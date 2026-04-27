import React from 'react';
import ReactDOM from 'react-dom/client';
import { setOnForceLogout } from '@alblue/api-client';
import { useAuthStore } from '@alblue/auth';
import './i18n';
import { App } from './App';
import './styles/index.css';

setOnForceLogout(() => useAuthStore.getState().logout());

// Register service worker only in production (vite build outputs sw.js)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
