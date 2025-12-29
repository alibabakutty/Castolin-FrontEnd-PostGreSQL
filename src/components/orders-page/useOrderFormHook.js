import { useCallback, useEffect, useState } from "react"
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
    const [originalOrderData, setOriginalOrderData] = useState([]);
    const [editingRow, setEditingRow] = useState({
        item: null,
        delivery_date: '',
        delivery_mode: '',
        quantity: '',
        rate: '',
        amount: '',
        disc: '',
        discAmt: 0,
        splDisc: '',
        splDiscAmt: 0,
        hsn: '',
        gst: '',
        sgst: '',
        cgst: '',
        igst: '',
    });
    const [voucherType, setVoucherType] = useState('Sales Order');
    // Add this state in NewOrder component
    const [dbTotals, setDbTotals] = useState(null);
    const [executiveName, setExecutiveName] = useState(null);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { distributorUser, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get user role properly - prioritize logged-in user over distributor user
    const getUserRole = () => {
        if (user?.role) {
            return user.role.toLowerCase();
        } else if (distributorUser?.role) {
            return distributorUser.role.toLowerCase();
        }
        return '';
    };
    
    const userRole = getUserRole();

    const isDistributorRoute = location.pathname.includes('/distributor');
    const isDirectRoute = location.pathname.includes('/corporate');
    const isCorporateReport = location.pathname.includes('/order-report-corporate');
    const isDistributorReport = location.pathname.includes('/order-report-distributor');
    const isApprovedReport = location.pathname.includes('/order-report-approved');
    const isReportRoute = isCorporateReport || isDistributorReport || isApprovedReport;
    const isViewOnlyReport = isCorporateReport || isDistributorReport;

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

    // Helper function to check if state is Tamil Nadu
      const isTamilNaduState = useCallback (() => {
    
        // Check user role - only apply for 'direct' and 'distributor' roles
        const role = userRole;
        
        // If user is admin, always return false
        if (role === 'admin') {
          console.log('Admin user detected - state-based GST disabled');
          return false;
        }
        
        // Only check state for 'direct' and 'distributor' roles
        if (role !== 'direct' && role !== 'distributor') {
          console.log(`User role ${role} - state-based GST disabled`);
          return false;
        }
        
        let customerState = '';

        const isDistributorRoute = location.pathname.includes('/distributor');
    
        if (isDistributorRoute) {
          customerState = distributorUser?.state || '';
          console.log('Distributor State:', customerState);
        } else {
          customerState = selectedCustomer?.state || '';
          console.log('Customer State:', customerState);
        }
    
        const normalizedState = customerState.toLowerCase().trim();
        return (
          normalizedState === 'tamil nadu' ||
          normalizedState === 'tn' ||
          normalizedState === 'tamilnadu'
        );
      }, [distributorUser, selectedCustomer, isDistributorRoute, userRole, location.pathname]);

    return { 
        // State variables
        date, setDate,
        customerName, setCustomerName,
        orderNumber, setOrderNumber,
        orderData, setOrderData,
        remarks, setRemarks,
        selectedCustomer, setSelectedCustomer,
        showRowValueRows, setShowRowValueRows,
        originalOrderData, setOriginalOrderData,
        editingRow, setEditingRow,
        voucherType, setVoucherType,
        executiveName, setExecutiveName,
        status, setStatus,
        loading, setLoading,
        isSubmitting, setIsSubmitting,
        formResetKey, setFormResetKey,
        
        // Computed values
        distributorUser,
        isDistributorRoute,
        isDirectRoute,
        isCorporateReport,
        isDistributorReport,
        isApprovedReport,
        isReportRoute,
        isViewOnlyReport,
        dbTotals,
        setDbTotals,
        
        // Navigation
        location,
        navigate,
        // User role
        userRole,
        isTamilNaduState,
    };
}