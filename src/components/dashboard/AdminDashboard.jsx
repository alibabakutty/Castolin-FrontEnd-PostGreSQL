import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from '../../auth/auth';
import CDAPage from '../CDAPage';
import { useAuth } from '../../context/ContextProvider';
import ViewFetchReport from '../reports-page/ViewFetchReport';
import ViewFetchOrder from '../orders-page/ViewFetchOrder';

const AdminDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedModule, setSelectedModule] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleLogout();
      }
    }
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [navigate]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Format time with seconds
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Handle module selection
  const handleModuleClick = (moduleType) => {
    setSelectedModule(moduleType);
    setCurrentPage('cda-page');
  };

  // Show only CorporateOrder page
  if (currentPage === 'fetch-order-pending') {
    return <ViewFetchOrder onBack={() => setCurrentPage('dashboard')} />;
  } else if (currentPage === 'fetch-report'){
    return <ViewFetchReport onBack={() => setCurrentPage('dashboard')} />;
  } else if (currentPage === 'cda-page') {
    return (
      <CDAPage 
        onBack={() => {
          setCurrentPage('dashboard');
          setSelectedModule('');
        }} 
        moduleType={selectedModule}
      />
    );
  }

  // Logout function
  const handleLogout = async () => {
    const userConfirmed = window.confirm('Are you sure you want to logout?');

    if (!userConfirmed) {
      return;
    }

    try {
      await logout();
      toast.success('Logged out successfully!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error Logging out', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    }
  };

  // Module configuration
  const modules = {
    customer: {
      title: 'Customer Management',
      description: 'To view customer information',
      icon: (
        <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'teal'
    },
    inventory: {
      title: 'Inventory Management',
      description: 'To view stock info',
      icon: (
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'yellow'
    },
    distributor: {
      title: 'Distributor Management',
      description: 'Manage distributor accounts',
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'purple'
    },
    direct: {
      title: 'Direct Order Management',
      description: 'Manage direct order accounts',
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'green'
    }
  };

  const colorClasses = {
    yellow: 'bg-yellow-100 group-hover:bg-yellow-200 text-yellow-600',
    teal: 'bg-teal-100 group-hover:bg-teal-200 text-teal-600',
    purple: 'bg-purple-100 group-hover:bg-purple-200 text-purple-600',
    blue: 'bg-blue-100 group-hover:bg-blue-200 text-blue-600',
    green: 'bg-green-100 group-hover:bg-green-200 text-green-600',
    indigo: 'bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600',
    orange: 'bg-orange-100 group-hover:bg-orange-200 text-orange-600',
    cyan: 'bg-cyan-100 group-hover:bg-cyan-200 text-cyan-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-t to-blue-500 from-[#ccc] p-6 font-amasis">
      {/* Header with Date and Time */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {/* Left side - Back button, Title, and User info */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLogout()}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
            
            <h1 className="text-3xl font-medium text-gray-700">Admin Dashboard</h1>
            
            {/* User info as a badge */}
            {user && (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm text-red-700 font-medium">
                  {user.displayName || user.username || user.email}
                </span>
                {user.role && (
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side - Date, Time and Logout */}
          <div className="flex items-center gap-4">
            {/* Date and Time compact */}
            <div className="flex items-center gap-3 text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium text-sm">{currentDate}</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium text-sm">{formattedTime}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors shadow-sm"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-8xl mx-auto">

        {/* Customer Management Button */}
        <button
          onClick={() => handleModuleClick('customer')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${colorClasses[modules.customer.color]}`}>
              {modules.customer.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">{modules.customer.title}</h3>
            <p className="text-gray-600">{modules.customer.description}</p>
          </div>
        </button>

        {/* Inventory Management Button */}
        <button
          onClick={() => handleModuleClick('inventory')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${colorClasses[modules.inventory.color]}`}>
              {modules.inventory.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">{modules.inventory.title}</h3>
            <p className="text-gray-600">{modules.inventory.description}</p>
          </div>
        </button>

        {/* Distributor Management Button */}
        <button
          onClick={() => handleModuleClick('distributor')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${colorClasses[modules.distributor.color]}`}>
              {modules.distributor.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">{modules.distributor.title}</h3>
            <p className="text-gray-600">{modules.distributor.description}</p>
          </div>
        </button>

        {/* Direct Order Management Button */}
        <button
          onClick={() => handleModuleClick('direct')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${colorClasses[modules.direct.color]}`}>
              {modules.direct.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">{modules.direct.title}</h3>
            <p className="text-gray-600">{modules.direct.description}</p>
          </div>
        </button>

                {/* Order Master Button */}
        <button
          onClick={() => setCurrentPage('fetch-order-pending')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Pending Order Master</h3>
            <p className="text-gray-600">To approve all pending orders</p>
          </div>
        </button>

        {/* Order Report Button */}
        <button
          onClick={() => setCurrentPage('fetch-report')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Order Reports</h3>
            <p className="text-gray-600">Manage all order reports</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;