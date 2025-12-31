const OrderFooter = ({
  remarks,
  setRemarks,
  status,
  setStatus,
  totals,
  handleSubmit,
  isSubmitting,
  formatCurrency,
  handleRemarksKeyDown,
  isDistributorReport,
  isCorporateReport,
  isDistributorOrder,
  isDirectOrder,
}) => {

  // Add this for debugging
  console.log('OrderFooter totals:', totals);
  console.log('SGST:', totals?.sgstAmt, 'Type:', typeof totals?.sgstAmt);
  console.log('CGST:', totals?.cgstAmt, 'Type:', typeof totals.cgstAmt);
  
  return (
    <div className="h-[9vh] flex flex-col border-t">
      {/* First row */}
      <div className="flex items-center">
        <div className="flex justify-between w-full px-0.5">
          <div className="w-[300px] px-0.5">
            <div className="relative flex gap-2 mt-1">
              <textarea
                name="remarks"
                placeholder="Remarks"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                onKeyDown={handleRemarksKeyDown}
                className="border border-[#932F67] resize-none md:w-[320px] outline-none rounded px-1 peer h-[26px] bg-[#F8F4EC] mb-1 ml-1"
              ></textarea>

              <div className="w-[320px]">
                <label className="text-sm font-medium ml-3">Status : </label>
                <select
                name="status"
                id="status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                  disabled={isDistributorOrder || isDirectOrder || isDistributorReport || isCorporateReport}
                  className="outline-none appearance-none border border-[#932F67] px-1 text-sm rounded ml-1 mt-0.5"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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
                  <FooterCell>{totals?.qty || 0}</FooterCell>
                  <FooterCell>{formatCurrency(totals?.amount)}</FooterCell>
                  <FooterCell>{formatCurrency(totals?.sgstAmt)}</FooterCell>
                  <FooterCell>{formatCurrency(totals?.cgstAmt)}</FooterCell>
                  <FooterCell>{formatCurrency(totals?.igstAmt)}</FooterCell>
                  <FooterCell>{formatCurrency(totals?.calculatedTotalAmount)}</FooterCell>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Second row - Save button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mb-0.5 -ml-[-1250px] mr-1">
            {!isDistributorReport && !isCorporateReport && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#693382] text-white px-5 rounded-[6px] py-1 outline-none cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FooterCell = ({ children }) => <td className="text-right border w-20 px-1">{children}</td>;

export default OrderFooter;
