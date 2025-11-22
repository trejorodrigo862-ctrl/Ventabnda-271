import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { DashboardIcon, SalesIcon, UsersIcon, BarChart3Icon, LogOutIcon, CloseIcon, TrophyIcon, SettingsIcon, DocumentDownloadIcon, CommissionIcon, CalculatorIcon, HistoryIcon } from './icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} onClick={onClick}>
        <li
        className={`
            flex items-center space-x-3 p-3 my-1 rounded-lg cursor-pointer transition-all duration-200
            ${isActive
            ? 'bg-indigo-600 dark:bg-red-600 text-white shadow-lg'
            : 'text-slate-500 hover:bg-gray-200 dark:hover:bg-gray-900 dark:text-gray-400 hover:text-slate-800 dark:hover:text-slate-100'
            }
        `}
        >
        {icon}
        <span className="font-semibold">{label}</span>
        </li>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { currentUser, handleLogout, isSidebarOpen, setIsSidebarOpen } = useAppContext();

  if (!currentUser) return null;

  const handleNavigate = () => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <aside className={`w-64 bg-gray-100 dark:bg-black dark:border-r dark:border-red-600 p-4 flex flex-col h-screen fixed z-50 transform lg:transform-none transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-3 mb-6">
          <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 dark:bg-red-600 p-2 rounded-lg">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Ventas Mc Banda</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
              <CloseIcon />
          </button>
        </div>
        <nav className="flex-grow">
          <ul>
            <NavItem
              icon={<DashboardIcon />}
              label="Panel de Control"
              to="/dashboard"
              onClick={handleNavigate}
            />
            <NavItem
              icon={<SalesIcon />}
              label="Ventas"
              to="/sales"
              onClick={handleNavigate}
            />
            {currentUser.role === 'Encargado' && (
              <>
                <NavItem
                  icon={<UsersIcon />}
                  label="Miembros del Equipo"
                  to="/team"
                  onClick={handleNavigate}
                />
                <NavItem
                  icon={<TrophyIcon className="h-6 w-6" />}
                  label="Metas Mensuales"
                  to="/goals"
                  onClick={handleNavigate}
                />
                 <NavItem
                  icon={<CommissionIcon />}
                  label="Comisiones"
                  to="/commissions"
                  onClick={handleNavigate}
                />
                <NavItem
                  icon={<CalculatorIcon />}
                  label="Calculadora"
                  to="/calculator"
                  onClick={handleNavigate}
                />
                <NavItem
                  icon={<BarChart3Icon />}
                  label="Reportes e IA"
                  to="/reports"
                  onClick={handleNavigate}
                />
                 <NavItem
                  icon={<DocumentDownloadIcon />}
                  label="Informes"
                  to="/informes"
                  onClick={handleNavigate}
                />
                 <NavItem
                  icon={<HistoryIcon />}
                  label="Historial"
                  to="/history"
                  onClick={handleNavigate}
                />
              </>
            )}
            {['Vendedor', 'Cajero'].includes(currentUser.role) && (
              <>
               <NavItem
                icon={<TrophyIcon className="h-6 w-6" />}
                label="Mis Metas"
                to="/my-goals"
                onClick={handleNavigate}
              />
               <NavItem
                icon={<CommissionIcon />}
                label="Mis Comisiones"
                to="/my-commissions"
                onClick={handleNavigate}
              />
              <NavItem
                  icon={<CalculatorIcon />}
                  label="Calculadora"
                  to="/calculator"
                  onClick={handleNavigate}
                />
              </>
            )}
            <NavItem
              icon={<SettingsIcon />}
              label="Ajustes"
              to="/settings"
              onClick={handleNavigate}
            />
          </ul>
        </nav>
        <div className="mt-auto flex flex-col space-y-4">
          <div className="p-3 bg-gray-200 dark:bg-gray-900 rounded-lg flex items-center space-x-3">
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-10 w-10 rounded-full" />
              <div>
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
              </div>
          </div>
          <button
              onClick={handleLogout}
              className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-500"
            >
              <LogOutIcon />
              <span className="font-semibold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;