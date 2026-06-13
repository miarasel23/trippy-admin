import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';
import { AuthProviderTrippy } from './shared/hooks/useAuth';
import { ToastProvider } from './shared/hooks/useToast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProviderTrippy>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProviderTrippy>
  </React.StrictMode>,
);
