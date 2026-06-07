import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  color: #333;
`;

export const Footer: React.FC = () => (
  <FooterContainer>
    © {new Date().getFullYear()} Trippu Admin. All rights reserved.
  </FooterContainer>
);
