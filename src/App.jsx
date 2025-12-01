import { Route, Routes } from 'react-router-dom';
import Unauthorized from './components/Unauthorized';
import ProtectedRoutes from './context/ProtectedRoutes';
import AdminDashboard from './components/dashboard/AdminDashboard';
import CustomerMaster from './redux/master-forms/CustomerMaster';
import MainPage from './components/MainPage';
import AdminAuthForm from './components/login-forms/AdminAuthForm';
import StockItemMaster from './redux/master-forms/StockItemMaster';
import ViewFetchReport from './components/reports-page/ViewFetchReport';
import ViewFetchMaster from './components/fetch-page/ViewFetchMaster';
import CorporateAuthForm from './components/login-forms/CorporateAuthForm';
import DistributorDashboard from './components/dashboard/DistributorDashboard';
import DistributorMaster from './redux/master-forms/DistributorMaster';
import DistributorAuthForm from './components/login-forms/DistributorAuthForm';
import CorporateMaster from './redux/master-forms/CorporateMaster';
import CorporateDashboard from './components/dashboard/CorporateDashboard';
import ViewFetchCorporate from './components/reports-page/ViewFetchCorporate';
import ViewFetchDistributor from './components/reports-page/ViewFetchDistributor';
import ViewItemFetchReport from './components/reports-page/ViewItemFetchReport';
import ViewPendingFetchReport from './components/reports-page/ViewPendingFetchReport';
import OrderReportPage from './components/reports-page/OrderReportPage';

function App() {
  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/admin-login" element={<AdminAuthForm />} />
          <Route path='/distributor-login' element={<DistributorAuthForm />} />
          <Route path='/corporate-login' element={<CorporateAuthForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* Admin Routes */}
          <Route path='/admin' element={
            <ProtectedRoutes roles={['admin']} >
              <AdminDashboard />
            </ProtectedRoutes>
          } />
          {/* Distributor Routes */}
          <Route
            path="/distributor"
            element={
            <ProtectedRoutes 
            roles={['admin', 'distributor']}
            >
              <DistributorDashboard />
            </ProtectedRoutes>}
          />
          {/* Corporate routes */}
          <Route path='/corporate' element={
            <ProtectedRoutes roles={['admin', 'direct']}>
              <CorporateDashboard />
            </ProtectedRoutes>
          } />
          {/* Master Page Routes */}
          <Route path='/inventory-master' element={
            <ProtectedRoutes roles={['admin']}>
              <StockItemMaster />
            </ProtectedRoutes>
          } />
          <Route path='/customer-master' element={
            <ProtectedRoutes roles={['admin']}>
              <CustomerMaster />
            </ProtectedRoutes>
          } />
          <Route path='/distributor-master' element={
            <ProtectedRoutes roles={['admin']}>
              <DistributorMaster />
            </ProtectedRoutes>
          } />
          <Route path='/corporate-master' element={
            <ProtectedRoutes roles={['admin']}>
              <CorporateMaster />
            </ProtectedRoutes>
          } />
        {/* For fetch for view */}
        <Route path='/fetch-view-master/:type' element={
          <ProtectedRoutes roles={['admin']}>
            <ViewFetchMaster />
          </ProtectedRoutes>
        } />
           {/* For View */}
        <Route path='/inventory-view/:id' element={
          <ProtectedRoutes roles={['admin']}>
            <StockItemMaster />
          </ProtectedRoutes>
        } />
        <Route path='/customer-view/:id' element={
          <ProtectedRoutes roles={['admin']}>
            <CustomerMaster />
          </ProtectedRoutes>
        } />
        <Route path='/distributor-view/:customer_code' element={
          <ProtectedRoutes roles={['admin']}>
            <DistributorMaster />
          </ProtectedRoutes>
        } />
        <Route path='/corporate-view/:customer_code' element={
          <ProtectedRoutes roles={['admin']}>
            <CorporateMaster />
          </ProtectedRoutes>
        } />
        {/* For Alter Master route */}
        <Route path='/inventory-alter' element={
          <ProtectedRoutes roles={['admin']}>
            <StockItemMaster />
          </ProtectedRoutes>
        } />
        <Route path='/customer-alter' element={
          <ProtectedRoutes roles={['admin']}>
            <CustomerMaster />
          </ProtectedRoutes>
        } />
        <Route path='/distributor-alter/:usercode' element={
          <ProtectedRoutes roles={['admin']}>
            <DistributorMaster />
          </ProtectedRoutes>
        } />
        {/* For pending order page */}
        {/* <Route path='/order-report-pending/:orderNumber' element={
          <ProtectedRoutes roles={['admin']}>
            <CorporateOrder />
          </ProtectedRoutes>
        } /> */}
        {/* For fetch report page */}
        <Route path='/fetch-report' element={
          <ProtectedRoutes roles={['admin']}>
            <ViewFetchReport />
          </ProtectedRoutes>
        } />
        {/* for Pending fetch report page */}
        <Route path='/fetch-pending-report' element={
          <ProtectedRoutes roles={['admin']}>
            <ViewPendingFetchReport />
          </ProtectedRoutes>
         } />
        {/* Fetch itemwise report page */}
        <Route path='/fetch-item-report' element={
          <ProtectedRoutes roles={['admin']}>
            <ViewItemFetchReport />
          </ProtectedRoutes>
        } />
        {/* Fetch report for Corporate */}
        <Route path='/fetch-corporate' element={
          <ProtectedRoutes>
            <ViewFetchCorporate />
          </ProtectedRoutes>
        } />
        {/* Fetch report for Distributor */}
        <Route path='/fetch-distributor' element={
          <ProtectedRoutes>
            <ViewFetchDistributor />
          </ProtectedRoutes>
        } />
        {/* Approved order report */}
        <Route path='/order-report-approved/:orderNumber' element={
          <ProtectedRoutes roles={['admin']}>
            <OrderReportPage />
          </ProtectedRoutes>
        } />
        {/* Corporate order report */}
        <Route path='/order-report-corporate/:orderNumber' element={
          <ProtectedRoutes roles={['admin', 'direct']}>
            <OrderReportPage />
          </ProtectedRoutes>
        } />
        {/* Distributor order report */}
        <Route path='/order-report-distributor/:orderNumber' element={
          <ProtectedRoutes roles={['admin', 'distributor']}>
            <OrderReportPage />
          </ProtectedRoutes>
        } />
        </Routes>
      </div>
    </>
  );
}

export default App;
