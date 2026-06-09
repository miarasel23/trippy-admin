import { useState, useContext, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../../ui-share/Spinner';
import { AuthContextTrippy } from '../../context/AuthContextTrippy';
import { useTranslation } from '../../utilities/translation';

export default function Sidebar({ isOpen = true }: { isOpen?: boolean }) {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => location.pathname.includes('/setting'));
  const [isCarsOpen, setIsCarsOpen] = useState(() => location.pathname.includes('/setting/cars'));
  const navigate = useNavigate();
  const auth = useContext(AuthContextTrippy);
  const user = auth?.user;
  const logout = auth?.logout;

  const permissionCodes = useMemo(() => {
    if (!user?.permissions) return [];
    return user.permissions.map((p: any) => p.code);
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
        {
          text: t('cars'),
          icon: 'fa-car',
          subItems: [
            { to: '/dashboard/setting/cars/car-category', text: t('carCategory') },
            { to: '/dashboard/setting/cars/car-service-category', text: t('carServiceCategory') },
            { to: '/dashboard/setting/cars/price-set-as-per-km', text: t('priceSetAsPerKm') }
          ]
        },
        { to: '/dashboard/setting/action', text: t('action') },
        { to: '/dashboard/setting/action-language', text: t('actionWithLanguage'), icon: 'fa-language' },
        { to: '/dashboard/setting/role-permission', text: t('rolePermission') },
        { to: '/dashboard/setting/driver-subscription', text: t('driverSubscription') },
        { to: '/dashboard/setting/otp-setup', text: t('otpSetup') }
      ]
    }
  ].filter(item => hasAny(item.perms));

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (logout) {
        await logout();
      }
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 w-64 border-r border-slate-800 flex flex-col transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <span className="text-white font-bold tracking-wider text-sm">TRIPPY SERVICE LTD</span>
      </div>

      {/* Sidebar Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <nav className="space-y-1">
          {links.map((link, index) => {
            const hasSubItems = !!link.subItems;
            const isActive = location.pathname === link.to;

            if (hasSubItems) {
              const isAnySubActive = location.pathname.includes('/setting');
              return (
                <div key={index} className="space-y-1">
                  <button
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isAnySubActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'
                    }`}
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`fa ${link.icon} w-5 text-center`}></i>
                      <span>{link.text}</span>
                    </div>
                    <i className={`fa fa-angle-left transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`}></i>
                  </button>
                  {isSettingsOpen && (
                    <div className="pl-4 py-1 space-y-1">
                      {link.subItems.map((sub, sIdx) => {
                        const hasNestedSubItems = !!(sub as any).subItems;
                        if (hasNestedSubItems) {
                          const nestedSub = sub as any;
                          const isNestedActive = location.pathname.includes('/setting/cars');
                          return (
                            <div key={sIdx} className="space-y-1">
                              <button
                                className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                  isNestedActive ? 'bg-slate-800/60 text-white' : 'hover:bg-slate-800/60 hover:text-white'
                                }`}
                                onClick={() => setIsCarsOpen(!isCarsOpen)}
                              >
                                <div className="flex items-center gap-3">
                                  <i className={`fa ${nestedSub.icon || 'fa-car'} w-4 text-center`}></i>
                                  <span>{nestedSub.text}</span>
                                </div>
                                <i className={`fa fa-angle-left transition-transform duration-200 ${isCarsOpen ? 'rotate-90' : ''}`}></i>
                              </button>
                              {isCarsOpen && (
                                <div className="pl-4 py-1 space-y-1">
                                  {nestedSub.subItems.map((child: any, cIdx: number) => {
                                    const isChildActive = location.pathname === child.to;
                                    const childIcon = child.icon || 'fa-bookmark-o';
                                    return (
                                      <Link
                                        key={cIdx}
                                        to={child.to}
                                        className={`flex items-center gap-3 px-4 py-1.5 rounded-md text-xs transition-colors ${
                                          isChildActive
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'hover:bg-slate-800/40 hover:text-white text-slate-400'
                                        }`}
                                      >
                                        <i className={`fa ${childIcon} w-4 text-center`}></i>
                                        <span>{child.text}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }
                        const isSubActive = location.pathname === sub.to;
                        const subIcon = (sub as any).icon || 'fa-bookmark-o';
                        return (
                          <Link
                            key={sIdx}
                            to={sub.to}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs transition-colors ${
                              isSubActive
                                ? 'bg-blue-600 text-white font-medium'
                                : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                            }`}
                          >
                            <i className={`fa ${subIcon} w-4 text-center`}></i>
                            <span>{sub.text}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={index}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <i className={`fa ${link.icon} w-5 text-center`}></i>
                <span>{link.text}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout/Bottom Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none"
        >
          <i className="fa fa-sign-out w-5 text-center"></i>
          <span>{t('signOut')}</span>
          {loading && <span className="ml-2"><Spinner /></span>}
        </button>
      </div>
    </aside>
  );
}
