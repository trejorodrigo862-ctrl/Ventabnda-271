import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; 
import { AppProvider } from '@/context/AppContext';
import '@/index.css'; // <-- RUTA CORREGIDA: Usa el alias '@/index.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento raíz para montar la aplicación.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
