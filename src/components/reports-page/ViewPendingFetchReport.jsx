import { useEffect, useState, useCallback, useRef } from 'react';
import Title from '../Title';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ViewPendingFetchReport = ({ onBack }) => { 
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const searchInputRef = useRef(null);
  const listContainerRef = useRef(null);
  const navigate = useNavigate();

  // Column configuration matching your existing structure
  const columns = [
    { key: 'date', label: 'Date', width: '90px', align: 'left' },
    { key: 'voucher_type', label: 'Vch Type', width: '250px', align: 'left' },
    { key: 'order_no', label: 'Vch No.', width: '16%', align: 'center' },
    { key: 'customer_code', label: 'Code', width: '100px', align: 'center' },
    { key: 'customer_name', label: 'Customer', width: '30%', align: 'left' },
    { key: 'executive', label: 'Executive', width: '28%', align: 'left' },
    { key: 'delivery_date', label: 'Dely. Date', width: '120px', align: 'left' },
    { key: 'delivery_mode', label: 'Dely. Mode', width: '100px', align: 'left' },
    { key: 'status', label: 'Status', width: '9%', align: 'center' },
    { key: 'amount', label: 'Amount', width: '10%', align: 'right' }
  ];

  // Filter orders based on search term
  const filterOrders = useCallback((orders, searchValue) => {
    if (!orders || !Array.isArray(orders)) return [];

    const trimmedValue = searchValue.trim().toLowerCase();
    if (trimmedValue === '') return orders;

    return orders.filter(order => {
      const voucherType = order.voucher_type?.toLowerCase() || '';
      const orderNo = order.order_no?.toString().toLowerCase() || '';
      const customerCode = order.customer_code?.toLowerCase() || '';
      const customer = order.customer_name?.toLowerCase() || '';
      const executive = order.executive?.toLowerCase() || '';
      const deliveryDate = formatDate(order.delivery_date)?.toLowerCase() || '';
      const deliveryMode = order.delivery_mode?.toLowerCase() || '';
      const amount = order.total_amount?.toString().toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      const createdAt = formatDate(order.created_at)?.toLowerCase() || '';

      return (
        voucherType.includes(trimmedValue) ||
        orderNo.includes(trimmedValue) ||
        customerCode.includes(trimmedValue) ||
        customer.includes(trimmedValue) ||
        executive.includes(trimmedValue) ||
        deliveryDate.includes(trimmedValue) ||
        deliveryMode.includes(trimmedValue) ||
        amount.includes(trimmedValue) ||
        status.includes(trimmedValue) ||
        createdAt.includes(trimmedValue)
      );
    });
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = e => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedRow(prev => Math.max(0, prev - 1));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setSelectedRow(prev => Math.min(filteredOrders.length - 1, prev + 1));
          break;

        case 'ArrowLeft':
          e.preventDefault();
          setSelectedCol(prev => Math.max(0, prev - 1));
          break;

        case 'ArrowRight':
          e.preventDefault();
          setSelectedCol(prev => Math.min(columns.length - 1, prev + 1));
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
          if (filteredOrders[selectedRow]) {
            handleOrderClick(filteredOrders[selectedRow]);
          }
          break;

        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) {
            setSelectedRow(0);
          } else {
            setSelectedCol(0);
          }
          break;

        case 'End':
          e.preventDefault();
          if (e.ctrlKey) {
            setSelectedRow(filteredOrders.length - 1);
          } else {
            setSelectedCol(columns.length - 1);
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
  }, [filteredOrders, selectedRow, selectedCol, navigate, onBack, columns.length]);

  // Scroll to selected row
  useEffect(() => {
    if (listContainerRef.current && selectedRow >= 0) {
      const items = listContainerRef.current.querySelectorAll('[data-order-item]');
      if (items[selectedRow]) {
        items[selectedRow].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedRow]);

  // Reset selection when filtered orders change
  useEffect(() => {
    setSelectedRow(0);
    setSelectedCol(0);
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

        // Get unique pending orders by order_no
        const pendingUniqueOrders = ordersData
          .filter(order => order.status && order.status.toLowerCase() === 'pending')
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

  // Apply search filter when search term changes
  useEffect(() => {
    if (allOrders.length > 0) {
      const filtered = filterOrders(allOrders, searchTerm);
      setFilteredOrders(filtered);
    }
  }, [searchTerm, allOrders, filterOrders]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = e => {
    setSearchTerm(e.target.value);
  };

  const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-IN', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  // Handle order click
  const handleOrderClick = order => {
    if (order.order_no) {
      navigate(`/order-report-approved/${order.order_no}`);
    }
  };

  // Handle cell click
  const handleCellClick = (rowIndex, colIndex) => {
    setSelectedRow(rowIndex);
    setSelectedCol(colIndex);
  };

  // Get cell value based on column key
  const getCellValue = (order, columnKey) => {
    switch (columnKey) {
      case 'date':
        return formatDate(order.created_at);
      case 'delivery_date':
        return formatDate(order.delivery_date);
      case 'amount':
        return `₹ ${Number(order.total_amount || 0).toFixed(2)}`;
      case 'executive':
        return order.executive?.toUpperCase();
      case 'status':
        return order.status?.toUpperCase();
      default:
        return order[columnKey] || '';
    }
  };

  // Calculate total amount of filtered orders
  const totalFilteredAmount = filteredOrders.reduce((total, order) => {
    return total + (Number(order.total_amount) || 0);
  }, 0);

  // Render content based on state
  const renderContent = () => {
    if (loading && !hasFetched) {
      return (
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-gray-500">Loading pending sales quotations...</div>
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
          filteredOrders.map((order, rowIndex) => {
            const isRowSelected = rowIndex === selectedRow;
            return (
              <div
                key={order.id || order.order_no || rowIndex}
                data-order-item
                className={`flex justify-between items-center border-b border-gray-200 px-2 py-[2px] transition cursor-pointer ${
                  isRowSelected
                    ? 'bg-yellow-100 border-yellow-300'
                    : rowIndex % 2 === 0
                    ? 'bg-white hover:bg-blue-50'
                    : 'bg-gray-100 hover:bg-blue-50'
                }`}
                onClick={() => {
                  setSelectedRow(rowIndex);
                  handleOrderClick(order);
                }}
              >
                {columns.map((column, colIndex) => {
                  const isCellSelected = isRowSelected && colIndex === selectedCol;
                  return (
                    <div
                      key={column.key}
                      className={`border-r border-gray-200 last:border-r-0 py-1 ${
                        isCellSelected ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                      }`}
                      style={{ width: column.width }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(rowIndex, colIndex);
                      }}
                    >
                      <div className={`${column.align === 'left' ? 'text-left' : column.align === 'center' ? 'text-center' : 'text-right'} ${
                        column.key === 'customer_name' || column.key === 'executive' ? 'truncate' : ''
                      }`} title={getCellValue(order, column.key)}>
                        {getCellValue(order, column.key)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            {searchTerm ? 'No orders match your search.' : 'No pending sales quotations found.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="w-[100%] h-[100vh] flex">
        <div className="w-full">
          <Title title={`Sales Quotation - Pending`} nav={onBack} />

          {/* Header Row: Title + Date Range + Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-gray-300 bg-white px-3 py-2">
            {/* Left section — title */}
            <div className="text-sm font-amasis text-gray-700">
              List of All Pending Sales Quotations
            </div>

            {/* Right section — search box */}
            <div className="flex-1 min-w-[300px] max-w-[500px]">
              <input
                type="text"
                placeholder="Search by order no, customer, executive, amount, or date..."
                value={searchTerm}
                ref={searchInputRef}
                onChange={handleSearchChange}
                className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-amasis"
                autoComplete="off"
              />
            </div>

            {/* Middle section — date range */}
            <div className="text-sm whitespace-nowrap font-amasis">1-Apr-25 to 31-May-26</div>
          </div>

          {/* Column Headers */}
          <div className="flex justify-between border-b-[1px] py-0.3 border-gray-300 bg-gray-100 font-amasis text-sm">
            {columns.map((column, colIndex) => (
              <div
                key={column.key}
                className={`border-r border-gray-300 last:border-r-0 ${
                  selectedCol === colIndex && selectedRow === -1 ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                }`}
                style={{ width: column.width }}
              >
                <div className={column.align === 'left' ? 'text-left pl-2' : column.align === 'center' ? 'text-center' : 'text-right pr-3'}>
                  {column.label}
                </div>
              </div>
            ))}
          </div>

          {/* Orders List */}
          {renderContent()}

          {/* Results Summary */}
          {filteredOrders.length > 0 && (
            <div className="border-t border-gray-300 bg-gray-50 py-2 px-3 font-amasis">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <div>
                  Showing {filteredOrders.length} of {allOrders.length} pending sales quotations
                  {searchTerm && ` for "${searchTerm}"`}
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

export default ViewPendingFetchReport;