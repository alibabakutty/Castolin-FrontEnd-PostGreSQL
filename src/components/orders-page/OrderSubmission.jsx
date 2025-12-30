// components/OrderSubmission.jsx
import { useState } from 'react';
import { toast } from 'react-toastify';

import { convertToMySQLDate } from './orderUtils';
import api from '../../services/api';

const OrderSubmission = ({ 
  mode,
  orderData,
  editingRow,
  orderNumber,
  date,
  customerName,
  distributorUser,
  remarks,
  status,
  voucherType,
  executiveName,
  isDistributorRoute,
  isDirectRoute,
  isTamilNaduState,
  totals,
  onSuccess,
  onError,
  onReset
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Validation helper
  const validateOrder = () => {
    const errors = [];

    if (!isDistributorRoute && !customerName) {
      errors.push('Please select a customer name.');
    }

    const hasEditingRowData = editingRow.item && editingRow.quantity;
    if (!orderData.length && !hasEditingRowData) {
      errors.push('No items in the order.');
    }

    // Validate editing row
    if (hasEditingRowData) {
      if (!editingRow.delivery_date?.trim()) {
        errors.push('Please enter delivery date for the current item!');
      }
      if (!editingRow.delivery_mode?.trim()) {
        errors.push('Please enter delivery mode for the current item!');
      }
    }

    // Validate existing rows
    orderData.forEach((row, index) => {
      if (!row.delivery_date?.trim()) {
        errors.push(`Please enter delivery date for item: ${row.itemName} (Row ${index + 1})`);
      }
      if (!row.delivery_mode?.trim()) {
        errors.push(`Please enter delivery mode for item: ${row.itemName} (Row ${index + 1})`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle update submission
  const handleUpdate = async () => {
    try {
      console.log('Update - Current totals:', totals);
      console.log('Update - Order data:', orderData);
      
      // Prepare updates array with ALL rows
      const updates = orderData.map(item => {
        const baseUpdate = {
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
          item_code: item.itemCode || '',
          item_name: item.itemName || '',
          voucher_type: voucherType,
          date: date,
          customer_code: customerName?.customer_code || distributorUser?.customer_code || '',
          customer_name: customerName?.customer_name || distributorUser?.customer_name || '',
          executive: executiveName?.customer_name || '',
          executiveCode: distributorUser?.customer_code || '',
          total_quantity: totals.qty,
          total_amount_without_tax: totals.amount,
          total_amount: totals.totalAmount,
          total_sgst_amount: totals.sgstAmt,
          total_cgst_amount: totals.cgstAmt,
          total_igst_amount: totals.igstAmt,
          remarks: remarks || '',
        };

        // Include ID only for existing rows
        if (item.id) {
          return { ...baseUpdate, id: item.id };
        }
        return baseUpdate;
      });
      
      console.log('Update payload:', {
        orderNumber,
        totalItems: updates.length,
        existingRows: updates.filter(item => item.id).length,
        newRows: updates.filter(item => !item.id).length
      });
      
      const response = await api.put(`/orders-by-number/${orderNumber}`, updates);
      
      if (response.data.success) {
        toast.success(`Order ${orderNumber} updated successfully!`);
        onSuccess?.(response.data);
      } else {
        throw new Error(response.data.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      console.error('Error details:', error.response?.data);
      onError?.(error);
      throw error;
    }
  };

  // Handle create submission
  const handleCreate = async () => {
    try {
      // Determine voucher type
      const finalVoucherType = isDirectRoute
        ? 'Direct Order Management'
        : isDistributorRoute
        ? 'Distributor Order-Web Based'
        : 'Sales Order';

      // Determine customer
      const finalCustomer = isDistributorRoute
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
      const hasEditingRowData = editingRow.item && editingRow.quantity;

      // Add editing row if it has data
      if (hasEditingRowData) {
        const rate = Number(editingRow.rate) || 0;
        const quantity = Number(editingRow.quantity) || 0;
        const amount = rate * quantity;
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

      // Prepare payload
      const payload = rows.map((item) => ({
        voucher_type: finalVoucherType,
        order_no: orderNumber,
        date: date,
        status: 'pending',
        executiveCode: distributorUser?.customer_code || '',
        executive: distributorUser?.customer_name || '',
        role: distributorUser?.role || '',
        ...finalCustomer,
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
        net_rate: Number(item.netRate || 0),
        gross_amount: Number(item.grossAmount || 0),
        disc_percentage: Number(item.disc || 0),
        disc_amount: Number(item.discAmt || 0),
        spl_disc_percentage: Number(item.splDisc || 0),
        spl_disc_amount: Number(item.splDiscAmt || 0),
        total_quantity: totals.qty,
        total_disc_amount: totals.discAmt || 0,
        total_spl_disc_amount: totals.splDiscAmt || 0,
        total_amount_without_tax: totals.amount,
        total_cgst_amount: totals.cgstAmt,
        total_sgst_amount: totals.sgstAmt,
        total_igst_amount: totals.igstAmt,
        total_amount: totals.totalAmount,
        remarks: remarks || '',
      }));

      console.log('Create payload:', {
        orderNumber,
        totalItems: payload.length,
        totalAmount: totals.totalAmount
      });

      const response = await api.post('/orders', payload);
      
      if (response.data.success) {
        toast.success(`Order ${orderNumber} placed successfully!`);
        onSuccess?.(response.data);
      } else {
        throw new Error(response.data.error || 'Create failed');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', error.response?.data);
      onError?.(error);
      throw error;
    }
  };

  // Main submission handler
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    // Clear previous errors
    setValidationErrors([]);
    
    // Validate
    if (!validateOrder()) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (mode === 'update') {
        await handleUpdate();
      } else {
        await handleCreate();
      }
      
      // Reset form on success
      if (onReset) {
        onReset();
      }
    } catch (error) {
      // Handle different error types
      if (error.response) {
        const serverError = error.response.data;
        if (serverError.message) {
          toast.error(`Server Error: ${serverError.message}`);
        } else if (serverError.error) {
          toast.error(`Server Error: ${serverError.error}`);
        } else {
          toast.error('Error processing order. Please check console for details.');
        }
      } else if (error.request) {
        toast.error('No response from server. Please check your connection.');
      } else {
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    validationErrors
  };
};

export default OrderSubmission;