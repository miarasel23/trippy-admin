import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextTrippy } from '../../shared/hooks/useAuth';

// Layouts
import Sidebar from '../layouts/Sidebar';
import Header from '../layouts/Header';
import { Footer } from '../layouts/Footer';

// Pages
import DashboardPage from '../../modules/dashboard/pages/DashboardPage';
import { Login } from '../../modules/settings/pages/Login';
import ActionList from '../../modules/settings/pages/ActionList';
import ActionLanguageList from '../../modules/settings/pages/ActionLanguageList';
import RoleList from '../../modules/settings/pages/RoleList';
import AdminUserList from '../../modules/settings/pages/AdminUserList';
import OtpSetup from '../../modules/settings/pages/OtpSetup';
import DriverSubscriptionList from '../../modules/settings/pages/DriverSubscriptionList';
import CarCategoryList from '../../modules/settings/pages/CarCategoryList';
import CarServiceCategoryList from '../../modules/settings/pages/CarServiceCategoryList';
import PriceSetAsPerKm from '../../modules/settings/pages/PriceSetAsPerKm';

import CustomerList from '../../modules/customer/pages/CustomerList';
import CustomerTripHistory from '../../modules/trip/pages/CustomerTripHistory';
import TripTrack from '../../modules/trip/pages/TripTrack';

export const AppRoutes = () => {
  const auth = useContext(AuthContextTrippy);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const loading = auth?.loading ?? true;
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

        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isAuthenticated ? (sidebarCollapsed ? 'pl-0' : 'pl-64') : ''
          }`}>
          {isAuthenticated && <Header onToggleSidebar={toggleSidebar} />}

          <main className={`flex-1 ${isAuthenticated ? 'p-6' : 'p-0'}`}>
            <Routes>
              {/* Redirect root to dashboard/home */}
              <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              
              <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/" replace />} />
              
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
              <Route path="/dashboard/trip" element={isAuthenticated ? <CustomerTripHistory /> : <Navigate to="/" replace />} />
              <Route path="/dashboard/trip-track" element={isAuthenticated ? <TripTrack /> : <Navigate to="/" replace />} />
            </Routes>
          </main>

          {isAuthenticated && <Footer />}
        </div>
      </div>
    </Router>
  );
};
