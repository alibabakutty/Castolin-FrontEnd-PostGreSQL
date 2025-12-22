import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Title from '../Title';
import { useAuth } from '../../context/authConstants';

const ViewFetchCorporate = ({ onBack }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-IN', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Filter orders based on search term
  const filterOrders = useCallback((orders, searchValue) => {
    if (!orders || !Array.isArray(orders)) return [];

    const trimmedValue = searchValue.trim().toLowerCase();
    if (trimmedValue === '') return orders;

    return orders.filter(order => {
      const orderNo = order.order_no?.toString().toLowerCase() || '';
      const customer = order.customer_name?.toLowerCase() || '';
      const executive = order.executive?.toLowerCase() || '';
      const amount = order.total_amount?.toString().toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      const createdAt = formatDate(order.created_at)?.toLowerCase() || '';

      return (
        orderNo.includes(trimmedValue) ||
        customer.includes(trimmedValue) ||
        executive.includes(trimmedValue) ||
        amount.includes(trimmedValue) ||
        status.includes(trimmedValue) ||
        createdAt.includes(trimmedValue)
      );
    });
  }, []);

  // handle order click
  const handleOrderClick = order => {
    if (order.order_no) {
      navigate(`/order-report-corporate/${order.order_no}`);
    }
  };

  // keyboard navigation handler
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
            const newIndex = Math.min(filteredOrders.length - 1, prev + 1);
            scrollToItem(newIndex);
            return newIndex;
          });
          break;
        case 'Escape':
          e.preventDefault();
          if (onBack) {
            onBack();
          } else {
            navigate(-1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOrders[selectedIndex]) {
            handleOrderClick(filteredOrders[selectedIndex]);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredOrders, selectedIndex, navigate, onBack]);

  // scroll to selected item
  const scrollToItem = index => {
    if (listContainerRef.current) {
      const items = listContainerRef.current.querySelectorAll('[data-order-item]');
      if (items[index]) {
        items[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  };

  // Reset selected index when filtered orders change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredOrders]);

  // Fetch orders
  useEffect(() => {
    if (hasFetched) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/orders');
        const ordersData = response.data;

        // current loggedin user
        const currentCorporateUsername = user?.customer_name.toLowerCase() || user?.displayName.toLowerCase() || '';

        // get unique orders by order_no
        const pendingUniqueOrders = ordersData
          .filter(
            order => {
              const hasCorporateRole = order.role && order.role === 'direct';
              const matchesCurrentUser = order.executive && order.executive.toLowerCase() === currentCorporateUsername
              
              return hasCorporateRole && matchesCurrentUser;
            }
          )
          .reduce((acc, current) => {
            const existingOrder = acc.find(order => order.order_no === current.order_no);
            if (!existingOrder) {
              acc.push(current);
            }
            return acc;
          }, []);

        setAllOrders(pendingUniqueOrders);
        setFilteredOrders(pendingUniqueOrders);
        setHasFetched(true);
        console.log('Pending orders:', pendingUniqueOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to fetch orders');
        setAllOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [hasFetched]);

  // apply search filter when search term changes
  useEffect(() => {
    if (allOrders.length > 0) {
      const filtered = filterOrders(allOrders, searchTerm);
      setFilteredOrders(filtered);
    }
  }, [searchTerm, allOrders, filterOrders]);

  // Focus search input on amount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
  };

  // calcualte total amount of filtered orders
  const totalFilteredAmount = filteredOrders.reduce((total, order) => {
    return total + (Number(order.total_amount) || 0);
  }, 0);

  // Render content based on state
  const renderContent = () => {
    if (loading && !hasFetched) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-gray-500">Loading sales quotations...</div>
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
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto max-h-[79vh] text-xs font-amasis" ref={listContainerRef}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={order.id || order.order_no || index}
                data-order-item
                className={`flex justify-between items-center border-b border-gray-200 px-2 py-[2px] transition cursor-pointer ${
                  isSelected
                    ? 'bg-yellow-100 border-yellow-300'
                    : index % 2 === 0
                    ? 'bg-white hover:bg-blue-50'
                    : 'bg-gray-100 hover:bg-blue-50'
                }`}
                onClick={() => {
                  setSelectedIndex(index);
                  handleOrderClick(order);
                }}
              >
                <div className='w-[15%] text-left'>{formatDate(order.created_at)}</div>
                <div className='w-[20%] text-center'>{order.order_no}</div>
                <div className='w-[35%] text-left truncate' title={order.customer_name}>{order.customer_name}</div>
                <div className='w-[15%] text-center truncate'>{order.status.toUpperCase()}</div>
                <div className='w-[20%] text-right pr-1'>₹ {Number(order.total_amount || 0).toFixed(2)}</div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? 'No orders match your search.' : 'No sales quotations found.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="w-[100%] h-[100vh] flex">
        <div className="w-full">
          <Title title={`Sales Quotation - Direct Order`} nav={onBack} />

          {/* Header row: Title + Date Range + Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-300 bg-white px-3 py-2">
            {/* Left section - title */}
            <div className="text-sm font-amasis text-gray-700">
              List of All Direct-Order Sales Quotation
            </div>

            {/* Right section - search box */}
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by order no, customer, executive, amount, or date..."
                value={searchTerm}
                ref={searchInputRef}
                onChange={handleSearchChange}
                className="w-full sm:w-80 h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-amasis"
                autoComplete="off"
              />
            </div>

            {/* Middle section -  date range */}
            <div className="text-sm whitespace-nowrap font-amasis">1-Apr-25 to 31-May-26</div>
          </div>

          {/* Column Headers */}
          <div className="flex justify-between border-b-[1px] py-0.3 border-gray-300 bg-gray-100 font-amasis">
            <div className="w-[15%] text-left pl-2">Date</div>
            <div className="w-[20%] text-center">Vch No.</div>
            <div className="w-[35%] text-left">Customer</div>
            <div className="w-[15%] text-center">Status</div>
            <div className="w-[20%] text-right pr-3">Amount</div>
          </div>

          {/* Orders List */}
          {renderContent()}

          {/* Results Summary */}
          {filteredOrders.length > 0 && (
            <div className="border-t border-gray-300 bg-gray-50 py-2 px-3 font-amasis">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <div>
                  Showing {filteredOrders.length} of {allOrders.length} direct-order sales
                  quotations {searchTerm && ` for "${searchTerm}"`}
                </div>
                <div className="font-medium">Total: ₹ {totalFilteredAmount.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewFetchCorporate;
