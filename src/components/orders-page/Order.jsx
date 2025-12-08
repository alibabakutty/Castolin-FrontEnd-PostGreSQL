import { useEffect, useRef, useState } from 'react';
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
  // const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [database, setDatebase] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerSelectRef = useRef(null);
  const isSubmitttingRef = useRef(false);
  const navigate = useNavigate();

  // Refs for keyboard navigation - separate arrays for each row type
  const inputRefs = useRef([]);
  const selectRefs = useRef([]);
  // Special refs for editing row
  const editingRowInputRefs = useRef({});
  const editingRowSelectRef = useRef(null);
  const addButtonRef = useRef(null);

  const { distributorUser } = useAuth();

  const location = useLocation();
  const isDistributorRoute = location.pathname.includes('/distributor');

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

  // const formatDate = dateString => {
  //   if (!dateString) return '';
  //   const date = new Date(dateString);
  //   const day = String(date.getDate()).padStart(2, '0');
  //   const month = String(date.getMonth() + 1).padStart(2, '0');
  //   const year = date.getFullYear();
  //   return `${day}-${month}-${year}`;
  // };

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

  // Focus on first field when component mounts
  useEffect(() => {
    if (!isDistributorRoute && customerSelectRef.current) {
      setTimeout(() => {
        customerSelectRef.current.focus();
      }, 100);
    } else if (isDistributorRoute && editingRowSelectRef.current) {
      setTimeout(() => {
        editingRowSelectRef.current.focus();
      }, 100);
    }
  }, [isDistributorRoute]);

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

  const generateOrderNumber = () => {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    const lastOrder = localStorage.getItem('lastOrder');

    if (lastOrder) {
      const lastOrderData = JSON.parse(lastOrder);
      const lastOrderDate = lastOrderData.date;
      const lastOrderNumber = lastOrderData.orderNumber;

      if (lastOrderDate === currentDate) {
        const parts = lastOrderNumber.split('-');
        const lastSequence = parseInt(parts[parts.length - 1]);
        const newSequence = (lastSequence + 1).toString().padStart(4, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear().toString().slice(-2);
        return `SQ-${day}-${month}-${year}-${newSequence}`;
      }
    }

    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    return `SQ-${day}-${month}-${year}-0001`;
  };

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
        }))
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
          updated.igst = ''; // Clear IGST
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
    }, 100);
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
    updatedRows[index].uom = selected?.uom || "No's";

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
        updatedRows[index].igst = ''; // Clear IGST
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
    }, 100);
  }
};

  const handleCustomerSelect = selected => {
  setCustomerName(selected);
  setSelectedCustomer(selected);

  // Recalculate GST for all items when customer changes
  recalculateGSTForAllItems(selected?.state || '');
};

// Helper function to recalculate GST for all items
const recalculateGSTForAllItems = (customerState) => {
  const isTN = customerState.toLowerCase().trim() === 'tamil nadu' || 
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
        updated.igst = '';
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
          updatedRow.igst = '';
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
  return normalizedState === 'tamil nadu' || 
         normalizedState === 'tn' ||
         normalizedState === 'tamilnadu';
};

  const handleAddRow = () => {
    if (!editingRow.item || !editingRow.quantity) {
      toast.error('Please select item and enter quantity!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

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
      itemQty: Number(editingRow.quantity),
      uom: editingRow.item.uom || "No's",
      rate: Number(editingRow.rate),
      amount: Number(editingRow.rate) * Number(editingRow.quantity),
      netRate: Number(editingRow.rate),
      grossAmount: Number(editingRow.rate) * Number(editingRow.quantity),
    };

    setOrderData(prev => [...prev, newRow]);

    // Reset editing row but keep customer state logic in mind
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

        const amount = (Number(qty) || 0) * (Number(rate) || 0);
        updated.amount = amount;

        // Check if state is Tamil Nadu
        if (isTamilNaduState()) {
          // Calculate SGST and CGST for Tamil Nadu
          const gstAmount = amount * (Number(gstPercentage || 18) / 100);
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
    updatedRows[index][field] = value;

    if (field === 'itemQty' || field === 'rate' || field === 'gst') {
      const qty = field === 'itemQty' ? value : updatedRows[index].itemQty;
      const rate = field === 'rate' ? value : updatedRows[index].rate;
      const gstPercentage = field === 'gst' ? value : updatedRows[index].gst;

      const amount = (Number(qty) || 0) * (Number(rate) || 0);
      updatedRows[index].amount = amount;

      // Check if state is Tamil Nadu
      if (isTamilNaduState()) {
        // Calculate SGST and CGST for Tamil Nadu
        const gstAmount = amount * (Number(gstPercentage || 18) / 100);
        const halfGST = gstAmount / 2;
        updatedRows[index].sgst = halfGST.toFixed(2);
        updatedRows[index].cgst = halfGST.toFixed(2);
        updatedRows[index].igst = ''; // Clear IGST
      } else {
        // Calculate IGST for other states
        const gstAmount = amount * (Number(gstPercentage || 18) / 100);
        updatedRows[index].sgst = '';
        updatedRows[index].cgst = '';
        updatedRows[index].igst = gstAmount.toFixed(2);
      }
    }

    setOrderData(updatedRows);
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

  // Enhanced keyboard navigation handler
  const handleKeyDownTable = (e, rowIndex, colIndex, fieldType = 'input') => {
    const key = e.key;

    // Calculate total rows including editing row
    const totalRows = orderData.length + 1; // +1 for editing row
    // const isEditingRow = rowIndex === totalRows - 1;

    if (key === 'Enter' || key === 'Tab') {
      e.preventDefault();

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
    } else if (key === 'ArrowRight') {
      e.preventDefault();
      handleKeyDownTable({ key: 'Enter' }, rowIndex, colIndex, fieldType);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
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
              handleKeyDownTable({ key: 'ArrowLeft' }, prevRow, prevCol);
            } else {
              inputRefs.current[prevRow * totalCols + prevCol]?.focus();
            }
          }
        }, 0);
      }
    } else if (key === 'ArrowDown') {
      e.preventDefault();
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

  const postOrder = async () => {
    if (isSubmitttingRef.current) return;
    isSubmitttingRef.current = true;

    try {
      const result = await api.post('/orders', database);
      console.log(result);

      const nextOrderNumber = generateOrderNumber();
      saveOrderNumber(nextOrderNumber);
      setOrderNumber(nextOrderNumber);

      setOrderData([]);
      setDatebase([]);
      setRemarks('');

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

      if (!isDistributorRoute) {
        setCustomerName(null);
        if (customerSelectRef.current) {
          customerSelectRef.current.clearValue();
        }
      }

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
    } finally {
      isSubmitttingRef.current = false;
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

  const handleSubmit = e => {
    e.preventDefault();

    if (!isDistributorRoute && !customerName) {
      toast.error('Please select a customer name.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    const hasEditingRowData = editingRow.item && editingRow.quantity;

    if (orderData.length >= 1 || hasEditingRowData) {
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
      const customerData = isDistributorRoute
        ? {
            customer_code: distributorUser?.customer_code || 'DISTRIBUTOR',
            customer_name: distributorUser?.customer_name || 'Distributor User',
          }
        : {
            customer_code: customerName?.customer_code || '',
            customer_name: customerName?.customer_name || '',
          };

      const allRows = [...orderData];

      if (hasEditingRowData) {
        const editingRowData = {
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
          itemQty: Number(editingRow.quantity),
          uom: editingRow.item.uom || "No's",
          rate: Number(editingRow.rate),
          amount: Number(editingRow.rate) * Number(editingRow.quantity),
          netRate: Number(editingRow.rate),
          grossAmount: Number(editingRow.rate) * Number(editingRow.quantity),
        };
        allRows.push(editingRowData);
      }

      const dbd = allRows.map(item => ({
        voucher_type: voucherType,
        order_no: orderNumber,
        date: date,
        status: 'pending',
        executiveCode: distributorUser.customer_code || '',
        executive: distributorUser.customer_name || '',
        role: distributorUser.role || '',
        customer_code: customerData.customer_code,
        customer_name: customerData.customer_name,
        item_code: item.itemCode,
        item_name: item.itemName,
        hsn: item.hsn,
        gst: Number(String(item.gst).replace('%', '').trim()),
        sgst: Number(String(item.sgst).replace('%', '').trim()),
        cgst: Number(String(item.cgst).replace('%', '').trim()),
        igst: Number(String(item.igst).replace('%', '').trim()),
        delivery_date: convertToMySQLDate(item.delivery_date),
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
        total_quantity: totals.qty + (hasEditingRowData ? Number(editingRow.quantity) : 0),
        total_amount:
          totals.amount +
          (hasEditingRowData ? Number(editingRow.rate) * Number(editingRow.quantity) : 0),
        remarks: remarks,
      }));

      setDatebase(prev => [...prev, ...dbd]);
      console.log('Submitting order data:', dbd);

      const nextOrderNumber = generateOrderNumber();
      saveOrderNumber(nextOrderNumber);
      setOrderNumber(nextOrderNumber);

      resetForm();
    } else {
      toast.error('No items in the order. Please add items before submitting.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
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

    if (!isDistributorRoute) {
      setCustomerName(null);
      if (customerSelectRef.current) {
        customerSelectRef.current.clearValue();
      }
    }

    setRemarks('');
    setTotals({
      qty: 0,
      amount: 0,
      netAmt: 0,
      grossAmt: 0,
      sgstAmt: 0,
      cgstAmt: 0,
      igstAmt: 0,
      totalAmount: 0,
    });

    // Reset refs
    inputRefs.current = [];
    selectRefs.current = [];
    editingRowInputRefs.current = {};

    // Focus on editing row select
    setTimeout(() => {
      editingRowSelectRef.current?.focus();
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

  // Calculate GST totals based on state
  const totalSgstAmt = orderData.reduce((sum, row) => sum + Number(row.sgst || 0), 0);
  const totalCgstAmt = orderData.reduce((sum, row) => sum + Number(row.cgst || 0), 0);
  const totalIgstAmt = orderData.reduce((sum, row) => sum + Number(row.igst || 0), 0);

  const editingRowQty = Number(editingRow.quantity || 0);
  const editingRowAmount = Number(editingRow.amount || 0);
  const editingRowSgst = Number(editingRow.sgst || 0);
  const editingRowCgst = Number(editingRow.cgst || 0);
  const editingRowIgst = Number(editingRow.igst || 0);

  // Check if state is Tamil Nadu
  if (isTamilNaduState()) {
    // For Tamil Nadu: Amount + SGST + CGST
    const totalAmountValue =
      totalAmt +
      editingRowAmount +
      (totalSgstAmt + editingRowSgst) +
      (totalCgstAmt + editingRowCgst);

    setTotals({
      qty: totalQty + editingRowQty,
      amount: totalAmt + editingRowAmount,
      sgstAmt: totalSgstAmt + editingRowSgst,
      cgstAmt: totalCgstAmt + editingRowCgst,
      igstAmt: 0, // IGST should be 0 for Tamil Nadu
      netAmt: 0,
      grossAmt: 0,
      totalAmount: totalAmountValue,
    });
  } else {
    // For other states: Amount + IGST
    const totalAmountValue = totalAmt + editingRowAmount + (totalIgstAmt + editingRowIgst);

    setTotals({
      qty: totalQty + editingRowQty,
      amount: totalAmt + editingRowAmount,
      sgstAmt: 0, // SGST should be 0 for other states
      cgstAmt: 0, // CGST should be 0 for other states
      igstAmt: totalIgstAmt + editingRowIgst,
      netAmt: 0,
      grossAmt: 0,
      totalAmount: totalAmountValue,
    });
  }
}, [orderData, editingRow, selectedCustomer, isDistributorRoute, distributorUser]);

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
    }),
  };

  return (
    <div className="p-3 bg-amber-50 border-2 h-screen font-amasis">
      {/* Header section remains same */}
      <div className="px-1 py-2 grid grid-cols-[auto_1fr_1fr_0.8fr_2fr_1.2fr_1.2fr] gap-2 items-center border transition-all">
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
            value={orderNumber}
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
      <div className="mt-1 border h-[88.5vh]">
        {/* Table section */}
        <div className="h-[75vh] flex flex-col">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-green-800 leading-3">
                <th className="font-medium text-sm border border-gray-300 py-0.5 w-10 text-center">
                  S.No
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-32 text-center">
                  Product Code
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 w-[250px] text-center">
                  Product Name
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-20">
                  Qty
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 w-12 text-center">
                  UOM
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-24">
                  Rate
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 w-28 text-center">
                  Amount
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 text-center w-16">
                  HSN
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-16 text-center">
                  GST %
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-20 text-center">
                  SGST
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-20 text-center">
                  CGST
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-1 w-20 text-center">
                  IGST
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 text-center w-20">
                  DL. Date
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 text-center w-28">
                  DL. Mode
                </th>
                <th className="font-medium text-sm border border-gray-300 py-0.5 px-2 text-center w-16">
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
                {orderData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="leading-4 hover:bg-gray-50">
                    <td className="border border-gray-400 text-center text-sm w-10 align-middle">
                      {rowIndex + 1}
                    </td>

                    {/* Product Code (Select) */}
                    <td className="border border-gray-400 text-left text-sm w-32 align-middle p-0.5">
                      <Select
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
                        value={formatCurrency(row.rate)}
                        onChange={e => handleFieldChange('rate', e.target.value, rowIndex)}
                        onKeyDown={e => handleKeyDownTable(e, rowIndex, 5)}
                        className="w-full h-full pl-1 pr-2 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
                        min="0"
                        step="0.01"
                        readOnly
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
                        value={row.igst}
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
                        onChange={e => handleFieldChange('delivery_date', e.target.value, rowIndex)}
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
                        onChange={e => handleFieldChange('delivery_mode', e.target.value, rowIndex)}
                        onKeyDown={e => handleKeyDownTable(e, rowIndex, 13)}
                        className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                        placeholder="Mode"
                      />
                    </td>

                    {/* Action */}
                    <td className="border border-gray-400 text-center text-sm w-16 align-middle">
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
                  <td className="border border-gray-400 text-center text-sm w-10 align-middle">
                    {orderData.length + 1}
                  </td>

                  {/* Product Code (Select) - Editing Row */}
                  <td className="border border-gray-400 text-left text-sm w-32 align-middle p-0.5">
                    <Select
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
                      value={formatCurrency(editingRow.rate)}
                      onChange={e => handleFieldChange('rate', e.target.value)}
                      onKeyDown={e => handleEditingRowKeyDown(e, 5)}
                      className="w-full h-full pl-1 pr-2 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
                      min="0"
                      step="0.01"
                      placeholder=""
                      readOnly
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
                      value={formatCurrency(editingRow.igst)}
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
                      className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
                      placeholder=""
                    />
                  </td>

                  {/* Action - Editing Row */}
                  <td className="border border-gray-400 text-center text-sm w-16 align-middle">
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
        <div className="h-[10vh] flex flex-col border-t">
          {/* row 1 */}
          <div className="flex items-center">
            <div className="flex justify-between w-full px-0.5">
              <div className="w-[400px] px-0.5">
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
                <p className="font-medium mt-1.5">Total :</p>
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
              <div className="mb-1 -ml-[-1410px] mr-1">
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
