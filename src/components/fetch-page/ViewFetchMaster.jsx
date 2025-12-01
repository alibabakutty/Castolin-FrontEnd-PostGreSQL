import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';

const ViewFetchMaster = () => {
  const { type } = useParams();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const searchInputRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef(null);

  // Configuration for different module types
  const moduleConfig = {
    inventory: {
      title: 'Inventory Items',
      apiEndpoint: '/stock_item',
      searchPlaceholder: 'Search by item code, item name, description, category...',
      itemName: 'items',
      createLink: '/inventory-master',
      fields: {
        primary: 'stock_item_name',
        code: 'item_code',
        category: 'hsn',
        quantity: 'gst',
        price: 'rate',
        description: 'description',
      },
    },
    customer: {
      title: 'Customers',
      apiEndpoint: '/customer',
      searchPlaceholder: 'Search by customer name, email, phone...',
      itemName: 'customers',
      createLink: '/customer-master',
      fields: {
        primary: 'customer_name',
        code: 'customer_code',
        email: 'mobile_number',
        phone: 'customer_type',
        address: 'address',
        company: 'company_name',
      },
    },
    distributor: {
      title: 'Distributors',
      apiEndpoint: '/distributors',
      searchPlaceholder: 'Search by name, email, mobile number...',
      itemName: 'distributors',
      createLink: '/distributor-master',
      fields: {
        primary: 'customer_name',
        code: 'customer_code',
        mobile: 'mobile_number',
        email: 'email',
        role: 'role',
        status: 'status',
        department: 'department',
      },
    },
    direct: {
      title: 'Direct Orders',
      apiEndpoint: '/corporates',
      searchPlaceholder: 'Search by code, name, mobile number...',
      itemName: 'direct orders',
      createLink: '/corporate-master',
      fields: {
        primary: 'customer_name',
        code: 'customer_code',
        mobile: 'mobile_number',
        email: 'email',
        role: 'role',
        status: 'status',
        department: 'department',
      },
    },
  };

  const typeNames = {
    inventory: 'Inventories',
    customer: 'Customers',
    distributor: 'Distributors',
    direct: 'Direct Orders',
  };

  // Get current module configuration
  const currentModule = moduleConfig[type];

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = e => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = Math.max(0, prev - 1);
            scrollToItem(newIndex);
            return newIndex;
          });
          break;

        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => {
            const newIndex = Math.min(filteredData.length - 1, prev + 1);
            scrollToItem(newIndex);
            return newIndex;
          });
          break;

        case 'Escape':
          e.preventDefault();
          navigate('/admin');
          break;

        case 'Enter':
          e.preventDefault();
          if (filteredData[selectedIndex]) {
            handleItemClick(filteredData[selectedIndex], selectedIndex);
          }
          break;

        default:
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredData, selectedIndex, navigate]);

  // Scroll to selected item
  const scrollToItem = index => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('li');
      if (items[index]) {
        items[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  };

  // Reset selected index when data changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredData]);

  // Filter data function with useCallback to prevent unnecessary re-renders
  const filterData = useCallback(
    (dataToFilter, searchValue) => {
      if (!currentModule || !dataToFilter) return [];

      if (searchValue.trim() === '') {
        return dataToFilter;
      } else {
        return dataToFilter.filter(item => {
          return Object.values(currentModule.fields).some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(searchValue.toLowerCase());
          });
        });
      }
    },
    [currentModule],
  );

  // Single useEffect for data fetching - optimized
  useEffect(() => {
    // Skip if no type or module config
    if (!type || !currentModule || hasFetched) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Don't clear data immediately to avoid blinking
        console.log(`Fetching data for: ${type}`);

        const response = await api.get(currentModule.apiEndpoint);

        // Batch state updates
        setData(response.data);
        setFilteredData(response.data);
        setHasFetched(true);
        console.log(`${currentModule.title} data:`, response.data);
      } catch (error) {
        console.error(`Error fetching ${currentModule.title.toLowerCase()}:`, error);
        setError(`Failed to fetch ${currentModule.title.toLowerCase()}`);
        setData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, currentModule, hasFetched]);

  // Filter data based on search term - optimized
  useEffect(() => {
    if (data.length > 0) {
      const filtered = filterData(data, searchTerm);
      setFilteredData(filtered);
    }
  }, [searchTerm, data, filterData]);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
  };

  const handleInventoryClick = item => {
    navigate(`/inventory-view/${item.item_code}`);
  };

  const handleCustomerClick = item => {
    navigate(`/customer-view/${item.customer_code}`);
  };

  const handleDistributorClick = item => {
    navigate(`/distributor-view/${item.customer_code}`);
  };

  const handleCorporateClick = item => {
    navigate(`/corporate-view/${item.customer_code}`);
  };

  // Handle item click based on type
  const handleItemClick = (item, index) => {
    setSelectedIndex(index);

    switch (type) {
      case 'inventory':
        handleInventoryClick(item);
        break;
      case 'customer':
        handleCustomerClick(item);
        break;
      case 'distributor':
        handleDistributorClick(item);
        break;
      case 'direct':
        handleCorporateClick(item);
        break;
      default:
        break;
    }
  };

  // Render list items based on type
  const renderListItem = (item, index) => {
    if (!currentModule) return null;

    const isSelected = index === selectedIndex;

    const getItemContent = () => {
      switch (type) {
        case 'inventory':
          return (
            <div className="w-full flex items-center text-[12px]">
              {/* Code - 12% */}
              <div className="w-[15%] text-gray-800 truncate">{item.item_code}</div>
              {/* Name - 50% (Increased for full name display) */}
              <div className="w-[50%] text-gray-800 truncate">{item.stock_item_name}</div>
              {/* HSN - 10% (Reduced) */}
              <div className="w-[10%] text-gray-800 truncate text-center">{item.hsn}</div>
              {/* GST - 10% (Reduced) */}
              <div className="w-[10%] text-gray-800 truncate text-center">{item.gst} %</div>
              {/* Rate - 18% (Reduced) */}
              <div className="w-[18%] text-gray-800 truncate text-right">
                ₹ {parseFloat(item.rate || 0).toFixed(2)}
              </div>
            </div>
          );

        case 'customer':
          return (
            <div className="w-full flex items-center text-[12px]">
              {/* Code - 20% */}
              <div className="w-[20%] text-gray-800 truncate">{item.customer_code}</div>
              {/* Name - 40% */}
              <div className="w-[45%] text-gray-800 truncate">{item.customer_name}</div>
              {/* Mobile - 20% */}
              <div className="w-[17%] text-gray-800 truncate">{item.mobile_number}</div>
              {/* Type - 20% */}
              <div className="w-[15%] text-gray-800 truncate">{item.role?.toUpperCase()}</div>
            </div>
          );

        case 'distributor':
          return (
            <div className="w-full flex items-center text-[12px]">
              {/* Code - 12% (Reduced) */}
              <div className="w-[12%] text-gray-800 truncate">{item.customer_code}</div>
              {/* Name - 50% (Increased for full name display) */}
              <div className="w-[50%] text-gray-800 truncate">{item.customer_name}</div>
              {/* Mobile - 15% (Reduced) */}
              <div className="w-[15%] text-gray-800 truncate">{item.mobile_number}</div>
              {/* Type - 13% (Reduced) */}
              <div className="w-[13%] text-gray-800 truncate">
                {item.customer_type?.toUpperCase()}
              </div>
              {/* Status - 10% (Reduced) */}
              <div className="w-[10%] text-gray-800 truncate text-center">
                {item.status?.toUpperCase()}
              </div>
            </div>
          );

        case 'direct':
          return (
            <div className="w-full flex items-center text-[12px]">
              {/* Code - 12% (Reduced) */}
              <div className="w-[12%] text-gray-800 truncate">{item.customer_code}</div>
              {/* Name - 50% (Increased for full name display) */}
              <div className="w-[50%] text-gray-800 truncate">{item.customer_name}</div>
              {/* Mobile - 15% (Reduced) */}
              <div className="w-[15%] text-gray-800 truncate">{item.mobile_number}</div>
              {/* Type - 13% (Reduced) */}
              <div className="w-[13%] text-gray-800 truncate">
                {item.customer_type?.toUpperCase()}
              </div>
              {/* Status - 10% (Reduced) */}
              <div className="w-[10%] text-gray-800 truncate text-center">
                {item.status?.toUpperCase()}
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <li
        key={item.id || item.item_code || item.customer_code || index}
        className={`border-b border-gray-300 py-1 px-3 transition-colors cursor-pointer ${
          isSelected ? 'bg-yellow-100 border-yellow-300' : 'hover:bg-blue-50'
        }`}
        onClick={() => handleItemClick(item, index)}
      >
        {getItemContent()}
        {item.description && type === 'inventory' && (
          <p className="text-xs text-gray-500 mt-1 italic">{item.description}</p>
        )}
        {item.address && type === 'customer' && (
          <p className="text-xs text-gray-500 mt-1">{item.address}</p>
        )}
      </li>
    );
  };

  // Main render with stable conditional rendering
  const renderContent = () => {
    if (loading && !hasFetched) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-gray-500">Loading {currentModule?.title.toLowerCase()}...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-red-600 text-center">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!currentModule) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-red-600">Invalid module type</div>
        </div>
      );
    }

    return (
      <div className="h-[78vh] overflow-y-auto" ref={listRef}>
        <div>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {searchTerm ? 'No items match your search.' : `No ${currentModule.itemName} found.`}
            </div>
          ) : (
            <ul className="divide-y divide-gray-300 leading-4">
              {filteredData.map((item, index) => renderListItem(item, index))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex font-amasis">
      <div className="w-[100%] h-[100vh] flex">
        <div className="w-1/2 bg-gradient-to-t to-blue-500 from-[#ccc]">
          <button
            onClick={() => navigate('/admin')}
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
        <div className="w-1/2 bg-slate-100 border border-1-blue-400 flex justify-center flex-col items-center">
          <div className="w-[100%] h-16 flex flex-col justify-center items-center bg-white border-b-0">
            <p className="text-[13px] font-semibold underline underline-offset-4 decoration-gray-400 text-gray-700">
              {currentModule.itemName.toUpperCase()} DISPLAY
            </p>
            <input
              type="text"
              placeholder={''}
              value={searchTerm}
              ref={searchInputRef}
              onChange={handleSearchChange}
              className="w-[600px] ml-2 mt-2 h-5 capitalize font-medium pl-1 text-sm focus:bg-yellow-200 focus:border focus:border-blue-500 focus:outline-0 relative z-10"
              autoComplete="off"
            />
          </div>
          <div className="w-[682px] h-[89vh] bg-slate-200">
            <h2 className="p-1 bg-[#2a67b1] text-white text-left text-[13px] pl-3">
              List of {typeNames[type] || 'Items'}
            </h2>
            <div className="border border-b-slate-400 flex justify-between px-2 py-1">
              {/* Header columns */}
              <div className="w-full flex text-xs font-medium">
                {/* Code column */}
                <div className={`${
                  type === 'customer' ? 'w-[20%]' : 
                  (type === 'inventory' || type === 'distributor' || type === 'direct') ? 'w-[12%]' : 'w-[15%]'
                }`}>
                  {type === 'customer'
                    ? 'Customer Code'
                    : type === 'inventory'
                    ? 'Product Code'
                    : type === 'distributor'
                    ? 'Dist. Code'
                    : 'Code'}
                </div>
                
                {/* Name column - Increased width for better name display */}
                <div className={`${
                  type === 'customer' ? 'w-[40%] pl-7' : 
                  (type === 'inventory' || type === 'distributor' || type === 'direct') ? 'w-[50%] text-center' : 'w-[30%]'
                }`}>
                  {type === 'customer'
                    ? 'Customer Name'
                    : type === 'inventory'
                    ? 'Product Name'
                    : type === 'distributor'
                    ? 'Distributor Name'
                    : 'Name'}
                </div>

                {/* Conditional columns */}
                {type !== 'inventory' && (
                  <div className={`${
                    type === 'customer' ? 'w-[20%] pl-4' : 
                    (type === 'distributor' || type === 'direct') ? 'w-[15%]' : 'w-[20%]'
                  }`}>
                    Mobile Number
                  </div>
                )}

                {type !== 'inventory' && (
                  <div className={`${
                    type === 'customer' ? 'w-[20%] pl-3' : 
                    (type === 'distributor' || type === 'direct') ? 'w-[13%]' : 'w-[20%]'
                  }`}>
                    {type === 'customer' ? 'Role' : 'Type'}
                  </div>
                )}

                {/* Fifth column for non-customer types */}
                {type !== 'customer' && (
                  <>
                    {type === 'inventory' && (
                      <>
                        <div className="w-[10%] text-center">HSN Code</div>
                        <div className="w-[10%] text-center">GST Rate</div>
                        <div className="w-[18%] text-right">Rate Amount</div>
                      </>
                    )}
                    {(type === 'distributor' || type === 'direct') && (
                      <div className="w-[10%] text-center">Status</div>
                    )}
                  </>
                )}
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewFetchMaster;