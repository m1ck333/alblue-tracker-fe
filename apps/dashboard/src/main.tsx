import React from 'react';
import ReactDOM from 'react-dom/client';
import { setOnForceLogout } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import './i18n';
import './styles/global.css';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

setOnForceLogout(() => useAuthStore.getState().logout());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
