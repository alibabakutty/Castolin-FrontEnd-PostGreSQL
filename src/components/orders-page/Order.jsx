import { useEffect, useRef, useState } from 'react';
import { AiFillExclamationCircle, AiOutlineArrowLeft } from 'react-icons/ai';
import Select from 'react-select';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/ContextProvider';
import { useLocation, useNavigate } from 'react-router-dom';

const Order = ({ onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [item, setItem] = useState(null);
  const [customerName, setCustomerName] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const itemSelectRef = useRef(null);
  const customerSelectRef = useRef(null);
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

  const { user } = useAuth();

  const location = useLocation();

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
    if (customerSelectRef.current) {
      customerSelectRef.current.focus();
    }
  }, []);

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
    quantityInputRef.current.focus();
  };

  const handleCustomerSelect = selected => {
    setCustomerName(selected);
    // optionally focus next field
    itemSelectRef.current.focus();
  };

  const handleKeyDown = e => {
    if (quantityInputRef.current.value !== '' && e.key === 'Enter') {
      e.preventDefault();
      buttonRef.current.focus();
    }
  };

  const handleClick = () => {
    if (!item || !quantity) return;

    const existingIndex = orderData.findIndex(pro => pro.itemCode === item.item_code);

    if (existingIndex !== -1) {
      const updatedRows = [...orderData];
      updatedRows[existingIndex].itemQty =
        Number(updatedRows[existingIndex].itemQty) + Number(quantity);

      updatedRows[existingIndex].amount =
        Number(updatedRows[existingIndex].itemQty) * Number(updatedRows[existingIndex].rate);
      updatedRows[existingIndex].grossAmt =
        Number(updatedRows[existingIndex].itemQty) * Number(updatedRows[existingIndex].rate);

      setOrderData(updatedRows);
      toast.warning('Item already exists, added with previous quantity!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } else {
      const newRow = {
        itemCode: item.item_code,
        itemName: item.stock_item_name,
        hsn: item.hsn_code || item.hsn,
        gst: item.gst,
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
      });
    }
    setItem('');
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

    if (!customerName) {
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
          return 'Corporate Order-Direct';
        } else if (location.pathname.includes('/distributor')) {
          return 'Distributor Order-Web Based';
        } else {
          return 'Sales Order';
        }
      };

      const voucherType = getVoucherType();
      const dbd = orderData.map(item => ({
        voucher_type: voucherType,
        order_no: orderNumber,
        date,
        status: 'pending',
        executive: user.username || '',
        role: user.role || '',
        customer_code: customerName.customer_code || '',
        customer_name: customerName.customer_name || '',
        item_code: item.itemCode,
        item_name: item.itemName,
        hsn: item.hsn_code || item.hsn,
        gst: Number(String(item.gst).replace('%', '').trim()),
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

  const numberFormat = num => {
    return Number(num || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  // Format for display - show as whole number
  const formatQuantityForDisplay = quantity => {
    const num = Number(quantity) || 0;
    // Remove any decimal places for display
    return Math.floor(num).toString();
  };

  return (
    <div className="font-poppins p-3 bg-[#E9EFEC] border-2 h-screen font-amasis">
      <div className="py px-1 py-3 flex justify-between border items-center transition-all">
        {/* Back Arrow */}
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-gray-200 transition justify-self-start"
        >
          <AiOutlineArrowLeft className="text-[#932F67]" size={22} />
        </button>

        <div className=" flex items-center relative -ml-8">
          <input
            type="text"
            required
            readOnly
            value={
              location.pathname === '/corporate'
                ? 'Corporate Order-Direct'
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

        <div className=" flex items-center relative -ml-5">
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

        {/* <div className=" text-right">Customer Code: C1012</div> */}
        <div className="relative w-30 -ml-8">
          <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium">
            {customerName ? customerName.customer_code : 'CUS-001'}
          </div>
          <span
            className="absolute left-2.5 top-[10px] transition-all text-[12px]
               -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1.5 rounded font-semibold leading-2"
          >
            Customer Code *
          </span>
        </div>

        <div className="relative w-64 -ml-8">
          <Select
            ref={customerSelectRef}
            className="text-sm peer"
            value={customerName}
            options={customerOptions}
            getOptionLabel={e => `${e.customer_name}`}
            getOptionValue={e => `${e.customer_code}`}
            onChange={handleCustomerSelect}
            placeholder="Select customer...."
            components={{
              DropdownIndicator: () => null,
              IndicatorSeparator: () => null,
            }}
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
              }),
              option: (base, state) => ({
                ...base,
                fontFamily: 'font-amasis',
                fontWeight: '600',
                padding: '2px 4px',
                lineHeight: '1.2',
                backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                color: '#555',
                cursor: 'pointer',
              }),
              menu: base => ({
                ...base,
                width: '130%',
                minWidth: '120px',
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
            Name *
          </span>
        </div>

        <div className="relative">
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
          {/* Item Code */}
          <div className="relative w-32">
            <div className="border px-[3px] py-1.5 rounded-[5px] border-[#932F67] text-sm font-medium text-center w-full bg-[#E9EFEC]">
              {item?.item_code || 'Item-1001'}
            </div>
            <span className="absolute left-2.5 top-[10px] transition-all text-[12px] -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1 rounded font-semibold leading-2">
              Item Code *
            </span>
          </div>

          {/* Item Name */}
          <div className="relative w-[450px]">
            <Select
              ref={itemSelectRef}
              className="text-sm peer"
              value={item}
              options={itemOptions}
              getOptionLabel={e => e.stock_item_name}
              getOptionValue={e => e.item_code}
              onChange={handleItemSelect}
              placeholder="Select Product Name..."
              components={{
                DropdownIndicator: () => null,
                IndicatorsContainer: () => null,
              }}
              styles={{
                ...customStyles,
                control: base => ({
                  ...base,
                  minHeight: '30px',
                  height: '30px',
                  lineHeight: '1',
                  padding: '0px 1px',
                  width: '100%',
                  backgroundColor: '#F8F4EC',
                  borderColor: '#932F67',
                  boxShadow: 'none',
                }),
                singleValue: base => ({
                  ...base,
                  lineHeight: '1',
                }),
                placeholder: base => ({
                  ...base,
                  textAlign: 'center',
                  color: '#777',
                }),
                option: (base, state) => ({
                  ...base,
                  fontFamily: 'font-amasis',
                  fontWeight: '600',
                  padding: '2px 4px',
                  lineHeight: '1.2',
                  backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
                  color: '#555',
                  cursor: 'pointer',
                }),
                menu: base => ({
                  ...base,
                  width: '130%',
                  minWidth: '120px',
                  zIndex: 9999,
                }),
                menuList: base => ({
                  ...base,
                  padding: '0',
                }),
              }}
              menuPortalTarget={document.body}
            />
            <span className="absolute left-2.5 top-[10px] transition-all text-[12px] -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1 rounded font-semibold leading-2">
              Item Name *
            </span>
          </div>

          <div className="flex items-center ml-5">
            <span className="text-sm mr-2 font-medium">Quantity * :</span>
            <input
              type="number"
              name="qty"
              ref={quantityInputRef}
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              min="0"
              step="1"
              className="py-1 border w-16 outline-none text-sm rounded px-1 border-[#932F67] bg-[#F8F4EC] text-center"
              autoComplete="off"
            />
          </div>
          <div>
            <input
              type="button"
              ref={buttonRef}
              value={'Add'}
              onClick={handleClick}
              className="bg-[#693382] text-white px-4 rounded-[6px] py-1 outline-none cursor-pointer"
            />
          </div>

          <div className="relative w-44 ml-20">
            <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-medium text-gray-700 text-center">
              {user.username.toUpperCase() || 'executive'}
            </div>
            <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
              Executive Name *
            </span>
          </div>
          <div className="flex w-44 justify-end">
            <button
              onClick={handleSubmit}
              className="bg-[#693382] text-white px-4 rounded-[6px] py-0.5 outline-none cursor-pointer"
            >
              Save
            </button>
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
        <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-28">
          Product Code
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-[400px] text-center">
          Product Name
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 text-center w-20">
          HSN
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-14 text-center">
          GST %
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-12">
          Qty
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 w-10">UOM</th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-right w-[85px]">
          Rate
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 w-[86px]">
          Amount
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 pr-1 w-[94px]">
          Net Amount
        </th>
        <th className="font-medium border text-sm border-gray-300 py-0.5 text-center w-[105px]">
          Gross Amount
        </th>
        <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-[76px]">
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
              <td className="border border-gray-400 text-center text-sm w-[40px]">{index + 1}</td>
              <td className="border border-gray-400 text-center text-sm">{item.itemCode}</td>
              <td className="border border-gray-400 px-2 text-sm w-[450px]">{item.itemName}</td>
              <td className="border border-gray-400 text-center text-sm">{item.hsn}</td>
              <td className="border border-gray-400 text-center text-sm w-[50px]">{item.gst}</td>
              <td className="border border-gray-400 px-2 text-right text-sm bg-[#F8F4EC]">
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
                  className="w-[20px] text-right border-none outline-none bg-transparent px-1"
                />
              </td>
              <td className="border border-gray-400 text-center text-sm w-[50px]">{item.uom}</td>
              <td className="border border-gray-400  px-2 text-right text-sm">
                {formatCurrency(item.rate)}
              </td>
              <td className="border border-gray-400 px-2 text-right text-sm">
                {formatCurrency(item.amount)}
              </td>
              <td className="border border-gray-400 px-2 text-right text-sm w-[100px]">
                {formatCurrency(item.netRate)}
              </td>
              <td className="border border-gray-400 px-2 text-right text-sm w-[117px]">
                {formatCurrency(item.grossAmount)}
              </td>
              <td className="border border-gray-400 text-center text-sm">
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  Remove
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
  <div>
    <p className="font-medium pr-2 mb-0.5">Total</p>
  </div>
  <div className="w-[550px] px-0.5 py-1">
    <table className="w-full border-b mb-1">
      <tfoot>
        <tr className="*:border-[#932F67]">
          <td className="text-right border w-16 px-1">
            {formatQuantityForDisplay(totals.qty)}
          </td>
          <td className="w-32 border"></td>
          <td className="text-right border w-28 px-1">{formatCurrency(totals.amount)}</td>
          <td className="text-right border w-24 px-1"></td>
          <td className="text-right border w-28 px-1">{formatCurrency(totals.grossAmt)}</td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

      </div>
    </div>
  );
};

export default Order;
