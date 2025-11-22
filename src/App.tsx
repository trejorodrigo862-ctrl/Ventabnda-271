import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Team from './components/Products';
import Sales from './components/Sales';
import Reports from './components/Insights';
import Settings from './components/Settings';
import Informes from './components/Informes';
import MyGoals from './components/MyGoals';
import Commissions from './components/Commissions';
import MyCommissions from './components/MyCommissions';
import CommissionCalculator from './components/CommissionCalculator';
import Intro from './components/Intro';
import History from './components/History';
import { MenuIcon } from './components/icons';

const LoginScreen: React.FC = () => {
    const { users, handleLogin } = useAppContext();
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-black p-4 overflow-hidden">
            {/* Video Background */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover z-0"
              src="https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4"
              onError={(e) => (e.currentTarget.src = 'https://videos.pexels.com/video-files/4434246/4434246-hd_1920_1080_25fps.mp4')}
            />
            <div className="absolute inset-0 bg-black/50 z-10" />

            {/* Content */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 text-center">Ventas Mc Banda</h1>
                <p className="text-slate-300 mb-8 text-center">Selecciona tu perfil para continuar</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl">
                    {users.map(user => (
                        <div key={user.id} onClick={() => handleLogin(user)} className="flex flex-col items-center p-4 sm:p-6 bg-white/10 dark:bg-gray-900/50 backdrop-blur-md rounded-xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform duration-300 border border-white/20 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-red-500">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mb-4 bg-slate-200 dark:bg-slate-700 border-2 border-white/30 flex items-center justify-center overflow-hidden">
                              <img 
                                src={user.avatarUrl} 
                                alt={user.name} 
                                className="w-full h-full object-cover text-xs text-center text-slate-500" 
                              />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-white text-center">{user.name}</h3>
                            <p className="text-xs sm:text-sm text-slate-300">{user.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const { currentUser, theme, isSidebarOpen, setIsSidebarOpen } = useAppContext();
  const [showIntro, setShowIntro] = useState(true);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  if (showIntro) {
    return <Intro onDone={() => setShowIntro(false)} />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100 dark:bg-black">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-8 lg:ml-64 overflow-y-auto bg-gray-100 dark:bg-black">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 mb-4 -ml-2 text-slate-600 dark:text-slate-400">
              <MenuIcon />
          </button>
          <Routes>
            {/* Common Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/calculator" element={<CommissionCalculator />} />

            {/* Encargado Routes */}
            {currentUser.role === 'Encargado' && (
                <>
                    <Route path="/team" element={<Team viewMode="members" />} />
                    <Route path="/goals" element={<Team viewMode="goals" />} />
                    <Route path="/commissions" element={<Commissions />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/informes" element={<Informes />} />
                    <Route path="/history" element={<History />} />
                </>
            )}

            {/* Vendedor/Cajero Routes */}
            {['Vendedor', 'Cajero'].includes(currentUser.role) && (
                <>
                    <Route path="/my-goals" element={<MyGoals />} />
                    <Route path="/my-commissions" element={<MyCommissions />} />
                </>
            )}

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;