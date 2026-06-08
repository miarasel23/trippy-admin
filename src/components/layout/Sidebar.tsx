import React, { useState, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../ui-share/Spinner';
import { AuthContextTrippy } from '../../context/AuthContextTrippy';
import { useTranslation } from '../../utilities/translation';

export default function Sidebar({ isOpen = true }: { isOpen?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContextTrippy);

  const permissionCodes = useMemo(() => {
    if (!user?.permissions) return [];
    return user.permissions.map((p) => p.code);
  }, [user]);

  const hasAny = (required: string[] = []) => {
    if (!required || required.length === 0) return true;
    return required.some((code) => permissionCodes.includes(code));
  };

  const t = useTranslation();

  const links = [
    { to: '/dashboard', icon: 'fa-dashboard', text: t('dashboard'), perms: [] },
    { to: '/dashboard/trip', icon: 'fa-search', text: t('trip'), perms: [] },
    { to: '/dashboard/customer', icon: 'fa-users', text: t('customer'), perms: [] },
    { to: '/dashboard/rider', icon: 'fa-user-circle', text: t('rider'), perms: [] },
    { to: '/dashboard/admin-user', icon: 'fa-user-secret', text: t('adminUser'), perms: [] },
    {
      text: t('settings'),
      icon: 'fa-cog',
      perms: [],
      subItems: [
        { to: '/dashboard/setting/car-setup', text: t('carSetup') },
        { to: '/dashboard/setting/action', text: t('action') },
        { to: '/dashboard/setting/action-language', text: t('actionWithLanguage'), icon: 'fa-language' },
        { to: '/dashboard/setting/role-permission', text: t('rolePermission') },
        { to: '/dashboard/setting/driver-subscription', text: t('driverSubscription') },
        { to: '/dashboard/setting/user-setting', text: t('userSetting') },
        { to: '/dashboard/setting/otp-setup', text: t('otpSetup') }
      ]
    }
  ].filter(item => hasAny(item.perms));

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="main-sidebar sidebar-dark-primary elevation-4">
      {/* Brand Logo */}
      <a href="#" className="brand-link">
        <span className="brand-text font-weight-light pl-3 font-weight-bold">TRIPPY SERVICE LTD</span>
      </a>

      {/* Sidebar */}
      <div className="sidebar">
        {/* Sidebar Menu */}
        <nav className="mt-2">
          <ul className="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
            {links.map((link, index) => {
              const hasSubItems = !!link.subItems;
              const isActive = location.pathname === link.to;

              if (hasSubItems) {
                return (
                  <li key={index} className={`nav-item has-treeview ${isSettingsOpen ? 'menu-open' : ''}`}>
                    <a
                      href="#"
                      className={`nav-link ${location.pathname.includes('/setting') ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setIsSettingsOpen(!isSettingsOpen); }}
                    >
                      <i className={`nav-icon fa ${link.icon}`}></i>
                      <p>
                        {link.text}
                        <i className="right fa fa-angle-left"></i>
                      </p>
                    </a>
                    <ul className="nav nav-treeview" style={{ display: isSettingsOpen ? 'block' : 'none' }}>
                      {link.subItems.map((sub, sIdx) => {
                        const isSubActive = location.pathname === sub.to;
                        const subIcon = (sub as any).icon || 'fa-bookmark-o';
                        return (
                          <li key={sIdx} className="nav-item">
                            <Link to={sub.to} className={`nav-link ${isSubActive ? 'active' : ''}`}>
                              <i className={`fa ${subIcon} nav-icon`}></i>
                              <p>{sub.text}</p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              }

              return (
                <li key={index} className="nav-item">
                  <Link to={link.to} className={`nav-link ${isActive ? 'active' : ''}`}>
                    <i className={`nav-icon fa ${link.icon}`}></i>
                    <p>{link.text}</p>
                  </Link>
                </li>
              );
            })}

            <li className="nav-header">{t('actionsHeader')}</li>
            <li className="nav-item">
              <a href="#" className="nav-link text-danger" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <i className="nav-icon fa fa-sign-out"></i>
                <span>
                  {t('signOut')}
                  {loading && <span className="ml-2"><Spinner /></span>}
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
