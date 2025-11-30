// import { useEffect, useRef, useState } from 'react';
// import { AiFillExclamationCircle, AiOutlineArrowLeft } from 'react-icons/ai';
// import Select from 'react-select';
// import { toast } from 'react-toastify';
// import api from '../../services/api';
// import { useNavigate } from 'react-router-dom';

// const CorporateOrder = ({ onBack }) => {
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [item, setItem] = useState(null);
//   const [customerName, setCustomerName] = useState(null);
//   const [executiveName, setExecutiveName] = useState(null);
//   const [quantity, setQuantity] = useState('');
//   const [orderNumber, setOrderNumber] = useState('');
//   const [selectedOrderNumber, setSelectedOrderNumber] = useState(null);
//   const itemSelectRef = useRef(null);
//   const customerSelectRef = useRef(null);
//   const executiveSelectRef = useRef(null);
//   const quantityInputRef = useRef(null);
//   const buttonRef = useRef(null);
//   const orderSelectRef = useRef(null);
//   const [windowWidth, setWindowWidth] = useState(window.innerWidth);
//   const [database, setDatabase] = useState([]);
//   const [itemOptions, setItemOptions] = useState([]); // Separate state for items
//   const [customerOptions, setCustomerOptions] = useState([]); // Separate state for customers
//   const [executiveOptions, setExecutiveOptions] = useState([]);
//   const [orderOptions, setOrderOptions] = useState([]);
//   const [orderData, setOrderData] = useState([]);
//   const [selectedOrderData, setSelectedOrderData] = useState(null);
//   const [defaultDiscount, setDefaultDiscount] = useState(10);
//   const [defaultSplDiscount, setDefaultSplDiscount] = useState(2.5);
//   const [status, setStatus] = useState('pending');
//   const isSubmittingRef = useRef(false);
//   const navigate = useNavigate();

//   const [totals, setTotals] = useState({
//     qty: 0,
//     amount: 0,
//     netAmt: 0,
//     grossAmt: 0,
//   });

//   const generateOrderNumber = () => {
//     const today = new Date();
//     const currentDate = today.toISOString().split('T')[0];

//     // Get last order number from localStorage
//     const lastOrder = localStorage.getItem('lastOrder');

//     if (lastOrder) {
//       const lastOrderData = JSON.parse(lastOrder);
//       const lastOrderDate = lastOrderData.date;
//       const lastOrderNumber = lastOrderData.orderNumber;

//       // If same day, increment the sequence
//       if (lastOrderDate === currentDate) {
//         // Extract the sequence number (last part after last hyphen)
//         const parts = lastOrderNumber.split('-');
//         const lastSequence = parseInt(parts[parts.length - 1]);
//         const newSequence = (lastSequence + 1).toString().padStart(4, '0');

//         const day = today.getDate().toString().padStart(2, '0');
//         const month = (today.getMonth() + 1).toString().padStart(2, '0');
//         const year = today.getFullYear().toString().slice(-2);

//         return `SQ-${day}-${month}-${year}-${newSequence}`;
//       }
//     }

//     // If new day or no previous order, start from 0001
//     const day = today.getDate().toString().padStart(2, '0');
//     const month = (today.getMonth() + 1).toString().padStart(2, '0');
//     const year = today.getFullYear().toString().slice(-2);

//     return `SQ-${day}-${month}-${year}-0001`;
//   };

//   // Function to save order number to localstorage
//   const saveOrderNumber = orderNum => {
//     const today = new Date().toISOString().split('T')[0];
//     localStorage.setItem(
//       'lastOrder',
//       JSON.stringify({
//         date: today,
//         orderNumber: orderNum,
//       }),
//     );
//   };

//   // update order number when date changes
//   useEffect(() => {
//     if(!selectedOrderData){
//       const newOrderNumber = generateOrderNumber();
//       setOrderNumber(newOrderNumber);
//     }
//   }, [date, selectedOrderData]);

//   useEffect(() => {
//     const handleResize = () => setWindowWidth(window.innerWidth);
//     window.addEventListener('resize', handleResize);

//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     const fetchStockItems = async () => {
//       try {
//         const response = await api.get('/stock_item');
//         setItemOptions(response.data);
//       } catch (error) {
//         console.error('Error fetching stock items:', error);
//       }
//     };
//     fetchStockItems();
//   }, []);

//   useEffect(() => {
//     const fetchCustomers = async () => {
//       try {
//         const response = await api.get('/customer');
//         setCustomerOptions(response.data);
//       } catch (error) {
//         console.error('Error fetching customers:', error);
//       }
//     };
//     fetchCustomers();
//   }, []);

//   useEffect(() => {
//     const fetchExecutives = async () => {
//       try {
//         const response = await api.get('/users');

//         // Convert all executive usernames to uppercase
//         const formattedExecutives = response.data.map(exec => ({
//           ...exec,
//           username: exec.username ? exec.username.toUpperCase() : '',
//         }));

//         setExecutiveOptions(formattedExecutives);
//         console.log(formattedExecutives);
//       } catch (error) {
//         console.error('Error fetching executives:', error);
//       }
//     };
//     fetchExecutives();
//   }, []);

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         const response = await api.get('/orders');
//         setOrderOptions(response.data);
//       } catch (error) {
//         console.error('Error fetching orders', error);
//       }
//     };
//     fetchOrders();
//   }, []);

//   const fetchOrderDetails = async orderNumber => {
//     try {
//       const response = await api.get(`orders-by-number/${orderNumber}`);
//       const orderDetails = response.data;

//       if (orderDetails && orderDetails.length > 0) {
//         setSelectedOrderData(orderDetails);
//         // populate customer info
//         const firstItem = orderDetails[0];
//         // find customer in customerOptions
//         const customer = customerOptions.find(
//           cust => cust.customer_code === firstItem.customer_code,
//         );
//         if (customer) {
//           setCustomerName(customer);
//         }
//         // populate executive info
//         const executive = executiveOptions.find(
//           exec => exec.username === firstItem.executive.toUpperCase(),
//         );
//         if (executive) {
//           setExecutiveName(executive);
//         }
//         // populate date
//         if (firstItem.order_date) {
//           const orderDate = new Date(firstItem.order_date).toISOString().split('T')[0];
//           setDate(orderDate);
//         }
//         // populate order data table
//         const formattedOrderData = orderDetails.map(item => ({
//           id: item.id,
//           itemCode: item.item_code,
//           itemName: item.item_name,
//           hsn: item.hsn,
//           gst: item.gst,
//           itemQty: Number(item.quantity),
//           uom: item.uom,
//           rate: Number(item.rate),
//           amount: Number(item.amount),
//           disc: Number(item.disc_percentage),
//           discAmt: Number(item.disc_amount),
//           splDisc: Number(item.spl_disc_percentage),
//           splDiscAmt: Number(item.spl_disc_amount),
//           netRate: Number(item.net_rate),
//           grossAmount: Number(item.gross_amount),
//         }));
//         setOrderData(formattedOrderData);
//         toast.success('Order details loaded successfully!.');
//       }
//     } catch (error) {
//       console.error('Error fetching order details:', error);
//     }
//   };

//   const handleItemSelect = selected => {
//     setItem(selected);
//     quantityInputRef.current.focus();
//   };

//   const handleCustomerSelect = selected => {
//     setCustomerName(selected);
//     // Optionally focus on item select after customer is selected
//     itemSelectRef.current.focus();
//   };

//   const handleExecutiveSelect = selected => {
//     setExecutiveName(selected);
//   };

//   // Handle order number selection
//   const handleOrderNumberSelect = async selected => {
//     if (selected) {
//       setSelectedOrderNumber(selected);
//       setOrderNumber(selected.value);
//       // Fetch and populate order details
//       await fetchOrderDetails(selected.value);
//     } else {
//       setSelectedOrderData(null);
//       // If cleared, generate new order number
//       const newOrderNumber = generateOrderNumber();
//       setOrderNumber(newOrderNumber);
//       setSelectedOrderNumber({ value: newOrderNumber, label: newOrderNumber });
//     }
//   };

//   const handleKeyDown = e => {
//     if (quantityInputRef.current.value !== '' && e.key === 'Enter') {
//       e.preventDefault();
//       buttonRef.current.focus();
//     }
//   };

//   const handleClick = () => {
//     if (!item || !quantity) return;

//     const existingIndex = orderData.findIndex(pro => pro.itemCode === item.item_code);

//     // const disc = 10;
//     // const splDisc = 2.5;

//     if (existingIndex !== -1) {
//       const updatedRows = [...orderData];

//       const qty = Number(updatedRows[existingIndex].itemQty) + Number(quantity);
//       const rate = Number(updatedRows[existingIndex].rate);
//       const amt = qty * rate;

//       const discAmt = (amt * disc) / 100;
//       const splDiscAmt = ((amt - discAmt) * splDisc) / 100;
//       const totalDisc = discAmt + splDiscAmt;

//       updatedRows[existingIndex].itemQty = qty;
//       updatedRows[existingIndex].amount = amt;
//       updatedRows[existingIndex].disc = defaultDiscount;
//       updatedRows[existingIndex].discAmt = discAmt;
//       updatedRows[existingIndex].splDisc = defaultSplDiscount;
//       updatedRows[existingIndex].splDiscAmt = splDiscAmt;
//       updatedRows[existingIndex].netRate = (amt - totalDisc) / qty;
//       updatedRows[existingIndex].grossAmount = amt - totalDisc;

//       setOrderData(updatedRows);
//       toast.warning('Entered Product Already There!.Added With Previous Quantity!.');
//     } else {
//       const qty = Number(quantity);
//       const rate = Number(item.rate);
//       const gross = qty * rate;

//       // Discount calculations
//       const discAmt = (gross * defaultDiscount) / 100;
//       const splDiscAmt = ((gross - discAmt) * defaultSplDiscount) / 100;
//       const totalDisc = discAmt + splDiscAmt;

//       const newRow = {
//         itemCode: item.item_code,
//         itemName: item.stock_item_name,
//         hsn: item.hsn,
//         gst: item.gst,
//         itemQty: qty,
//         uom: item.uom || "No's",
//         rate: rate,
//         amount: gross,
//         disc: defaultDiscount,
//         discAmt,
//         splDisc: defaultSplDiscount,
//         splDiscAmt,
//         netRate: (gross - totalDisc) / qty,
//         grossAmount: gross - totalDisc,
//       };
//       setOrderData(prev => [...prev, newRow]);
//       toast.info('Product added Successfully!.');
//     }

//     setItem('');
//     setQuantity('');
//     itemSelectRef.current.focus();
//   };

//   // Function to update existing orders via PUT endpoint
// const updateOrder = async (actualOrderNumber = null) => {
//   if (isSubmittingRef.current) return;
//   isSubmittingRef.current = true;

//   try {
//     // Use the provided order number or fall back to the current one
//     const orderNoToUse = actualOrderNumber || orderNumber;
    
//     // Validate orderData has IDs
//     if (!orderData || !orderData.length) {
//       toast.error('No order data available for update');
//       return;
//     }

//     // Prepare updates for existing orders with proper validation
//     const updates = orderData.map(item => {
//       // Check if item has required ID
//       if (!item.id) {
//         console.error('Order item missing ID:', item);
//         throw new Error(`Order item missing required ID field`);
//       }

//       return {
//         id: item.id, // REQUIRED - must come from existing order data
//         status: status || item.status, // Ensure status has a value
//         disc_percentage: Number(item.disc) || 0,
//         disc_amount: Number(item.discAmt) || 0,
//         spl_disc_percentage: Number(item.splDisc) || 0,
//         spl_disc_amount: Number(item.splDiscAmt) || 0,
//         net_rate: Number(item.netRate) || 0,
//         gross_amount: Number(item.grossAmount) || 0,
//         total_quantity: totals.qty || 0.00,
//         total_amount: totals.amount || 0.00
//       };
//     });

//     // Filter out any invalid items
//     const validUpdates = updates.filter(update => update.id);

//     if (validUpdates.length === 0) {
//       toast.error('No valid orders to update');
//       return;
//     }

//     console.log('Sending updates for order:', orderNoToUse, validUpdates);

//     // Use the correct order number in the API call
//     const response = await api.put(`/orders-by-number/${orderNoToUse}`, validUpdates);

//     console.log('Update successful:', response.data);

//     return response.data;
//   } catch (error) {
//     console.error('Error updating order:', error);
    
//     // More specific error messages
//     if (error.response?.data) {
//       const serverError = error.response.data;
//       if (serverError.details) {
//         toast.error(`Update failed: ${serverError.details.join(', ')}`);
//       } else {
//         toast.error(`Update failed: ${serverError.error || 'Server error'}`);
//       }
//     } else {
//       toast.error('Error updating order. Please try again.');
//     }
//     throw error;
//   } finally {
//     isSubmittingRef.current = false;
//   }
// };
 
//   const postOrder = async () => {
//     if (isSubmittingRef.current) return; // Prevent multiple submissions

//     isSubmittingRef.current = true;
//     try {
//       const result = await api.post('/orders', database);
//       console.log(result);

//       toast.success('Order Placed Successfully with approval!.');
//     } catch (error) {
//       console.error('Error placing order:', error);
//       toast.error('Error placing order. Please try again.');
//     }
//   };

//   // Function to handle discount percentage change
//   const handleDiscChange = (index, value) => {
//     const updatedRows = [...orderData];
//     const row = updatedRows[index];

//     const disc = Number(value) || 0;
//     const gross = row.amount;

//     // Recalculate discount amounts
//     const discAmt = (gross * disc) / 100;
//     const splDiscAmt = ((gross - discAmt) * row.splDisc) / 100;
//     const totalDisc = discAmt + splDiscAmt;

//     updatedRows[index].disc = disc;
//     updatedRows[index].discAmt = discAmt;
//     updatedRows[index].splDiscAmt = splDiscAmt;
//     updatedRows[index].netRate = (gross - totalDisc) / row.itemQty;
//     updatedRows[index].grossAmount = gross - totalDisc;

//     setOrderData(updatedRows);
//   };

//   // Function to handle special discount percentage change
//   const handleSplDiscChange = (index, value) => {
//     const updatedRows = [...orderData];
//     const row = updatedRows[index];

//     const splDisc = Number(value) || 0;
//     const gross = row.amount;
//     const discAmt = (gross * row.disc) / 100;

//     // Recalculate special discount amounts
//     const splDiscAmt = ((gross - discAmt) * splDisc) / 100;
//     const totalDisc = discAmt + splDiscAmt;

//     updatedRows[index].splDisc = splDisc;
//     updatedRows[index].splDiscAmt = splDiscAmt;
//     updatedRows[index].netRate = (gross - totalDisc) / row.itemQty;
//     updatedRows[index].grossAmount = gross - totalDisc;

//     setOrderData(updatedRows);
//   };

//   const handleSubmit = e => {
//     e.preventDefault();

//     if (!customerName) {
//       toast.error('Please select a customer!');
//       customerSelectRef.current.focus();
//       return;
//     }

//     if (!executiveName) {
//       toast.error('Please select an executive!');
//       executiveSelectRef.current.focus();
//       return;
//     }

//     if (orderData.length >= 1) {
//       const dbd = orderData.map(item => ({
//         voucher_type: 'Sales Order',
//         order_no: orderNumber,
//         date,
//         status: status,
//         executive: executiveName.username || '',
//         customer_code: customerName.customer_code || '',
//         customer_name: customerName.customer_name,
//         item_code: item.itemCode,
//         item_name: item.itemName,
//         hsn: item.hsn,
//         gst: Number(String(item.gst).replace('%', '').trim()),
//         quantity: item.itemQty,
//         uom: item.uom,
//         rate: item.rate,
//         amount: item.amount,
//         disc_percentage: item.disc || 0,
//         disc_amount: item.discAmt || 0,
//         spl_disc_percentage: item.splDisc || 0,
//         spl_disc_amount: item.splDiscAmt || 0,
//         net_rate: item.netRate,
//         gross_amount: item.grossAmount,
//         total_quantity: totals.qty,
//         total_amount: totals.amount
//       }));

//       setDatabase(prev => [...prev, ...dbd]);
//       console.log('Submitting order data:', dbd);

//       // 🔹 Immediately generate and update the next order number
//       const nextOrderNumber = generateOrderNumber();
//       saveOrderNumber(nextOrderNumber);
//       setOrderNumber(nextOrderNumber);

//       // Reset form fields after successful submission
//       resetFormFields();
//     } else {
//       toast.error('Please add at least one item to the order!');
//     }
//   };

//   // Add this function to reset all form fields
//   const resetFormFields = (isUpdate = false) => {
//     setCustomerName(null);
//     setExecutiveName(null);
//     setItem(null);
//     setQuantity('');
//     setStatus('pending');
//     setOrderData([]);
//     setDefaultDiscount(0);
//     setDefaultSplDiscount(0);

//   if (!isUpdate) {
//       // ✅ Optionally auto-generate new order number here too
//       const newOrderNumber = generateOrderNumber();
//       saveOrderNumber(newOrderNumber);
//       setOrderNumber(newOrderNumber);
//   }

//     // Reset Select components to their default state
//     if (customerSelectRef.current) {
//       customerSelectRef.current.select.clearValue();
//     }
//     if (executiveSelectRef.current) {
//       executiveSelectRef.current.select.clearValue();
//     }
//     if (itemSelectRef.current) {
//       itemSelectRef.current.select.clearValue();
//     }

//      // Clear selected order data when resetting
//     setSelectedOrderData(null);
//     setSelectedOrderNumber(null);

//     // Focus on customer select for next entry
//     setTimeout(() => {
//       customerSelectRef.current.focus();
//     }, 100);
//   };
//   console.log(database);

//   useEffect(() => {
//     if (database.length > 0) {
//       postOrder();
//     }
//   }, [database]);

//   useEffect(() => {
//     const totalQty = orderData.reduce((sum, row) => sum + Number(row.itemQty || 0), 0);
//     const totalAmt = orderData.reduce((sum, row) => sum + Number(row.amount || 0), 0);
//     const totalNetRate = orderData.reduce((sum, row) => sum + Number(row.netRate || 0), 0);
//     const totalGrossAmt = orderData.reduce((sum, row) => sum + Number(row.grossAmount || 0), 0);

//     setTotals({
//       qty: totalQty,
//       amount: totalAmt,
//       netAmt: totalNetRate,
//       grossAmt: totalGrossAmt,
//     });
//   }, [orderData]);

// // In your handleUpdate, always use the selected order's number
// const handleUpdate = async e => {
//   e.preventDefault();

//   if (!selectedOrderData) {
//     toast.error('No existing order selected for update');
//     return;
//   }

//   // Always use the selected order's number for updates
//   const orderNoToUse = selectedOrderData.order_no;

//   try {
//     await updateOrder(orderNoToUse);
//     // await fetchOrderDetails(orderNoToUse);
//     toast.success('Order updated successfully!');
//     // reset form fields
//     resetFormFields(true);
//     setSelectedOrderData(null);
//     setOrderData([]);
//     navigate(-1);
//   } catch (error) {
//     console.error('Update failed:', error);
//   }
// };

//   const numberFormat = num => {
//     return Number(num || 0).toLocaleString('en-IN', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   const formatCurrency = value => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 2,
//     })
//       .format(value || 0)
//       .replace(/^₹/, '₹ ');
//   };

//   const customStyles = {
//     control: (base, state) => {
//       let customWidth = '500px';
//       if (windowWidth <= 768) {
//         customWidth = '100%';
//       } else if (windowWidth <= 1024) {
//         customWidth = '200px';
//       } else if (windowWidth <= 1280) {
//         customWidth = '250px';
//       } else if (windowWidth <= 1366) {
//         customWidth = '300px';
//       }
//       return {
//         ...base,
//         minHeight: '26px',
//         height: '26px',
//         padding: '0 1px',
//         width: customWidth,
//         backgroundColor: '#E9EFEC',
//         borderColor: '#932F67',
//         boxShadow: 'none',
//       };
//     },
//     valueContainer: base => ({
//       ...base,
//       padding: '0px 4px',
//       height: '20px',
//     }),
//     menu: base => {
//       let customWidth = '550px';
//       if (windowWidth <= 768) {
//         customWidth = '100%';
//       } else if (windowWidth <= 1024) {
//         customWidth = '350px';
//       } else if (windowWidth <= 1366) {
//         customWidth = '400px';
//       }
//       return {
//         ...base,
//         width: customWidth,
//         overflowY: 'auto',
//         zIndex: 9999,
//         border: '1px solid #ddd',
//       };
//     },
//     option: (base, state) => ({
//       ...base,
//       padding: '8px 12px',
//       backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
//       color: 'black',
//       cursor: 'pointer',
//     }),
//     menuList: base => ({
//       ...base,
//       padding: 0,
//       minHeight: '55vh',
//     }),
//     input: base => ({
//       ...base,
//       margin: 0,
//       padding: 0,
//     }),
//   };

//   return (
//     <div className="font-poppins p-3 bg-[#E9EFEC] border-2 h-screen">
//       <div className="py-2 px-1 grid grid-cols-7 gap-1 items-center border transition-all">
//         {/* Back Arrow */}
//         <button
//           onClick={onBack}
//           className="p-1 rounded hover:bg-gray-200 transition justify-self-start"
//         >
//           <AiOutlineArrowLeft className="text-[#932F67]" size={22} />
//         </button>

//         {/* Voucher Type */}
//         <div className="relative">
//           <input
//             type="text"
//             required
//             readOnly
//             value={'Sales Order'}
//             className="outline-none border rounded-[5px] focus:border-[#932F67] p-[3.5px] text-sm bg-transparent font-semibold w-full"
//           />
//           <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] leading-2 rounded">
//             Voucher Type *
//           </span>
//         </div>

//         {/* Order No */}
//         <div className="relative">
//           <Select
//             ref={orderSelectRef}
//             className="text-sm peer"
//             value={selectedOrderNumber}
//             options={orderOptions}
//             onChange={handleOrderNumberSelect}
//             onFocus={() => {
//               // Refresh order options when focused to get latest orders
//               const fetchOrders = async () => {
//                 try {
//                   const response = await api.get('/orders');
//                   const orders = response.data;

//                   const pendingOrders = orders.filter(order => order.status === 'pending');
//                   const uniqueOrderNumbers = [
//                     ...new Set(pendingOrders.map(order => order.order_no)),
//                   ];

//                   const orderOptionsFormatted = uniqueOrderNumbers.map(orderNo => ({
//                     value: orderNo,
//                     label: orderNo,
//                   }));

//                   setOrderOptions(orderOptionsFormatted);
//                 } catch (error) {
//                   console.error('Error fetching orders', error);
//                 }
//               };
//               fetchOrders();
//             }}
//             placeholder={orderNumber}
//             // isClearable
//             components={{
//               DropdownIndicator: () => null,
//               IndicatorSeparator: () => null,
//             }}
//             styles={{
//               ...customStyles,
//               control: base => ({
//                 ...base,
//                 minHeight: '28px',
//                 height: '28px',
//                 lineHeight: '1',
//                 padding: '0 1px',
//                 width: '100%',
//                 backgroundColor: '#E9EFEC',
//                 borderColor: '#932F67',
//                 boxShadow: 'none',
//                 fontWeight: 'bold',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//               }),
//               singleValue: base => ({
//                 ...base,
//                 fontWeight: 'bold',
//                 lineHeight: '1',
//                 margin: '0',
//                 padding: '0',
//                 display: 'flex',
//                 alignItems: 'center',
//               }),
//               input: base => ({
//                 ...base,
//                 margin: 0,
//                 padding: 0,
//                 display: 'flex',
//                 alignItems: 'center',
//               }),
//               placeholder: base => ({
//                 ...base,
//                 margin: 0,
//                 padding: 0,
//                 display: 'flex',
//                 alignItems: 'center',
//                 color: '#000',
//               }),
//               option: (base, state) => ({
//                 ...base,
//                 fontWeight: '600',
//                 padding: '4px 8px',
//                 lineHeight: '1.2',
//                 backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
//                 color: '#555',
//                 cursor: 'pointer',
//               }),
//               menu: base => ({
//                 ...base,
//                 width: '100%',
//                 minWidth: '120px',
//                 left: '0',
//                 right: 'auto',
//                 position: 'absolute',
//                 zIndex: 9999,
//               }),
//               menuList: base => ({
//                 ...base,
//                 padding: 0,
//                 width: '100%',
//               }),
//             }}
//             menuPortalTarget={document.body}
//           />
//           <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
//             Order No *
//           </span>
//         </div>

//         {/* Customer Code */}
//         <div className="relative w-28">
//           <div className="border p-[3.5px] rounded-[5px] border-[#932F67] text-sm font-semibold text-center">
//             {customerName ? customerName.customer_code : 'CUS-001'}
//           </div>
//           <span className="absolute left-2.5 top-[10px] transition-all text-[12px] -translate-y-[15px] text-[#932F67] bg-[#E9EFEC] px-1 rounded font-semibold leading-2">
//             Customer Code *
//           </span>
//         </div>

//         {/* Customer Name - Updated with suggestions */}
//         <div className="relative w-40 -ml-[73px]">
//           <Select
//             ref={customerSelectRef}
//             className="text-sm peer"
//             value={customerName}
//             options={customerOptions}
//             getOptionLabel={e => `${e.customer_name}`}
//             getOptionValue={e => e.customer_code}
//             onChange={handleCustomerSelect}
//             placeholder="Select customer..."
//             components={{
//               DropdownIndicator: () => null,
//               IndicatorSeparator: () => null,
//             }}
//             styles={{
//               ...customStyles,
//               control: base => ({
//                 ...base,
//                 minHeight: '28px',
//                 height: '28px',
//                 lineHeight: '1',
//                 padding: '0 1px',
//                 width: '172%', // Takes full width of container
//                 backgroundColor: '#E9EFEC',
//                 borderColor: '#932F67',
//                 boxShadow: 'none',
//                 fontWeight: 'bold',
//               }),
//               singleValue: base => ({
//                 ...base,
//                 fontWeight: 'bold',
//                 lineHeight: '1',
//               }),
//               option: (base, state) => ({
//                 ...base,
//                 fontWeight: '600',
//                 padding: '4px 8px',
//                 lineHeight: '1.2',
//                 backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
//                 color: '#555',
//                 cursor: 'pointer',
//               }),
//               menu: base => ({
//                 ...base,
//                 width: '130%', // 👈 Explicit pixel width
//                 minWidth: '120px',
//                 left: '0', // Align left with input
//                 right: 'auto',
//                 position: 'absolute',
//                 zIndex: 9999,
//               }),
//               menuList: base => ({
//                 ...base,
//                 padding: 0,
//                 width: '100%',
//               }),
//             }}
//             menuPortalTarget={document.body}
//           />
//           <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
//             Name *
//           </span>
//         </div>

//         {/* Order Date */}
//         <div className="relative ml-5">
//           <input
//             type="date"
//             readOnly
//             required
//             defaultValue={date}
//             onChange={e => setDate(e.target.value)}
//             className="peer w-full border border-[#932F67] rounded p-[3.5px] focus:outline-none focus:border-[#932F67] text-sm font-semibold"
//           />
//           <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
//             Order Date *
//           </span>
//         </div>
//       </div>

//       {/* Body Part */}
//       <div className="mt-1 border h-[87vh]">
//         <div className="flex p-1 h-16 items-center">
//           <div className="flex items-center">
//             <label htmlFor="" className="text-sm font-semibold leading-3 px-1">
//               Item Code & Name * :
//             </label>
//             <Select
//               ref={itemSelectRef}
//               className="text-sm peer"
//               value={item}
//               options={itemOptions}
//               getOptionLabel={e => `${e.item_code} - ${e.stock_item_name}`}
//               getOptionValue={e => e.item_code}
//               onChange={handleItemSelect}
//               placeholder="Select item..."
//               components={{
//                 DropdownIndicator: () => null,
//                 IndicatorSeparator: () => null,
//               }}
//               styles={{
//                 control: base => ({
//                   ...base,
//                   minHeight: '30px',
//                   height: '30px',
//                   lineHeight: '1',
//                   padding: '0 1px',
//                   width: '400px',
//                   backgroundColor: '#E9EFEC',
//                   borderColor: '#932F67',
//                   boxShadow: 'none',
//                   fontWeight: 'bold',
//                 }),
//                 singleValue: base => ({
//                   ...base,
//                   fontWeight: 'bold',
//                   lineHeight: '1',
//                 }),
//                 option: (base, state) => ({
//                   ...base,
//                   fontWeight: '600',
//                   padding: '4px 8px',
//                   lineHeight: '1.2',
//                   backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
//                   color: '#555',
//                   cursor: 'pointer',
//                 }),
//                 menu: base => ({
//                   ...base,
//                   width: '400px', // 👈 Explicit pixel width
//                   minWidth: '120px',
//                   left: '0', // Align left with input
//                   right: 'auto',
//                   position: 'absolute',
//                   zIndex: 9999,
//                 }),
//                 menuList: base => ({
//                   ...base,
//                   padding: 0,
//                   width: '100%',
//                 }),
//               }}
//               menuPortalTarget={document.body}
//             />
//           </div>
//           <div className="flex items-center">
//             <span className="px-4 text-sm font-semibold">Quantity * :</span>
//             <input
//               type="text"
//               name="qty"
//               ref={quantityInputRef}
//               value={quantity}
//               onChange={e => setQuantity(e.target.value)}
//               onKeyDown={handleKeyDown}
//               className="py-0.5 border lg:w-24 sm:w-24 md:w-24 outline-none text-sm rounded px-1 border-[#932F67]"
//               autoComplete="off"
//             />
//           </div>
//           <div>
//             <input
//               type="button"
//               ref={buttonRef}
//               value={'Add'}
//               onClick={handleClick}
//               className="bg-[#693382] text-white px-4 rounded-[6px] py-0.5 outline-none"
//             />
//           </div>
//           {/* Executive Name */}
//           <div className="relative w-40 ml-2">
//             <Select
//               ref={executiveSelectRef}
//               className="text-sm peer"
//               value={executiveName}
//               options={executiveOptions}
//               getOptionLabel={e => `${e.username}`}
//               getOptionValue={e => e.username}
//               onChange={handleExecutiveSelect}
//               placeholder="Select executive..."
//               components={{
//                 DropdownIndicator: () => null,
//                 IndicatorSeparator: () => null,
//               }}
//               styles={{
//                 control: base => ({
//                   ...base,
//                   minHeight: '30px',
//                   height: '30px',
//                   lineHeight: '1',
//                   padding: '0 1px',
//                   width: '172%',
//                   backgroundColor: '#E9EFEC',
//                   borderColor: '#932F67',
//                   boxShadow: 'none',
//                   fontWeight: 'bold',
//                 }),
//                 singleValue: base => ({
//                   ...base,
//                   fontWeight: 'bold',
//                   lineHeight: '1',
//                 }),
//                 option: (base, state) => ({
//                   ...base,
//                   fontWeight: '600',
//                   padding: '4px 8px',
//                   lineHeight: '1.2',
//                   backgroundColor: state.isFocused ? '#f0f0f0' : 'white',
//                   color: '#555',
//                   cursor: 'pointer',
//                 }),
//                 menu: base => ({
//                   ...base,
//                   width: '250px', // 👈 Explicit pixel width
//                   minWidth: '120px',
//                   left: '0', // Align left with input
//                   right: 'auto',
//                   position: 'absolute',
//                   zIndex: 9999,
//                 }),
//                 menuList: base => ({
//                   ...base,
//                   padding: 0,
//                   width: '100%',
//                 }),
//               }}
//               menuPortalTarget={document.body}
//             />

//             <span className="absolute left-2.5 top-[12px] transition-all pointer-events-none -translate-y-[17px] text-[#932F67] px-1.5 font-semibold text-[12px] bg-[#E9EFEC] peer-valid:text-[#932F67] leading-2 rounded">
//               Executive Name *
//             </span>
//           </div>
//           <div className="flex w-44 justify-end ml-20">
//             {/* Show Update button when editing existing order, Save for new orders */}
//             {selectedOrderData ? (
//               <button type='button'
//                 onClick={handleUpdate}
//                 className="bg-[#28a745] text-white px-4 rounded-[6px] py-0.5 outline-none hover:bg-[#218838] transition-colors"
//               >
//                 Update
//               </button>
//             ) : (
//               <button type='button'
//                 onClick={handleSubmit}
//                 className="bg-[#693382] text-white px-4 rounded-[6px] py-0.5 outline-none hover:bg-[#5a2a6f] transition-colors"
//               >
//                 Save
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Table section - remains the same */}
//         <div className="h-[70vh]">
//           <table className="w-full">
//             <thead>
//               <tr className="bg-[#A2AADB] leading-3">
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 w-10 text-center">
//                   S.No
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 w-[100px]">
//                   Item Code
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 w-[350px] text-center">
//                   Product Name
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 text-center w-16">
//                   HSN
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-1 w-16 text-center">
//                   GST %
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 text-right w-8">
//                   Quantity
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 w-8">
//                   UOM
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 text-right w-24">
//                   Rate
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 text-right w-28">
//                   Amount
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 px-2 text-right w-20">
//                   Disc %
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 text-center w-20">
//                   Disc Amt
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 px-2 text-right w-28">
//                   Spl Disc %
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 px-2 text-right w-32">
//                   Spl Disc Amt
//                 </td>
//                 <td className="font-semibold text-sm border border-gray-300 py-0.5 px-2 text-right w-28">
//                   Net Amount
//                 </td>
//                 <td className="font-semibold border text-sm border-gray-300 py-0.5 px-2 text-right w-32">
//                   Gross Amount
//                 </td>
//               </tr>
//             </thead>
//             <tbody>
//               {orderData.length === 0 ? (
//                 <tr>
//                   <td colSpan={15} className="text-center border border-gray-300">
//                     <div className="flex items-center justify-center p-5">
//                       <AiFillExclamationCircle className="text-red-700 text-[28px] mx-1" />
//                       No Records Found...
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 orderData.map((item, index) => (
//                   <tr key={index} className="leading-12">
//                     <td className="border border-gray-400  text-center text-sm">{index + 1}</td>
//                     <td className="border border-gray-400  text-center text-sm">{item.itemCode}</td>
//                     <td className="border border-gray-400  px-2 text-sm">{item.itemName}</td>
//                     <td className="border border-gray-400  text-center text-sm">{item.hsn}</td>
//                     <td className="border border-gray-400  text-center text-sm">{item.gst}</td>
//                     <td className="border border-gray-400  px-2 text-right text-sm">
//                       {numberFormat(item.itemQty)}
//                     </td>
//                     <td className="border border-gray-400  text-center text-sm">{item.uom}</td>
//                     <td className="border border-gray-400  px-2 text-right text-sm">
//                       {formatCurrency(item.rate)}
//                     </td>
//                     <td className="border border-gray-400  px-2 text-right text-sm">
//                       {formatCurrency(item.amount)}
//                     </td>

//                     {/* Editable Discount % */}
//                     <td className="border border-gray-400 px-1 text-center">
//                       <div className='flex items-center justify-end gap-1'>
//                         <input
//                         type="number"
//                         min="0"
//                         max="100"
//                         step="0.1"
//                         value={item.disc}
//                         onChange={e => handleDiscChange(index, e.target.value)}
//                         className="w-full text-right outline-none border-none bg-transparent text-sm px-1"
//                         />
//                         <span className="text-xs">%</span>
//                       </div>
//                     </td>

//                     <td className="border border-gray-400 px-2 text-right text-sm w-">
//                       {formatCurrency(item.discAmt)}
//                     </td>

//                     {/* Editable Special Discount % */}
//                     <td className="border border-gray-400 px-1 text-center">
//                       <div className='flex items-center justify-end gap-1'>
//                         <input
//                         type="number"
//                         min="0"
//                         max="100"
//                         step="0.1"
//                         value={item.splDisc}
//                         onChange={e => handleSplDiscChange(index, e.target.value)}
//                         className="w-full text-right outline-none border-none bg-transparent text-sm px-1"
//                         />
//                         <span className="text-xs">%</span>
//                       </div>
//                     </td>

//                     <td className="border border-gray-400 px-2 text-right text-sm">
//                       {formatCurrency(item.splDiscAmt)}
//                     </td>
//                     <td className="border border-gray-400  px-2 text-right text-sm">
//                       {formatCurrency(item.netRate)}
//                     </td>
//                     <td className="border border-gray-400  px-4 text-right text-sm">
//                       {formatCurrency(item.grossAmount)}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="h-[7vh] flex justify-end border-t items-center">
//           <div className="w-2/4 px-0.5">
//             <div className="relative mt-1 flex gap-2">
//               <textarea
//                 name="remarks"
//                 id=""
//                 placeholder="Remarks"
//                 className="border border-[#932F67] resize-none md:w-[400px] outline-none rounded px-1  peer h-[26px]"
//               ></textarea>
//               <div>
//                 <label htmlFor="" className="text-sm font-semibold">
//                   Status:{' '}
//                 </label>
//                 <select
//                   name="status"
//                   id="status"
//                   value={status}
//                   onChange={e => setStatus(e.target.value)}
//                   disabled={false}
//                   className="outline-none appearance-none border border-[#932F67] px-1 text-sm rounded"
//                 >
//                   <option value="pending">Pending</option>
//                   <option value="approved">Approved</option>
//                   <option value="rejected">Rejected</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//           <div>
//             <p className="font-semibold pr-2">Total</p>
//           </div>
//           <div className="w-2/4 px-0.5 py-1">
//             <table className="w-full border-b">
//               <tfoot>
//                 <tr className="*:border-[#932F67]">
//                   <td className="text-right border w-24 px-1">{numberFormat(totals.qty)}</td>
//                   <td className="w-32 border"></td>

//                   <td className="text-right border w-28 px-1">{formatCurrency(totals.amount)}</td>

//                   <td className="text-right border w-24 px-1"></td>

//                   <td className="text-right border w-28 px-1">{formatCurrency(totals.grossAmt)}</td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CorporateOrder;
