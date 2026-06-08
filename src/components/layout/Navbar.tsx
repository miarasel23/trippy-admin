import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import { newwork_image_url } from '../../utilities/api';
import noImage from '../../assets/no-image.png';


// ------------------- Layout & Styling -------------------
const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  padding: 0 2rem;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const Brand = styled.h1`
  margin-left: 10%;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
`;

const NavItem = styled(NavLink)`
  color: #333;
  margin-right: 1.5rem;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &.active {
    color: #0077ff;
    border-bottom: 2px solid #0077ff;
  }

  &:hover {
    color: #0055cc;
  }
`;

const ProfileWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
`;

const Avatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: #f0f0f0;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

const UserRole = styled.span`
  font-size: 0.85rem;
  color: #777;
`;

// ------------------- Component -------------------
export const Navbar: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  const [showSidebar, setShowSidebar] = useState(false);
  const [userName, setUserName] = useState<string>('User');
  const [userRole, setUserRole] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>(noImage);

  // Load user data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('userData');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserName(`${user.first_name} ${user.last_name}`);
        setUserRole(user.role?.name ?? '');
        if (user.profile_picture && user.profile_picture !== 'null' && user.profile_picture !== 'undefined') {
          // If the picture is a relative path, prepend the media base URL
          const imgSrc = user.profile_picture.startsWith('http')
            ? user.profile_picture
            : `${newwork_image_url}${user.profile_picture}`;
          setAvatarUrl(imgSrc);
        } else {
          setAvatarUrl(noImage);
        }
      } catch (e) {
        console.warn('Failed to parse user data from localStorage', e);
      }
    }
  }, []);

  if (!isAuthenticated) {
    // Hide navbar completely when not logged in
    return null;
  }

  return (
    <>
      <Nav>
        {/* Brand displayed on the left */}
        <Brand>TRIPPY SERVICE LTD</Brand>

        {/* Right side user profile */}
        <ProfileWrapper onClick={() => setShowSidebar(!showSidebar)}>
          <Avatar
            src={avatarUrl}
            alt="Avatar"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = noImage;
            }}
          />
          <UserInfo>
            <UserName>{userName}</UserName>
            {userRole && <UserRole>{userRole}</UserRole>}
          </UserInfo>
        </ProfileWrapper>
      </Nav>

      {showSidebar && <Sidebar isSidebarOpen={undefined} toggleSidebar={undefined} />}
    </>
  );
};
