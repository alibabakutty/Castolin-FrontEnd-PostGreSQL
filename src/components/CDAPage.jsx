import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const CDAPage = ({ onBack, moduleType }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onBack();
      }
    }

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [onBack]);

  // Module configuration for dynamic content
  const moduleConfig = {
    inventory: {
      title: 'Inventory Management',
      description: 'Manage your product inventory and stock levels',
      createText: 'Create Inventory',
      viewText: 'View Inventory',
      alterText: 'Alter Inventory',
      createDescription: 'Add new products to inventory',
      viewDescription: 'Browse and search inventory items',
      alterDescription: 'Modify existing inventory records',
      createPage: '/inventory-master',
      viewPage: '/fetch-view-master/inventory',
      alterPage: '/inventory-alter',
    },
    customer: {
      title: 'Customer Management',
      description: 'Manage customer data and relationships',
      createText: 'Create Customer',
      viewText: 'View Customer',
      alterText: 'Alter Customer',
      createDescription: 'Add new customer profiles',
      viewDescription: 'Browse and search customer information',
      alterDescription: 'Update customer details and records',
      createPage: '/customer-master',
      viewPage: '/fetch-view-master/customer',
      alterPage: '/customer-alter',
    },
    distributor: {
      title: 'Distributor Management',
      description: 'Manage system distributors and user accounts',
      createText: 'Create Distributor',
      viewText: 'View Distributor',
      alterText: 'Alter Distributor',
      createDescription: 'Add new distributor accounts',
      viewDescription: 'Browse and search distributor profiles',
      alterDescription: 'Modify distributor information and permissions',
      createPage: '/distributor-master',
      viewPage: '/fetch-view-master/distributor',
      alterPage: '/fetch-alter-master/distributor',
    },
    direct: {
      title: 'Direct Order Management',
      description: 'Manage system direct order accounts',
      createText: 'Create Direct Order',
      viewText: 'View Direct Order',
      alterText: 'Alter Direct Order',
      createDescription: 'Add new direct order accounts',
      viewDescription: 'Browse and search direct order profiles',
      alterDescription: 'Modify direct order informations',
      createPage: '/corporate-master',
      viewPage: '/fetch-view-master/direct',
      alterPage: '/corporate-alter'
    },
  };

  // Get current module configuration or default to distributor
  const currentModule = moduleConfig[moduleType] || moduleConfig.distributor;

  const handleView = () => {
    console.log(`View ${moduleType} clicked`);
    navigate(currentModule.viewPage);
  };

  return (
    <div className="flex font-amasis">
      <div className="w-[883px] h-[100vh] flex">
        <div className="w-[883px] bg-gradient-to-t to-blue-500 from-[#ccc]">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg backdrop-blur-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>
      <div className="min-h-screen bg-gradient-to-t to-blue-500 from-[#ccc] flex items-center justify-center p-4 border-l border-gray-300">
        <div className="w-[450px]">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-medium text-gray-800 mb-4">{currentModule.title}</h1>
            <p className="text-gray-600 text-lg">{currentModule.description}</p>
          </div>

          {/* Buttons Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">

            {/* View Button */}
            <button
              onClick={handleView}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-medium text-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {currentModule.viewText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDAPage;
