import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'font-awesome/css/font-awesome.min.css';
import './index.css';
import App from './App.tsx';
import AuthProviderTrippy from './context/AuthContextTrippy';
import { ToastProvider } from './context/ToastContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProviderTrippy>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProviderTrippy>
  </StrictMode>
);
