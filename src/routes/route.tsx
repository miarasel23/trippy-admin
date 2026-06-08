
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useContext } from 'react';
import { AuthContextTrippy } from '../context/AuthContextTrippy';
import { Footer } from '../components/layout/Footer';
import Home from '../pages/Home';
import { Login } from '../pages/Login';
import ActionList from '../pages/ActionList';
import ActionLanguageList from '../pages/ActionLanguageList';
import RoleList from '../pages/RoleList';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export const AppRoutes = () => {
  const { isAuthenticated, loading } = useContext(AuthContextTrippy);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
    // AdminLTE collapses the sidebar by toggling 'sidebar-collapse' on the body element
    if (document.body.classList.contains('sidebar-collapse')) {
      document.body.classList.remove('sidebar-collapse');
    } else {
      document.body.classList.add('sidebar-collapse');
    }
  };

  return (
    <Router>
      <div className={`wrapper ${sidebarCollapsed ? 'sidebar-collapse' : ''}`}>
        {isAuthenticated && <Sidebar isOpen={!sidebarCollapsed} />}
        {isAuthenticated && <Header onToggleSidebar={toggleSidebar} />}
        <div className={isAuthenticated ? "content-wrapper" : ""} style={{ minHeight: '100vh', marginLeft: isAuthenticated ? undefined : 0 }}>
          <section className={isAuthenticated ? "content mt-3" : "mt-0"}>
            <div className={isAuthenticated ? "container-fluid" : ""}>
              <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
                <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" replace />} />
                <Route path="/dashboard/setting/action" element={isAuthenticated ? <ActionList /> : <Navigate to="/" replace />} />
                <Route path="/dashboard/setting/action-language" element={isAuthenticated ? <ActionLanguageList /> : <Navigate to="/" replace />} />
                <Route path="/dashboard/setting/role-permission" element={isAuthenticated ? <RoleList /> : <Navigate to="/" replace />} />
              </Routes>
            </div>
          </section>
          {isAuthenticated && <Footer />}
        </div>
      </div>
    </Router>
  );
};
