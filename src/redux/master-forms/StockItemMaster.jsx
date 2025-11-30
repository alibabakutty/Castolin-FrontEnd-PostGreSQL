import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RightSideButton from '../../components/right-side-button/RightSideButton';
import LeftSideMenu from '../../components/right-side-button/LeftSideMenu';
import { useDispatch, useSelector } from 'react-redux';
import { setModeStockItemData, updateFieldStockItemData } from '../slices/stockItemSlice';
import { fetchStockItemByItemCode } from '../thunks/stockItemThunks';
import handleStockItemSubmit from '../submit/handleStockItemSubmit';

const StockItemMaster = () => {
  const { stockItemData, mode } = useSelector((state) => state.stockItemData);
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef([]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/inventory-master') {
      dispatch(setModeStockItemData('create'));
    } else if (path.startsWith('/inventory-view')) {
      dispatch(setModeStockItemData('display'));
    } else if (path.startsWith('/inventory-alter')) {
      dispatch(setModeStockItemData('update'));
    }
  }, [dispatch]);

  useEffect(() => {
    if (inputRef.current[0]) {
      inputRef.current[0].focus();
      inputRef.current[0].setSelectionRange(0, 0);
    }
  }, []);

  useEffect(() => {
    if ((mode === 'display' || mode === 'update') && id) {
      dispatch(fetchStockItemByItemCode(id));
    }
  }, [mode, id, dispatch]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    dispatch(updateFieldStockItemData({ name, value }));
  };

  const handleKeyDown = (e, index) => {
    const key = e.key;
    const { value, selectionStart } = e.target;

    if (key === 'Enter') {
      e.preventDefault();

      const nextField = index + 1;
      if (nextField < inputRef.current.length) {
        inputRef.current[nextField].focus();
        inputRef.current[nextField].setSelectionRange(0, 0);
      } else if (e.target.name === 'rate') {
        const userConfirmed = window.confirm('Do you want go previous page?');
        if (userConfirmed) {
          handleSubmit(e);
          dispatch(setModeStockItemData('create'));
        } else {
          e.preventDefault();
        }
      }
    } else if (key === 'Backspace') {
      e.preventDefault();

      if (selectionStart === 0 && index > 0) {
        const prevIndex = index - 1;
        inputRef.current[prevIndex].focus();
        inputRef.current[prevIndex].setSelectionRange(0, 0);
      } else if (selectionStart > 0) {
        const newValue = value.slice(0, selectionStart - 1) + value.slice(selectionStart);
        e.target.value = newValue;
        dispatch(updateFieldStockItemData({ name: e.target.name, value: newValue }) );
        // Move the cursor back by one position
        e.target.setSelectionRange(selectionStart - 1, selectionStart - 1);
      }
    } else if (key === 'Escape') {
      e.preventDefault();
      handleBack();
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await handleStockItemSubmit(e, mode, stockItemData, dispatch, navigate, id, inputRef);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen flex bg-[#493D9E] font-amasis">
      <LeftSideMenu />
      {/* Back Button in Top Left Corner */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      <form action="" className="w-[30%] h-[30vh] bg-[#FBFBFB]">
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="item_code" className='w-[34%]'>Product Code</label>
          <span>:</span>
          <input type="text" name='item_code' value={stockItemData.item_code || ''} ref={(input) => (inputRef.current[0] = input)} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 0)} className='w-[150px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' autoComplete='off' readOnly={mode === 'display'} />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="stock_item_name" className='w-[34%]'>Product Name</label>
          <span>:</span>
          <input type="text" name='stock_item_name' value={stockItemData.stock_item_name || ''} ref={(input) => (inputRef.current[1] = input)} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 1)} className='w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' autoComplete='off' readOnly={mode === 'display'} />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="hsn" className='w-[34%]'>HSN Code</label>
          <span>:</span>
          <input type="text" name='hsn' value={stockItemData.hsn || ''} ref={(input) => (inputRef.current[2] = input)} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 2)} className='w-[100px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' autoComplete='off' readOnly={mode === 'display'} />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="gst" className='w-[34%]'>GST</label>
          <span>:</span>
          <input type="text" name='gst' value={stockItemData.gst || ''} ref={(input) => (inputRef.current[3] = input)} onKeyDown={(e) => handleKeyDown(e, 3)} className='w-[100px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' autoComplete='off'readOnly={mode === 'display'} />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="uom" className='w-[34%]'>UOM</label>
          <span>:</span>
          <input type="text" name='uom' value={stockItemData.uom || ''} ref={(input) => (inputRef.current[4] = input)} onKeyDown={(e) => handleKeyDown(e, 4)} onChange={handleInputChange} className='w-[100px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' autoComplete='off' readOnly={mode === 'display'} />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="rate" className='w-[34%]'>Rate</label>
          <span>:</span>
          <input type="text" name='rate' value={stockItemData.rate || ''} ref={(input) => (inputRef.current[5] = input)} onChange={handleInputChange} onKeyDown={(e) => handleKeyDown(e, 5)} className='w-[100px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' autoComplete='off' readOnly={mode === 'display'} />
        </div>
      </form>
      <RightSideButton />
    </div>
  );
};

export default StockItemMaster;
