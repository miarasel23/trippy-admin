import React from 'react';
import styled, { keyframes } from 'styled-components';

// Simple CSS spinner using styled-components
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerWrapper = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #0077ff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: ${spin} 1s linear infinite;
`;

/**
 * Reusable loading spinner.
 */
const Spinner: React.FC = () => {
  return <SpinnerWrapper aria-label="Loading" />;
};

export default Spinner;
