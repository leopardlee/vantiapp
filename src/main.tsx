import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and ignore benign Vite WebSocket/HMR connection rejections in the dev environment
if (typeof window !== 'undefined') {
  const ignoreBenignErrors = (event: ErrorEvent | PromiseRejectionEvent) => {
    const message = 'message' in event ? event.message : (event.reason?.message || event.reason?.toString() || '');
    if (
      message.includes('WebSocket') ||
      message.includes('websocket') ||
      message.includes('vite') ||
      message.includes('Vite') ||
      message.includes('HMR') ||
      message.includes('closed without opened')
    ) {
      event.preventDefault();
      try {
        event.stopPropagation();
      } catch (err) {}
    }
  };
  window.addEventListener('unhandledrejection', ignoreBenignErrors, true);
  window.addEventListener('error', ignoreBenignErrors, true);
}

// Fix for mobile viewport height
const setVH = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};
setVH();
window.addEventListener('resize', setVH);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
