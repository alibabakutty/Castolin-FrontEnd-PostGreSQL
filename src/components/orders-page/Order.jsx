import { useEffect, useRef, useState } from 'react';
import { AiFillDelete, AiFillExclamationCircle, AiOutlineArrowLeft } from 'react-icons/ai';
import Select from 'react-select';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authConstants';

const Order = ({ onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [item, setItem] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const itemSelectRef = useRef(null);
  const customerSelectRef = useRef(null);
  const deliveryDateRef = useRef(null);
  const deliveryModeRef = useRef(null);
  const transporterNameRef = useRef(null);
  const quantityInputRef = useRef(null);
  const buttonRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [database, setDatebase] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [remarks, setRemarks] = useState('');
  const isSubmitttingRef = useRef(false);
  const navigate = useNavigate();

  const { distributorUser } = useAuth();

  const location = useLocation();

  const isDistributorRoute = location.pathname.includes('/distributor');

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onBack) {
          onBack();
        } else {
          navigate(-1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBack, navigate]);

  useEffect(() => {
    if (location.pathname.includes('/distributor') && itemSelectRef.current) {
      itemSelectRef.current.focus();
    } else if (location.pathname.includes('/corporate') && customerSelectRef.current) {
      customerSelectRef.current.focus();
    }
  }, [location.pathname]);

  const [totals, setTotals] = useState({
    qty: 0,
    amount: 0,
    netAmt: 0,
    grossAmt: 0,
  });

  // Function to generate order number
  const generateOrderNumber = () => {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];

    // Get last order number from localStorage
    const lastOrder = localStorage.getItem('lastOrder');

    if (lastOrder) {
      const lastOrderData = JSON.parse(lastOrder);
      const lastOrderDate = lastOrderData.date;
      const lastOrderNumber = lastOrderData.orderNumber;

      // If same day, increment the sequence
      if (lastOrderDate === currentDate) {
        // Extract the sequence number (last part after the last hyphen)
        const parts = lastOrderNumber.split('-');
        const lastSequence = parseInt(parts[parts.length - 1]);
        const newSequence = (lastSequence + 1).toString().padStart(4, '0');

        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2);

        return `SQ-${day}-${month}-${year}-${newSequence}`;
      }
    }

    // If new day or no previous order, start from 0001
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);

    return `SQ-${day}-${month}-${year}-0001`;
  };

  // Function to save last order number to localStorage
  const saveOrderNumber = orderNum => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(
      'lastOrder',
      JSON.stringify({
        date: today,
        orderNumber: orderNum,
      }),
    );
  };

  useEffect(() => {
    const newOrderNumber = generateOrderNumber();
    setOrderNumber(newOrderNumber);
  }, [date]);

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

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customer');
        setCustomerOptions(response.data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleItemSelect = selected => {
    setItem(selected);
    deliveryDateRef.current.focus();
  };

  // Add this function for field navigation
  const handleFieldKeyDown = (e, nextFieldRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextFieldRef && nextFieldRef.current) {
        nextFieldRef.current.focus();
      }
    }
  };

  const handleCustomerSelect = selected => {
    setCustomerName(selected);
    // optionally focus next field
    itemSelectRef.current.focus();
  };

  const handleClick = () => {
    if (!item || !quantity) return;

    const newRow = {
      itemCode: item.item_code,
      itemName: item.stock_item_name,
      hsn: item.hsn_code || item.hsn,
      gst: item.gst,
      delivery_date: deliveryDate,
      delivery_mode: deliveryMode,
      itemQty: Number(quantity),
      uom: item.uom || "No's",
      rate: Number(item.rate),
      amount: Number(item.rate) * Number(quantity),
      netRate: Number(item.rate),
      grossAmount: Number(item.rate) * Number(quantity),
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

    setItem('');
    setDeliveryDate('');
    setDeliveryMode('');
    setTransporterName('');
    setQuantity('');
    itemSelectRef.current.focus();
  };

  // Function to handle quantity change in table rows
  const handleQuantityChange = (index, newQuantity) => {
    // Allow empty string
    if (newQuantity === '') {
      const updatedRows = [...orderData];
      const row = updatedRows[index];

      row.itemQty = 0;
      row.amount = 0;
      row.grossAmount = 0;

      setOrderData(updatedRows);
      return;
    }

    // Only allow numbers and positive values
    if (isNaN(newQuantity) || Number(newQuantity) < 0) {
      return;
    }

    const updatedRows = [...orderData];
    const row = updatedRows[index];

    row.itemQty = Number(newQuantity);
    row.amount = row.itemQty * row.rate;
    row.grossAmount = row.itemQty * row.rate;

    setOrderData(updatedRows);
  };

  // Function to remove item from order
  const handleRemoveItem = index => {
    const updatedRows = orderData.filter((_, i) => i !== index);
    setOrderData(updatedRows);
    toast.info('Item removed from order!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
  };

  const handleDeliveryDateChange = selectedDate => {
    setDeliveryDate(selectedDate);
  };

  // Add onBlur handler for validation
  const handleDeliveryDateBlur = e => {
    const selectedDate = e.target.value;

    if (selectedDate && selectedDate < date) {
      toast.error(
        'Please enter valid delivery date!',
        {
          position: 'bottom-right',
          autoClose: 4000,
        },
      );
      setDeliveryDate(''); // Clear the invalid date
      // Keep focus on delivery date field instead of moving to next field
      setTimeout(() => {
        deliveryDateRef.current.focus();
      }, 100);
      return false; // Prevent further processing
    }
    return true; // validation passed
  };

  const postOrder = async () => {
    if (isSubmitttingRef.current) return; // Prevent multiple submissions

    isSubmitttingRef.current = true;

    try {
      const result = await api.post('/orders', database);
      console.log(result);

      // Generate next order number after successful submission
      const nextOrderNumber = generateOrderNumber();
      saveOrderNumber(nextOrderNumber);
      setOrderNumber(nextOrderNumber);

      // clear order data and database after successful submission
      setOrderData([]);
      setDatebase([]);
      setRemarks('');

      toast.success('Order Placed Successfully and waiting for approval!.', {
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

  const handleSubmit = e => {
    e.preventDefault();

    if (!isDistributorRoute && !customerName) {
      toast.error('Please select a customer name.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      customerSelectRef.current.focus();
      return;
    }

    if (orderData.length >= 1) {
      // determine voucher type based on location path
      const getVoucherType = () => {
        if (location.pathname.includes('/corporate')) {
          return 'Direct Order Management';
        } else if (location.pathname.includes('/distributor')) {
          return 'Distributor Order-Web Based';
        } else {
          return 'Sales Order';
        }
      };

      const voucherType = getVoucherType();
      // ✅ Handle customer data based on route
      const customerData = isDistributorRoute
        ? {
            customer_code: distributorUser?.customer_code || 'DISTRIBUTOR',
            customer_name: distributorUser?.customer_name || 'Distributor User',
          }
        : {
            customer_code: customerName?.customer_code || '',
            customer_name: customerName?.customer_name || '',
          };

      const dbd = orderData.map(item => ({
        voucher_type: voucherType,
        order_no: orderNumber,
        date,
        status: 'pending',
        executiveCode: distributorUser.customer_code || '',
        executive: distributorUser.customer_name || '',
        role: distributorUser.role || '',
        customer_code: customerData.customer_code,
        customer_name: customerData.customer_name,
        item_code: item.itemCode,
        item_name: item.itemName,
        hsn: item.hsn_code || item.hsn,
        gst: Number(String(item.gst).replace('%', '').trim()),
        delivery_date: item.delivery_date,
        delivery_mode: item.delivery_mode,
        quantity: item.itemQty,
        uom: item.uom,
        rate: item.rate,
        amount: item.amount,
        net_rate: item.netRate,
        gross_amount: item.grossAmount,
        disc_percentage: 0,
        disc_amount: 0,
        spl_disc_percentage: 0,
        spl_disc_amount: 0,
        total_quantity: totals.qty,
        total_amount: totals.amount,
        remarks: remarks,
      }));

      setDatebase(prev => [...prev, ...dbd]);
      console.log('Submitting order data:', dbd);

      // generate and update the next order number
      const nextOrderNumber = generateOrderNumber();
      saveOrderNumber(nextOrderNumber);
      setOrderNumber(nextOrderNumber);

      // Reset form fields after successful submission
      resetFormFields();
    } else {
      toast.error('No items in the order. Please add items before submitting.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  const resetFormFields = () => {
    setCustomerName(null);
    setItem(null);
    setDeliveryDate('');
    setDeliveryMode('');
    setTransporterName('');
    setQuantity('');
    setRemarks('');

    // Reset select components
    if (customerSelectRef.current) {
      customerSelectRef.current.clearValue();
    }
    if (itemSelectRef.current) {
      itemSelectRef.current.clearValue();
    }
    // focus on customer select for next entry
    setTimeout(() => {
      customerSelectRef.current.focus();
    }, 100);
  };

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
    control: base => {
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
        minHeight: '26px', // 🔽 Reduce height here
        height: '26px',
        padding: '0 1px',
        width: customWidth,
        backgroundColor: '#E9EFEC',
        borderColor: '#932F67', // Tailwind: blue-400 / gray-300
        boxShadow: 'none',
      };
    },
    valueContainer: base => ({
      ...base,
      padding: '0px 4px', // 🔽 Reduce internal padding
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
        width: customWidth, // Custom width
        overflowY: 'auto', // Scroll if too many options
        zIndex: 9999, // Ensure on top
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
    <div className="p-3 bg-[#E9EFEC] border-2 h-screen font-amasis">
      <div className="px-1 py-2 grid  grid-cols-[auto_1fr_1fr_0.8fr_2fr_1.2fr_1.2fr] gap-2 items-center border transition-all">
        {/* Back Arrow */}
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-gray-200 transition justify-self-start"
        >
          <AiOutlineArrowLeft className="text-[#932F67]" size={22} />
        </button>

        <div className="relative">
          <input
            type="text"
            required
            readOnly
            value={
              location.pathname === '/corporate'
                ? 'Direct Order Management'
                : location.pathname === '/distributor'
                ? 'Distributor Order-Web Based'
                : 'Select Order'
            }
            className="outline-none border rounded-[5px] focus: border-[#932F67]  p-[3.5px] text-sm bg-transparent font-medium w-52"
          />
          <span
            className="absolute left-2.5 top-[12px]  transition-all pointer-events-none -translate-y-[17px] text-[#932F67]
             px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded
          "
          >
            Voucher Type *
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            required
            readOnly
            value={orderNumber}
            className="outline-none border rounded-[5px] focus: border-[#932F67]  p-[3.5px] text-sm bg-transparent font-medium"
          />
          <span
            className="absolute left-2.5 top-[12px]  transition-all pointer-events-none -translate-y-[17px] text-[#932F67]
             px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded
          "
          >
            Order No *
          </span>
        </div>

        {/* Customer Code Selection Field */}
        {!isDistributorRoute && (
          <div className="relative w-[116px]">
            <Select
              ref={customerSelectRef}
              className="text-sm peer"
              value={customerName}
              options={customerOptions}
              // getOptionLabel={e => e.label} // Use the custom label for dropdown
              getOptionValue={e => e.customer_code} // Store only the code
              onChange={handleCustomerSelect}
              placeholder=""
              components={{
                DropdownIndicator: () => null,
                IndicatorSeparator: () => null,
              }}
              formatOptionLabel={(option, { context }) =>
                context === 'menu'
                  ? `${option.customer_code} - ${option.customer_name}`
                  : option.customer_code
              }
              styles={{
                ...customStyles,
                control: base => ({
                  ...base,
                  minHeight: '30px',
                  height: '30px',
                  lineHeight: '1',
                  padding: '0px 1px',
                  width: '120%',
                  backgroundColor: '#F8F4EC',
                  borderColor: '#932F67',
                  boxShadow: 'none',
                }),
                singleValue: base => ({
                  ...base,
                  lineHeight: '1',
                  // Ensure only code is displayed in the input
                  '& > div': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
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
                  width: '500px',
                  minWidth: '500px',
                  left: '0px',
                  right: 'auto',
                  position: 'absolute',
                  zIndex: 9999,
                }),
                menuList: base => ({
                  ...base,
                  padding: 0,
                  width: '100%',
                }),
              }}
              menuPortalTarget={document.body}
            />
            <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
              Customer Code *
            </span>
          </div>
        )}

        {/* Customer Name (Read-only) */}
        {!isDistributorRoute && (
          <div className="relative ml-7 w-80">
            <input
              type="text"
              readOnly
              value={customerName ? customerName.customer_name : ''}
              className="outline-none border rounded-[5px] border-[#932F67] p-[3.5px] text-sm bg-gray-100 font-medium w-full"
              placeholder=""
            />
            <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded">
              Customer Name *
            </span>
          </div>
        )}

        {isDistributorRoute && (
          <div className={`relative ${isDistributorRoute ? 'w-[150px]' : ''}`}>
            <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium text-gray-700 text-center">
              {distributorUser.customer_code || 'executive'}
            </div>
            <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
              Customer Code *
            </span>
          </div>
        )}

        <div className={`relative ${isDistributorRoute ? 'w-[500px]' : 'w-[280px]'}`}>
          <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium text-gray-700 text-center">
            {distributorUser.customer_name || 'executive'}
          </div>
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            {isDistributorRoute ? 'Customer Name' : 'Executive Name'}
          </span>
        </div>

        <div className="relative w-28">
          <input
            type="date"
            readOnly
            required
            defaultValue={date}
            onChange={e => setDate(e.target.value)}
            className="
           peer w-full border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium"
          />

          <span
            className="absolute left-2.5 top-[12px]  transition-all pointer-events-none -translate-y-[17px] text-[#932F67]
             px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded
          "
          >
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
              // getOptionLabel={e => `${e.item_code} - ${e.stock_item_name}`}
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
              onKeyDown={e => handleFieldKeyDown(e, deliveryModeRef)}
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

          <div className="relative w-36">
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

          <div className="flex items-center ml-5">
            <span className="text-sm mr-2 font-medium">Qty * :</span>
            <input
              type="number"
              name="qty"
              ref={quantityInputRef}
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleClick(); // Automatically add item on Enter
                }
              }}
              placeholder="0"
              min="0"
              step="1"
              className="py-1 border w-16 outline-none text-sm rounded px-1 border-[#932F67] bg-[#F8F4EC] text-center"
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end">
            <input
              type="button"
              ref={buttonRef}
              value={'Add'}
              onClick={handleClick}
              className="bg-[#693382] text-white px-4 rounded-[6px] py-1 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Table section */}
        <div className="h-[70vh] flex flex-col">
          <table className="w-full">
            <thead>
              <tr className="bg-[#A2AADB] leading-3">
                <th className="font-medium text-sm border border-gray-300 py-0.5 w-10 text-center">
                  S.No
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-24">
                  Product Code
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-[400px] text-center">
                  Product Name
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 text-center w-16">
                  HSN
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-14 text-center">
                  GST %
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-12">
                  Qty
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 w-10">UOM</th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-[85px]">
                  Rate
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 w-[86px]">
                  Amount
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-[60px]">
                  Action
                </th>
              </tr>
            </thead>
          </table>

          {/* Scrollable table body container */}
          <div className={`flex-1 overflow-y-auto ${orderData.length > 15 ? 'max-h-[65vh]' : ''}`}>
            <table className="w-full">
              <tbody>
                {orderData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center border border-gray-300">
                      <div className="flex items-center justify-center p-5">
                        <AiFillExclamationCircle className="text-red-700 text-[28px] mx-1" />
                        No Records Found...
                      </div>
                    </td>
                  </tr>
                ) : (
                  orderData.map((item, index) => (
                    <tr key={index} className="leading-12">
                      <td className="border border-gray-400 text-center text-sm w-[54px]">
                        {index + 1}
                      </td>
                      <td className="border border-gray-400 text-left pl-1 text-sm w-[132px]">
                        {item.itemCode}
                      </td>
                      <td className="border border-gray-400 px-2 text-sm w-[548px]">
                        {item.itemName}
                      </td>
                      <td className="border border-gray-400 text-center text-sm w-[88px]">
                        {item.hsn}
                      </td>
                      <td className="border border-gray-400 text-center text-sm w-[76px]">
                        {item.gst}
                      </td>
                      <td className="border border-gray-400 px-2 text-right text-sm bg-[#F8F4EC] w-[66px]">
                        <input
                          type="text"
                          value={item.itemQty === 0 ? '' : item.itemQty}
                          onChange={e => {
                            const value = e.target.value.replace(/[^\d]/g, '');
                            handleQuantityChange(index, value);
                          }}
                          onBlur={e => {
                            if (e.target.value === '') {
                              handleQuantityChange(index, '1');
                            }
                          }}
                          className="w-[47px] text-right border-none outline-none bg-transparent px-1"
                        />
                      </td>
                      <td className="border border-gray-400 text-center text-sm w-[55px]">
                        {item.uom}
                      </td>
                      <td className="border border-gray-400  px-2 text-right text-sm w-[116px]">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="border border-gray-400 px-2 text-right text-sm w-[118px]">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="border border-gray-400 text-center text-sm">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <AiFillDelete size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer section - remove the mt-[320px] */}
        <div className="h-[7vh] flex border-t items-center">
          <div className="w-2/4 px-0.5">
            <div className="relative flex gap-2">
              <textarea
                name="remarks"
                id="remarks"
                placeholder="Remarks"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="border border-[#932F67] resize-none md:w-[400px] outline-none rounded px-1  peer h-[26px] bg-[#F8F4EC] mb-1 ml-1"
              ></textarea>

              <div>
                <label htmlFor="" className="text-sm font-medium ml-3">
                  Status :{' '}
                </label>
                <select
                  name=""
                  id=""
                  disabled={true}
                  className="outline-none appearance-none border border-[#932F67] px-1 text-sm rounded ml-1 mt-0.5"
                >
                  <option value="">Pending</option>
                </select>
              </div>
            </div>
          </div>
          <div className="ml-44">
            <p className="font-medium pr-2 mb-0.5">Total</p>
          </div>
          <div className="w-[375px] px-0.5 py-1">
            <table className="w-full border-b mb-1">
              <tfoot>
                <tr className="*:border-[#932F67]">
                  <td className="text-right border w-8 px-1">{totals.qty}</td>
                  <td className="text-right border w-28 px-1">{formatCurrency(totals.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className=" mb-1 ml-0.5">
            <button
              onClick={handleSubmit}
              className="bg-[#693382] text-white px-4 rounded-[6px] py-0.5 outline-none cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
