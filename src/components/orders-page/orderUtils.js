import api from "../../services/api";

// Client-side fallback (should rarely be used)
export const generateClientSideOrderNumber = () => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear().toString().slice(-2);
  
  // Generate a random suffix to prevent collisions
  const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
  return `SQ-${day}-${month}-${year}-${randomSuffix}`;
};

// Fetch order number from server (primary method)
export const fetchOrderNumberFromServer = async () => {
  try {
    const response = await api.get('/orders/next-order-number');
    return {
      orderNumber: response.data.orderNumber,
      success: true
    };
  } catch (error) {
    console.error('Error fetching order number from server:', error);
    
    // Fallback to client-side generation
    const fallbackOrderNumber = generateClientSideOrderNumber();
    return {
      orderNumber: fallbackOrderNumber,
      success: false,
      error: error.message
    };
  }
};

// Format Currency
export const formatCurrency = value => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value || 0).replace(/^₹/, '₹ ');
};

// Format date to DD-MM-YYYY
export const formatDateToDDMMYYYYSimple = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';

    const cleanedStr = dateStr.trim();

    if (/^\d{2}-\d{2}-\d{4}$/.test(cleanedStr)) {
        return cleanedStr;
    }

    const numbers = cleanedStr.match(/\d+/g);
    if (!numbers || numbers.length < 3) return cleanedStr;

    let day, month, year;

    if (numbers[2].length === 2) {
        const shortYear = parseInt(numbers[2]);
        year = shortYear < 50 ? 2000 + shortYear : 1900 + shortYear;
    } else if (numbers[2].length === 4) {
        year === numbers[2];
    } else {
        return cleanedStr;
    }

    if (parseInt(numbers[0]) <= 31 && parseInt(numbers[1]) <= 12) {
        day = numbers[0];
        month = numbers[1];
    } else if (parseInt(numbers[0]) <= 12 && parseInt(numbers[1]) <= 31) {
        day = numbers[1];
        month = numbers[0];
    } else {
        day = numbers[0];
        month = numbers[1];
    }

    day = day.padStart(2, '0');
    month = month.padStart(2, '0');

    return `${day}-${month}-${year}`;
};

// Validate future date
export const validateFutureDate = (dateStr) => {
  if (!dateStr) return false;
  const normalizedDate = formatDateToDDMMYYYYSimple(dateStr);
  if (!normalizedDate) return false;
  
  const parts = normalizedDate.split('-');
  if (parts.length !== 3) return false;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1;
  const year = parseInt(parts[2]);
  
  const inputDate = new Date(year, month, day);
  const today = new Date();

  const inputDateStart = new Date(
    inputDate.getFullYear(),
    inputDate.getMonth(),
    inputDate.getDate(),
  );
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return inputDateStart >= todayStart;
};

// Add this missing function for date conversion
export const convertToMySQLDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // If date is in DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    // If date is already in YYYY-MM-DD format
    return dateStr;
  } catch (error) {
    console.error('Date conversion error:', error);
    return null;
  }
};

export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  export const transformOrderData = (apiData) => {
      return apiData.map(item => ({
        id: item.id,
        item: {
          item_code: item.item_code,
          stock_item_name: item.item_name,
          hsn_code: item.hsn,
          gst: item.gst,
          uom: item.uom,
          rate: item.rate,
        },
        itemCode: item.item_code,
        itemName: item.item_name,
        hsn: item.hsn,
        gst: item.gst,
        sgst: item.sgst || 0,
        cgst: item.cgst || 0,
        igst: item.igst || 0,
        delivery_date: item.delivery_date || '',
        delivery_mode: item.delivery_mode || '',
        itemQty: item.quantity,
        uom: item.uom,
        rate: item.rate,
        amount: item.amount,
        disc: item.disc_percentage || 0,
        discAmt: item.disc_amount || 0,
        splDisc: item.spl_disc_percentage || 0,
        splDiscAmt: item.spl_disc_amount || 0,
        netRate: item.net_rate || item.rate,
        grossAmount: item.gross_amount || item.amount,
      }))
    };

  // Custom styles for table selects
  export const tableSelectStyles = {
    control: base => ({
      ...base,
      minHeight: '24px',
      height: '24px',
      lineHeight: '1',
      padding: '0 1px',
      width: '100%',
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#932F67',
      },
    }),
    menu: base => ({
      ...base,
      width: '445px',
      height: '68vh',
      fontSize: '12px',
      zIndex: 9999,
      position: 'absolute',
    }),
    menuList: base => ({
      ...base,
      maxHeight: '68vh',
      padding: 0,
    }),
    menuPortal: base => ({
      ...base,
      zIndex: 9999,
    }),
    option: base => ({
      ...base,
      padding: '3px 20px',
      fontSize: '11.5px',
      fontFamily: 'font-amasis',
      fontWeight: '600',
    }),
    valueContainer: base => ({
      ...base,
      padding: '0px 4px',
      height: '20px',
    }),
    input: base => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: '11.5px',
    }),
    singleValue: base => ({
      ...base,
      fontSize: '11.5px', // Add this for the selected value
      lineHeight: '1.2',
    }),
  };

  export const formatDate = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };