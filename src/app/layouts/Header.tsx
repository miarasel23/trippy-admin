import React, { useEffect, useState, useContext } from 'react';
import { AuthContextTrippy } from '../../shared/hooks/useAuth';
import { newwork_image_url } from '../../shared/utils/constants';
import noImage from '../../shared/assets/images/no-image.png';

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
    <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
      {/* Left navbar links */}
      <div className="flex items-center">
        <button
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors focus:outline-none"
          onClick={(e) => {
            e.preventDefault();
            if (onToggleSidebar) onToggleSidebar();
          }}
        >
          <i className="fa fa-bars text-lg"></i>
        </button>
      </div>

      {/* Right navbar links */}
      <div className="flex items-center gap-6">
        {/* Language Slider Toggle */}
        <div 
          className="relative flex w-36 h-8 bg-gray-100 rounded-full p-1 cursor-pointer select-none shadow-inner"
          onClick={() => {
            if (setLanguage) {
              setLanguage(language === 'en' ? 'bn' : 'en');
            }
          }}
        >
          {/* Sliding Indicator */}
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-blue-600 rounded-full shadow transition-all duration-200 ease-out ${
              language === 'en' ? 'left-[calc(50%+2px)]' : 'left-1'
            }`}
          />
          
          {/* Bangla Label */}
          <span 
            className={`flex-1 z-10 text-center text-xs font-bold leading-6 transition-colors duration-200 ${
              language === 'bn' ? 'text-white' : 'text-gray-600'
            }`}
          >
            বাংলা
          </span>

          {/* English Label */}
          <span 
            className={`flex-1 z-10 text-center text-xs font-bold leading-6 transition-colors duration-200 ${
              language === 'en' ? 'text-white' : 'text-gray-600'
            }`}
          >
            English
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right flex flex-col">
            <span className="text-sm font-semibold text-gray-800">{userName}</span>
            <span className="text-xs text-gray-500 capitalize">{userRole}</span>
          </div>
          <img
            src={avatarUrl}
            className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
            alt={userName}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = noImage;
            }}
          />
        </div>
      </div>
    </nav>
  );
};

export default Header;
