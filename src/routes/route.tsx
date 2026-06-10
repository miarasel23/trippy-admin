import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContextTrippy } from '../context/AuthContextTrippy';
import { Footer } from '../components/layout/Footer';
import Home from '../pages/Home';
import { Login } from '../pages/Login';
import ActionList from '../pages/ActionList';
import ActionLanguageList from '../pages/ActionLanguageList';
import RoleList from '../pages/RoleList';
import AdminUserList from '../pages/AdminUserList';
import OtpSetup from '../pages/OtpSetup';
import DriverSubscriptionList from '../pages/DriverSubscriptionList';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import CarCategoryList from '../pages/CarCategoryList';
import CarServiceCategoryList from '../pages/CarServiceCategoryList';
import PriceSetAsPerKm from '../pages/PriceSetAsPerKm';
import CustomerList from '../pages/CustomerList';

export const AppRoutes = () => {
  const { isAuthenticated, loading } = useContext(AuthContextTrippy);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 flex">
        {isAuthenticated && <Sidebar isOpen={!sidebarCollapsed} />}
        
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isAuthenticated ? (sidebarCollapsed ? 'pl-0' : 'pl-64') : ''
        }`}>
          {isAuthenticated && <Header onToggleSidebar={toggleSidebar} />}
          
          <main className={`flex-1 ${isAuthenticated ? 'p-6' : 'p-0'}`}>
            <Routes>
              <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
              <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/action" element={isAuthenticated ? <ActionList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/action-language" element={isAuthenticated ? <ActionLanguageList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/role-permission" element={isAuthenticated ? <RoleList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/otp-setup" element={isAuthenticated ? <OtpSetup /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/driver-subscription" element={isAuthenticated ? <DriverSubscriptionList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/cars/car-category" element={isAuthenticated ? <CarCategoryList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/cars/car-service-category" element={isAuthenticated ? <CarServiceCategoryList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/setting/cars/price-set-as-per-km" element={isAuthenticated ? <PriceSetAsPerKm /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/admin-user" element={isAuthenticated ? <AdminUserList /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/customer" element={isAuthenticated ? <CustomerList /> : <Navigate to="/" replace />} />
            </Routes>
          </main>

          {isAuthenticated && <Footer />}
        </div>
      </div>
    </Router>
  );
};
