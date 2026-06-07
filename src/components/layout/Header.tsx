import React, { useEffect, useState, useContext } from 'react';
import { AuthContextTrippy } from '../../context/AuthContextTrippy';
import { newwork_image_url } from '../../utilities/api';

export const Header: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { user, isAuthenticated } = useContext(AuthContextTrippy);
  const [userName, setUserName] = useState<string>('Guest User');
  const [userRole, setUserRole] = useState<string>('Role');
  const [avatarUrl, setAvatarUrl] = useState<string>('https://via.placeholder.com/160');

  useEffect(() => {
    if (user) {
      setUserName(`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Admin User');
      setUserRole(user.role?.name || user.user_type || 'Administrator');
      if (user.profile_picture) {
        const imgSrc = user.profile_picture.startsWith('http')
          ? user.profile_picture
          : `${newwork_image_url}${user.profile_picture}`;
        setAvatarUrl(imgSrc);
      }
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
            />
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Header;
