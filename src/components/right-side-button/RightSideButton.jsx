import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const RightSideButton = () => {
  const { type } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if the current path is '/'
  const isRootPath = location.pathname === '/';

  // Flag to disable all buttons if on specific paths
  const disableAll = location.pathname.startsWith(`/stockItemMasterApi/displayStockItem`) || location.pathname.startsWith(`/stockItemMasterApi/alterStockItemMaster`) || location.pathname.startsWith('/stockItemTestApi/displayStockItem') || location.pathname.startsWith('/stockItemTestApi/alterStockItemMaster');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          if (!isRootPath && !disableAll) {
            navigate(`/menu/${type}`);
          }
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          if (!isRootPath && !disableAll) {
            navigate(`/${type}/display`);
          }
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          if (!isRootPath && !disableAll) {
            navigate(`/${type}/alter`);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, isRootPath, type, disableAll]);

  return (
    <div className='w-[10%] h-[100vh] bg-[#def1fc] border border-blue-400 absolute top-0 left-[90%]'>
      {!isRootPath && (
        <div className='mt-2 ml-[8px]'>
          {/* <Link to={disableAll || isCreatePath ? '#' : `/menu/${type}`}>
            <input
              type='button'
              value='Create'
              disabled={disableAll || isCreatePath}
              className={`mb-1 w-28 pl-[8px] border border-gray-400 bg-white text-sm shadow-md ${disableAll || isCreatePath ? 'text-gray-600 cursor-not-allowed' : 'cursor-pointer'}`}
            />{' '}
            <span className={`text-sm font-medium absolute left-[28px] top-[11px] ${disableAll || isCreatePath ? 'cursor-not-allowed text-gray-600' : 'cursor-pointer'}`}>C:</span>
          </Link> */}
          {/* <Link to={disableAll || isDisplayPath ? '#' : `/${type}/display`}>
            <input
              type='button'
              value='Display'
              disabled={disableAll || isDisplayPath}
              className={`mb-1 w-28 pl-[12px] border border-gray-400 bg-white text-sm shadow-md ${disableAll || isDisplayPath ? 'text-gray-600 cursor-not-allowed' : 'cursor-pointer'}`}
            />{' '}
            <span className={`text-sm font-medium absolute left-[28px] top-[11px] ${disableAll || isDisplayPath ? 'cursor-not-allowed text-gray-600' : 'cursor-pointer'}`}>D:</span>
          </Link> */}
          {/* <Link to={disableAll || isAlterPath ? '#' : `/${type}/alter`}>
            <input
              type='button'
              value='Alter'
              className={`w-28 border border-gray-400 bg-white text-sm shadow-md ${disableAll || isAlterPath ? 'text-gray-600 cursor-not-allowed' : 'cursor-pointer'}`}
            />{' '}
            <span className={`text-sm font-medium absolute left-[28.5px] top-[67px] ${disableAll || isAlterPath ? 'cursor-not-allowed text-gray-600' : 'cursor-pointer'}`}>A:</span>
          </Link> */}
        </div>
      )}
    </div>
  );
};

export default RightSideButton;
