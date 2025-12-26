import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/authConstants';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { convertToMySQLDate, formatCurrency, formatDateForInput, generateClientSideOrderNumber, transformOrderData } from './orderUtils';
import { toast } from 'react-toastify';
import OrderHeader from './OrderHeader';
import OrderTable from './OrderTable';
import OrderFooter from './OrderFooter';
import api from '../../services/api';

const NewOrder = ({ onBack }) => {
  const { orderNumberFetch } = useParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showRowValueRows, setShowRowValueRows] = useState(true);
  const [formResetKey, setFormResetKey] = useState(0);
  const { distributorUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDistributorOrder = location.pathname.includes('/distributor');
  const isDirectOrder = location.pathname.includes('/corporate');
  const isCorporateReport = location.pathname.includes('/order-report-corporate');
  const isDistributorReport = location.pathname.includes('/order-report-distributor');
  const isApprovedReport = location.pathname.includes('/order-report-approved');
  const isReportRoute = isCorporateReport || isDistributorReport || isApprovedReport;
  const mode = isReportRoute || orderNumberFetch ? 'update' : 'create';
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDistributorRoute = location.pathname.includes('/distributor');
  const isDirectRoute = location.pathname.includes('/corporate');
  const isOrderReportApproved = location.pathname.includes('/order-report-approved');
  const editingRowSelectRef = useRef(null);
  const customerSelectRef = useRef(null); 
  const addButtonRef = useRef(null);
  // Header States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherType, setVoucherType] = useState('Sales Order');
  const [customerName, setCustomerName] = useState(null);
  const [executiveName, setExecutiveName] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState('pending');
  // Order Data States
  const [orderData, setOrderData] = useState([]);
  const [originalOrderData, setOriginalOrderData] = useState([]);
  // check if view only
  const isViewOnlyReport = location.pathname.includes('order-report-corporate') || 
  location.pathname.includes('order-report-distributor');
  // Add a new empty row for data entry
  const [editingRow, setEditingRow] = useState({
    item: null,
    delivery_date: '',
    delivery_mode: '',
    quantity: '',
    rate: '',
    amount: '',
    disc: '',
    discAmt: 0,
    splDisc: '',
    splDiscAmt: 0,
    hsn: '',
    gst: '',
    sgst: '',
    cgst: '',
    igst: '',
  });

 const handleBackClick = () => {
  const confirmLeave = window.confirm(
    mode === 'update'
      ? 'Do you want to leave without saving changes?'
      : 'Do you want to leave this order?'
  );

  if (!confirmLeave) return;

  if (typeof onBack === 'function') {
    onBack();
  } else {
    navigate(-1);
  }
};

  // Fetch order details
  useEffect(() => {
  if (mode !== 'update') return;

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`orders-by-number/${orderNumberFetch}`);
      const fetchedOrderData = response.data;

      if (fetchedOrderData?.length) {
        const transformedData = transformOrderData(fetchedOrderData);
        setOrderData(transformedData);
        setOriginalOrderData(transformedData);

        const firstItem = fetchedOrderData[0];
        setVoucherType(firstItem.voucher_type || 'Sales Order');
        setCustomerName({
          customer_code: firstItem.customer_code,
          customer_name: firstItem.customer_name,
        });
        setExecutiveName({ customer_name: firstItem.executive });
        setDate(formatDateForInput(firstItem.created_at));
        setStatus(firstItem.status || 'pending');
        setRemarks(firstItem.remarks || '');
      } else {
        toast.error('No data found for this order.');
      }
    } catch (error) {
      toast.error('Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  fetchOrderDetails();
}, [mode, orderNumberFetch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Focus management running');
      
      if (isDistributorRoute) {
        // For distributor route: Always focus editing row
        if (editingRowSelectRef.current) {
          editingRowSelectRef.current.focus();
          console.log('Focused editing row for distributor');
        }
      } else if (isDirectRoute) {
        // For corporate route
        if (!customerName) {
          // No customer selected: Focus customer select
          if (customerSelectRef.current) {
            customerSelectRef.current.focus();
            console.log('Focused customer select (no customer yet)');
          }
        } else {
          // Customer is selected: Focus editing row
          if (editingRowSelectRef.current) {
            editingRowSelectRef.current.focus();
            console.log('Focused editing row (customer selected)');
          }
        }
      }
    }, 200); // Slightly longer delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [isDistributorRoute, isDirectRoute, customerName, location.pathname, formResetKey]);

  // Initialize order number
  useEffect(() => {
  if (mode === 'create') {
    const newOrderNumber = generateClientSideOrderNumber();
    setOrderNumber(newOrderNumber);
  } else {
    setOrderNumber(orderNumberFetch);
  }
}, [mode, date, orderNumberFetch]);

  // Handle customer selection
  const handleCustomerSelect = (selected) => {
    setCustomerName(selected);
    setSelectedCustomer(selected);
  };

  // Handle remarks textarea key events
  const handleRemarksKeyDown = e => {
    const key = e.key;

    if (key === 'ArrowUp') {
      e.preventDefault();
      // Move back to Add button
      addButtonRef.current?.focus();
    } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown') {
      // Allow normal text navigation
    } else if (key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      // Move to Status select
      const statusSelect = document.querySelector('select[disabled]');
      if (statusSelect) {
        statusSelect.focus();
      }
    } else if (key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      // Move back to Add button
      addButtonRef.current?.focus();
    }
  };

  // Helper function to check if state is Tamil Nadu
    const isTamilNaduState = () => {
      let customerState = '';
  
      if (isDistributorRoute) {
        // For distributor route, check distributorUser state
        customerState = distributorUser?.state || '';
        console.log('Distributor State:', customerState);
      } else {
        // For non-distributor route, check selected customer state
        customerState = selectedCustomer?.state || '';
        console.log('Customer State:', customerState);
      }
  
      // Normalize the state string for comparison
      const normalizedState = customerState.toLowerCase().trim();
      return (
        normalizedState === 'tamil nadu' ||
        normalizedState === 'tn' ||
        normalizedState === 'tamilnadu'
      );
    };

  // calculate totals
  const totals = useMemo(() => {
    const totalQty = orderData.reduce((sum, row) => sum + Number(row.itemQty || 0), 0);
    const totalAmt = orderData.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const totalSgstAmt = orderData.reduce((sum, row) => sum + Number(row.sgst || 0), 0);
    const totalCgstAmt = orderData.reduce((sum, row) => sum + Number(row.cgst || 0), 0);
    const totalIgstAmt = orderData.reduce((sum, row) => sum + Number(row.igst || 0), 0);

    const editingRowQty = Number(editingRow.quantity || 0);
    const editingRowAmount = Number(editingRow.amount || 0);
    const editingRowSgst = Number(editingRow.sgst || 0);
    const editingRowCgst = Number(editingRow.cgst || 0);
    const editingRowIgst = Number(editingRow.igst || 0);

    if (isTamilNaduState()) {
      const totalAmountValue = totalAmt + editingRowAmount + (totalSgstAmt + editingRowSgst) + (totalCgstAmt + editingRowCgst);
      
      return {
        qty: totalQty + editingRowQty,
        amount: totalAmt + editingRowAmount,
        sgstAmt: totalSgstAmt + editingRowSgst,
        cgstAmt: totalCgstAmt + editingRowCgst,
        igstAmt: 0,
        netAmt: 0,
        grossAmt: 0,
        totalAmount: totalAmountValue,
      };
    } else {
      const totalAmountValue = totalAmt + editingRowAmount + (totalIgstAmt + editingRowIgst);
      
      return {
        qty: totalQty + editingRowQty,
        amount: totalAmt + editingRowAmount,
        sgstAmt: 0,
        cgstAmt: 0,
        igstAmt: totalIgstAmt + editingRowIgst,
        netAmt: 0,
        grossAmt: 0,
        totalAmount: totalAmountValue,
      };
    }
  }, [orderData, editingRow, isTamilNaduState]);

  const handleDiscChange = (index, value) => {
    const updatedRows = [...orderData];
    const row = updatedRows[index];

    const disc = Number(value) || 0;
    const gross = row.amount;
    const qty = Number(row.itemQty) || 1;

    const discAmt = (gross * disc) / 100;
    const splDiscAmt = (gross * (row.splDisc || 0)) / 100;
    const totalDisc = discAmt + splDiscAmt;

    updatedRows[index].disc = value;
    updatedRows[index].discAmt = discAmt;
    updatedRows[index].netRate = qty > 0 ? (gross - totalDisc) / qty : 0;
    updatedRows[index].grossAmount = gross - totalDisc;

    setOrderData(updatedRows);
  };

  // Handle special discount changes
  const handleSplDiscChange = (index, value) => {
    const updatedRows = [...orderData];
    const row = updatedRows[index];
    
    const splDisc = Number(value) || 0;
    const gross = row.amount;
    const qty = Number(row.itemQty) || 1;
    
    const discAmt = (gross * (row.disc || 0)) / 100;
    const splDiscAmt = (gross * splDisc) / 100;
    const totalDisc = discAmt + splDiscAmt;
    
    updatedRows[index].splDisc = value;
    updatedRows[index].splDiscAmt = splDiscAmt;
    updatedRows[index].netRate = qty > 0 ? (gross - totalDisc) / qty : 0;
    updatedRows[index].grossAmount = gross - totalDisc;
    
    setOrderData(updatedRows);
  };

   // Handle quantity changes
  const handleQuantityChange = (index, value) => {
    const updatedRows = [...orderData];
    const row = updatedRows[index];
    
    const newQty = Number(value) || 0;
    const rate = Number(row.rate) || 0;
    const gross = newQty * rate;
    
    const discAmt = (gross * (row.disc || 0)) / 100;
    const splDiscAmt = (gross * (row.splDisc || 0)) / 100;
    const totalDisc = discAmt + splDiscAmt;
    
    updatedRows[index].itemQty = newQty;
    updatedRows[index].amount = gross;
    updatedRows[index].discAmt = discAmt;
    updatedRows[index].splDiscAmt = splDiscAmt;
    updatedRows[index].netRate = newQty > 0 ? (gross - totalDisc) / newQty : 0;
    updatedRows[index].grossAmount = gross - totalDisc;
    
    setOrderData(updatedRows);
  };

  const handlePrimaryAction = e => {
  if (mode === 'update') {
    handleUpdate(e);
  } else {
    handleSubmit(e);
  }
};

  
  const handleUpdate = async (e) => { 
    e.preventDefault(); 
    setIsSubmitting(true); 
    try { 
     const updates = orderData.map(
      item => ({ 
        id: item.id, 
        status: status, 
        disc_percentage: Number(item.disc) || 0, 
        disc_amount: Number(item.discAmt) || 0, 
        spl_disc_percentage: Number(item.splDisc) || 0, 
        spl_disc_amount: Number(item.splDiscAmt) || 0, 
        net_rate: Number(item.netRate) || 0, 
        gross_amount: Number(item.grossAmount) || 0, 
        quantity: Number(item.itemQty) || 0, 
        gst: Number(item.gst || 0), 
        sgst: Number(item.sgst || 0), 
        cgst: Number(item.cgst || 0), 
        igst: Number(item.igst || 0), 
        hsn: item.hsn || '', 
        rate: Number(item.rate || 0), 
        amount: Number(item.amount || 0), 
        uom: item.uom || '', 
        delivery_date: convertToMySQLDate(item.delivery_date), 
        delivery_mode: item.delivery_mode || '', 
        total_quantity: totals.qty, 
        total_amount: totals.totalAmount, 
        total_sgst_amount: totals.sgstAmt, 
        total_cgst_amount: totals.cgstAmt, 
        total_igst_amount: totals.igstAmt, 
        remarks: remarks || '', 
      })); 
      // Log for debugging 
      console.log('Sending update for order:', orderNumber); 
      console.log('Update payload sample:', updates[0]); 
      console.log('Totals:', { total_quantity: totals.qty, total_amount: totals.totalAmount, total_sgst_amount: totals.sgstAmt, total_cgst_amount: totals.cgstAmt, total_igst_amount: totals.igstAmt, }); 
      const response = await api.put(`/orders-by-number/${orderNumber}`, updates); 
      console.log('Update response:', response.data); 
      toast.success('Order updated successfully!'); navigate(-1); 
    } catch (error) { 
      console.error('Error updating order:', error); 
      console.error('Error details:', error.response?.data); 
    } finally { setIsSubmitting(false); } };

 const postOrder = async (payload) => {
  try {
    console.log('Sending order payload:', payload);
    const response = await api.post('/orders', payload);
    console.log('Order response:', response);
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    // Validation
    if (!isDistributorRoute && !customerName) {
      toast.error('Please select a customer name.');
      setIsSubmitting(false);
      return;
    }

    const hasEditingRowData = editingRow.item && editingRow.quantity;
    if (!orderData.length && !hasEditingRowData) {
      toast.error('No items in the order.');
      setIsSubmitting(false);
      return;
    }

    // Additional validation for editing row
    if (hasEditingRowData) {
      if (!editingRow.delivery_date || editingRow.delivery_date.trim() === '') {
        toast.error('Please enter delivery date for the current item!');
        setIsSubmitting(false);
        return;
      }
      if (!editingRow.delivery_mode || editingRow.delivery_mode.trim() === '') {
        toast.error('Please enter delivery mode for the current item!');
        setIsSubmitting(false);
        return;
      }
    }

    // Validate existing rows
    for (const row of orderData) {
      if (!row.delivery_date || row.delivery_date.trim() === '') {
        toast.error(`Please enter delivery date for item: ${row.itemName}`);
        setIsSubmitting(false);
        return;
      }
      if (!row.delivery_mode || row.delivery_mode.trim() === '') {
        toast.error(`Please enter delivery mode for item: ${row.itemName}`);
        setIsSubmitting(false);
        return;
      }
    }

    const voucherType = isDirectRoute 
      ? 'Direct Order Management' 
      : isDistributorRoute 
      ? 'Distributor Order-Web Based' 
      : 'Sales Order';

    const customer = isDistributorRoute
      ? {
          customer_code: distributorUser?.customer_code || 'DISTRIBUTOR',
          customer_name: distributorUser?.customer_name || 'Distributor User',
        }
      : {
          customer_code: customerName?.customer_code || '',
          customer_name: customerName?.customer_name || '',
        };

    // Prepare rows array
    const rows = [...orderData];

    // Add editing row if it has data
    if (hasEditingRowData) {
      // Validate editing row rate and amount
      const rate = Number(editingRow.rate) || 0;
      const quantity = Number(editingRow.quantity) || 0;
      const amount = rate * quantity;
      
      // Ensure GST values are properly set
      const gstPercentage = Number(editingRow.gst) || 18;
      const gstAmount = amount * (gstPercentage / 100);
      
      let sgst = 0;
      let cgst = 0;
      let igst = 0;
      
      if (isTamilNaduState()) {
        const halfGST = gstAmount / 2;
        sgst = halfGST;
        cgst = halfGST;
        igst = 0;
      } else {
        sgst = 0;
        cgst = 0;
        igst = gstAmount;
      }

      rows.push({
        item: editingRow.item,
        itemCode: editingRow.item.item_code,
        itemName: editingRow.item.stock_item_name,
        hsn: editingRow.hsn || editingRow.item.hsn_code || '',
        gst: gstPercentage,
        sgst: sgst.toFixed(2),
        cgst: cgst.toFixed(2),
        igst: igst.toFixed(2),
        delivery_date: editingRow.delivery_date,
        delivery_mode: editingRow.delivery_mode,
        itemQty: quantity,
        uom: editingRow.item.uom || 'Nos',
        rate: rate,
        amount: amount,
        netRate: rate,
        grossAmount: amount,
      });
    }

    // Log rows for debugging
    console.log('Rows to submit:', rows);

    // Prepare payload - SEND AS ARRAY if your API expects array of items
    const payload = rows.map((item, index) => ({
      voucher_type: voucherType,
      order_no: orderNumber,
      date: date,
      status: 'pending',
      executiveCode: distributorUser?.customer_code || '',
      executive: distributorUser?.customer_name || '',
      role: distributorUser?.role || '',
      ...customer,
      item_code: item.itemCode,
      item_name: item.itemName,
      hsn: item.hsn,
      gst: Number(item.gst || 0),
      sgst: Number(item.sgst || 0),
      cgst: Number(item.cgst || 0),
      igst: Number(item.igst || 0),
      delivery_date: convertToMySQLDate(item.delivery_date),
      delivery_mode: item.delivery_mode,
      quantity: Number(item.itemQty || 0),
      uom: item.uom,
      rate: Number(item.rate || 0),
      amount: Number(item.amount || 0),
      net_rate: Number(item.netRate || item.rate || 0),
      gross_amount: Number(item.grossAmount || item.amount || 0),
      disc_percentage: 0,
      disc_amount: 0,
      spl_disc_percentage: 0,
      spl_disc_amount: 0,
      total_quantity: totals.qty,
      total_cgst_amount: totals.cgstAmt,
      total_sgst_amount: totals.sgstAmt,
      total_igst_amount: totals.igstAmt,
      total_amount: totals.totalAmount,
      remarks: remarks || '',
      row_index: index + 1, // Add row index for reference
    }));

    // Log final payload
    console.log('Final payload:', payload);

    // Check if payload is empty
    if (payload.length === 0) {
      toast.error('No items to submit!');
      setIsSubmitting(false);
      return;
    }

    // Submit order
    await postOrder(payload);
    
    toast.success(`Order ${orderNumber} placed successfully!`);
    
    // Reset form after successful submission
    resetForm();
    
  } catch (error) {
    console.error('Submission error:', error);
    
    // More specific error messages
    if (error.response) {
      // Server responded with error status
      const serverError = error.response.data;
      console.error('Server error response:', serverError);
      
      if (serverError.message) {
        toast.error(`Server Error: ${serverError.message}`);
      } else if (serverError.error) {
        toast.error(`Server Error: ${serverError.error}`);
      } else {
        toast.error('Error placing order. Please check console for details.');
      }
    } else if (error.request) {
      // Request was made but no response
      console.error('No response received:', error.request);
      toast.error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      console.error('Error setting up request:', error.message);
      toast.error(`Error: ${error.message}`);
    }
  } finally {
    setIsSubmitting(false);
  }
};

const resetForm = () => {
    setOrderData([]);
    setEditingRow({
      item: null,
      delivery_date: '',
      delivery_mode: '',
      quantity: '',
      rate: '',
      amount: '',
      hsn: '',
      gst: '',
      sgst: '',
      cgst: '',
      igst: '',
    });
    
    setRemarks('');
    setDate(new Date().toISOString().split('T')[0]);
    setCustomerName(null);
    setSelectedCustomer(null);
    setFormResetKey(prev => prev + 1);
    // Generate new order number
    const newOrderNumber = generateClientSideOrderNumber();
    setOrderNumber(newOrderNumber);
  };


  return (
    <div className='p-3 bg-amber-50 border-2 h-screen font-amasis'>
      <OrderHeader
        onBack={handleBackClick}
        location={location}
        orderNumber={orderNumber}
        customerName={customerName}
        setCustomerName={setCustomerName}
        handleCustomerSelect={handleCustomerSelect}
        distributorUser={distributorUser}
        isDistributorRoute={isDistributorRoute}
        date={date}
        setDate={setDate} 
        customerSelectRef={customerSelectRef}
        voucherType={voucherType}
        executiveName={executiveName}
        readOnly={isViewOnlyReport}
        isDistributorReport={isDistributorReport}
        isCorporateReport={isCorporateReport}
      />

      <OrderTable
        orderData={orderData}
        setOrderData={setOrderData}
        editingRow={editingRow}
        setEditingRow={setEditingRow}
        showRowValueRows={showRowValueRows}
        formResetKey={formResetKey}
        editingRowSelectRef={editingRowSelectRef}
        isTamilNaduState={isTamilNaduState}
        isViewOnlyReport={isViewOnlyReport}
        isDistributorOrder={isDistributorOrder}
        isDirectOrder={isDirectOrder}
        isDistributorReport={isDistributorReport}
        isCorporateReport={isCorporateReport}
        isOrderReportApproved={isOrderReportApproved}
      />

      <OrderFooter
        remarks={remarks}
        setRemarks={setRemarks}
        totals={totals}
        handleSubmit={handlePrimaryAction}
        isSubmitting={isSubmitting}
        formatCurrency={formatCurrency}
        handleRemarksKeyDown={handleRemarksKeyDown}
        isViewOnlyReport={isViewOnlyReport}
        isDistributorReport={isDistributorReport}
        isCorporateReport={isCorporateReport}
      />
    </div>
  )
}

export default NewOrder