import React, { useState, useEffect } from 'react';
import { InstallIcon, IosShareIcon } from './icons';

const PwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator).standalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent) && !window.MSStream);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (isStandalone) {
    return (
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">La aplicación ya está instalada en tu dispositivo.</p>
        </div>
    );
  }

  if (isIos) {
    return (
      <div className="bg-indigo-100 dark:bg-red-900/30 p-4 rounded-lg border border-indigo-200 dark:border-red-700">
        <h4 className="font-bold text-slate-800 dark:text-slate-100">Instalar en tu iPhone/iPad</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Para instalar la aplicación, toca el ícono de Compartir <IosShareIcon className="h-4 w-4 inline-block mx-1" /> en la barra de herramientas de Safari y luego selecciona "Agregar a la pantalla de inicio".
        </p>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700 transition-colors"
      >
        <InstallIcon />
        <span>Instalar Aplicación en tu Dispositivo</span>
      </button>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">La instalación no es compatible con este navegador o ya se ha solicitado.</p>
    </div>
  );
};

export default PwaInstall;
