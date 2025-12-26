import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import TableRow from './TableRow';
import EditingRow from './EditingRow';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDateToDDMMYYYYSimple, validateFutureDate } from './orderUtils';

const OrderTable = ({
  orderData,
  setOrderData,
  editingRow,
  setEditingRow,
  showRowValueRows,
  formResetKey,
  editingRowSelectRef,
  isTamilNaduState,
  isDistributorOrder,
  isDirectOrder,
  isDistributorReport,
  isCorporateReport,
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
  
  // Calculate total columns based on order type
  const totalCols = isDistributorOrder
    ? 15
    : isDirectOrder
    ? 15
    : isDistributorReport
    ? 15
    : isCorporateReport
    ? 15
    : 17;
  
  const actionColumnIndex = isDistributorOrder
    ? 16
    : isDirectOrder
    ? 16
    : isDistributorReport
    ? 16
    : isCorporateReport
    ? 16
    : 16;

  // Helper function to check if discount columns are visible
  const showDiscountColumns = () => {
    return !isDistributorReport && !isCorporateReport && !isDistributorOrder && !isDirectOrder;
  };

  // Map logical column index to actual display column index
  const getActualColumnIndex = (logicalIndex) => {
    if (showDiscountColumns()) {
      // All columns are visible
      return logicalIndex;
    } else {
      // Discount columns (7, 8) are hidden
      if (logicalIndex < 7) {
        return logicalIndex; // Columns before discount stay same
      } else if (logicalIndex === 7 || logicalIndex === 8) {
        return -1; // These columns don't exist
      } else {
        return logicalIndex - 2; // Columns after discount shift left by 2
      }
    }
  };

  // Get next visible column for keyboard navigation
  const getNextVisibleColumn = (currentIndex, direction = 1) => {
    let nextIndex = currentIndex + direction;
    
    // Skip columns that don't exist based on order type
    while (!showDiscountColumns() && (nextIndex === 7 || nextIndex === 8)) {
      nextIndex += direction;
    }
    
    // Make sure we stay within bounds
    if (nextIndex < 1) nextIndex = 1;
    if (nextIndex > actionColumnIndex) nextIndex = actionColumnIndex;
    
    return nextIndex;
  };

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
        const actualColIndex = getActualColumnIndex(3); // Quantity is column 3
        if (actualColIndex !== -1) {
          const quantityIndex = index * totalCols + actualColIndex;
          inputRefs.current[quantityIndex]?.focus();
        }
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
      disc: editingRow.disc,
      splDisc: editingRow.splDisc,
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
      disc: '',
      splDisc: '',
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

  // Debug: Check if components are rendering
  console.log('OrderTable rendering:', {
    orderDataLength: orderData?.length,
    showRowValueRows,
    editingRow,
    totalCols,
    actionColumnIndex,
    showDiscountColumns: showDiscountColumns(),
  });

  // Handler specifically for editing row
  const handleEditingRowKeyDown = (e, colIndex, fieldType = 'input') => {
    const rowIndex = orderData.length; // Editing row is always last
    handleKeyDownTable(e, rowIndex, colIndex, fieldType);
  };

  // Enhanced keyboard navigation handler with validation and column skipping
  const handleKeyDownTable = (e, rowIndex, colIndex, fieldType = 'input') => {
    const key = e.key;
    // Calculate total rows including editing row
    const totalRows = orderData.length + 1; // +1 for editing row

    // Helper function to get actual column index considering hidden columns
    const getActualColIndex = (logicalIndex) => {
      if (!showDiscountColumns() && (logicalIndex === 7 || logicalIndex === 8)) {
        return -1; // These columns don't exist
      }
      return logicalIndex;
    };

    // Helper function to get next logical column index (considering hidden columns)
    const getNextLogicalColumn = (currentIndex, direction = 1) => {
      let nextIndex = currentIndex + direction;
      
      // Skip hidden columns
      while (!showDiscountColumns() && (nextIndex === 7 || nextIndex === 8)) {
        nextIndex += direction;
      }
      
      // Make sure we stay within bounds
      if (nextIndex < 1) nextIndex = 1;
      if (nextIndex > actionColumnIndex) nextIndex = actionColumnIndex;
      
      return nextIndex;
    };

    // Helper function to check if column exists
    const columnExists = (col) => {
      const actualIndex = getActualColIndex(col);
      return actualIndex !== -1;
    };

    // Helper function to focus on editing row element
    const focusEditingRow = (colIndex) => {
      if (colIndex === 1) {
        // Product Code (Select)
        editingRowSelectRef.current?.focus();
      } else if (colIndex === actionColumnIndex) {
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
          9: 'hsn',
          10: 'gst',
          11: 'sgst',
          12: 'cgst',
          13: 'igst',
          14: 'delivery_date',
          15: 'delivery_mode',
        };
        
        // Add discount fields only if visible
        if (showDiscountColumns()) {
          fieldMap[7] = 'disc';
          fieldMap[8] = 'splDisc';
        }
        
        const field = fieldMap[colIndex];
        if (field && editingRowInputRefs.current[field]) {
          editingRowInputRefs.current[field].focus();
        }
      }
    };

    // Helper function to focus on existing row element
    const focusExistingRow = (rowIndex, colIndex) => {
      const actualColIndex = getActualColumnIndex(colIndex);
      if (actualColIndex !== -1) {
        const refIndex = (rowIndex * totalCols) + actualColIndex;
        
        if (colIndex === 1) {
          // Product Code (Select)
          selectRefs.current[refIndex]?.focus();
        } else if (colIndex === actionColumnIndex) {
          // Delete button - skip it and move to previous column
          moveToPrevCell();
        } else {
          // Other fields
          inputRefs.current[refIndex]?.focus();
        }
      } else {
        // Column doesn't exist, skip to next/prev
        if (key === 'ArrowRight' || key === 'Enter' || key === 'Tab') {
          moveToNextCell();
        } else if (key === 'ArrowLeft' || key === 'Backspace') {
          moveToPrevCell();
        }
      }
    };

    // Common function for moving to next cell
    const moveToNextCell = () => {
      // Get current row data
      const currentRowData = rowIndex === totalRows - 1 ? editingRow : orderData[rowIndex];
      
      // Check validation based on current column
      let shouldPreventNavigation = false;

      if (colIndex === 3) {
        // Quantity column validation
        // if (!currentRowData.quantity || currentRowData.quantity.trim() === '') {
        //   shouldPreventNavigation = true;
        //   toast.error('Please enter quantity before proceeding!', {
        //     position: 'bottom-right',
        //     autoClose: 3000,
        //   });
        // }
      } else if (colIndex === 14) {
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
      } else if (colIndex === 15) {
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
      let nextCol = colIndex;

      // Find next visible column
      do {
        nextCol = getNextLogicalColumn(nextCol, 1);
      } while (!columnExists(nextCol) && nextCol <= actionColumnIndex);

      // If at last column, move to next row
      if (nextCol > actionColumnIndex) {
        nextRow += 1;
        nextCol = 1; // Start with first column (Product Code select)
        
        // Skip hidden columns
        while (!showDiscountColumns() && (nextCol === 7 || nextCol === 8)) {
          nextCol += 1;
        }
      }

      // If at last row and last column, stay at current
      if (nextRow >= totalRows) {
        return;
      }

      // Focus on next element
      setTimeout(() => {
        if (nextRow === totalRows - 1) {
          // Moving to editing row
          focusEditingRow(nextCol);
        } else {
          // Moving within existing rows
          focusExistingRow(nextRow, nextCol);
        }
      }, 0);
    };

    // Common function for moving to previous cell
    const moveToPrevCell = () => {
      let prevRow = rowIndex;
      let prevCol = colIndex;

      // Find previous visible column
      do {
        prevCol = getNextLogicalColumn(prevCol, -1);
      } while (!columnExists(prevCol) && prevCol >= 1);

      if (prevCol < 1) {
        // Move to previous row
        prevRow -= 1;
        if (prevRow >= 0) {
          prevCol = actionColumnIndex; // Go to action column of previous row
        }
      }

      if (prevRow >= 0) {
        setTimeout(() => {
          if (prevRow === totalRows - 1) {
            // Moving within editing row backward
            focusEditingRow(prevCol);
          } else {
            // Moving within existing rows backward
            focusExistingRow(prevRow, prevCol);
          }
        }, 0);
      }
    };

    // Handle arrow down
    const handleArrowDown = () => {
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
      } else if (colIndex === 14) {
        // Delivery Date column
        if (!currentRowData.delivery_date || currentRowData.delivery_date.trim() === '') {
          shouldPreventNavigation = true;
          toast.error('Please enter delivery date before proceeding!', {
            position: 'bottom-right',
            autoClose: 3000,
          });
        }
      } else if (colIndex === 15) {
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
            focusEditingRow(colIndex);
          } else {
            // Moving down within existing rows
            focusExistingRow(nextRow, colIndex);
          }
        }, 0);
      }
    };

    // Handle arrow up
    const handleArrowUp = () => {
      let prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        setTimeout(() => {
          if (prevRow === totalRows - 1) {
            // Moving up to editing row from below
            focusEditingRow(colIndex);
          } else {
            // Moving up within existing rows
            focusExistingRow(prevRow, colIndex);
          }
        }, 0);
      }
    };

    // Handle key events
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
      handleArrowDown();
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      handleArrowUp();
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
        const deliveryModeCol = showDiscountColumns() ? 15 : 13;
        setTimeout(() => {
          const actualColIndex = getActualColumnIndex(deliveryModeCol);
          if (actualColIndex !== -1) {
            const refIndex = (prevRowIndex * totalCols) + actualColIndex;
            inputRefs.current[refIndex]?.focus();
          }
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

  // Calculate editing row indices
  const editingRowIndex = orderData.length;
  const editingRowBaseIndex = editingRowIndex * totalCols;

  return (
    <div className="mt-1 border h-[76vh]">
      <div className="h-[75vh] flex flex-col">
        {/* Single table structure */}
        <div className={`flex-1 overflow-y-auto ${orderData.length > 17 ? 'max-h-[65vh]' : ''}`}>
          <table className="w-full table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-green-800 leading-3">
                <TableHeaderCell width="w-9">S.No</TableHeaderCell>
                <TableHeaderCell width="w-24">Product Code</TableHeaderCell>
                <TableHeaderCell width="w-[185px]">Product Name</TableHeaderCell>
                <TableHeaderCell width="w-20">Qty</TableHeaderCell>
                <TableHeaderCell width="w-12">UOM</TableHeaderCell>
                <TableHeaderCell width="w-20">Rate</TableHeaderCell>
                <TableHeaderCell width="w-28">Amount</TableHeaderCell>
                {showDiscountColumns() && (
                  <TableHeaderCell width="w-16">Disc %</TableHeaderCell>
                )}
                {showDiscountColumns() && (
                  <TableHeaderCell width="w-20">Spl Disc %</TableHeaderCell>
                )}
                <TableHeaderCell width="w-16">HSN</TableHeaderCell>
                <TableHeaderCell width="w-16">GST %</TableHeaderCell>
                <TableHeaderCell width="w-20">SGST</TableHeaderCell>
                <TableHeaderCell width="w-20">CGST</TableHeaderCell>
                <TableHeaderCell width="w-20">IGST</TableHeaderCell>
                <TableHeaderCell width="w-20">DL.Date</TableHeaderCell>
                <TableHeaderCell width="w-16">DL.Mode</TableHeaderCell>
                <TableHeaderCell width="w-10">Act</TableHeaderCell>
              </tr>
            </thead>

            <tbody>
              {/* Existing Rows */}
              {showRowValueRows &&
                orderData?.map((row, rowIndex) => {
                  // calculate baseindex for this row
                  const rowBaseIndex = rowIndex * totalCols;
                  return (
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
                      isDistributorOrder={isDistributorOrder}
                      isDirectOrder={isDirectOrder}
                      isDistributorReport={isDistributorReport}
                      isCorporateReport={isCorporateReport}
                      showDiscountColumns={showDiscountColumns()}
                      getActualColumnIndex={getActualColumnIndex}
                      rowBaseIndex={rowBaseIndex}
                    />
                  );
                })}

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
                  handleDateBlur={handleDateBlur}
                  handleEditingRowKeyDown={handleEditingRowKeyDown}
                  handleAddButtonKeyDown={handleAddButtonKeyDown}
                  isDistributorOrder={isDistributorOrder}
                  isDirectOrder={isDirectOrder}
                  isDistributorReport={isDistributorReport}
                  isCorporateReport={isCorporateReport}
                  showDiscountColumns={showDiscountColumns()}
                  getActualColumnIndex={getActualColumnIndex}
                  rowIndex={editingRowIndex}
                  rowBaseIndex={editingRowBaseIndex}
                  orderData={orderData}
                />
              )}

              {/* If no rows and showRowValueRows is false, show empty state */}
              {!showRowValueRows && (
                <tr>
                  <td colSpan={17} className="text-center py-8 text-gray-500">
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