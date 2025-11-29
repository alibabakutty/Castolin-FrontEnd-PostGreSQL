import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RightSideButton from '../../components/right-side-button/RightSideButton';
import LeftSideMenu from '../../components/right-side-button/LeftSideMenu';
import { useDispatch, useSelector } from 'react-redux';
import { setModeCustomerData, updateFieldCustomerData } from '../slices/customerSlice';
import { fetchCustomerByCustomerCode } from '../thunks/customerThunks';
import handleCustomerSubmit from '../submit/handleCustomerSubmit';

const CustomerMaster = () => {
  const { customerData, mode } = useSelector((state) => state.customerData);
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef([]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/customer-master') {
      dispatch(setModeCustomerData('create'));
    } else if (path.startsWith('/customer-view')) {
      dispatch(setModeCustomerData('display'));
    } else if (path.startsWith('/customer-alter')) {
      dispatch(setModeCustomerData('update'));
    }
  }, [dispatch]);

  useEffect(() => {
    if (inputRef.current[0]) {
      inputRef.current[0].focus();
      inputRef.current[0].setSelectionRange(0, 0);
    }
  }, []);

  // Fetch customer data when in display or update mode
  useEffect(() => {
    if ((mode === 'display' || mode === 'update') && id) {
      dispatch(fetchCustomerByCustomerCode(id));
    }
  }, [mode, id, dispatch]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    dispatch(updateFieldCustomerData({ name, value }));
  };

  const handleKeyDown = (e, index) => {
    const key = e.key;
    const { value, selectionStart, selectionEnd } = e.target;

    if (key === 'Enter') {
      e.preventDefault();

      const nextField = index + 1;
      if (nextField < inputRef.current.length) {
        inputRef.current[nextField].focus();
        inputRef.current[nextField].setSelectionRange(0, 0);
      } else if (e.target.name === 'customer_type') {
        const userConfirmed = window.confirm('Do you want go previous page?');
        if (userConfirmed) {
          handleSubmit(e);
          dispatch(setModeCustomerData('create'));
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
        dispatch(updateFieldCustomerData({ name: e.target.name, value: newValue }));
        // move cursor back by one position
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
      await handleCustomerSubmit(e, mode, customerData, dispatch, navigate, id, inputRef);
      if (mode === 'create') {
        alert('Customer created successfully!');
        navigate(-1);
      } else if (mode === 'update') {
        alert('Customer updated successfully!');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex bg-[#493D9E] font-amasis">
      <LeftSideMenu />
      
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

      <form onSubmit={handleSubmit} className="w-[30%] h-[24vh] bg-[#FBFBFB]">
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="customer_code" className='w-[34%]'>Customer Code</label>
          <span>:</span>
          <input 
            type="text" 
            name='customer_code' 
            value={customerData.customer_code || ''} 
            ref={(input) => (inputRef.current[0] = input)} 
            onChange={handleInputChange} 
            onKeyDown={(e) => handleKeyDown(e, 0)}
            className='w-[150px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' 
            autoComplete='off' 
            readOnly={mode === 'display'} 
          />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="customer_name" className='w-[34%]'>Customer Name</label>
          <span>:</span>
          <input 
            type="text" 
            name='customer_name' 
            value={customerData.customer_name || ''} 
            ref={(input) => (inputRef.current[1] = input)} 
            onChange={handleInputChange} 
            onKeyDown={(e) => handleKeyDown(e, 1)}
            className='w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' 
            autoComplete='off' 
            readOnly={mode === 'display'} 
          />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="mobile_number" className='w-[34%]'>Mobile Number</label>
          <span>:</span>
          <input 
            type="text" 
            name='mobile_number' 
            value={customerData.mobile_number || ''} 
            ref={(input) => (inputRef.current[2] = input)} 
            onChange={handleInputChange} 
            onKeyDown={(e) => handleKeyDown(e, 2)}
            className='w-[150px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' 
            autoComplete='off' 
            readOnly={mode === 'display'} 
          />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="email" className='w-[34%]'>Email</label>
          <span>:</span>
          <input 
            type="text" 
            name='email' 
            value={customerData.email || ''} 
            ref={(input) => (inputRef.current[3] = input)} 
            onChange={handleInputChange} 
            onKeyDown={(e) => handleKeyDown(e, 3)}
            className='w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' 
            autoComplete='off' 
            readOnly={mode === 'display'} 
          />
        </div>
        <div className='text-[13px] flex mt-2 ml-2 leading-4'>
          <label htmlFor="customer_type" className='w-[34%]'>Type</label>
          <span>:</span>
          <input 
            type="text" 
            name='customer_type' 
            value={customerData.customer_type || ''} 
            ref={(input) => (inputRef.current[4] = input)} 
            onChange={handleInputChange} 
            onKeyDown={(e) => handleKeyDown(e, 4)}
            className='w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent' 
            autoComplete='off' 
            readOnly={mode === 'display'} 
          />
        </div>

        {mode !== 'display' && (
          <div className="mt-4 ml-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {mode === 'create' ? 'Create Customer' : 'Update Customer'}
            </button>
          </div>
        )}
      </form>
      <RightSideButton />
    </div>
  );
};

export default CustomerMaster;