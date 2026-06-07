import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'admin-lte/dist/css/adminlte.min.css';
import 'font-awesome/css/font-awesome.min.css';
import './index.css';
import App from './App.tsx';
import AuthProviderTrippy from './context/AuthContextTrippy';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProviderTrippy>
      <App />
    </AuthProviderTrippy>
  </StrictMode>
);
