import { AiFillPlusCircle } from 'react-icons/ai';
import Select from 'react-select';
import { tableSelectStyles } from './orderUtils';

const EditingRow = ({
  editingRow,
  itemOptions,
  handleItemSelect,
  handleFieldChange,
  handleAddRow,
  focusedRateFields,
  setFocusedRateFields,
  formatCurrency,
  editingRowSelectRef,
  editingRowInputRefs,
  addButtonRef,
  handleEditingRowKeyDown,
  handleDateBlur,
  handleAddButtonKeyDown,
  isDistributorOrder,
  isDirectOrder,
  isDistributorReport,
  isCorporateReport,
  showDiscountColumns,
  getActualColumnIndex,
  rowIndex,
  orderData,
  rowBaseIndex,
  handleSelectKeyDown,
}) => {
  const handleRateFocus = () => {
    setFocusedRateFields(prev => ({
      ...prev,
      editingRow: true,
    }));
  };

  const handleRateBlur = () => {
    setFocusedRateFields(prev => ({
      ...prev,
      editingRow: false,
    }));
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

  // Helper function to handle key down with proper column index
  const handleKeyDown = (e, colIndex, fieldType = 'input') => {
    handleEditingRowKeyDown(e, colIndex, fieldType);
  };

  return (
    <tr className="leading-12 bg-yellow-50 hover:bg-yellow-100">
      <td className="border border-gray-400 text-center text-sm w-8 align-middle">
        {orderData.length + 1}
      </td>

      {/* Product Code (Select) - Editing Row */}
      <td className="border border-gray-400 text-left text-sm w-24 align-middle p-0.5">
        <Select
          ref={editingRowSelectRef}
          value={editingRow.item}
          options={itemOptions}
          getOptionLabel={option =>
            option.label || `${option.item_code} - ${option.stock_item_name}`
          }
          getOptionValue={option => option.item_code}
          onChange={selected => handleItemSelect(selected)}
          onKeyDown={e => handleSelectKeyDown(e, orderData.length, 1, editingRow.item)}
          placeholder=""
          styles={tableSelectStyles}
          components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null, ClearIndicator: () => null }}
          isDisabled={isDistributorReport || isCorporateReport}
          formatOptionLabel={(option, { context }) => {
            if (context === 'menu') {
              return option.label || `${option.item_code} - ${option.stock_item_name}`;
            }
            return option.item_code;
          }}
          isClearable={true}
          isSearchable={true}
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
          onKeyDown={e => handleKeyDown(e, 2)}
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
          onKeyDown={e => handleKeyDown(e, 3)}
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
          value={editingRow.item?.uom || ""}
          className="w-full h-full text-center focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent"
          onKeyDown={e => handleKeyDown(e, 4)}
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
          onKeyDown={e => handleKeyDown(e, 5)}
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
          onKeyDown={e => handleKeyDown(e, 6)}
        />
      </td>

      {/* Discount - Editing Row */}
      {showDiscountColumns && (
        <td className="border border-gray-400 text-sm w-16 align-middle p-0">
          <input
            ref={el => (editingRowInputRefs.current.disc = el)}
            type="text"
            value={editingRow.disc}
            onChange={e => handleFieldChange('disc', e.target.value)}
            onKeyDown={e => handleKeyDown(e, 7)}
            onFocus={e => {
              e.target.setSelectionRange(0, e.target.value.length);
            }}
            className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
            placeholder=""
          />
        </td>
      )}

      {/* Special Discount - Editing Row */}
      {showDiscountColumns && (
        <td className="border border-gray-400 text-sm w-16 align-middle p-0">
          <input
            ref={el => (editingRowInputRefs.current.splDisc = el)}
            type="text"
            value={editingRow.splDisc}
            onChange={e => handleFieldChange('splDisc', e.target.value)}
            onKeyDown={e => handleKeyDown(e, 8)}
            onFocus={e => {
              e.target.setSelectionRange(0, e.target.value.length);
            }}
            className="w-full h-full pl-1 font-medium text-[12px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border-transparent text-center"
            placeholder=""
          />
        </td>
      )}

      {/* HSN - Editing Row */}
      <td className="border border-gray-400 text-sm w-16 align-middle p-0">
        <input
          ref={el => (editingRowInputRefs.current.hsn = el)}
          type="text"
          value={editingRow.hsn}
          onChange={e => handleFieldChange('hsn', e.target.value)}
          onKeyDown={e => handleKeyDown(e, 9)}
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
          onKeyDown={e => handleKeyDown(e, 10)}
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
          onKeyDown={e => handleKeyDown(e, 11)}
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
          onKeyDown={e => handleKeyDown(e, 12)}
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
          onKeyDown={e => handleKeyDown(e, 13)}
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
          onFocus={e => {
            e.target.setSelectionRange(0, e.target.value.length);
          }}
          onBlur={e => handleDateBlur(e)}
          onKeyDown={e => handleKeyDown(e, 14)}
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
          onKeyDown={e => handleKeyDown(e, 15)}
          onFocus={e => {
            e.target.setSelectionRange(0, e.target.value.length);
          }}
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
  );
};

export default EditingRow;