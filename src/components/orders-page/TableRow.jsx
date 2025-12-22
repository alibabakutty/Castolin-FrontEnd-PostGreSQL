import { AiFillDelete } from 'react-icons/ai';
import Select from 'react-select';

const TableRow = ({
  row,
  rowIndex,
  itemOptions,
  handleItemSelect,
  handleFieldChange,
  handleRemoveItem,
  focusedRateFields,
  setFocusedRateFields,
  formatCurrency,
  inputRefs,
  selectRefs,
  totalCols,
  formResetKey,
  handleKeyDownTable,
  handleDateBlur,
  isDistributorRoute,
  isDirectRoute,
}) => {
  // Custom styles for table selects
  const tableSelectStyles = {
    control: base => ({
      ...base,
      minHeight: '24px',
      height: '24px',
      lineHeight: '1',
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
      width: '445px',
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
      padding: '3px 20px',
      fontSize: '11.5px',
      fontFamily: 'font-amasis',
      fontWeight: '600',
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
      fontSize: '11.5px',
    }),
    singleValue: base => ({
      ...base,
      fontSize: '11.5px', // Add this for the selected value
      lineHeight: '1.2',
    }),
  };

  const handleRateFocus = () => {
    setFocusedRateFields(prev => ({
      ...prev,
      existingRows: {
        ...prev.existingRows,
        [rowIndex]: true,
      },
    }));
  };

  const handleRateBlur = () => {
    setFocusedRateFields(prev => ({
      ...prev,
      existingRows: {
        ...prev.existingRows,
        [rowIndex]: false,
      },
    }));
  };

  const getRateDisplay = () => {
    if (focusedRateFields.existingRows[rowIndex]) {
      return row.rate || '';
    } else {
      if (row.rate && !isNaN(parseFloat(row.rate))) {
        return formatCurrency(parseFloat(row.rate));
      }
      return '';
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

  return (
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
              return option.label || `${option.item_code} - ${option.stock_item_name}`;
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
          onChange={e => handleFieldChange('delivery_date', e.target.value, rowIndex)}
          onFocus={e => {
            e.target.setSelectionRange(0, e.target.value.length);
          }}
          onBlur={e => handleDateBlur(e, rowIndex)}
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
          onFocus={e => {
            e.target.setSelectionRange(0, e.target.value.length);
          }}
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
  );
};

export default TableRow;
