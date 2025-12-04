import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { setModeCorporateData, updateFieldCorporateData } from '../slices/corporateSlice';
import { fetchCorporateByUsercode } from '../thunks/corporateThunks';
import { toast } from 'react-toastify';
import LeftSideMenu from '../../components/right-side-button/LeftSideMenu';
import RightSideButton from '../../components/right-side-button/RightSideButton';
import { useAuth } from '../../context/authConstants';

const CorporateMaster = () => {
  const { corporateData, mode } = useSelector(state => state.corporateData);
  const { customer_code } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const inputRef = useRef([]);
  const { createDirectOrderFirebaseAccount } = useAuth();

  useEffect(() => {
    const path = location.pathname;
    if (path === '/corporate-master') {
      dispatch(setModeCorporateData('create'));
    } else if (path.startsWith('/corporate-view')) {
      dispatch(setModeCorporateData('display'));
    } else if (path.startsWith('/corporate-alter')) {
      dispatch(setModeCorporateData('update'));
    }
  }, [dispatch]);

  useEffect(() => {
    if (inputRef.current[0]) {
      inputRef.current[0].focus();
      inputRef.current[0].setSelectionRange(0, 0);
    }
  }, []);

  useEffect(() => {
    if (mode === 'display' || mode === 'update') {
      dispatch(fetchCorporateByUsercode(customer_code));
    }
  }, [mode, customer_code, dispatch]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    dispatch(updateFieldCorporateData({ name, value }));
  };

  const handleKeyDown = (e, index) => {
    const key = e.key;
    const { value, selectionStart } = e.target;

    if (key === 'Enter') {
      e.preventDefault();
      if (e.target.value.trim() !== '') {
        const nextField = index + 1;

        if (nextField < inputRef.current.length) {
          inputRef.current[nextField].focus();
          inputRef.current[nextField].setSelectionRange(0, 0);
        } else if (e.target.name === 'password') {
          const userConfirmed = window.confirm('Do you want to confirm this submit?');
          if (userConfirmed) {
            handleSubmit(e);
          } else {
            e.preventDefault();
          }
        }
      }
    } else if (key === 'Backspace') {
      if (selectionStart === 0 && index > 0) {
        e.preventDefault();
        const prevField = index - 1;
        inputRef.current[prevField].focus();
        inputRef.current[prevField].setSelectionRange(0, 0);
      } else if (selectionStart > 0) {
        const newValue = value.slice(0, selectionStart - 1) + value.slice(selectionStart);
        e.target.value = newValue;
        updateFieldCorporateData({ name: e.target.name, value: newValue });
        // move the cursor back by position
        e.target.setSelectionRange(selectionStart - 1, selectionStart - 1);
      }
    } else if (key === 'Escape') {
      navigate(-1);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // for create mode, handel firebase signup first
    if (mode === 'create') {
      console.log('Create mode not available:');
    } else {
      // For update mode - use the enhanced signupDirectorder
      try {
        const result = await createDirectOrderFirebaseAccount(
          corporateData.customer_code,
          {
            customer_name: corporateData.customer_name,
            mobile_number: corporateData.mobile_number,
            customer_type: corporateData.customer_type,
            staus: 'active',
            email: corporateData.email,
            password: corporateData.password,
          },
          corporateData.email,
          corporateData.password
        );

        if (result.success) {
          toast.success('Direct order updated successfully!', {
            position: 'bottom-right',
            autoClose: 50,
          });
          
          setTimeout(() => {
            navigate(`/fetch-view-master/direct`);
          }, 10);
        } else {
          toast.error('Failed to update direct order');
        }
      } catch (error) {
        toast.error(error.message || 'Error updating direct order');
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };
  return (
    <div className="min-h-screen flex bg-[#493D9E] font-amasis">
      <LeftSideMenu />
      {/* Back button */}
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

      <form action="" onSubmit={handleSubmit} className="w-[30%] h-[29vh] bg-[#FBFBFB]">
        <div className="text-[13px] flex mt-2 ml-2 leading-4">
          <label htmlFor="customer_code" className="w-[34%]">
            Direct Order Code
          </label>
          <span>:</span>
          <input
            type="text"
            name="customer_code"
            value={corporateData.customer_code || ''}
            ref={input => (inputRef.current[0] = input)}
            onChange={handleInputChange}
            onKeyDown={e => handleKeyDown(e, 0)}
            className="w-[150px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent"
            autoComplete="off"
            readOnly={mode === 'display'}
          />
        </div>
        <div className="text-[13px] flex mt-2 ml-2 leading-4">
          <label htmlFor="customer_name" className="w-[34%]">
            Direct Order Name
          </label>
          <span>:</span>
          <input
            type="text"
            name="customer_name"
            value={corporateData.customer_name || ''}
            ref={input => (inputRef.current[1] = input)}
            onChange={handleInputChange}
            onKeyDown={e => handleKeyDown(e, 1)}
            className="w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent"
            autoComplete="off"
            readOnly={mode === 'display'}
          />
        </div>
        <div className="text-[13px] flex mt-2 ml-2 leading-4">
          <label htmlFor="mobile_number" className="w-[34%]">
            Mobile Number
          </label>
          <span>:</span>
          <input
            type="text"
            name="mobile_number"
            value={corporateData.mobile_number || ''}
            ref={input => (inputRef.current[2] = input)}
            onChange={handleInputChange}
            onKeyDown={e => handleKeyDown(e, 2)}
            className="w-[150px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent"
            autoComplete="off"
            readOnly={mode === 'display'}
          />
        </div>
        <div className="text-[13px] flex mt-2 ml-2 leading-4">
          <label htmlFor="customer_type" className="w-[34%]">
            Type
          </label>
          <span>:</span>
          <input
            type="text"
            name="customer_type"
            value={corporateData.customer_type || ''}
            ref={input => (inputRef.current[3] = input)}
            onChange={handleInputChange}
            onKeyDown={e => handleKeyDown(e, 3)}
            className="w-[150px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent"
            autoComplete="off"
            readOnly
          />
        </div>
        <div className="text-[13px] flex mt-2 ml-2 leading-4">
          <label htmlFor="email" className="w-[34%]">
            Email
          </label>
          <span>:</span>
          <input
            type="text"
            name="email"
            value={corporateData.email || ''}
            ref={input => (inputRef.current[4] = input)}
            onChange={handleInputChange}
            onKeyDown={e => handleKeyDown(e, 4)}
            className="w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent"
            autoComplete="off"
            readOnly={mode === 'display'}
          />
        </div>
        <div className="text-[13px] flex mt-2 ml-2 leading-4">
          <label htmlFor="" className="w-[34%]">
            Password
          </label>
          <span>:</span>
          <input
            type="text"
            name="password"
            value={corporateData.password || ''}
            ref={input => (inputRef.current[5] = input)}
            onChange={handleInputChange}
            onKeyDown={e => handleKeyDown(e, 5)}
            className="w-[250px] ml-2 pl-0.5 h-5 font-medium text-[13px] capitalize focus:bg-yellow-200 focus:outline-none focus:border-blue-500 focus:border border border-transparent"
            autoComplete="off"
          />
        </div>
      </form>
      <RightSideButton />
    </div>
  );
};

export default CorporateMaster;
