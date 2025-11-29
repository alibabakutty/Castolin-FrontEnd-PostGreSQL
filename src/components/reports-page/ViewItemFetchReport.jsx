import { useEffect, useState, useCallback, useRef } from 'react';
import Title from '../Title';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ViewItemFetchReport = ({ onBack }) => {
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
  const horizontalScrollRef = useRef(null);
  const navigate = useNavigate();

  // Column configuration
  const columns = [
    { key: 'date', label: 'Date', width: '75px', align: 'center' },
    { key: 'voucher_type', label: 'Vch Type', width: '170px', align: 'left' },
    { key: 'order_no', label: 'Vch No.', width: '120px', align: 'left' },
    { key: 'customer_code', label: 'Code', width: '60px', align: 'left' },
    { key: 'customer_name', label: 'Customer', width: '270px', align: 'left' },
    { key: 'executive', label: 'Executive', width: '260px', align: 'left' },
    { key: 'item_code', label: 'Item Code', width: '110px', align: 'left' },
    { key: 'item_name', label: 'Item Name', width: '320px', align: 'left' },
    { key: 'quantity', label: 'Qty', width: '60px', align: 'right' },
    { key: 'uom', label: 'UOM', width: '40px', align: 'center' },
    { key: 'delivery_date', label: 'Dely. Date', width: '75px', align: 'center' },
    { key: 'delivery_mode', label: 'Dely. Mode', width: '80px', align: 'left' },
    { key: 'status', label: 'Status', width: '75px', align: 'left' },
    { key: 'gross_amount', label: 'Amount', width: '90px', align: 'right' },
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
      const itemCode = order.item_code?.toString().toLowerCase() || '';
      const itemName = order.item_name?.toString().toLowerCase() || '';
      const quantity = order.quantity?.toString().toLowerCase() || '';
      const uom = order.uom?.toString().toLowerCase() || '';

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
        createdAt.includes(trimmedValue) ||
        itemCode.includes(trimmedValue) ||
        itemName.includes(trimmedValue) ||
        quantity.includes(trimmedValue) ||
        uom.includes(trimmedValue)
      );
    });
  }, []);

  // Scroll to selected cell horizontally
  const scrollToSelectedCell = useCallback(() => {
    if (horizontalScrollRef.current && selectedCol >= 0) {
      const container = horizontalScrollRef.current;
      const selectedCell = container.querySelector(`[data-cell-row="${selectedRow}"][data-cell-col="${selectedCol}"]`);
      
      if (selectedCell) {
        const containerRect = container.getBoundingClientRect();
        const cellRect = selectedCell.getBoundingClientRect();
        
        // Check if cell is outside visible area
        if (cellRect.left < containerRect.left) {
          // Cell is to the left of visible area
          container.scrollLeft -= (containerRect.left - cellRect.left + 10);
        } else if (cellRect.right > containerRect.right) {
          // Cell is to the right of visible area
          container.scrollLeft += (cellRect.right - containerRect.right + 10);
        }
      }
    }
  }, [selectedRow, selectedCol]);

  // Scroll to selected row vertically
  const scrollToSelectedRow = useCallback(() => {
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
          setSelectedCol(prev => {
            const newCol = Math.max(0, prev - 1);
            return newCol;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSelectedCol(prev => {
            const newCol = Math.min(columns.length - 1, prev + 1);
            return newCol;
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
          if (filteredOrders[selectedRow]) {
            handleOrderClick(filteredOrders[selectedRow]);
          }
          break;
        case 'Home':
          e.preventDefault();
          if (e.ctrlKey) {
            setSelectedRow(0);
            setSelectedCol(0);
          } else {
            setSelectedCol(0);
          }
          break;
        case 'End':
          e.preventDefault();
          if (e.ctrlKey) {
            setSelectedRow(filteredOrders.length - 1);
            setSelectedCol(columns.length - 1);
          } else {
            setSelectedCol(columns.length - 1);
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            // Shift+Tab - move left
            setSelectedCol(prev => {
              const newCol = Math.max(0, prev - 1);
              return newCol;
            });
          } else {
            // Tab - move right
            setSelectedCol(prev => {
              const newCol = Math.min(columns.length - 1, prev + 1);
              return newCol;
            });
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
  }, [filteredOrders, selectedRow, selectedCol, navigate, onBack, columns.length]);

  // Scroll to selected items when selection changes
  useEffect(() => {
    scrollToSelectedRow();
    // Use setTimeout to ensure DOM is updated with new selection
    setTimeout(scrollToSelectedCell, 10);
  }, [selectedRow, selectedCol, scrollToSelectedRow, scrollToSelectedCell]);

  // Reset selection when filter orders change
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

        setAllOrders(ordersData);
        setFilteredOrders(ordersData);
        setHasFetched(true);
        console.log('Pending orders:', ordersData);
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
        return `₹ ${Number(order.total_amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`;
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
          <div className="text-gray-500">Loading item-wise reports...</div>
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
      <div
        className="overflow-auto h-[79vh] text-xs font-amasis"
        ref={listContainerRef}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {filteredOrders.length > 0 ? (
          <div className="min-w-full">
            {filteredOrders.map((order, rowIndex) => {
              const isRowSelected = rowIndex === selectedRow;
              return (
                <div
                  key={order.id || order.order_no || rowIndex}
                  data-order-item
                  className={`flex items-center border-b border-gray-200 transition cursor-pointer ${
                    isRowSelected
                      ? 'bg-yellow-100 border-yellow-300'
                      : rowIndex % 2 === 0
                      ? 'bg-white hover:bg-blue-50'
                      : 'bg-gray-100 hover:bg-blue-50'
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex items-center w-full min-w-full py-1">
                    {columns.map((column, colIndex) => {
                      const isCellSelected = isRowSelected && colIndex === selectedCol;
                      return (
                        <div
                          key={column.key}
                          data-cell-row={rowIndex}
                          data-cell-col={colIndex}
                          className={`flex-shrink-0 px-1 border-r border-gray-200 last:border-r-0 ${
                            isCellSelected ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                          }`}
                          style={{ width: column.width }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(rowIndex, colIndex);
                          }}
                        >
                          <div className={`whitespace-normal break-words ${
                            column.key === 'amount' ? 'text-right' : 
                            column.key === 'customer_name' || column.key === 'executive' || 
                            column.key === 'item_name' ||column.key === 'voucher_type' || column.key === 'item_code' || column.key === 'delivery_mode' || column.key === 'status' ? 'text-left' : 'text-center'
                          }`}>
                            {getCellValue(order, column.key)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 min-w-full">
            {searchTerm ? 'No orders match your search.' : 'No item-wise reports found.'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="w-full h-[100vh] flex">
        <div className="w-full overflow-hidden">
          <Title title="Item Wise Report" nav={onBack} />

          {/* Header Row: Title + Date Range + Search */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-gray-300 bg-white px-4 py-2">
            <div className="text-sm font-amasis text-gray-700 whitespace-nowrap">
              List of All Item-wise Sales Reports
            </div>

            <div className="flex-1 min-w-[300px] max-w-[500px]">
              <input
                type="text"
                placeholder="Search by order no, customer, item, executive, amount, or date..."
                value={searchTerm}
                ref={searchInputRef}
                onChange={handleSearchChange}
                className="w-full h-8 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-amasis"
                autoComplete="off"
              />
            </div>

            <div className="text-sm font-amasis text-gray-600 whitespace-nowrap">
              1-Apr-25 to 31-May-26
            </div>
          </div>

          {/* Main Container with Horizontal Scroll */}
          <div 
            className="w-full overflow-x-auto"
            ref={horizontalScrollRef}
          >
            <div className="min-w-[1810px]">
              
              {/* Column Headers - Single Row */}
              <div className="flex items-center border-b border-gray-300 bg-gray-100 text-[14px] font-amasis font-medium text-gray-700">
                {columns.map((column, colIndex) => (
                  <div
                    key={column.key}
                    className={`flex-shrink-0 px-1 border-r border-gray-300 last:border-r-0 ${
                      selectedCol === colIndex && selectedRow === -1 ? 'bg-blue-200 ring-2 ring-blue-500' : ''
                    }`}
                    style={{ width: column.width }}
                  >
                    <div className={column.key === 'amount' ? 'text-right' : 'text-center'}>
                      {column.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Orders List */}
              {renderContent()}

              {/* Results Summary */}
              {filteredOrders.length > 0 && (
                <div className="border-t border-gray-300 bg-gray-50 py-1 px-4 font-amasis">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <div>
                      Showing {filteredOrders.length} of {allOrders.length} item-wise reports
                      {searchTerm && ` for "${searchTerm}"`}
                    </div>
                    <div className="font-medium text-gray-800 pr-2">
                      Total: ₹{' '}
                      {totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewItemFetchReport;