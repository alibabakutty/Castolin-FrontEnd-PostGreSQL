import { useEffect, useRef, useState } from 'react';
import { AiFillExclamationCircle, AiOutlineArrowLeft } from 'react-icons/ai';
import Select from 'react-select';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const OrderReportPage = () => {
  const { orderNumber } = useParams();
  console.log('Order number from URL:', orderNumber);
  const [date, setDate] = useState('');
  const [item, setItem] = useState(null);
  const [voucherType, setVoucherType] = useState('');
  const [customerName, setCustomerName] = useState(null);
  const [executiveName, setExecutiveName] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const itemSelectRef = useRef(null);
  const customerSelectRef = useRef(null);
  const deliveryDateRef = useRef(null);
  const deliveryModeRef = useRef(null);
  const transporterNameRef = useRef(null);
  const executiveSelectRef = useRef(null);
  const quantityInputRef = useRef(null);
  const buttonRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [database, setDatabase] = useState([]);
  const [itemOptions, setItemOptions] = useState([]); // Separate state for items
  const [orderData, setOrderData] = useState([]);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [defaultDiscount, setDefaultDiscount] = useState(0);
  const [defaultSplDiscount, setDefaultSplDiscount] = useState(0);
  const [status, setStatus] = useState('pending');
  const [remarks, setRemarks] = useState('');
  const location = useLocation();
  const isViewOnlyReport =
    location.pathname.includes('order-report-corporate') ||
    location.pathname.includes('order-report-distributor');
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();

  const [totals, setTotals] = useState({
    qty: 0,
    amount: 0,
    netAmt: 0,
    grossAmt: 0,
  });

  useEffect(() => {
    if (itemSelectRef.current) {
      itemSelectRef.current.focus();
    }
  }, []);

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const transformOrderData = apiData => {
    return apiData.map(item => ({
      voucher_type: item.voucher_type,
      id: item.id,
      itemCode: item.item_code,
      itemName: item.item_name,
      hsn: item.hsn,
      gst: item.gst,
      itemQty: item.quantity,
      uom: item.uom,
      rate: item.rate,
      amount: item.amount,
      disc: item.disc_percentage || defaultDiscount,
      discAmt: item.disc_amount || 0,
      splDisc: item.spl_disc_percentage || defaultSplDiscount,
      splDiscAmt: item.spl_disc_amount || 0,
      netRate: item.net_rate || 0,
      grossAmount: item.gross_amount || 0,
      delivery_date: item.delivery_date || '',
      delivery_mode: item.delivery_mode || '',
    }));
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`orders-by-number/${orderNumber}`);
        const data = response.data;
        console.log('specific order data:', data);

        if (data && data.length > 0) {
          setSelectedOrderData(data[0]);
          setVoucherType(data[0].voucher_type || 'Sales Order');
          setCustomerName({
            customer_code: data[0].customer_code,
            customer_name: data[0].customer_name,
          });
          setExecutiveName({ customer_name: data[0].executive });
          // format the date here
          const rawDate = data[0].created_at;
          const formattedDate = formatDateForInput(rawDate);
          setDate(formattedDate);

          setStatus(data[0].status || 'pending');

          setRemarks(data[0].remarks || '');

          const transformedData = transformOrderData(data);
          setOrderData(transformedData);
        } else {
          toast.error('No data found for this order.', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      } catch (error) {
        console.error('Error fetching specific order details:', error);
        toast.error('Failed to load order details.', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
    };
    fetchOrderDetails();
  }, [orderNumber]);

  // Use this function for date input (YYYY-MM-DD format)
  const formatDateForInput = dateString => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`; // Returns "2025-10-31" for date input
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await api.get('/stock_item');
        setItemOptions(response.data);
      } catch (error) {
        console.error('Error fetching stock items:', error);
      }
    };
    fetchStockItems();
  }, []);

  const handleItemSelect = selected => {
    setItem(selected);
    deliveryDateRef.current.focus();
  };

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const handleClick = () => {
    if (!item || !quantity) return;

    const existingIndex = orderData.findIndex(pro => pro.itemCode === item.item_code);

    if (existingIndex !== -1) {
      const updatedRows = [...orderData];

      const qty = Number(updatedRows[existingIndex].itemQty) + Number(quantity);
      const rate = Number(updatedRows[existingIndex].rate);
      const amt = qty * rate;

      const discAmt = (amt * defaultDiscount) / 100;
      const splDiscAmt = ((amt - discAmt) * defaultSplDiscount) / 100;
      const totalDisc = discAmt + splDiscAmt;

      updatedRows[existingIndex].itemQty = qty;
      updatedRows[existingIndex].amount = amt;
      updatedRows[existingIndex].disc = defaultDiscount;
      updatedRows[existingIndex].discAmt = discAmt;
      updatedRows[existingIndex].splDisc = defaultSplDiscount;
      updatedRows[existingIndex].splDiscAmt = splDiscAmt;
      updatedRows[existingIndex].netRate = (amt - totalDisc) / qty;
      updatedRows[existingIndex].grossAmount = amt - totalDisc;

      setOrderData(updatedRows);
      toast.warning('Entered Product Already There!.Added With Previous Quantity!.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } else {
      const qty = Number(quantity);
      const rate = Number(item.rate);
      const gross = qty * rate;

      // Discount calculations
      const discAmt = (gross * defaultDiscount) / 100;
      const splDiscAmt = ((gross - discAmt) * defaultSplDiscount) / 100;
      const totalDisc = discAmt + splDiscAmt;

      const newRow = {
        itemCode: item.item_code,
        itemName: item.stock_item_name,
        hsn: item.hsn,
        gst: item.gst,
        itemQty: qty,
        uom: item.uom || "No's",
        rate: rate,
        amount: gross,
        disc: defaultDiscount,
        discAmt,
        splDisc: defaultSplDiscount,
        splDiscAmt,
        netRate: (gross - totalDisc) / qty,
        grossAmount: gross - totalDisc,
      };
      setOrderData(prev => [...prev, newRow]);
      toast.info('Item added successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
        style: {
          width: '380px',
          minHeight: '20px',
          fontSize: '12px',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
        },
        progressStyle: {
          background: 'linear-gradient(to right, #0369a1, #7dd3fc)',
        },
      });
    }

    setItem('');
    setQuantity('');
  };

  const isValidDate = value => {
    // Must match yyyy-mm-dd (HTML date input standard)
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  };

  // Add this function for field navigation
  const handleFieldKeyDown = (e, nextFieldRef, currentValue, validator) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (validator && !validator(currentValue)) {
        console.log('Date is not complete. Staying in same field.');
        return;
      }

      if (nextFieldRef && nextFieldRef.current) {
        nextFieldRef.current.focus();
      }
    }
  };

  // Function to update existing orders via PUT endpoint
  const updateOrder = async (actualOrderNumber = null) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      // Use the provided order number or fall back to the current one
      const orderNoToUse = actualOrderNumber || orderNumber;

      // Validate orderData has IDs
      if (!orderData || !orderData.length) {
        toast.error('No order data available for update', {
          position: 'bottom-right',
          autoClose: 3000,
        });
        return;
      }

      // Prepare updates for existing orders with proper validation
      const updates = orderData.map(item => {
        // Check if item has required ID
        if (!item.id) {
          console.error('Order item missing ID:', item);
          throw new Error(`Order item missing required ID field`);
        }

        return {
          id: item.id, // REQUIRED - must come from existing order data
          status: status || item.status, // Ensure status has a value
          disc_percentage: Number(item.disc) || 0,
          disc_amount: Number(item.discAmt) || 0,
          spl_disc_percentage: Number(item.splDisc) || 0,
          spl_disc_amount: Number(item.splDiscAmt) || 0,
          net_rate: Number(item.netRate) || 0,
          gross_amount: Number(item.grossAmount) || 0,
          total_quantity: totals.qty || 0.0,
          total_amount: totals.amount || 0.0,
          remarks: remarks || item.remarks,
          quantity: Number(item.itemQty) || 0,
        };
      });

      // Filter out any invalid items
      const validUpdates = updates.filter(update => update.id);

      if (validUpdates.length === 0) {
        toast.error('No valid orders to update', {
          position: 'bottom-right',
          autoClose: 3000,
        });
        return;
      }

      console.log('Sending updates for order:', orderNoToUse, validUpdates);

      // Use the correct order number in the API call
      const response = await api.put(`/orders-by-number/${orderNoToUse}`, validUpdates);

      console.log('Update successful:', response.data);

      return response.data;
    } catch (error) {
      console.error('Error updating order:', error);

      // More specific error messages
      if (error.response?.data) {
        const serverError = error.response.data;
        if (serverError.details) {
          toast.error(`Update failed: ${serverError.details.join(', ')}`, {
            position: 'bottom-right',
            autoClose: 3000,
          });
        } else {
          toast.error(`Update failed: ${serverError.error || 'Server error'}`, {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      } else {
        toast.error('Error updating order. Please try again.', {
          position: 'bottom-right',
          autoClose: 3000,
        });
      }
      throw error;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const postOrder = async () => {
    if (isSubmittingRef.current) return; // Prevent multiple submissions

    isSubmittingRef.current = true;
    try {
      const result = await api.post('/orders', database);
      console.log(result);

      toast.success('Order Placed Successfully with approval!.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Error placing order. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  const handleQuantityChange = (index, value) => {
    // Allow only number and decimal point
    const numberRegex = /^\d*$/;
    if (value !== '' && !numberRegex.test(value)) {
      return;
    }

    const updatedRows = [...orderData];
    const row = updatedRows[index];

    // update quantity
    const newQty = Number(value) || 0;
    const rate = Number(row.rate) || 0;
    const gross = newQty * rate;

    // Get current discount percentages
    const disc = Number(row.disc || defaultDiscount);
    const splDisc = Number(row.splDisc || defaultSplDiscount);
    // Recalculate all amounts based on new quantity
    const discAmt = (gross * disc) / 100;
    const splDiscAmt = (gross * splDisc) / 100;
    const totalDisc = discAmt + splDiscAmt;

    updatedRows[index].itemQty = newQty;
    updatedRows[index].amount = gross;
    updatedRows[index].discAmt = discAmt;
    updatedRows[index].splDiscAmt = splDiscAmt;
    updatedRows[index].netRate = newQty > 0 ? (gross - totalDisc) / newQty : 0;
    updatedRows[index].grossAmount = gross - totalDisc;

    setOrderData(updatedRows);
  };

  const handleDeliveryDateChange = seelctedDate => {
    setDeliveryDate(seelctedDate);
  };

  // Add onBlur handler for validation
  const handleDeliveryDateBlur = e => {
    const selectedDate = e.target.value;

    if (selectedDate && selectedDate < date) {
      toast.error('Please enter valid delivery date!', {
        position: 'bottom-right',
        autoClose: 4000,
      });
      setDeliveryDate(''); // Clear the invalid date
      // Keep focus on delivery date field instead of moving to next field
      setTimeout(() => {
        deliveryDateRef.current.focus();
      }, 100);
      return false; // Prevent further processing
    }
    return true; // validation passed
  };

  const formatQuantityForDisplay = quantity => {
    if (quantity === null || quantity === undefined) return '0';

    let str = quantity.toString().trim();

    // remove commas
    str = str.replace(/,/g, '');

    // keep only part before decimal
    const beforeDecimal = str.split('.')[0];

    return beforeDecimal === '' ? '0' : beforeDecimal;
  };

  // Function to handle discount percentage change
  const handleDiscChange = (index, value) => {
    // Allow only numbers and decimal point
    const decimalRegex = /^\d*\.?\d*$/;
    if (value !== '' && !decimalRegex.test(value)) {
      return; // Don't update if invalid
    }

    const updatedRows = [...orderData];
    const row = updatedRows[index];

    const disc = Number(value) || 0;
    const gross = row.amount;
    const qty = Number(row.itemQty) || 1;

    // FIX: Use defaultSplDiscount when row.splDisc is not available
    const currentSplDisc = Number(row.splDisc || defaultSplDiscount);

    // Recalculate discount amounts
    const discAmt = (gross * disc) / 100;
    const splDiscAmt = (gross * currentSplDisc) / 100;
    const totalDisc = discAmt + splDiscAmt;

    updatedRows[index].disc = value; // Keep as string for proper display
    updatedRows[index].discAmt = discAmt;
    updatedRows[index].splDiscAmt = splDiscAmt;
    updatedRows[index].netRate = qty > 0 ? (gross - totalDisc) / qty : 0;
    updatedRows[index].grossAmount = gross - totalDisc;

    setOrderData(updatedRows);
  };

  // Function to handle special discount percentage change
  const handleSplDiscChange = (index, value) => {
    // Allow only numbers and decimal point
    const decimalRegex = /^\d*\.?\d*$/;
    if (value !== '' && !decimalRegex.test(value)) {
      return; // Don't update if invalid
    }

    const updatedRows = [...orderData];
    const row = updatedRows[index];

    const splDisc = parseFloat(value) || 0;
    const gross = Number(row.amount) || 0;
    const qty = Number(row.itemQty) || 1;

    // FIX: Use defaultDiscount when row.disc is not available
    const currentDisc = Number(row.disc || defaultDiscount);
    const discAmt = (gross * currentDisc) / 100;

    // Recalculate special discount amounts
    const splDiscAmt = (gross * splDisc) / 100;
    const totalDisc = discAmt + splDiscAmt;

    updatedRows[index].splDisc = value; // Keep as string for proper display
    updatedRows[index].splDiscAmt = splDiscAmt;
    updatedRows[index].netRate = qty > 0 ? (gross - totalDisc) / qty : 0;
    updatedRows[index].grossAmount = gross - totalDisc;

    setOrderData(updatedRows);
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (!customerName) {
      toast.error('Please select a customer!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      customerSelectRef.current.focus();
      return;
    }

    if (!executiveName) {
      toast.error('Please select an executive!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      executiveSelectRef.current.focus();
      return;
    }

    if (orderData.length >= 1) {
      const dbd = orderData.map(item => ({
        voucher_type: 'Sales Order',
        order_no: orderNumber,
        date,
        status: status,
        remarks: remarks,
        executive: executiveName.customer_name || '',
        customer_code: customerName.customer_code || '',
        customer_name: customerName.customer_name,
        item_code: item.itemCode,
        item_name: item.itemName,
        hsn: item.hsn,
        gst: Number(String(item.gst).replace('%', '').trim()),
        quantity: Number(item.itemQty) || 0,
        uom: item.uom,
        rate: item.rate,
        amount: item.amount,
        disc_percentage: item.disc || 0,
        disc_amount: item.discAmt || 0,
        spl_disc_percentage: parseFloat(item.splDisc) || 0,
        spl_disc_amount: item.splDiscAmt || 0,
        net_rate: item.netRate,
        gross_amount: item.grossAmount,
        total_quantity: totals.qty,
        total_amount: totals.amount,
      }));

      setDatabase(prev => [...prev, ...dbd]);
      console.log('Submitting order data:', dbd);

      // Reset form fields after successful submission
      resetFormFields();
    } else {
      toast.error('Please add at least one item to the order!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  // Add this function to reset all form fields
  const resetFormFields = () => {
    setCustomerName(null);
    setExecutiveName(null);
    setItem(null);
    setQuantity('');
    setStatus('pending');
    setRemarks('');
    setOrderData([]);
    setDefaultDiscount(0);
    setDefaultSplDiscount(0);

    // Reset Select components to their default state
    if (customerSelectRef.current) {
      customerSelectRef.current.select.clearValue();
    }
    if (executiveSelectRef.current) {
      executiveSelectRef.current.select.clearValue();
    }
    if (itemSelectRef.current) {
      itemSelectRef.current.select.clearValue();
    }

    // Clear selected order data when resetting
    setSelectedOrderData(null);

    // Focus on customer select for next entry
    setTimeout(() => {
      customerSelectRef.current.focus();
    }, 100);
  };
  console.log(database);

  useEffect(() => {
    if (database.length > 0) {
      postOrder();
    }
  }, [database]);

  useEffect(() => {
    const totalQty = orderData.reduce((sum, row) => sum + Number(row.itemQty || 0), 0);
    const totalAmt = orderData.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalNetRate = orderData.reduce((sum, row) => sum + Number(row.netRate || 0), 0);
    const totalGrossAmt = orderData.reduce((sum, row) => sum + Number(row.grossAmount || 0), 0);

    setTotals({
      qty: totalQty,
      amount: totalAmt,
      netAmt: totalNetRate,
      grossAmt: totalGrossAmt,
    });
  }, [orderData]);

  // In your handleUpdate, always use the selected order's number
  const handleUpdate = async e => {
    e.preventDefault();

    if (!selectedOrderData) {
      toast.error('No existing order selected for update', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    // Always use the selected order's number for updates
    const orderNoToUse = selectedOrderData.order_no;

    try {
      await updateOrder(orderNoToUse);
      // await fetchOrderDetails(orderNoToUse);
      toast.success('Order updated successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      // reset form fields
      navigate(-1);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // const numberFormat = num => {
  //   return Number(num || 0).toLocaleString('en-IN', {
  //     minimumFractionDigits: 2,
  //     maximumFractionDigits: 2,
  //   });
  // };

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })
      .format(value || 0)
      .replace(/^₹/, '₹ ');
  };

  const customStyles = {
    control: (base) => {
      let customWidth = '500px';
      if (windowWidth <= 768) {
        customWidth = '100%';
      } else if (windowWidth <= 1024) {
        customWidth = '200px';
      } else if (windowWidth <= 1280) {
        customWidth = '250px';
      } else if (windowWidth <= 1366) {
        customWidth = '300px';
      }
      return {
        ...base,
        minHeight: '26px',
        height: '26px',
        padding: '0 1px',
        width: customWidth,
        backgroundColor: '#E9EFEC',
        borderColor: '#932F67',
        boxShadow: 'none',
      };
    },
    valueContainer: base => ({
      ...base,
      padding: '0px 4px',
      height: '20px',
    }),
    menu: base => {
      let customWidth = '550px';
      if (windowWidth <= 768) {
        customWidth = '100%';
      } else if (windowWidth <= 1024) {
        customWidth = '350px';
      } else if (windowWidth <= 1366) {
        customWidth = '400px';
      }
      return {
        ...base,
        width: customWidth,
        overflowY: 'auto',
        zIndex: 9999,
        border: '1px solid #ddd',
      };
    },
    option: (base, state) => ({
      ...base,
      padding: '8px 12px',
      backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
      color: 'black',
      cursor: 'pointer',
    }),
    menuList: base => ({
      ...base,
      padding: 0,
      minHeight: '55vh',
    }),
    input: base => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
  };

  return (
    <div className="font-amasis p-3 bg-[#E9EFEC] border-2 h-screen">
      <div className="py-2 px-1 grid grid-cols-[auto_1fr_1fr_0.8fr_2fr_1.2fr_1.2fr] gap-2 items-center border transition-all">
        {/* Back Arrow */}
        <button
          onClick={() => navigate(-1)}
          className="p-1 rounded hover:bg-gray-200 transition justify-self-start"
        >
          <AiOutlineArrowLeft className="text-[#932F67]" size={22} />
        </button>

        {/* Voucher Type */}
        <div className="relative">
          <input
            type="text"
            required
            readOnly
            value={voucherType || 'Sales Order'}
            className="outline-none border rounded-[5px] focus:border-[#932F67] p-[3.5px] text-sm bg-transparent font-medium w-52"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded">
            Voucher Type *
          </span>
        </div>

        {/* Order No */}
        <div className="relative">
          <input
            type="name"
            readOnly
            required
            value={orderNumber || ''}
            className="peer w-[140px] border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Order No *
          </span>
        </div>

        {/* Customer Code */}
        <div className="relative">
          <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium text-center w-[120px]">
            {customerName?.customer_code || ''}
          </div>
          <span className="absolute left-2.5 top-[10px] transition-all text-[12px] -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1 rounded font-semibold leading-2">
            Customer Code *
          </span>
        </div>

        {/* Customer Name */}
        <div className="relative">
          <input
            type="name"
            readOnly
            required
            value={customerName?.customer_name || 'Select Customer'}
            className="peer w-[370px] border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Name *
          </span>
        </div>

        {/* Executive Name */}
        <div className="relative">
          <input
            type="name"
            readOnly
            required
            value={executiveName?.customer_name || ''}
            className="peer w-[300px] border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium text-center"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Executive Name *
          </span>
        </div>

        {/* Order Date */}
        <div className="relative">
          <input
            type="date"
            readOnly
            required
            defaultValue={date}
            className="peer w-[110px] border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Order Date *
          </span>
        </div>
      </div>

      {/* Body Part */}
      <div className="mt-1 border h-[87vh]">
        <div className="flex p-1 h-16 items-center gap-4">
          {/* Item Code Selection */}
          <div className="relative w-32">
            <Select
              ref={itemSelectRef}
              className="text-sm peer"
              value={item}
              options={itemOptions}
              getOptionValue={e => e.item_code}
              onChange={handleItemSelect}
              placeholder=""
              components={{
                DropdownIndicator: () => null,
                IndicatorsContainer: () => null,
              }}
              formatOptionLabel={(option, { context }) =>
                context === 'menu'
                  ? `${option.item_code} - ${option.stock_item_name}`
                  : option.item_code
              }
              styles={{
                ...customStyles,
                control: base => ({
                  ...base,
                  minHeight: '30px',
                  height: '30px',
                  backgroundColor: '#F8F4EC',
                  borderColor: '#932F67',
                  boxShadow: 'none',
                  cursor: 'pointer',
                }),
                singleValue: base => ({
                  ...base,
                  lineHeight: '1',
                }),
                placeholder: base => ({
                  ...base,
                  textAlign: 'center',
                  color: '#777',
                  fontSize: '12px',
                }),
                option: (base, state) => ({
                  ...base,
                  fontFamily: 'font-amasis',
                  fontWeight: '600',
                  padding: '4px 24px',
                  lineHeight: '1.2',
                  backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                  color: '#555',
                  cursor: 'pointer',
                  fontSize: '14px',
                }),
                menu: base => ({
                  ...base,
                  width: '550px',
                  minWidth: '120px',
                  zIndex: 9999,
                }),
              }}
              menuPortalTarget={document.body}
            />
            <span className="absolute left-2.5 top-[10px] transition-all text-[12px] -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1 rounded font-semibold leading-2">
              Item Code *
            </span>
          </div>

          {/* Item Name (Read-only) */}
          <div className="relative w-[450px]">
            <input
              type="text"
              readOnly
              value={item ? item.stock_item_name : ''}
              className="outline-none border rounded-[5px] border-[#932F67] p-[3.5px] text-sm bg-gray-100 font-medium w-full"
              placeholder=""
            />
            <span className="absolute left-2.5 top-[10px] transition-all text-[12px] -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1 rounded font-semibold leading-2">
              Item Name *
            </span>
          </div>

          <div className="relative">
            <input
              type="date"
              ref={deliveryDateRef}
              value={deliveryDate}
              min={date} // This prevents selecting past dates in the calendar UI
              onChange={e => handleDeliveryDateChange(e.target.value)}
              onBlur={handleDeliveryDateBlur}
              onKeyDown={e =>
                handleFieldKeyDown(
                  e,
                  deliveryModeRef,
                  deliveryDate,
                  isValidDate, // pass validator
                )
              }
              className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium w-full bg-white cursor-pointer"
            />
            <span
              className="absolute left-2.5 top-[10px] transition-all text-[12px]
     -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1.5 rounded font-semibold leading-2"
            >
              Delivery Date *
            </span>
          </div>

          <div className="relative w-36">
            <input
              type="text"
              value={deliveryMode}
              ref={deliveryModeRef}
              onChange={e => setDeliveryMode(e.target.value)}
              onKeyDown={e => handleFieldKeyDown(e, transporterNameRef)}
              className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium w-full outline-none focus:border-[#693382]"
            />
            <span
              className="absolute left-2.5 top-[10px] transition-all text-[12px]
               -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1.5 rounded font-semibold leading-2"
            >
              Delivery Mode *
            </span>
          </div>

          <div className="relative w-40">
            <input
              type="text"
              ref={transporterNameRef}
              value={transporterName}
              onChange={e => setTransporterName(e.target.value)}
              onKeyDown={e => handleFieldKeyDown(e, quantityInputRef)}
              placeholder=""
              className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium w-full outline-none focus:border-[#693382]"
            />
            <span
              className="absolute left-2.5 top-[10px] transition-all text-[12px]
     -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1.5 rounded font-semibold leading-2"
            >
              Transporter Name *
            </span>
          </div>

          {!isViewOnlyReport && (
            <>
              <div className="flex items-center">
                <div className="relative w-20">
                  {' '}
                  {/* adjust width as needed */}
                  <input
                    type="text"
                    name="qty"
                    ref={quantityInputRef}
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, buttonRef)}
                    placeholder=""
                    className="border p-[3.5px] rounded-[5px] border-[#932F67] 
                 text-sm font-medium w-full outline-none focus:border-[#693382] 
                 bg-[#F8F4EC] text-center"
                    autoComplete="off"
                  />
                  <span
                    className="absolute left-2.5 top-[10px] transition-all text-[12px]
                 -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1.5 rounded 
                 font-semibold leading-2"
                  >
                    Qty *
                  </span>
                </div>
              </div>

              <div className="ml-20">
                <input
                  type="button"
                  ref={buttonRef}
                  value={'Add'}
                  onClick={handleClick}
                  className="bg-[#693382] text-white px-4 rounded-[6px] py-0.5 outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Table section - remains the same */}
        <div className="h-[70vh]">
          <table className="w-full">
            <thead>
              <tr className="bg-[#A2AADB] leading-3">
                <td className="font-medium text-sm border border-gray-300 py-0.5 w-10 text-center">
                  S.No
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-[95px]">
                  Item Code
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-[250px] text-center">
                  Product Name
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 text-center w-24">
                  Qty
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-0.3">UOM</td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-right w-20">
                  Rate
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-right w-24">
                  Amount
                </td>

                {/* {!isViewOnlyReport && (
                  <>
                    
                  </>
                )} */}

                <td className="font-medium text-sm border border-gray-300 px-2 text-right w-20">
                  Disc %
                </td>
                <td className="font-medium text-sm border border-gray-300 px-2 text-right w-24">
                  Spl Disc %
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-24">
                  Net Rate
                </td>
                <td className="font-medium border text-sm border-gray-300 py-0.5 text-center w-28">
                  Gross Amount
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 text-center w-[68px]">
                  HSN
                </td>
                <td className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-16 text-center">
                  GST %
                </td>
                <td className="font-medium border text-sm border-gray-300 py-0.5 text-center w-[100px]">
                  Dely. Date
                </td>
                <td className="font-medium border text-sm border-gray-300 py-0.5 text-center w-[83px]">
                  Dely. Mode
                </td>
              </tr>
            </thead>
            <tbody>
              {orderData.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center border border-gray-300">
                    <div className="flex items-center justify-center p-5">
                      <AiFillExclamationCircle className="text-red-700 text-[28px] mx-1" />
                      No Records Found...
                    </div>
                  </td>
                </tr>
              ) : (
                orderData.map((item, index) => (
                  <tr key={index} className="leading-12">
                    <td className="border border-gray-400  text-center text-sm">{index + 1}</td>
                    <td className="border border-gray-400 pl-0.5 text-sm">{item.itemCode}</td>
                    <td className="border border-gray-400  px-2 text-sm">{item.itemName}</td>
                    {/* Editable Quantity */}
                    <td className="border border-gray-400  px-2 text-right text-sm bg-[#F8F4EC]">
                      <input
                        type="text"
                        value={formatQuantityForDisplay(item.itemQty)}
                        onChange={e => handleQuantityChange(index, e.target.value)}
                        disabled={isViewOnlyReport}
                        className="w-full text-right outline-none border-none bg-transparent text-sm px-1"
                      />
                    </td>
                    <td className="border border-gray-400  text-center text-sm">{item.uom}</td>
                    <td className="border border-gray-400  px-2 text-right text-sm">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="border border-gray-400  px-2 text-right text-sm">
                      {formatCurrency(item.amount)}
                    </td>

                    {/* {!isViewOnlyReport && (
                      <>
                        
                      </>
                    )} */}

                    <td className="border border-gray-400 px-1 text-center bg-[#F8F4EC]">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="text"
                          value={item.disc}
                          onChange={e => handleDiscChange(index, e.target.value)}
                          disabled={isViewOnlyReport}
                          className="w-full text-right outline-none border-none bg-transparent text-sm px-1"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </td>

                    <td className="border border-gray-400 px-1 text-center bg-[#F8F4EC]">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="text"
                          value={item.splDisc}
                          onChange={e => handleSplDiscChange(index, e.target.value)}
                          disabled={isViewOnlyReport}
                          className="w-full text-right outline-none border-none bg-transparent text-sm px-1"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </td>
                    <td className="border border-gray-400  px-1 text-right text-sm">
                      {formatCurrency(item.netRate)}
                    </td>
                    <td className="border border-gray-400  px-2 text-right text-sm">
                      {formatCurrency(item.grossAmount)}
                    </td>
                    <td className="border border-gray-400  text-center text-sm">{item.hsn}</td>
                    <td className="border border-gray-400  text-center text-sm">
                      {Math.round(item.gst)}
                    </td>
                    <td className="border border-gray-400 text-center text-sm">
                      {formatDate(item.delivery_date || '')}
                    </td>
                    <td className="border border-gray-400  px-2 text-sm">
                      {item.delivery_mode || ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="h-[7vh] flex border-t items-center">
          <div className="w-[370px] px-0.5">
            <div className="relative mb-1 ml-1 flex gap-2">
              <textarea
                name="remarks"
                id="remarks"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Remarks"
                disabled={isViewOnlyReport}
                className="border border-[#932F67] resize-none md:w-[175px] outline-none rounded px-1  peer h-[26px] bg-[#F8F4EC]"
              ></textarea>
              <div className="">
                <label htmlFor="" className="text-sm font-medium">
                  Status :{' '}
                </label>
                <select
                  name="status"
                  id="status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  disabled={isViewOnlyReport}
                  className="outline-none appearance-none border border-[#932F67] px-1 py-0.5 text-sm rounded bg-[#F8F4EC] ml-1 text-center"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
          <div className="">
            <p className="font-medium pr-2">Total</p>
          </div>
          <div className="w-[640px] px-0.5 py-1">
            <table className="w-full border-b mb-1">
              <tfoot>
                <tr className="*:border-[#932F67]">
                  <td className="text-right border w-5 px-1">
                    {formatQuantityForDisplay(totals.qty)}
                  </td>
                  {/* {!isViewOnlyReport && (
                    <>
                      
                    </>
                  )} */}

                  {/* <td className="w-10 border"></td> */}

                  <td className="text-right border w-12 px-1">{formatCurrency(totals.amount)}</td>

                  {/* <td className="text-right border w-32 px-1"></td> */}

                  <td className="text-right border w-28 px-1">{formatCurrency(totals.grossAmt)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* {!isViewOnlyReport && (
                    <>
                      <div className='flex'>
                        <button className='px-3 py-1 rounded-xl bg-yellow-300'>Reject</button>
                        <button className='px-3 py-1 rounded-xl bg-violet-400 ml-1'>Approve</button>
                      </div>
                    </>
                  )} */}
          <div className="flex w-72 justify-end pr-1 pb-1">
            {/* Show Update button when editing existing order, Save for new orders */}
            {selectedOrderData ? (
              <button
                type="button"
                onClick={handleUpdate}
                className="bg-[#28a745] text-white px-4 rounded-[6px] py-0.5 outline-none hover:bg-[#218838] transition-colors"
              >
                Save
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-[#693382] text-white px-4 rounded-[6px] py-0.5 outline-none hover:bg-[#5a2a6f] transition-colors"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReportPage;
