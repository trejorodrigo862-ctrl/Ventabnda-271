import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // ¡Importación con ruta relativa corregida!
import { AppProvider } from '@/context/AppContext';
import '@/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
