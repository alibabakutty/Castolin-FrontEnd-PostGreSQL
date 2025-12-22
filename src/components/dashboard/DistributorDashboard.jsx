import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import Order from '../orders-page/Order';
import { logout } from '../../auth/auth';
import { toast } from 'react-toastify';
import ViewFetchDistributor from '../reports-page/ViewFetchDistributor';
import { useAuth } from '../../context/authConstants';
import NewOrder from '../orders-page/NewOrder';

const DistributorDashboard = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleEscapeKey = event => {
      if (event.key === 'Escape') {
        handleLogout();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [navigate]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // update time for every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    // cleanup interval on unmount
    return () => clearInterval(timer);
  }, []);

  // format time with seconds
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Show only Dashboard for now (you can add other pages later)
  if (currentPage === 'order-management') {
    return <NewOrder onBack={() => setCurrentPage('dashboard')} />;
  } else if (currentPage === 'fetch-distributor') {
    return <ViewFetchDistributor onBack={() => setCurrentPage('dashboard')} />;
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

  // Show only Dashboard
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

            <h1 className="text-3xl font-medium text-gray-700">Distributor Dashboard</h1>

            {/* User info as a badge */}
            {user && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm text-blue-700 font-medium">
                  {user.displayName || user.username || user.email}
                </span>
                {user.role && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {user.role || 'not given'}
                  </span>
                )}
                {user?.state && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {user.state || 'not given'}
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

      {/* Dashboard Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Order Management Button */}
        <button
          onClick={() => setCurrentPage('order-management')}
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
            <h3 className="text-xl font-medium text-gray-700 mb-2">Orders Place</h3>
            <p className="text-gray-600">To take customer orders</p>
          </div>
        </button>

        {/* Sales Report Button */}
        <button
          onClick={() => setCurrentPage('fetch-distributor')}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 group w-full"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Sales Reports</h3>
            <p className="text-gray-600">View sales performance and analytics</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DistributorDashboard;
