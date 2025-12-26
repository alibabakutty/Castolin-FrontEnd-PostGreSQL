import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiFillDelete, AiFillPlusCircle, AiOutlineArrowLeft } from 'react-icons/ai';
import Select from 'react-select';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authConstants';

const Order = ({ onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [itemOptions, setItemOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formResetKey, setFormResetKey] = useState(0);
  const [focusedRateFields, setFocusedRateFields] = useState({
    editingRow: false,
    existingRows: {}, // key: rowIndex, value: boolean
  });
  const customerSelectRef = useRef(null);
  const isSubmitttingRef = useRef(false);
  const navigate = useNavigate();
  const [showRowValueRows, setShowRowValueRows] = useState(true);
  const inputRefs = useRef([]);
  const selectRefs = useRef([]);
  const editingRowInputRefs = useRef({});
  const editingRowSelectRef = useRef(null);
  const addButtonRef = useRef(null);
  const isResettingRef = useRef(false);
  const [isLoadingOrderNumber, setIsLoadingOrderNumber] = useState(false);
  const { distributorUser } = useAuth();
  const location = useLocation();
  const isDistributorRoute = location.pathname.includes('/distributor');
  const isDirectRoute = location.pathname.includes('/corporate');

  // Add a new empty row for data entry
  const [editingRow, setEditingRow] = useState({
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

  // Define column structure for keyboard navigation
  const totalCols = 15; // Total number of editable columns (excluding S.No and Action)
  const actionColumnIndex = 14; // Action column index

  useEffect(() => {
    console.log('Selected Customer:', selectedCustomer);
    console.log('Distributor User:', distributorUser);
    console.log('Is Tamil Nadu State:', isTamilNaduState());
  }, [selectedCustomer, distributorUser]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onBack) {
          onBack()
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

// Focus management - SINGLE SOURCE OF TRUTH for initial focus
useEffect(() => {
  const timer = setTimeout(() => {
    console.log('Focus management running for route:', location.pathname);
    
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
  }, 150);

  return () => clearTimeout(timer);
}, [isDistributorRoute, isDirectRoute, customerName, location.pathname]);

// Remove duplicate focus effects and keep one comprehensive version
useEffect(() => {
  const handleFocus = () => {
    // Small delay for DOM readiness
    setTimeout(() => {
      if (isDistributorRoute) {
        editingRowSelectRef.current?.focus();
      } else if (isDirectRoute) {
        if (!customerName) {
          customerSelectRef.current?.focus();
        } else {
          editingRowSelectRef.current?.focus();
        }
      }
    }, 100);
  };

  handleFocus();
}, [isDistributorRoute, isDirectRoute, customerName, location.pathname]);

// Additional effect to handle customer selection
useEffect(() => {
  // When customer changes from null to a value (corporate route only)
  if (isDirectRoute && customerName) {
    const timer = setTimeout(() => {
      if (editingRowSelectRef.current) {
        editingRowSelectRef.current.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }
}, [customerName, isDirectRoute]);

  const [totals, setTotals] = useState({
    qty: 0,
    amount: 0,
    sgstAmt: 0,
    cgstAmt: 0,
    igstAmt: 0,
    netAmt: 0,
    grossAmt: 0,
    totalAmount: 0,
  });

  const fetchOrderNumberFromServer = async () => {
    setIsLoadingOrderNumber(true);
    try {
      const response = await api.get('/orders/next-order-number');
      setOrderNumber(response.data.orderNumber);
      return response.data.orderNumber;
    } catch (error) {
      console.error('Error fetching order number from server:', error);
      
      // Fallback to client-side generation ONLY as last resort
      const fallbackOrderNumber = generateClientSideOrderNumber();
      setOrderNumber(fallbackOrderNumber);
      return fallbackOrderNumber;
    } finally {
      setIsLoadingOrderNumber(false);
    }
  };

  const generateClientSideOrderNumber = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    
    // Generate a random suffix to prevent collisions
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    return `SQ-${day}-${month}-${year}-${randomSuffix}`;
  };

  // 3. Initial load of order number
useEffect(() => {
  const initializeOrder = async () => {
    await fetchOrderNumberFromServer();
    // Other initialization logic here
  };
  
  initializeOrder();
}, [date]); // Only re-fetch when date changes

  // useEffect(() => {
  //   const handleResize = () => setWindowWidth(window.innerWidth);
  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, []);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await api.get('/stock_item');
        const formattedItems = response.data.map(item => ({
          ...item,
          label: `${item.item_code} - ${item.stock_item_name}`,
          value: item.item_code,
        }));
        setItemOptions(formattedItems);
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
        const customerWithState = response.data.map(customer => ({
          ...customer,
          state: customer.state || '',
        }));
        setCustomerOptions(customerWithState);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleItemSelect = (selected, index) => {
    if (index === undefined) {
      // For editing row
      setEditingRow(prev => {
        const updated = {
          ...prev,
          item: selected,
          rate: selected?.rate || '',
          hsn: selected?.hsn_code || selected?.hsn || '',
          gst: selected?.gst || '18',
          sgst: '', // Will calculate based on state
          cgst: '', // Will calculate based on state
          igst: '', // Will calculate based on state
        };

        if (prev.quantity && selected?.rate) {
          const amount = (Number(prev.quantity) || 0) * (Number(selected.rate) || 0);
          updated.amount = amount;

          // Check if state is Tamil Nadu
          if (isTamilNaduState()) {
            // Calculate SGST and CGST for Tamil Nadu
            const gstPercentage = Number(selected?.gst || 18);
            const gstAmount = amount * (gstPercentage / 100);
            const halfGST = gstAmount / 2;
            updated.sgst = halfGST.toFixed(2);
            updated.cgst = halfGST.toFixed(2);
            updated.igst = 0; // Clear IGST
          } else {
            // Calculate IGST for other states
            const gstPercentage = Number(selected?.gst || 18);
            const gstAmount = amount * (gstPercentage / 100);
            updated.sgst = ''; // Clear SGST
            updated.cgst = ''; // Clear CGST
            updated.igst = gstAmount.toFixed(2);
          }
        }

        return updated;
      });

      // After selecting item, focus on quantity field
      setTimeout(() => {
        editingRowInputRefs.current.quantity?.focus();
      }, 50);
    } else {
      // For existing rows
      const updatedRows = [...orderData];
      updatedRows[index].item = selected;
      updatedRows[index].itemCode = selected?.item_code || '';
      updatedRows[index].itemName = selected?.stock_item_name || '';
      updatedRows[index].rate = selected?.rate || '';
      updatedRows[index].hsn = selected?.hsn_code || selected?.hsn || '';
      updatedRows[index].gst = selected?.gst || '18';
      updatedRows[index].sgst = '';
      updatedRows[index].cgst = '';
      updatedRows[index].igst = '';
      updatedRows[index].uom = selected?.uom || "Nos";

      if (updatedRows[index].itemQty && selected?.rate) {
        const amount = (Number(updatedRows[index].itemQty) || 0) * (Number(selected.rate) || 0);
        updatedRows[index].amount = amount;

        // Check if state is Tamil Nadu
        if (isTamilNaduState()) {
          // Calculate SGST and CGST for Tamil Nadu
          const gstPercentage = Number(selected?.gst || 18);
          const gstAmount = amount * (gstPercentage / 100);
          const halfGST = gstAmount / 2;
          updatedRows[index].sgst = halfGST.toFixed(2);
          updatedRows[index].cgst = halfGST.toFixed(2);
          updatedRows[index].igst = 0; // Clear IGST
        } else {
          // Calculate IGST for other states
          const gstPercentage = Number(selected?.gst || 18);
          const gstAmount = amount * (gstPercentage / 100);
          updatedRows[index].sgst = ''; // Clear SGST
          updatedRows[index].cgst = ''; // Clear CGST
          updatedRows[index].igst = gstAmount.toFixed(2);
        }
      }

      setOrderData(updatedRows);

      // After selecting item, focus on quantity field
      setTimeout(() => {
        const quantityIndex = index * totalCols + 3;
        inputRefs.current[quantityIndex]?.focus();
      }, 50);
    }
  };

  const handleCustomerSelect = useCallback(selected => {
    setCustomerName(selected);
    setSelectedCustomer(selected);
    recalculateGSTForAllItems(selected?.state || '');
  }, []);

  // Helper function to recalculate GST for all items
  const recalculateGSTForAllItems = customerState => {
    const isTN =
      customerState.toLowerCase().trim() === 'tamil nadu' ||
      customerState.toLowerCase().trim() === 'tn' ||
      customerState.toLowerCase().trim() === 'tamilnadu';

    // Update editing row
    setEditingRow(prev => {
      if (prev.item && prev.quantity && prev.rate) {
        const amount = (Number(prev.quantity) || 0) * (Number(prev.rate) || 0);
        const gstPercentage = Number(prev.gst || 18);
        const gstAmount = amount * (gstPercentage / 100);

        let updated = { ...prev, amount };

        if (isTN) {
          const halfGST = gstAmount / 2;
          updated.sgst = halfGST.toFixed(2);
          updated.cgst = halfGST.toFixed(2);
          updated.igst = 0;
        } else {
          updated.sgst = '';
          updated.cgst = '';
          updated.igst = gstAmount.toFixed(2);
        }

        return updated;
      }
      return prev;
    });

    // Update existing rows
    if (orderData.length > 0) {
      const updatedRows = orderData.map(row => {
        if (row.itemQty && row.rate) {
          const amount = (Number(row.itemQty) || 0) * (Number(row.rate) || 0);
          const gstPercentage = Number(row.gst || 18);
          const gstAmount = amount * (gstPercentage / 100);

          let updatedRow = { ...row, amount };

          if (isTN) {
            const halfGST = gstAmount / 2;
            updatedRow.sgst = halfGST.toFixed(2);
            updatedRow.cgst = halfGST.toFixed(2);
            updatedRow.igst = 0;
          } else {
            updatedRow.sgst = '';
            updatedRow.cgst = '';
            updatedRow.igst = gstAmount.toFixed(2);
          }

          return updatedRow;
        }
        return row;
      });

      setOrderData(updatedRows);
    }
  };

  // Add this validation in your form
  useEffect(() => {
    if (isDistributorRoute) {
      if (!distributorUser?.state) {
        console.warn('Distributor user state is not set. Defaulting to IGST calculation.');
      }
    } else {
      if (customerName && !selectedCustomer?.state) {
        console.warn('Customer state is not available. Defaulting to IGST calculation.');
      }
    }
  }, [distributorUser, customerName, selectedCustomer, isDistributorRoute]);

  // When distributor user changes, update GST calculations
  useEffect(() => {
    if (isDistributorRoute && distributorUser) {
      const distributorState = distributorUser.state || '';
      recalculateGSTForAllItems(distributorState);
    }
  }, [distributorUser, isDistributorRoute]);

  // When selected customer changes (non-distributor route)
  useEffect(() => {
    if (!isDistributorRoute && selectedCustomer) {
      const customerState = selectedCustomer.state || '';
      recalculateGSTForAllItems(customerState);
    }
  }, [selectedCustomer, isDistributorRoute]);

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

  const handleAddRow = () => {
  // Validation
  if (!editingRow.item) {
    toast.error('Please select item!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    return;
  }

  if (!editingRow.quantity || editingRow.quantity.trim() === '') {
    toast.error('Please enter quantity!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    // Focus on quantity field
    setTimeout(() => {
      editingRowInputRefs.current.quantity?.focus();
    }, 100);
    return;
  }

  // Convert quantity to number for validation
  const quantityNum = parseFloat(editingRow.quantity);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    toast.error('Please enter a valid quantity (greater than 0)!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    // Focus on quantity field
    setTimeout(() => {
      editingRowInputRefs.current.quantity?.focus();
    }, 100);
    return;
  }

  if (!editingRow.delivery_date || editingRow.delivery_date.trim() === '') {
    toast.error('Please enter delivery date!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    // Focus on delivery date field
    setTimeout(() => {
      editingRowInputRefs.current.delivery_date?.focus();
    }, 100);
    return;
  }

  if (!editingRow.delivery_mode || editingRow.delivery_mode.trim() === '') {
    toast.error('Please enter delivery mode!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    // Focus on delivery mode field
    setTimeout(() => {
      editingRowInputRefs.current.delivery_mode?.focus();
    }, 100);
    return;
  }

  // Ensure rate is a number
  const rateValue = parseFloat(editingRow.rate) || 0;
  
  const newRow = {
    item: editingRow.item,
    itemCode: editingRow.item.item_code,
    itemName: editingRow.item.stock_item_name,
    hsn: editingRow.hsn,
    gst: editingRow.gst,
    sgst: editingRow.sgst,
    cgst: editingRow.cgst,
    igst: editingRow.igst,
    delivery_date: editingRow.delivery_date,
    delivery_mode: editingRow.delivery_mode,
    itemQty: quantityNum, // Use the parsed number
    uom: editingRow.item.uom || "No's",
    rate: rateValue,
    amount: rateValue * quantityNum,
    netRate: rateValue,
    grossAmount: rateValue * quantityNum,
  };

  setOrderData(prev => [...prev, newRow]);

  // Reset editing row
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

  // Focus on the new editing row's select
  setTimeout(() => {
    editingRowSelectRef.current?.focus();
  }, 100);
};

  const handleFieldChange = (field, value, index) => {
    if (index === undefined) {
      // For editing row
      setEditingRow(prev => {
        const updated = { ...prev, [field]: value };

        if (field === 'quantity' || field === 'rate' || field === 'gst') {
          const qty = field === 'quantity' ? value : prev.quantity;
          const rate = field === 'rate' ? value : prev.rate;
          const gstPercentage = field === 'gst' ? value : prev.gst;

          // Parse rate value for calculation
          const rateNum = field === 'rate' ? parseFloat(value) || 0 : parseFloat(prev.rate) || 0;
          const amount = (parseFloat(qty) || 0) * rateNum;
          updated.amount = amount;

          // Check if state is Tamil Nadu
          if (isTamilNaduState()) {
            // Calculate SGST and CGST for Tamil Nadu
            const gstAmount = amount * (parseFloat(gstPercentage || 18) / 100);
            const halfGST = gstAmount / 2;
            updated.sgst = halfGST.toFixed(2);
            updated.cgst = halfGST.toFixed(2);
            updated.igst = ''; // Clear IGST
          } else {
            // Calculate IGST for other states
            const gstAmount = amount * (Number(gstPercentage || 18) / 100);
            updated.sgst = '';
            updated.cgst = '';
            updated.igst = gstAmount.toFixed(2);
          }
        }

        return updated;
      });
    } else {
      // For existing rows
      const updatedRows = [...orderData];

      // If it's the rate field, store the raw value but keep numeric value for calculations
      if (field === 'rate') {
        updatedRows[index][field] = value; // Store the raw input
      } else {
        updatedRows[index][field] = value;
      }

      if (field === 'itemQty' || field === 'rate' || field === 'gst') {
        const qty = field === 'itemQty' ? value : updatedRows[index].itemQty;
        const rate = field === 'rate' ? value : updatedRows[index].rate;
        const gstPercentage = field === 'gst' ? value : updatedRows[index].gst;

        // Parse rate for calculation
        const rateNum = parseFloat(rate) || 0;
        const amount = (parseFloat(qty) || 0) * rateNum;
        updatedRows[index].amount = amount;

        // Check if state is Tamil Nadu
        if (isTamilNaduState()) {
          // Calculate SGST and CGST for Tamil Nadu
          const gstAmount = amount * (parseFloat(gstPercentage || 18) / 100);
          const halfGST = gstAmount / 2;
          updatedRows[index].sgst = halfGST.toFixed(2);
          updatedRows[index].cgst = halfGST.toFixed(2);
          updatedRows[index].igst = 0; // Clear IGST
        } else {
          // Calculate IGST for other states
          const gstAmount = amount * (parseFloat(gstPercentage || 18) / 100);
          updatedRows[index].sgst = '';
          updatedRows[index].cgst = '';
          updatedRows[index].igst = gstAmount.toFixed(2);
        }
      }

      setOrderData(updatedRows);
    }
  };

  // Add this function to handle rate field blur (when focus leaves)
  const handleRateBlur = index => {
    if (index === undefined) {
      // For editing row
      setFocusedRateFields(prev => ({
        ...prev,
        editingRow: false,
      }));

      setEditingRow(prev => {
        if (!prev.rate) return { ...prev, rate: '' };

        // Parse the value to ensure it's a number
        const rateValue = parseFloat(prev.rate);
        if (isNaN(rateValue)) return { ...prev, rate: '' };

        // Return numeric value, not formatted string
        return { ...prev, rate: rateValue.toFixed(2) };
      });
    } else {
      // For existing rows
      setFocusedRateFields(prev => ({
        ...prev,
        existingRows: {
          ...prev.existingRows,
          [index]: false,
        },
      }));

      setOrderData(prev => {
        const updatedRows = [...prev];
        if (!updatedRows[index].rate) {
          updatedRows[index].rate = '';
          return updatedRows;
        }

        const rateValue = parseFloat(updatedRows[index].rate);
        if (isNaN(rateValue)) {
          updatedRows[index].rate = '';
        } else {
          // Store as numeric string with 2 decimal places
          updatedRows[index].rate = rateValue.toFixed(2);
        }

        return updatedRows;
      });
    }
  };

  // Add this function to handle rate field focus
  const handleRateFocus = index => {
    if (index === undefined) {
      // For editing row
      setFocusedRateFields(prev => ({
        ...prev,
        editingRow: true,
      }));
    } else {
      // For existing rows
      setFocusedRateFields(prev => ({
        ...prev,
        existingRows: {
          ...prev.existingRows,
          [index]: true,
        },
      }));
    }
  };

  // Helper function to get display value for existing rows rate
  const getExistingRowRateDisplay = (rowIndex, rateValue) => {
    if (focusedRateFields.existingRows[rowIndex]) {
      // When focused, show raw value
      return rateValue || '';
    } else {
      // When not focused, show formatted value
      if (rateValue && !isNaN(parseFloat(rateValue))) {
        return formatCurrency(parseFloat(rateValue));
      }
      return '';
    }
  };

  // Helper function to get display value for editing row rate
  const getEditingRowRateDisplay = rateValue => {
    if (focusedRateFields.editingRow) {
      // When focused, show raw value
      return rateValue || '';
    } else {
      // When not focused, show formatted value
      if (rateValue && !isNaN(parseFloat(rateValue))) {
        return formatCurrency(parseFloat(rateValue));
      }
      return '';
    }
  };

  const handleRemoveItem = index => {
    const updatedRows = orderData.filter((_, i) => i !== index);
    setOrderData(updatedRows);

    // Clean up refs for the removed row
    const startIndex = index * totalCols;
    const endIndex = startIndex + totalCols;

    inputRefs.current = inputRefs.current.filter((_, i) => i < startIndex || i >= endIndex);
    selectRefs.current = selectRefs.current.filter((_, i) => i < startIndex || i >= endIndex);

    // Re-index remaining refs
    const newInputRefs = [];
    const newSelectRefs = [];

    updatedRows.forEach((_, newIndex) => {
      for (let col = 0; col < totalCols; col++) {
        const oldIndex = (newIndex >= index ? newIndex + 1 : newIndex) * totalCols + col;
        if (col === 1) {
          newSelectRefs[newIndex * totalCols + col] = selectRefs.current[oldIndex];
        } else {
          newInputRefs[newIndex * totalCols + col] = inputRefs.current[oldIndex];
        }
      }
    });

    inputRefs.current = newInputRefs;
    selectRefs.current = newSelectRefs;

    toast.info('Item removed from order!', {
      position: 'bottom-right',
      autoClose: 3000,
    });
  };

  // Function to normalize different date formats to YYYY-MM-DD
  // const normalizeDateString = dateStr => {
  //   if (!dateStr || typeof dateStr !== 'string') return '';

  //   // Remove any whitespace and replace common separators with hyphens
  //   const cleanedStr = dateStr.trim().replace(/[./]/g, '-');

  //   // Try to parse the date - multiple format attempts
  //   let date = null;

  //   // Try parsing as DD-MM-YYYY (most common for your input)
  //   const parts = cleanedStr.split('-');
  //   if (parts.length === 3) {
  //     const day = parts[0];
  //     const month = parts[1];
  //     const year = parts[2];

  //     // Check if it's likely DD-MM-YYYY (day <= 31, month <= 12)
  //     if (day.length <= 2 && month.length <= 2 && year.length === 4) {
  //       // Use the constructor with individual parts to avoid timezone issues
  //       date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  //     }
  //     // Check if it's YYYY-MM-DD
  //     else if (year.length === 4 && month.length <= 2 && day.length <= 2) {
  //       date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  //     }
  //   }

  //   // If parsing failed, try the Date constructor directly
  //   if (!date || isNaN(date.getTime())) {
  //     date = new Date(cleanedStr);
  //   }

  //   // Validate the date
  //   if (!date || isNaN(date.getTime())) {
  //     return ''; // Invalid date
  //   }

  //   // Format as YYYY-MM-DD for consistency
  //   const yearFormatted = date.getFullYear();
  //   const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
  //   const dayFormatted = String(date.getDate()).padStart(2, '0');

  //   return `${yearFormatted}-${monthFormatted}-${dayFormatted}`;
  // };

  // Function to validate if a date is today or in the future
const validateFutureDate = dateStr => {
  if (!dateStr) return false;

  const formattedDate = formatDateToDDMMYYYYSimple(dateStr);
  if (!formattedDate) return false;

  const parts = formattedDate.split('-');
  if (parts.length !== 3) return false;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  // Validate date parts
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (day < 1 || day > 31) return false;
  if (month < 0 || month > 11) return false;
  
  const inputDate = new Date(year, month, day);
  
  // Check if date is valid
  if (isNaN(inputDate.getTime())) return false;
  
  // Check if date components match (handles invalid dates like 31-Feb)
  if (inputDate.getDate() !== day || 
      inputDate.getMonth() !== month || 
      inputDate.getFullYear() !== year) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
};

  // Enhanced keyboard navigation handler with validation
  const handleKeyDownTable = (e, rowIndex, colIndex, fieldType = 'input') => {
    const key = e.key;
    // Calculate total rows including editing row
    const totalRows = orderData.length + 1; // +1 for editing row

    // Common function for moving to next cell (used by Enter, Tab, ArrowRight)
    const moveToNextCell = () => {
      // Get current row data
      const currentRowData = rowIndex === totalRows - 1 ? editingRow : orderData[rowIndex];
      // Check validation based on current column
      let shouldPreventNavigation = false;

      if (colIndex === 3) {
        // Quantity column
        // if (!currentRowData.quantity || currentRowData.quantity.trim() === '') {
        //   shouldPreventNavigation = true;
        //   toast.error('Please enter quantity before proceeding!', {
        //     position: 'bottom-right',
        //     autoClose: 3000,
        //   });
        // }
      } else if (colIndex === 12) {
        // Delivery Date column
        const dateStr = currentRowData.delivery_date || '';

        if (!dateStr.trim()) {
          shouldPreventNavigation = true;
          toast.error('Please enter delivery date before proceeding!', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        } else if (!validateFutureDate(dateStr)) {
          shouldPreventNavigation = true;
          toast.error('Delivery date must be today or a future date!', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      } else if (colIndex === 13) {
        // Delivery Mode column
        if (!currentRowData.delivery_mode || currentRowData.delivery_mode.trim() === '') {
          shouldPreventNavigation = true;
          toast.error('Please enter delivery mode before proceeding!', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      }

      if (shouldPreventNavigation) {
        e.preventDefault();
        return;
      }

      let nextRow = rowIndex;
      let nextCol = colIndex + 1;

      // If at last column (delivery_mode), move to action column (Add button)
      if (colIndex === 13) {
        // Delivery Mode column
        nextCol = actionColumnIndex;
      }
      // If at last column (action), move to next row first column
      else if (colIndex >= actionColumnIndex) {
        nextRow += 1;
        nextCol = 1; // Skip S.No column
      }
      // If at last column before action, move to action
      else if (nextCol >= totalCols) {
        nextRow += 1;
        nextCol = 1;
      }

      // If at last row and last column, stay at current
      if (nextRow >= totalRows) {
        return;
      }

      // Focus on next element
      setTimeout(() => {
        if (nextRow === totalRows - 1) {
          // Moving to editing row
          if (nextCol === 1) {
            // Product Code (Select)
            editingRowSelectRef.current?.focus();
          } else if (nextCol === actionColumnIndex) {
            // Add button in editing row
            addButtonRef.current?.focus();
          } else {
            // Other fields in editing row
            const fieldMap = {
              2: 'itemName',
              3: 'quantity',
              4: 'uom',
              5: 'rate',
              6: 'amount',
              7: 'hsn',
              8: 'gst',
              9: 'sgst',
              10: 'cgst',
              11: 'igst',
              12: 'delivery_date',
              13: 'delivery_mode',
            };
            const field = fieldMap[nextCol];
            if (field && editingRowInputRefs.current[field]) {
              editingRowInputRefs.current[field].focus();
            }
          }
        } else {
          // Moving within existing rows
          if (nextCol === 1) {
            // Product Code (Select)
            selectRefs.current[nextRow * totalCols + nextCol]?.focus();
          } else if (nextCol === actionColumnIndex) {
            // Delete button - skip it and move to next
            handleKeyDownTable({ key: 'Enter' }, nextRow, nextCol);
          } else {
            // Other fields
            inputRefs.current[nextRow * totalCols + nextCol]?.focus();
          }
        }
      }, 0);
    };

    // Common function for moving to previous cell (used by ArrowLeft, Backspace)
    const moveToPrevCell = () => {
      let prevRow = rowIndex;
      let prevCol = colIndex - 1;

      if (prevCol < 1) {
        // Skip S.No column
        prevRow -= 1;
        prevCol = actionColumnIndex; // Go to action column of previous row
      }

      if (prevRow >= 0) {
        setTimeout(() => {
          if (prevRow === totalRows - 1) {
            // Moving within editing row backward
            if (prevCol === 1) {
              editingRowSelectRef.current?.focus();
            } else if (prevCol === actionColumnIndex) {
              addButtonRef.current?.focus();
            } else {
              const fieldMap = {
                2: 'itemName',
                3: 'quantity',
                4: 'uom',
                5: 'rate',
                6: 'amount',
                7: 'hsn',
                8: 'gst',
                9: 'sgst',
                10: 'cgst',
                11: 'igst',
                12: 'delivery_date',
                13: 'delivery_mode',
              };
              const field = fieldMap[prevCol];
              if (field && editingRowInputRefs.current[field]) {
                editingRowInputRefs.current[field].focus();
              }
            }
          } else {
            // Moving within existing rows backward
            if (prevCol === 1) {
              selectRefs.current[prevRow * totalCols + prevCol]?.focus();
            } else if (prevCol === actionColumnIndex) {
              // Skip delete button, move to previous column
              handleKeyDownTable({ key: 'Backspace' }, prevRow, prevCol);
            } else {
              inputRefs.current[prevRow * totalCols + prevCol]?.focus();
            }
          }
        }, 0);
      }
    };

    if (key === 'Enter' || key === 'Tab') {
      e.preventDefault();
      moveToNextCell();
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      moveToNextCell();
    } else if (key === 'ArrowLeft' || key === 'Backspace') {
      e.preventDefault();
      moveToPrevCell();
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      // Check validation before moving down
      const currentRowData = rowIndex === totalRows - 1 ? editingRow : orderData[rowIndex];
      let shouldPreventNavigation = false;

      if (colIndex === 3) {
        // Quantity column
        // if (!currentRowData.quantity || currentRowData.quantity.trim() === '') {
        //   shouldPreventNavigation = true;
        //   toast.error('Please enter quantity before proceeding!', {
        //     position: 'bottom-right',
        //     autoClose: 3000,
        //   });
        // }
      } else if (colIndex === 12) {
        // Delivery Date column
        if (!currentRowData.delivery_date || currentRowData.delivery_date.trim() === '') {
          shouldPreventNavigation = true;
          toast.error('Please enter delivery date before proceeding!', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      } else if (colIndex === 13) {
        // Delivery Mode column
        if (!currentRowData.delivery_mode || currentRowData.delivery_mode.trim() === '') {
          shouldPreventNavigation = true;
          toast.error('Please enter delivery mode before proceeding!', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      }

      if (shouldPreventNavigation) {
        return;
      }

      let nextRow = rowIndex + 1;
      if (nextRow < totalRows) {
        setTimeout(() => {
          if (nextRow === totalRows - 1) {
            // Moving down to editing row
            if (colIndex === 1) {
              editingRowSelectRef.current?.focus();
            } else if (colIndex === actionColumnIndex) {
              addButtonRef.current?.focus();
            } else {
              const fieldMap = {
                2: 'itemName',
                3: 'quantity',
                4: 'uom',
                5: 'rate',
                6: 'amount',
                7: 'hsn',
                8: 'gst',
                9: 'sgst',
                10: 'cgst',
                11: 'igst',
                12: 'delivery_date',
                13: 'delivery_mode',
              };
              const field = fieldMap[colIndex];
              if (field && editingRowInputRefs.current[field]) {
                editingRowInputRefs.current[field].focus();
              }
            }
          } else {
            // Moving down within existing rows
            if (colIndex === 1) {
              selectRefs.current[nextRow * totalCols + colIndex]?.focus();
            } else if (colIndex === actionColumnIndex) {
              // Skip delete button, move to same column in next row
              handleKeyDownTable({ key: 'ArrowDown' }, rowIndex, colIndex);
            } else {
              inputRefs.current[nextRow * totalCols + colIndex]?.focus();
            }
          }
        }, 0);
      }
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      let prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        setTimeout(() => {
          if (prevRow === totalRows - 1) {
            // Moving up to editing row from below (shouldn't happen as editing is last)
            // But handle it anyway
            if (colIndex === 1) {
              editingRowSelectRef.current?.focus();
            } else if (colIndex === actionColumnIndex) {
              addButtonRef.current?.focus();
            } else {
              const fieldMap = {
                2: 'itemName',
                3: 'quantity',
                4: 'uom',
                5: 'rate',
                6: 'amount',
                7: 'hsn',
                8: 'gst',
                9: 'sgst',
                10: 'cgst',
                11: 'igst',
                12: 'delivery_date',
                13: 'delivery_mode',
              };
              const field = fieldMap[colIndex];
              if (field && editingRowInputRefs.current[field]) {
                editingRowInputRefs.current[field].focus();
              }
            }
          } else {
            // Moving up within existing rows
            if (colIndex === 1) {
              selectRefs.current[prevRow * totalCols + colIndex]?.focus();
            } else if (colIndex === actionColumnIndex) {
              // Skip delete button, move to same column in previous row
              handleKeyDownTable({ key: 'ArrowUp' }, rowIndex, colIndex);
            } else {
              inputRefs.current[prevRow * totalCols + colIndex]?.focus();
            }
          }
        }, 0);
      }
    } else if (key === 'Escape') {
      if (onBack) {
        onBack();
      } else {
        navigate(-1);
      }
    }
  };

  const handleBackClick = () => {
    const confirmLeave = window.confirm('Do you want to leave this order?');
    if (!confirmLeave) return;
    onBack(); // your existing back logic
  };


  // Handler specifically for editing row
  const handleEditingRowKeyDown = (e, colIndex, fieldType = 'input') => {
    const rowIndex = orderData.length; // Editing row is always last
    handleKeyDownTable(e, rowIndex, colIndex, fieldType);
  };

  // Handle Add button key events
  const handleAddButtonKeyDown = e => {
    const key = e.key;

    if (key === 'Enter') {
      e.preventDefault();
      handleAddRow();
    } else if (key === 'Tab' || key === 'ArrowRight') {
      e.preventDefault();
      // Move to next focusable element (Remarks textarea)
      const remarksTextarea = document.querySelector('textarea[name="remarks"]');
      if (remarksTextarea) {
        remarksTextarea.focus();
      }
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      // Move to previous column in editing row (Delivery Mode)
      setTimeout(() => {
        editingRowInputRefs.current.delivery_mode?.focus();
      }, 0);
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      // Move to same column in previous row (Action column of previous row)
      const prevRowIndex = orderData.length - 1;
      if (prevRowIndex >= 0) {
        // Since delete button is not focusable, move to Delivery Mode in previous row
        setTimeout(() => {
          inputRefs.current[prevRowIndex * totalCols + 13]?.focus();
        }, 0);
      }
    } else if (key === 'ArrowDown') {
      e.preventDefault();
      // Move to next focusable element after table (Remarks textarea)
      const remarksTextarea = document.querySelector('textarea[name="remarks"]');
      if (remarksTextarea) {
        remarksTextarea.focus();
      }
    }
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

  // Focus first field when editing row is empty
  useEffect(() => {
    if (orderData.length === 0 && !editingRow.item) {
      setTimeout(() => {
        editingRowSelectRef.current?.focus();
      }, 100);
    }
  }, [orderData.length, editingRow.item]);

  useEffect(() => {
  const fetchOrderNumber = async () => {
    try {
      const response = await api.get('/orders/next-order-number');
      setOrderNumber(response.data.orderNumber);
    } catch (error) {
      console.error('Error fetching order number:', error);
      // Fallback to client-side generation
      const newOrderNumber = generateOrderNumber();
      setOrderNumber(newOrderNumber);
    }
  };
  
  fetchOrderNumber();
}, [date]);

  const postOrder = async payload => {
  if (isSubmitttingRef.current) return;
  isSubmitttingRef.current = true;

  try {
    if (!payload.length) return;

    console.log('Sending data:', payload);
    await api.post('/orders', payload);

    toast.success('Order placed successfully!', {
      position: 'bottom-right',
      autoClose: 3000,
    });

  } catch (err) {
    console.error(err);
    toast.error('Error placing order', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    throw err;
  } finally {
    isSubmitttingRef.current = false;
  }
};

// Alternative simpler version if you prefer:
const formatDateToDDMMYYYYSimple = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  
  const cleanedStr = dateStr.trim();
  
  // Already in correct format
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanedStr)) {
    return cleanedStr;
  }
  
  // Extract numbers using regex
  const numbers = cleanedStr.match(/\d+/g);
  if (!numbers || numbers.length < 3) return cleanedStr;
  
  let day, month, year;
  
  // Convert 2-digit year to 4-digit
  if (numbers[2].length === 2) {
    const shortYear = parseInt(numbers[2]);
    year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
  } else if (numbers[2].length === 4) {
    year = numbers[2];
  } else {
    return cleanedStr;
  }
  
  // Simple logic for day/month detection (common Indian format DD-MM-YYYY)
  if (parseInt(numbers[0]) <= 31 && parseInt(numbers[1]) <= 12) {
    day = numbers[0];
    month = numbers[1];
  } else if (parseInt(numbers[0]) <= 12 && parseInt(numbers[1]) <= 31) {
    // Could be MM-DD format, but assuming DD-MM for India
    day = numbers[1];
    month = numbers[0];
  } else {
    day = numbers[0];
    month = numbers[1];
  }
  
  // Pad with zeros
  day = day.padStart(2, '0');
  month = month.padStart(2, '0');
  
  return `${day}-${month}-${year}`;
};

// Handle date blur formatting
const handleDateBlur = (e, index) => {
  const value = e.target.value;
  
  if (!value) return;
  
  const formattedDate = formatDateToDDMMYYYYSimple(value);
  
  if (index === undefined) {
    // For editing row
    setEditingRow(prev => ({
      ...prev,
      delivery_date: formattedDate
    }));
  } else {
    // For existing rows
    handleFieldChange('delivery_date', formattedDate, index);
  }
  
  // Optional: Show toast if date was reformatted
  if (formattedDate !== value) {
    console.log(`Date reformatted: ${value} -> ${formattedDate}`);
  }
};

  const convertToMySQLDate = dateString => {
    if (!dateString) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }

    const parts = dateString.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[0]}-${parts[1]}`;
      }
    }

    return '';
  };

  const handleSubmit = async e => {
  e.preventDefault();

  // Validate order number
    if (!orderNumber || orderNumber.trim() === '') {
      toast.error('Order number is required. Please try again.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

  if (!isDistributorRoute && !customerName) {
    toast.error('Please select a customer name.');
    return;
  }

  const hasEditingRowData = editingRow.item && editingRow.quantity;
  if (!orderData.length && !hasEditingRowData) {
    toast.error('No items in the order.');
    return;
  }

  const voucherType = location.pathname.includes('/corporate')
    ? 'Direct Order Management'
    : location.pathname.includes('/distributor')
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

  const rows = [...orderData];

  if (hasEditingRowData) {
    rows.push({
      itemCode: editingRow.item.item_code,
      itemName: editingRow.item.stock_item_name,
      hsn: editingRow.hsn,
      gst: editingRow.gst,
      sgst: editingRow.sgst,
      cgst: editingRow.cgst,
      igst: editingRow.igst,
      delivery_date: editingRow.delivery_date,
      delivery_mode: editingRow.delivery_mode,
      itemQty: Number(editingRow.quantity),
      uom: editingRow.item.uom || 'Nos',
      rate: Number(editingRow.rate),
      amount: Number(editingRow.rate) * Number(editingRow.quantity),
      netRate: Number(editingRow.rate),
      grossAmount: Number(editingRow.rate) * Number(editingRow.quantity),
    });
  }

  const payload = rows.map(item => ({
    voucher_type: voucherType,
    order_no: orderNumber,
    date,
    status: 'pending',
    executiveCode: distributorUser.customer_code || '',
    executive: distributorUser.customer_name || '',
    role: distributorUser.role || '',
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
    quantity: item.itemQty,
    uom: item.uom,
    rate: item.rate,
    amount: item.amount,
    net_rate: item.netRate,
    gross_amount: item.grossAmount,
    // 🔥 FIX — NEVER NULL
    disc_percentage: 0,
    disc_amount: 0,
    spl_disc_percentage: 0,
    spl_disc_amount: 0,
    total_quantity: totals.qty,
    total_amount: totals.totalAmount,
    remarks: remarks || '',
  }));

  try {
    await postOrder(payload);
    await resetForm();
    toast.success('Order placed successfully! New order number generated.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
  } catch (error) {
    toast.error('Error placing order', {
        position: 'bottom-right',
        autoClose: 3000,
      });
  }
};


  const resetForm = async () => {
  isResettingRef.current = true;

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

  setTotals({
    qty: 0,
    amount: 0,
    sgstAmt: 0,
    cgstAmt: 0,
    igstAmt: 0,
    netAmt: 0,
    grossAmt: 0,
    totalAmount: 0,
  });

  // await fetchOrderNumberFromServer();

  setRemarks('');
  setDate(new Date().toISOString().split('T')[0]);

  setFormResetKey(prev => prev + 1);

  setTimeout(() => {
    isResettingRef.current = false;
  }, 0);
};

useEffect(() => {
  if (isResettingRef.current) return;

  // totals calculation logic here
}, [orderData, editingRow]);

  // useEffect(() => {
  //   const totalQty = orderData.reduce((sum, row) => sum + Number(row.itemQty || 0), 0);
  //   const totalAmt = orderData.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  //   // Calculate GST totals based on state
  //   const totalSgstAmt = orderData.reduce((sum, row) => sum + Number(row.sgst || 0), 0);
  //   const totalCgstAmt = orderData.reduce((sum, row) => sum + Number(row.cgst || 0), 0);
  //   const totalIgstAmt = orderData.reduce((sum, row) => sum + Number(row.igst || 0), 0);

  //   const editingRowQty = Number(editingRow.quantity || 0);
  //   const editingRowAmount = Number(editingRow.amount || 0);
  //   const editingRowSgst = Number(editingRow.sgst || 0);
  //   const editingRowCgst = Number(editingRow.cgst || 0);
  //   const editingRowIgst = Number(editingRow.igst || 0);

  //   // Check if state is Tamil Nadu
  //   if (isTamilNaduState()) {
  //     // For Tamil Nadu: Amount + SGST + CGST
  //     const totalAmountValue =
  //       totalAmt +
  //       editingRowAmount +
  //       (totalSgstAmt + editingRowSgst) +
  //       (totalCgstAmt + editingRowCgst);

  //     setTotals({
  //       qty: totalQty + editingRowQty,
  //       amount: totalAmt + editingRowAmount,
  //       sgstAmt: totalSgstAmt + editingRowSgst,
  //       cgstAmt: totalCgstAmt + editingRowCgst,
  //       igstAmt: 0, // IGST should be 0 for Tamil Nadu
  //       netAmt: 0,
  //       grossAmt: 0,
  //       totalAmount: totalAmountValue,
  //     });
  //   } else {
  //     // For other states: Amount + IGST
  //     const totalAmountValue = totalAmt + editingRowAmount + (totalIgstAmt + editingRowIgst);

  //     setTotals({
  //       qty: totalQty + editingRowQty,
  //       amount: totalAmt + editingRowAmount,
  //       sgstAmt: 0, // SGST should be 0 for other states
  //       cgstAmt: 0, // CGST should be 0 for other states
  //       igstAmt: totalIgstAmt + editingRowIgst,
  //       netAmt: 0,
  //       grossAmt: 0,
  //       totalAmount: totalAmountValue,
  //     });
  //   }
  // }, [orderData, editingRow, selectedCustomer, isDistributorRoute, distributorUser]);

  const memoTotals = useMemo(() => {
    const totalQty = orderData.reduce(
      (sum, row) => sum + Number(row.itemQty || 0),
      0
    );

    const totalAmt = orderData.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const totalSgstAmt = orderData.reduce(
      (sum , row) => sum + Number(row.sgst || 0),
      0
    );

    const totalCgstAmt = orderData.reduce(
      (sum, row) => sum + Number(row.cgst || 0),
      0
    );

    const totalIgstAmt = orderData.reduce(
      (sum, row) => sum + Number(row.igst || 0),
      0
    );

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
      }
    }

    // Other states
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
  }, [
    orderData,
    editingRow,
    selectedCustomer,
    isDirectRoute,
    isDistributorRoute,
    distributorUser,
  ]);

  useEffect(() => {
    setTotals(memoTotals);
  }, [memoTotals]);

  const formatCurrency = value => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })
      .format(value || 0)
      .replace(/^₹/, '₹ ');
  };

  // Custom styles for table selects
  const tableSelectStyles = {
    control: base => ({
      ...base,
      minHeight: '24px',
      height: '24px',
      padding: '0 1px',
      width: '100%',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#932F67',
      },
    }),
    menu: base => ({
      ...base,
      width: '405px',
      height: '68vh',
      fontSize: '12px',
      zIndex: 9999,
      position: 'absolute',
    }),
    menuList: base => ({
      ...base,
      maxHeight: '68vh',
      padding: 0,
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 9999,
    }),
    option: base => ({
      ...base,
      padding: '6px 12px',
      fontSize: '12px',
    }),
    valueContainer: base => ({
      ...base,
      padding: '0px 4px',
      height: '20px',
    }),
    input: base => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: '12px',
    }),
    singleValue: base => ({
      ...base,
      fontSize: '11.5px', // Add this for the selected value
      lineHeight: '1.2',
    }),
  };

  return (
    <div className="p-3 bg-amber-50 border-2 h-screen font-amasis">
      {/* Header section remains same */}
      <div className="px-1 py-2 grid grid-cols-[auto_1fr_1fr_0.8fr_2fr_1.2fr_1.2fr] gap-2 items-center border transition-all">
        <button
          onClick={handleBackClick}
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
            className="outline-none border rounded-[5px] focus:border-[#932F67] p-[3.5px] text-sm bg-transparent font-medium w-52"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded">
            Voucher Type *
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            required
            readOnly
            value={isLoadingOrderNumber ? 'Loading....' : orderNumber}
            className="outline-none border rounded-[5px] focus:border-[#932F67] p-[3.5px] text-sm bg-transparent font-medium"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded">
            Order No *
          </span>
        </div>

        {!isDistributorRoute && (
          <div className="relative w-[116px]">
            <Select
              ref={customerSelectRef}
              className="text-sm peer"
              value={customerName}
              options={customerOptions}
              getOptionValue={e => e.customer_code}
              onChange={handleCustomerSelect}
              placeholder=""
              components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
              formatOptionLabel={(option, { context }) =>
                context === 'menu'
                  ? `${option.customer_code} - ${option.customer_name}`
                  : option.customer_code
              }
              styles={{
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

        {!isDistributorRoute && (
          <div className="relative ml-7 w-80">
            <input
              type="text"
              readOnly
              value={customerName ? customerName.customer_name : ''}
              className="outline-none border rounded-[5px] border-[#932F67] p-[3.5px] text-sm bg-gray-100 font-medium w-full"
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

        <div className={`relative ${isDistributorRoute ? 'w-[450px]' : 'w-[280px]'}`}>
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
            className="peer w-full border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-medium"
          />
          <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
            Order Date *
          </span>
        </div>
      </div>

      {/* Body Part */}
      <div className="mt-1 border h-[88vh]">
        {/* Table section */}
        <div className="h-[75vh] flex flex-col">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-green-800 leading-3">
                <th className="font-medium text-xs border border-gray-300 py-0.5 w-8 text-center">
                  S.No
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-2 w-24 text-center">
                  Product Code
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-2 w-[250px] text-center">
                  Product Name
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-2 text-center w-20">
                  Qty
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 w-12 text-center">
                  UOM
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-2 text-center w-24">
                  Rate
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 w-28 text-center">
                  Amount
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 text-center w-16">
                  HSN
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-1 w-16 text-center">
                  GST %
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-1 w-20 text-center">
                  SGST
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-1 w-20 text-center">
                  CGST
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-1 w-20 text-center">
                  IGST
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 text-center w-20">
                  DL. Date
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 text-center w-28">
                  DL. Mode
                </th>
                <th className="font-medium text-xs border border-gray-300 py-0.5 px-2 text-center w-14">
                  Action
                </th>
              </tr>
            </thead>
          </table>

          {/* Scrollable table body container */}
          <div className={`flex-1 overflow-y-auto ${orderData.length > 15 ? 'max-h-[65vh]' : ''}`}>
            <table className="w-full table-fixed">
              <tbody>
                {/* Existing rows */}
                {showRowValueRows &&
                  orderData.length > 0 &&
                  orderData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="leading-4 hover:bg-gray-50">
                      <td className="border border-gray-400 text-center text-sm w-8 align-middle">
                        {rowIndex + 1}
                      </td>

                      {/* Product Code (Select) */}
                      <td className="border border-gray-400 text-left text-sm w-24 align-middle p-0.5">
                        <Select
                          key={`row-select-${formResetKey}-${rowIndex}`}
                          ref={el => {
                            selectRefs.current[rowIndex * totalCols + 1] = el;
                          }}
                          value={row.item}
                          options={itemOptions}
                          getOptionLabel={option =>
                            option.label || `${option.item_code} - ${option.stock_item_name}`
                          }
                          getOptionValue={option => option.item_code}
                          onChange={selected => handleItemSelect(selected, rowIndex)}
                          // onKeyDown={e => handleKeyDownTable(e, rowIndex, 1, 'select')}
                          placeholder=""
                          styles={tableSelectStyles}
                          components={{
                            DropdownIndicator: () => null,
                            IndicatorSeparator: () => null,
                          }}
                          formatOptionLabel={(option, { context }) => {
                            if (context === 'menu') {
                              return (
                                option.label || `${option.item_code} - ${option.stock_item_name}`
                              );
                            }
                            return option.item_code;
                          }}
                          menuPortalTarget={document.body}
                        />
                      </td>

                      {/* Product Name */}
                      <td className="border border-gray-400 px-2 text-sm w-[250px] align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 2] = el;
                          }}
                          type="text"
                          readOnly
                          value={row.itemName || ''}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 2)}
                        />
                      </td>

                      {/* Quantity */}
                      <td className="border border-gray-400 text-sm bg-[#F8F4EC] w-20 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 3] = el;
                          }}
                          type="text"
                          value={row.itemQty}
                          onChange={e => handleFieldChange('itemQty', e.target.value, rowIndex)}
                          onFocus={e => {
                            e.target.setSelectionRange(0, e.target.value.length);
                          }}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 3)}
                          className="w-full h-full pl-2 pr-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
                          min="0"
                        />
                      </td>

                      {/* UOM */}
                      <td className="border border-gray-400 text-center text-[13px] w-12 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 4] = el;
                          }}
                          type="text"
                          readOnly
                          value={row.uom || "No's"}
                          className="w-full h-full text-center focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 4)}
                        />
                      </td>

                      {/* Rate */}
                      <td className="border border-gray-400 text-sm w-24 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 5] = el;
                          }}
                          type="text"
                          value={getExistingRowRateDisplay(rowIndex, row.rate)}
                          onChange={e => handleFieldChange('rate', e.target.value, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 5)}
                          onFocus={e => {
                            handleRateFocus(rowIndex);

                            // Get the raw value (not formatted) for selection
                            const rawValue = row.rate || '';

                            // Use setTimeout to ensure the value has been set
                            setTimeout(() => {
                              // Select all text
                              e.target.setSelectionRange(0, rawValue.length);
                            }, 10);
                          }}
                          onBlur={() => handleRateBlur(rowIndex)}
                          className="w-full h-full pl-1 pr-2 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
                        />
                      </td>

                      {/* Amount */}
                      <td className="border border-gray-400 text-right text-[12px] w-28 align-middle p-0 pr-2">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 6] = el;
                          }}
                          type="text"
                          readOnly
                          value={formatCurrency(row.amount)}
                          className="w-full h-full text-right focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 6)}
                        />
                      </td>

                      {/* HSN */}
                      <td className="border border-gray-400 text-sm w-16 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 7] = el;
                          }}
                          type="text"
                          value={row.hsn}
                          onChange={e => handleFieldChange('hsn', e.target.value, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 7)}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          readOnly
                        />
                      </td>

                      {/* GST */}
                      <td className="border border-gray-400 text-sm w-16 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 8] = el;
                          }}
                          type="text"
                          value={row.gst}
                          onChange={e => handleFieldChange('gst', e.target.value, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 8)}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          readOnly
                        />
                      </td>

                      {/* SGST */}
                      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 9] = el;
                          }}
                          type="text"
                          value={formatCurrency(row.sgst)}
                          onChange={e => handleFieldChange('sgst', e.target.value, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 9)}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          readOnly
                        />
                      </td>

                      {/* CGST */}
                      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 10] = el;
                          }}
                          type="text"
                          value={formatCurrency(row.cgst)}
                          onChange={e => handleFieldChange('cgst', e.target.value, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 10)}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          readOnly
                        />
                      </td>

                      {/* IGST */}
                      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 11] = el;
                          }}
                          type="text"
                          value={formatCurrency(row.igst || 0)}
                          onChange={e => handleFieldChange('igst', e.target.value, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 11)}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          readOnly
                        />
                      </td>

                      {/* Delivery Date */}
                      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 12] = el;
                          }}
                          type="text"
                          value={row.delivery_date}
                          onChange={e =>
                            handleFieldChange('delivery_date', e.target.value, rowIndex)
                          }
                          onFocus={(e) => {e.target.setSelectionRange(0, e.target.value.length)}}
                          onBlur={(e) => handleDateBlur(e, rowIndex)}
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 12)}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          placeholder=""
                        />
                      </td>

                      {/* Delivery Mode */}
                      <td className="border border-gray-400 text-sm w-28 align-middle p-0">
                        <input
                          ref={el => {
                            inputRefs.current[rowIndex * totalCols + 13] = el;
                          }}
                          type="text"
                          value={row.delivery_mode}
                          onChange={e =>
                            handleFieldChange('delivery_mode', e.target.value, rowIndex)
                          }
                          onKeyDown={e => handleKeyDownTable(e, rowIndex, 13)}
                          onFocus={(e) => {e.target.setSelectionRange(0, e.target.value.length)}}
                          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                          placeholder="Mode"
                        />
                      </td>

                      {/* Action */}
                      <td className="border border-gray-400 text-center text-sm w-14 align-middle">
                        <button
                          onClick={() => handleRemoveItem(rowIndex)}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Delete Item"
                        >
                          <AiFillDelete size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}

                {/* Add new row (editing row) */}
                <tr className="leading-12 bg-yellow-50 hover:bg-yellow-100">
                  <td className="border border-gray-400 text-center text-sm w-8 align-middle">
                    {showRowValueRows ? orderData.length + 1 : 1}
                  </td>

                  {/* Product Code (Select) - Editing Row */}
                  <td className="border border-gray-400 text-left text-sm w-24 align-middle p-0.5">
                    <Select
                      // key={`editing-select-${formResetKey}`}
                      ref={editingRowSelectRef}
                      value={editingRow.item}
                      options={itemOptions}
                      getOptionLabel={option =>
                        option.label || `${option.item_code} - ${option.stock_item_name}`
                      }
                      getOptionValue={option => option.item_code}
                      onChange={selected => handleItemSelect(selected)}
                      // onKeyDown={e => handleEditingRowKeyDown(e, 1, 'select')}
                      placeholder=""
                      styles={tableSelectStyles}
                      components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                      formatOptionLabel={(option, { context }) => {
                        if (context === 'menu') {
                          return option.label || `${option.item_code} - ${option.stock_item_name}`;
                        }
                        return option.item_code;
                      }}
                      menuPortalTarget={document.body}
                    />
                  </td>

                  {/* Product Name - Editing Row */}
                  <td className="border border-gray-400 px-2 text-sm w-[250px] align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.itemName = el)}
                      type="text"
                      readOnly
                      value={editingRow.item?.stock_item_name || ''}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
                      placeholder=""
                      onKeyDown={e => handleEditingRowKeyDown(e, 2)}
                    />
                  </td>

                  {/* Quantity - Editing Row */}
                  <td className="border border-gray-400 text-sm bg-[#F8F4EC] w-20 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.quantity = el)}
                      type="text"
                      value={editingRow.quantity}
                      onChange={e => handleFieldChange('quantity', e.target.value)}
                      onFocus={e => {
                        e.target.setSelectionRange(0, e.target.value.length);
                      }}
                      onKeyDown={e => handleEditingRowKeyDown(e, 3)}
                      className="w-full h-full pl-2 pr-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
                      min="0"
                      placeholder=""
                    />
                  </td>

                  {/* UOM - Editing Row */}
                  <td className="border border-gray-400 text-center text-xs w-12 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.uom = el)}
                      type="text"
                      readOnly
                      value={editingRow.item?.uom || "No's"}
                      className="w-full h-full text-center focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
                      onKeyDown={e => handleEditingRowKeyDown(e, 4)}
                    />
                  </td>

                  {/* Rate - Editing Row */}
                  <td className="border border-gray-400 text-sm w-24 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.rate = el)}
                      type="text"
                      value={getEditingRowRateDisplay(editingRow.rate)}
                      onChange={e => handleFieldChange('rate', e.target.value)}
                      onFocus={e => {
                        handleRateFocus();

                        // Get the raw value (not formatted) for selection
                        const rawValue = editingRow.rate || '';

                        // Use setTimeout to ensure the value has been set
                        setTimeout(() => {
                          // Select all text
                          e.target.setSelectionRange(0, rawValue.length);
                        }, 10);
                      }}
                      onBlur={() => handleRateBlur()}
                      onKeyDown={e => handleEditingRowKeyDown(e, 5)}
                      className="w-full h-full pl-1 pr-2 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
                      placeholder=""
                    />
                  </td>

                  {/* Amount - Editing Row */}
                  <td className="border border-gray-400 text-right text-xs w-28 align-middle p-0 pr-2">
                    <input
                      ref={el => (editingRowInputRefs.current.amount = el)}
                      type="text"
                      readOnly
                      value={formatCurrency(editingRow.amount)}
                      className="w-full h-full text-right focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
                      onKeyDown={e => handleEditingRowKeyDown(e, 6)}
                    />
                  </td>

                  {/* HSN - Editing Row */}
                  <td className="border border-gray-400 text-sm w-16 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.hsn = el)}
                      type="text"
                      value={editingRow.hsn}
                      onChange={e => handleFieldChange('hsn', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 7)}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                      readOnly
                    />
                  </td>

                  {/* GST - Editing Row */}
                  <td className="border border-gray-400 text-sm w-16 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.gst = el)}
                      type="text"
                      value={editingRow.gst}
                      onChange={e => handleFieldChange('gst', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 8)}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                      readOnly
                    />
                  </td>

                  {/* SGST - Editing Row */}
                  <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.sgst = el)}
                      type="text"
                      value={formatCurrency(editingRow.sgst)}
                      onChange={e => handleFieldChange('sgst', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 9)}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                      readOnly
                    />
                  </td>

                  {/* CGST - Editing Row */}
                  <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.cgst = el)}
                      type="text"
                      value={formatCurrency(editingRow.cgst)}
                      onChange={e => handleFieldChange('cgst', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 10)}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                      readOnly
                    />
                  </td>

                  {/* IGST - Editing Row */}
                  <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.igst = el)}
                      type="text"
                      value={formatCurrency(editingRow.igst || 0)}
                      onChange={e => handleFieldChange('igst', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 11)}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                      readOnly
                    />
                  </td>

                  {/* Delivery Date - Editing Row */}
                  <td className="border border-gray-400 text-sm w-20 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.delivery_date = el)}
                      type="text"
                      value={editingRow.delivery_date}
                      onChange={e => handleFieldChange('delivery_date', e.target.value)}
                      onFocus={(e) => {e.target.setSelectionRange(0, e.target.value.length)}}
                      onBlur={(e) => handleDateBlur(e)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 12)}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                    />
                  </td>

                  {/* Delivery Mode - Editing Row */}
                  <td className="border border-gray-400 text-sm w-28 align-middle p-0">
                    <input
                      ref={el => (editingRowInputRefs.current.delivery_mode = el)}
                      type="text"
                      value={editingRow.delivery_mode}
                      onChange={e => handleFieldChange('delivery_mode', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 13)}
                      onFocus={(e) => {e.target.setSelectionRange(0, e.target.value.length)}}
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                    />
                  </td>

                  {/* Action - Editing Row */}
                  <td className="border border-gray-400 text-center text-sm w-14 align-middle">
                    <button
                      ref={addButtonRef}
                      onClick={handleAddRow}
                      onKeyDown={handleAddButtonKeyDown}
                      className="text-green-500 hover:text-green-600 p-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                      title="Add Item"
                      disabled={!editingRow.item || !editingRow.quantity}
                      tabIndex={0}
                    >
                      <AiFillPlusCircle size={18} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer section */}
        <div className="h-[9vh] flex flex-col border-t">
          {/* row 1 */}
          <div className="flex items-center">
            <div className="flex justify-between w-full px-0.5">
              <div className="w-[300px] px-0.5">
                <div className="relative flex gap-2 mt-1">
                  <textarea
                    name="remarks"
                    id="remarks"
                    placeholder="Remarks"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    onKeyDown={handleRemarksKeyDown}
                    className="border border-[#932F67] resize-none md:w-[350px] outline-none rounded px-1  peer h-[26px] bg-[#F8F4EC] mb-1 ml-1"
                  ></textarea>

                  <div className="w-[300px]">
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
              <div className="">
                <p className="font-medium mt-1.5">:</p>
              </div>
              <div className="w-[1000px] px-0.5 py-1">
                <table className="w-full border-b mb-1">
                  <tfoot>
                    <tr className="*:border-[#932F67]">
                      <td className="text-right border w-20 px-1">{totals.qty}</td>
                      <td className="text-right border w-20 px-1">
                        {formatCurrency(totals.amount)}
                      </td>
                      <td className="text-right border w-20 px-1">
                        {formatCurrency(totals.sgstAmt)}
                      </td>
                      <td className="text-right border w-20 px-1">
                        {formatCurrency(totals.cgstAmt)}
                      </td>
                      <td className="text-right border w-20 px-1">
                        {formatCurrency(totals.igstAmt)}
                      </td>
                      <td className="border w-28 px-1 text-right">
                        {formatCurrency(totals.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
          {/* row 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mb-0.5 -ml-[-1250px] mr-1">
                <button
                  onClick={handleSubmit}
                  className="bg-[#693382] text-white px-5 rounded-[6px] py-1 outline-none cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;