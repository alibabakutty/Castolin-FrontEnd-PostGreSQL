import { useEffect, useState } from "react"
import { useAuth } from "../../context/authConstants";
import { useLocation, useNavigate } from "react-router-dom";


export const useOrderFormHook = (onBack) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerName, setCustomerName] = useState(null);
    const [orderNumber, setOrderNumber] = useState('');
    const [orderData, setOrderData] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showRowValueRows, setShowRowValueRows] = useState(true);
    const [isLoadingOrderNumber, setIsLoadingOrderNumber] = useState(true);
    const [orderNumberError, setOrderNumberError] = useState(null);
    const [formResetKey, setFormResetKey] = useState(0);

    const { distributorUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isDistributorRoute = location.pathname.includes('/distributor');
    const isDirectRoute = location.pathname.includes('/corporate');

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                if (onBack) {
                    onBack();
                } else {
                    navigate(-1);
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack, navigate]);

    // Focus management
    useEffect(() => {
        const timer = setTimeout(() => {
            console.log('Focus management running for route:', location.pathname);

            if (isDistributorRoute) {
                // For distributor route: always focus editing row
                if (editingRowSelectRef.current) {
                    editingRowSelectRef.current.focus();
                    console.log('Focused editing row for distributor');
                }
            } else if (isDirectRoute) {
                // For corporate route
                if (!customerName) {
                    // No customer selected: Focus customer select
                    if (customerSelectRef.current) {
                        customerSelectRef.current.focus();
                        console.log('Focused customer select (no customer yet)');
                    }
                } else {
                    // Customer is selected: Focus editing row
                    if (editingRowSelectRef.current) {
                        editingRowSelectRef.current.focus();
                        console.log('Focused editing row (customer selected)');
                    }
                }
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [isDistributorRoute, isDirectRoute, customerName, location.pathname]);

    // Initialize order number
  useEffect(() => {
    const initializeOrderNumber = async () => {
      setIsLoadingOrderNumber(true);
      setOrderNumberError(null);
      
      try {
        const result = await fetchOrderNumberFromServer();
        if (result.success) {
          setOrderNumber(result.orderNumber);
        } else {
          setOrderNumber(result.orderNumber);
          setOrderNumberError('Using fallback order number due to server error');
          console.warn('Server order number fetch failed:', result.error);
        }
      } catch (error) {
        console.error('Failed to initialize order number:', error);
      } finally {
        setIsLoadingOrderNumber(false);
      }
    };

    initializeOrderNumber();
  }, [date]); // Re-fetch when date changes

  // Function to refresh order number
  const refreshOrderNumber = async () => {
    setIsLoadingOrderNumber(true);
    setOrderNumberError(null);
    
    try {
      const result = await fetchOrderNumberFromServer();
      if (result.success) {
        setOrderNumber(result.orderNumber);
      } else {
        setOrderNumber(result.orderNumber);
        setOrderNumberError('Using fallback order number due to server error');
      }
    } catch (error) {
      console.error('Failed to refresh order number:', error);
    } finally {
      setIsLoadingOrderNumber(false);
    }
  };

    return { date, setDate, customerName, setCustomerName, orderNumber, setOrderNumber, orderData, setOrderData, remarks, setRemarks, selectedCustomer, setSelectedCustomer, showRowValueRows, setShowRowValueRows, distributorUser, isDistributorRoute, isDirectRoute, location, isLoadingOrderNumber, refreshOrderNumber, formResetKey, setFormResetKey };
}