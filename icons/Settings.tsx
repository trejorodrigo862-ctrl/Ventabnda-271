import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DocumentDownloadIcon, GitHubIcon } from './icons';


const Settings: React.FC = () => {
  const { theme, setTheme, users, sales, goals, storeProgress, individualProgress, messages } = useAppContext();
  const [isDataDownloading, setIsDataDownloading] = useState(false);
  
  const handleDownloadData = () => {
    setIsDataDownloading(true);
    try {
        const allData = {
            users,
            sales,
            goals,
            storeProgress,
            individualProgress,
            messages,
            theme,
            timestamp: new Date().toISOString()
        };
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `mcbanda-datos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch(e) {
        console.error("Error downloading data:", e);
        alert("Hubo un error al descargar los datos.");
    } finally {
        setIsDataDownloading(false);
    }
  };
  
   const handleClearData = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar TODOS los datos de la aplicación? Esta acción es irreversible.')) {
        localStorage.removeItem('mcbanda_users');
        localStorage.removeItem('mcbanda_sales');
        localStorage.removeItem('mcbanda_goals');
        localStorage.removeItem('mcbanda_store_progress');
        localStorage.removeItem('mcbanda_currentUser');
        localStorage.removeItem('mcbanda_messages');
        localStorage.removeItem('mcbanda_individual_progress');
        window.location.reload();
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Ajustes</h2>
      
      <div className="space-y-8 max-w-2xl mx-auto">
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Apariencia</h3>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">Tema</span>
            <div className="flex items-center space-x-2 p-1 bg-gray-200 dark:bg-gray-800 rounded-lg">
              <button onClick={() => setTheme('light')} className={`px-3 py-1 text-sm rounded-md ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow' : ''}`}>Claro</button>
              <button onClick={() => setTheme('dark')} className={`px-3 py-1 text-sm rounded-md ${theme === 'dark' ? 'bg-black text-white shadow' : ''}`}>Oscuro</button>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Herramientas y Datos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button
                    onClick={handleDownloadData}
                    disabled={isDataDownloading}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-slate-100 disabled:text-slate-400 dark:text-red-100 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition-colors"
                >
                    <DocumentDownloadIcon />
                    <span>{isDataDownloading ? 'Preparando...' : 'Descargar Datos (JSON)'}</span>
                </button>
                 <button
                    onClick={handleClearData}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60"
                >
                    <span>Borrar Todos los Datos</span>
                </button>
            </div>
            <div className="mt-6 text-center">
                 <a href="https://github.com/tu-usuario/tu-repositorio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-red-500 transition-colors">
                    <GitHubIcon className="w-5 h-5" />
                    Ver en GitHub (o sube tu propio repo)
                </a>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;