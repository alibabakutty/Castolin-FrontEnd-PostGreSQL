// components/OrderCalculations.jsx
import { useMemo, useEffect } from 'react';

const OrderCalculations = ({ 
  mode, 
  orderData, 
  editingRow, 
  dbTotals, 
  isTamilNaduState,
  onTotalsCalculated 
}) => {
  
  // calculate totals - ALWAYS calculate dynamically, even in update mode
  const totals = useMemo(() => {
    // For update mode, we should still calculate dynamically based on current data
    // Only use dbTotals if we have no orderData (initial load)
    if (mode === 'update' && dbTotals && orderData.length === 0) {
      console.log('Initial load - Using database totals:', dbTotals);
      const calculated = {
        qty: parseFloat(dbTotals.qty) || 0,
        amount: parseFloat(dbTotals.amount) || 0,
        discAmt: parseFloat(dbTotals.discAmt) || 0,
        splDiscAmt: parseFloat(dbTotals.splDiscAmt) || 0,
        sgstAmt: parseFloat(dbTotals.sgstAmt) || 0,
        cgstAmt: parseFloat(dbTotals.cgstAmt) || 0,
        igstAmt: parseFloat(dbTotals.igstAmt) || 0,
        totalAmount: parseFloat(dbTotals.totalAmount) || 0,
        baseAmount: parseFloat(dbTotals.amount) || 0,
      };
      
      onTotalsCalculated?.(calculated);
      return calculated;
    }
    
    // Calculate totals including discounts - DYNAMIC CALCULATION
    console.log('Calculating dynamic totals for mode:', mode, 'Order data length:', orderData.length);
    
    let totalQty = 0;
    let totalBaseAmount = 0;
    let totalDiscAmt = 0;
    let totalSplDiscAmt = 0;
    let totalSgstAmt = 0;
    let totalCgstAmt = 0;
    let totalIgstAmt = 0;
    let totalAmount = 0;

    // Calculate for existing rows
    orderData.forEach(row => {
      const qty = parseFloat(row.itemQty) || 0;
      const rate = parseFloat(row.rate) || 0;
      totalQty += qty;
      
      const baseAmount = qty * rate;
      totalBaseAmount += baseAmount;
      
      const discAmt = parseFloat(row.discAmt) || 0;
      const splDiscAmt = parseFloat(row.splDiscAmt) || 0;
      
      totalDiscAmt += discAmt;
      totalSplDiscAmt += splDiscAmt;
      
      const discountedAmount = baseAmount - discAmt - splDiscAmt;
      
      // Add GST amounts
      totalSgstAmt += parseFloat(row.sgst) || 0;
      totalCgstAmt += parseFloat(row.cgst) || 0;
      totalIgstAmt += parseFloat(row.igst) || 0;
      
      // Add final amount (should match row.amount)
      totalAmount += parseFloat(row.amount) || 0;
    });

    // Calculate for editing row if it has data
    let editingRowQty = 0;
    let editingRowBaseAmount = 0;
    let editingRowDiscAmt = 0;
    let editingRowSplDiscAmt = 0;
    let editingRowSgst = 0;
    let editingRowCgst = 0;
    let editingRowIgst = 0;
    let editingRowAmount = 0;

    const hasEditingRowData = editingRow.item && editingRow.quantity;
    if (hasEditingRowData) {
      editingRowQty = parseFloat(editingRow.quantity) || 0;
      const editingRowRate = parseFloat(editingRow.rate) || 0;
      editingRowBaseAmount = editingRowQty * editingRowRate;
      
      editingRowDiscAmt = parseFloat(editingRow.discAmt) || 0;
      editingRowSplDiscAmt = parseFloat(editingRow.splDiscAmt) || 0;
      
      editingRowSgst = parseFloat(editingRow.sgst) || 0;
      editingRowCgst = parseFloat(editingRow.cgst) || 0;
      editingRowIgst = parseFloat(editingRow.igst) || 0;
      
      editingRowAmount = parseFloat(editingRow.amount) || 0;
    }

    // Combine totals including editing row
    const finalTotalQty = totalQty + editingRowQty;
    const finalTotalBaseAmount = totalBaseAmount + editingRowBaseAmount;
    const finalTotalDiscAmt = totalDiscAmt + editingRowDiscAmt;
    const finalTotalSplDiscAmt = totalSplDiscAmt + editingRowSplDiscAmt;
    const finalTotalSgstAmt = totalSgstAmt + editingRowSgst;
    const finalTotalCgstAmt = totalCgstAmt + editingRowCgst;
    const finalTotalIgstAmt = totalIgstAmt + editingRowIgst;
    const finalTotalAmount = totalAmount + editingRowAmount;
    
    // Calculate amount without tax (after discounts, before GST)
    const amountWithoutTax = finalTotalBaseAmount - finalTotalDiscAmt - finalTotalSplDiscAmt;
    
    // Verify calculation: amountWithoutTax + GST should equal totalAmount
    const calculatedTotalAmount = amountWithoutTax + finalTotalSgstAmt + finalTotalCgstAmt + finalTotalIgstAmt;
    
    const calculated = {
      qty: finalTotalQty,
      amount: amountWithoutTax,
      baseAmount: finalTotalBaseAmount,
      discAmt: finalTotalDiscAmt,
      splDiscAmt: finalTotalSplDiscAmt,
      sgstAmt: finalTotalSgstAmt,
      cgstAmt: finalTotalCgstAmt,
      igstAmt: finalTotalIgstAmt,
      totalAmount: finalTotalAmount,
      calculatedTotalAmount,
    };
    
    onTotalsCalculated?.(calculated);
    return calculated;
  }, [orderData, editingRow, mode, dbTotals, isTamilNaduState]);

  // Debug effect
  useEffect(() => {
    console.log('=== ORDER CALCULATIONS DEBUG ===');
    console.log('Inputs:', {
      mode,
      orderDataLength: orderData.length,
      hasEditingRow: !!editingRow.item,
      dbTotals: !!dbTotals
    });
    console.log('Calculated Totals:', totals);
  }, [totals]);

  return null; // This component only calculates, doesn't render
};

export default OrderCalculations;