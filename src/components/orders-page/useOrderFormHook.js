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
    const [formResetKey, setFormResetKey] = useState(0);
    const { distributorUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isDistributorRoute = location.pathname.includes('/distributor');
    const isDirectRoute = location.pathname.includes('/corporate');

    // Escape key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onBack ? onBack() : navigate(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack, navigate]);

   // Generate order number (client-side)
  useEffect(() => {
    setOrderNumber(generateClientSideOrderNumber());
  }, [date]);

    return { date, setDate, customerName, setCustomerName, orderNumber, setOrderNumber, orderData, setOrderData, remarks, setRemarks, selectedCustomer, setSelectedCustomer, showRowValueRows, setShowRowValueRows, distributorUser, isDistributorRoute, isDirectRoute, location, formResetKey, setFormResetKey };
}