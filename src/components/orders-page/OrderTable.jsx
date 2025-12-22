import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import TableRow from './TableRow';
import EditingRow from './EditingRow';
import { useNavigate } from 'react-router-dom';

const OrderTable = ({
  orderData,
  setOrderData,
  editingRow,
  setEditingRow,
  selectedCustomer,
  distributorUser,
  isDistributorRoute,
  isDirectRoute,
  showRowValueRows,
  formResetKey,
  editingRowSelectRef,
}) => {
  const [itemOptions, setItemOptions] = useState([]);
  const [focusedRateFields, setFocusedRateFields] = useState({
    editingRow: false,
    existingRows: {},
  });
  const inputRefs = useRef([]);
  const selectRefs = useRef([]);
  const editingRowInputRefs = useRef({});
  const addButtonRef = useRef(null);
  const navigate = useNavigate();
  const totalCols = 15;
  const actionColumnIndex = 14;

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

  // check if state is Tamil Nadu
  const isTamilNaduState = useCallback(() => {
    let customerState = '';
    if (isDistributorRoute) {
      customerState = distributorUser?.state || '';
    } else {
      customerState = selectedCustomer?.state || '';
    }
    const normalizedState = customerState.toLowerCase().trim();
    return (
      normalizedState === 'tamil nadu' ||
      normalizedState === 'tn' ||
      normalizedState === 'tamilnadu'
    );
  }, [isDistributorRoute, distributorUser, selectedCustomer]);

  // Calculate GST for a row
  const calculateGSTForRow = useCallback(
    (row, amount) => {
      const gstPercentage = Number(row.gst || 18);
      const gstAmount = amount * (gstPercentage / 100);

      if (isTamilNaduState()) {
        const halfGST = gstAmount / 2;
        row.sgst = halfGST.toFixed(2);
        row.cgst = halfGST.toFixed(2);
        row.igst = '0';
      } else {
        row.sgst = '0';
        row.cgst = '0';
        row.igst = gstAmount.toFixed(2);
      }
    },
    [isTamilNaduState],
  );

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
      updatedRows[index].uom = selected?.uom || 'Nos';

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

  // Handle field changes
  const handleFieldChange = useCallback(
    (field, value, index) => {
      if (index === undefined) {
        // For editing row
        setEditingRow(prev => {
          const updated = { ...prev, [field]: value };

          if (field === 'quantity' || field === 'rate' || field === 'gst') {
            const qty = field === 'quantity' ? value : prev.quantity;
            const rate = field === 'rate' ? value : prev.rate;
            const rateNum = field === 'rate' ? parseFloat(value) || 0 : parseFloat(prev.rate) || 0;
            const amount = (parseFloat(qty) || 0) * rateNum;
            updated.amount = amount;
            calculateGSTForRow(updated, amount);
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
          const rateNum = parseFloat(rate) || 0;
          const amount = (parseFloat(qty) || 0) * rateNum;
          updatedRows[index].amount = amount;
          calculateGSTForRow(updatedRows[index], amount);
        }

        setOrderData(updatedRows);
      }
    },
    [orderData, setOrderData, setEditingRow, calculateGSTForRow],
  );

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
      uom: editingRow.item.uom || 'Nos',
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

  // Handle removing an item
  const handleRemoveItem = useCallback(
    index => {
      const updatedRows = orderData.filter((_, i) => i !== index);
      setOrderData(updatedRows);
      toast.info('Item removed from order!');
    },
    [orderData, setOrderData],
  );

  // Handle date blur formatting
  const handleDateBlur = (e, index) => {
    const value = e.target.value;

    if (!value) return;

    const formattedDate = formatDateToDDMMYYYYSimple(value);

    if (index === undefined) {
      // For editing row
      setEditingRow(prev => ({
        ...prev,
        delivery_date: formattedDate,
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

  // Alternative simpler version if you prefer:
  const formatDateToDDMMYYYYSimple = dateStr => {
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

  // Format currency
  const formatCurrency = value => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    })
      .format(value || 0)
      .replace(/^₹/, '₹ ');
  };

  // Debug: Check if components are rendering
  console.log('OrderTable rendering:', {
    orderDataLength: orderData?.length,
    showRowValueRows,
    editingRow,
  });

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
    if (
      inputDate.getDate() !== day ||
      inputDate.getMonth() !== month ||
      inputDate.getFullYear() !== year
    ) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);

    return inputDate >= today;
  };

  // Handler specifically for editing row
  const handleEditingRowKeyDown = (e, colIndex, fieldType = 'input') => {
    const rowIndex = orderData.length; // Editing row is always last
    handleKeyDownTable(e, rowIndex, colIndex, fieldType);
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

  return (
    <div className="mt-1 border h-[76vh]">
      <div className="h-[75vh] flex flex-col">
        {/* Single table structure */}
        <div className={`flex-1 overflow-y-auto ${orderData.length > 15 ? 'max-h-[65vh]' : ''}`}>
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-green-800 leading-3">
                <TableHeaderCell width="w-8">S.No</TableHeaderCell>
                <TableHeaderCell width="w-24">Product Code</TableHeaderCell>
                <TableHeaderCell width="w-[250px]">Product Name</TableHeaderCell>
                <TableHeaderCell width="w-20">Qty</TableHeaderCell>
                <TableHeaderCell width="w-12">UOM</TableHeaderCell>
                <TableHeaderCell width="w-24">Rate</TableHeaderCell>
                <TableHeaderCell width="w-28">Amount</TableHeaderCell>
                <TableHeaderCell width="w-16">HSN</TableHeaderCell>
                <TableHeaderCell width="w-16">GST %</TableHeaderCell>
                <TableHeaderCell width="w-20">SGST</TableHeaderCell>
                <TableHeaderCell width="w-20">CGST</TableHeaderCell>
                <TableHeaderCell width="w-20">IGST</TableHeaderCell>
                <TableHeaderCell width="w-20">DL. Date</TableHeaderCell>
                <TableHeaderCell width="w-28">DL. Mode</TableHeaderCell>
                <TableHeaderCell width="w-14">Action</TableHeaderCell>
              </tr>
            </thead>

            <tbody>
              {/* Existing Rows */}
              {showRowValueRows &&
                orderData?.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    row={row}
                    rowIndex={rowIndex}
                    itemOptions={itemOptions}
                    handleItemSelect={handleItemSelect}
                    handleFieldChange={handleFieldChange}
                    handleRemoveItem={handleRemoveItem}
                    focusedRateFields={focusedRateFields}
                    setFocusedRateFields={setFocusedRateFields}
                    formatCurrency={formatCurrency}
                    inputRefs={inputRefs}
                    selectRefs={selectRefs}
                    totalCols={totalCols}
                    formResetKey={formResetKey}
                    handleKeyDownTable={handleKeyDownTable}
                    handleDateBlur={handleDateBlur}
                    isDistributorRoute={isDistributorRoute}
                    isDirectRoute={isDirectRoute}
                  />
                ))}

              {/* Editing Row - Always show if showRowValueRows is true */}
              {showRowValueRows && (
                <EditingRow
                  editingRow={editingRow}
                  itemOptions={itemOptions}
                  handleItemSelect={handleItemSelect}
                  handleFieldChange={handleFieldChange}
                  handleAddRow={handleAddRow}
                  focusedRateFields={focusedRateFields}
                  setFocusedRateFields={setFocusedRateFields}
                  formatCurrency={formatCurrency}
                  editingRowSelectRef={editingRowSelectRef}
                  editingRowInputRefs={editingRowInputRefs}
                  addButtonRef={addButtonRef}
                  orderDataLength={orderData?.length || 0}
                  handleDateBlur={handleDateBlur}
                  handleEditingRowKeyDown={handleEditingRowKeyDown}
                  handleAddButtonKeyDown={handleAddButtonKeyDown}
                  isDistributorRoute={isDistributorRoute}
                  isDirectRoute={isDirectRoute}
                />
              )}

              {/* If no rows and showRowValueRows is false, show empty state */}
              {!showRowValueRows && (
                <tr>
                  <td colSpan={15} className="text-center py-8 text-gray-500">
                    No items to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Fixed TableHeaderCell component
const TableHeaderCell = ({ children, width }) => (
  <th
    className={`font-medium text-xs border border-gray-300 py-0.5 px-2 text-center text-white ${width}`}
  >
    {children}
  </th>
);

export default OrderTable;
