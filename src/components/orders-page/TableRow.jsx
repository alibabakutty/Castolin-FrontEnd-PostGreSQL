import { AiFillDelete } from 'react-icons/ai';
import Select from 'react-select';
import { tableSelectStyles } from './orderUtils';

const TableRow = ({
  row,
  rowIndex,
  itemOptions,
  handleItemSelect,
  handleFieldChange,
  handleDeleteRow,
  focusedRateFields,
  setFocusedRateFields,
  formatCurrency,
  inputRefs,
  selectRefs,
  totalCols,
  formResetKey,
  handleKeyDownTable,
  handleDateBlur,
  isDistributorOrder,
  isDirectOrder,
  isDistributorReport,
  isCorporateReport,
  showDiscountColumns,
  getActualColumnIndex,
  rowBaseIndex,
  isDeleted = false,
}) => {
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

  // Helper function to get ref index for a column
  const getRefIndex = colIndex => {
    const actualIndex = getActualColumnIndex(colIndex);
    if (actualIndex === -1) return null; // Column doesn't exist
    return rowBaseIndex + actualIndex;
  };

  // Helper function to handle key down with proper column index
  const handleKeyDown = (e, colIndex) => {
    handleKeyDownTable(e, rowIndex, colIndex, 'input');
  };

  return (
    <tr
      key={rowIndex}
      className={`${isDeleted ? 'bg-red-100 line-through leading-4 hover:bg-gray-50' : ''}`}
    >
      <td className="border border-gray-400 text-center text-sm w-8 align-middle">
        {rowIndex + 1}
      </td>

      {/* Product Code (Select) */}
      <td className="border border-gray-400 text-left text-sm w-24 align-middle p-0.5">
        <Select
          key={`row-select-${formResetKey}-${rowIndex}`}
          ref={el => {
            const refIndex = getRefIndex(1);
            if (refIndex !== null) selectRefs.current[refIndex] = el;
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
          isDisabled={isDistributorReport || isCorporateReport}
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
            const refIndex = getRefIndex(2);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          readOnly
          value={row.itemName || ''}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
          onKeyDown={e => handleKeyDown(e, 2)}
        />
      </td>

      {/* Quantity */}
      <td className="border border-gray-400 text-sm bg-[#F8F4EC] w-20 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(3);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={row.itemQty}
          onChange={e => handleFieldChange('itemQty', e.target.value, rowIndex)}
          onFocus={e => {
            e.target.setSelectionRange(0, e.target.value.length);
          }}
          onKeyDown={e => handleKeyDown(e, 3)}
          className="w-full h-full pl-2 pr-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-right"
        />
      </td>

      {/* UOM */}
      <td className="border border-gray-400 text-center text-[13px] w-12 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(4);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          readOnly
          value={row.uom || 'Nos'}
          className="w-full h-full text-center focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
          onKeyDown={e => handleKeyDown(e, 4)}
        />
      </td>

      {/* Rate */}
      <td className="border border-gray-400 text-sm w-24 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(5);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={getExistingRowRateDisplay(rowIndex, row.rate)}
          onChange={e => handleFieldChange('rate', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 5)}
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
            const refIndex = getRefIndex(6);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          readOnly
          value={formatCurrency(row.amount)}
          className="w-full h-full text-right focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
          onKeyDown={e => handleKeyDown(e, 6)}
        />
      </td>

      {/* Discount */}
      {showDiscountColumns && (
        <td className="border border-gray-400 text-sm w-16 align-middle p-0">
          <input
            ref={el => {
              const refIndex = getRefIndex(7);
              if (refIndex !== null) inputRefs.current[refIndex] = el;
            }}
            type="text"
            value={row.disc}
            onChange={e => handleFieldChange('disc', e.target.value, rowIndex)}
            onKeyDown={e => handleKeyDown(e, 7)}
            onFocus={e => {
              e.target.setSelectionRange(0, e.target.value.length);
            }}
            className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          />
        </td>
      )}

      {/* Special Discount */}
      {showDiscountColumns && (
        <td className="border border-gray-400 text-sm w-16 align-middle p-0">
          <input
            ref={el => {
              const refIndex = getRefIndex(8);
              if (refIndex !== null) inputRefs.current[refIndex] = el;
            }}
            type="text"
            value={row.splDisc}
            onChange={e => handleFieldChange('splDisc', e.target.value, rowIndex)}
            onKeyDown={e => handleKeyDown(e, 8)}
            onFocus={e => {
              e.target.setSelectionRange(0, e.target.value.length);
            }}
            className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          />
        </td>
      )}

      {/* HSN */}
      <td className="border border-gray-400 text-sm w-16 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(9);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={row.hsn}
          onChange={e => handleFieldChange('hsn', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 9)}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          readOnly
        />
      </td>

      {/* GST */}
      <td className="border border-gray-400 text-sm w-16 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(10);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={row.gst}
          onChange={e => handleFieldChange('gst', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 10)}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          readOnly
        />
      </td>

      {/* SGST */}
      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(11);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={formatCurrency(row.sgst)}
          onChange={e => handleFieldChange('sgst', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 11)}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          readOnly
        />
      </td>

      {/* CGST */}
      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(12);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={formatCurrency(row.cgst)}
          onChange={e => handleFieldChange('cgst', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 12)}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          readOnly
        />
      </td>

      {/* IGST */}
      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(13);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={formatCurrency(row.igst || 0)}
          onChange={e => handleFieldChange('igst', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 13)}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          readOnly
        />
      </td>

      {/* Delivery Date */}
      <td className="border border-gray-400 text-sm w-20 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(14);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={row.delivery_date} // or formatDate(row.delivery_date) from orderutils component for update mode
          onChange={e => handleFieldChange('delivery_date', e.target.value, rowIndex)}
          onFocus={e => {
            e.target.setSelectionRange(0, e.target.value.length);
          }}
          onBlur={e => handleDateBlur(e, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 14)}
          className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
          placeholder=""
        />
      </td>

      {/* Delivery Mode */}
      <td className="border border-gray-400 text-sm w-28 align-middle p-0">
        <input
          ref={el => {
            const refIndex = getRefIndex(15);
            if (refIndex !== null) inputRefs.current[refIndex] = el;
          }}
          type="text"
          value={row.delivery_mode}
          onChange={e => handleFieldChange('delivery_mode', e.target.value, rowIndex)}
          onKeyDown={e => handleKeyDown(e, 15)}
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
          onClick={() => handleDeleteRow(rowIndex)}
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
