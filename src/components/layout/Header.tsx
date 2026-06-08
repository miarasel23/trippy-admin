import React, { useEffect, useState, useContext } from 'react';
import { AuthContextTrippy } from '../../context/AuthContextTrippy';
import { newwork_image_url } from '../../utilities/api';
import noImage from '../../assets/no-image.png';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const authContext = useContext(AuthContextTrippy);
  const { user, isAuthenticated, language, setLanguage } = authContext || {};
  const [userName, setUserName] = useState<string>('Guest User');
  const [userRole, setUserRole] = useState<string>('Role');
  const [avatarUrl, setAvatarUrl] = useState<string>(noImage);

  useEffect(() => {
    if (user) {
      setUserName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin User');
      setUserRole(user.role?.name || user.user_type || 'Administrator');
      if (user.profile_picture && user.profile_picture !== 'null' && user.profile_picture !== 'undefined') {
        const imgSrc = user.profile_picture.startsWith('http')
          ? user.profile_picture
          : `${newwork_image_url}${user.profile_picture}`;
        setAvatarUrl(imgSrc);
      } else {
        setAvatarUrl(noImage);
      }
    } else {
      setAvatarUrl(noImage);
    }
  }, [user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="main-header navbar navbar-expand navbar-white navbar-light d-flex justify-content-between px-3">
      {/* Left navbar links */}
      <ul className="navbar-nav">
        <li className="nav-item">
          <a
            className="nav-link"
            data-widget="pushmenu"
            href="#"
            role="button"
            onClick={(e) => {
              e.preventDefault();
              if (onToggleSidebar) onToggleSidebar();
            }}
          >
            <i className="fa fa-bars"></i>
          </a>
        </li>
      </ul>

      {/* Right navbar links */}
      <ul className="navbar-nav ml-auto">
        {/* Language Slider Toggle */}
        <li className="nav-item d-flex align-items-center" style={{ marginRight: '20px' }}>
          <div 
            style={{
              position: 'relative',
              display: 'flex',
              width: '140px',
              height: '30px',
              backgroundColor: '#e9ecef',
              borderRadius: '15px',
              padding: '2px',
              cursor: 'pointer',
              userSelect: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
            }}
            onClick={() => {
              if (setLanguage) {
                setLanguage(language === 'en' ? 'bn' : 'en');
              }
            }}
          >
            {/* Sliding Indicator */}
            <div 
              style={{
                position: 'absolute',
                left: language === 'en' ? 'calc(50% - 2px)' : '2px',
                top: '2px',
                width: 'calc(50% - 2px)',
                height: '26px',
                backgroundColor: '#007bff',
                borderRadius: '13px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(0,123,255,0.3)'
              }}
            />
            
            {/* Bangla Label */}
            <span 
              style={{
                flex: 1,
                zIndex: 1,
                textAlign: 'center',
                lineHeight: '26px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: language === 'bn' ? '#fff' : '#495057',
                transition: 'color 0.2s ease'
              }}
            >
              বাংলা
            </span>

            {/* English Label */}
            <span 
              style={{
                flex: 1,
                zIndex: 1,
                textAlign: 'center',
                lineHeight: '26px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: language === 'en' ? '#fff' : '#495057',
                transition: 'color 0.2s ease'
              }}
            >
              English
            </span>
          </div>
        </li>

        <li className="nav-item dropdown user-menu d-flex align-items-center">
          <div className="d-flex align-items-center" style={{ gap: '10px' }}>
            <div className="text-right d-flex flex-column">
              <span className="d-block font-weight-bold text-dark">{userName}</span>
              <small className="text-muted text-capitalize">{userRole}</small>
            </div>
            <img
              src={avatarUrl}
              className="user-image img-circle elevation-2"
              alt={userName}
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = noImage;
              }}
            />
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
