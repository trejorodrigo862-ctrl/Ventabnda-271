import React, { useMemo, useState } from 'react';
import { VendedorGoalSet, CajeroGoalSet } from '../types';
import { useAppContext } from '../context/AppContext';

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 transform hover:-translate-y-1 transition-transform duration-300">
    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
  </div>
);

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100);
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-indigo-600 dark:bg-red-500 h-2.5 rounded-full" style={{ width: `${displayPercentage}%` }}></div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { users, currentUser, goals, storeProgress, individualProgress, messages } = useAppContext();
  
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentGoal = goals.find(g => g.month === currentMonthStr);
  
  const managerData = useMemo(() => {
    if (!currentUser || currentUser.role !== 'Encargado') return null;

    const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
    
    const totalRevenue = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
    const totalUnits = progressThisMonth.reduce((sum, p) => sum + p.unidades, 0);
    const totalTickets = progressThisMonth.reduce((sum, p) => sum + p.tickets, 0);
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    const unitsPerTicket = totalTickets > 0 ? totalUnits / totalTickets : 0;
    
    const monthlyGoalPesos = currentGoal?.teamGoal?.metaPesos || 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyGoal = monthlyGoalPesos > 0 ? monthlyGoalPesos / daysInMonth : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayProgress = progressThisMonth.find(p => p.date === todayStr)?.pesos || 0;
    const remainingForDay = dailyGoal > 0 ? dailyGoal - todayProgress : 0;

    const WORKDAY_START = 9;
    const WORKDAY_END = 18;
    const currentHour = new Date().getHours();
    const remainingHours = Math.max(0, WORKDAY_END - currentHour);
    const hourlyRateNeeded = remainingForDay > 0 && remainingHours > 0 ? remainingForDay / remainingHours : 0;
    
    const sellers = users.filter(u => u.role === 'Vendedor');
    const individualProgressThisMonth = individualProgress.filter(s => s.date.startsWith(currentMonthStr));

    const sellerProgress = sellers.map(seller => {
      const sellerSales = individualProgressThisMonth
        .filter(s => s.userId === seller.id)
        .reduce((sum, s) => sum + (s.pesos || 0), 0);
      
      const sellerGoal = (currentGoal?.userGoals?.[seller.id] as VendedorGoalSet)?.metaPesos || 0;
      return {
        id: seller.id,
        name: seller.name,
        avatarUrl: seller.avatarUrl,
        sold: sellerSales,
        goal: sellerGoal,
        progress: sellerGoal > 0 ? (sellerSales / sellerGoal) * 100 : 0,
      };
    }).sort((a, b) => b.progress - a.progress);

    return {
        totalRevenue, totalUnits, avgTicket, unitsPerTicket,
        dailyGoal, todayProgress, remainingForDay, hourlyRateNeeded,
        sellerProgress,
    };
  }, [currentUser, users, individualProgress, goals, storeProgress, currentMonthStr]);

  const userData = useMemo(() => {
    if (!currentUser || currentUser.role === 'Encargado') return null;

    const userIndividualProgress = individualProgress.filter(p => p.userId === currentUser.id && p.date.startsWith(currentMonthStr));

    let totalRevenue = 0;
    let totalUnits = 0;
    let totalTickets = 0;
    
    const userGoals = currentGoal?.userGoals?.[currentUser.id];
    let goalsWithProgress: { label: string, value: number, max: number }[] = [];
    
    if (currentUser.role === 'Vendedor' && userGoals) {
        totalRevenue = userIndividualProgress.reduce((sum, s) => sum + (s.pesos || 0), 0);
        totalUnits = userIndividualProgress.reduce((sum, s) => sum + (s.unidades || 0), 0);
        totalTickets = userIndividualProgress.reduce((sum, s) => sum + (s.tickets || 0), 0);
        const goalsVendedor = userGoals as VendedorGoalSet;
        goalsWithProgress = [
            { label: 'Pesos ($)', value: totalRevenue, max: goalsVendedor.metaPesos || 0 },
            { label: 'Unidades', value: totalUnits, max: goalsVendedor.metaUnidades || 0 },
            { label: 'Calzado (U)', value: userIndividualProgress.reduce((sum, s) => sum + (s.calzado || 0), 0), max: goalsVendedor.metaCalzado || 0},
            { label: 'Indumentaria (U)', value: userIndividualProgress.reduce((sum, s) => sum + (s.indumentaria || 0), 0), max: goalsVendedor.metaIndumentaria || 0},
        ];
    } else if (currentUser.role === 'Cajero' && userGoals) {
        const goalsCajero = userGoals as CajeroGoalSet;
        const mcCredProgressPesos = userIndividualProgress.reduce((sum, p) => sum + (p.pesosMcCred || 0), 0);
        const mcCredProgressUnidades = userIndividualProgress.reduce((sum, p) => sum + (p.unidadesMcCred || 0), 0);
        const mediasProgress = userIndividualProgress.reduce((sum, p) => sum + (p.medias || 0), 0);
        
        goalsWithProgress = [
            { label: 'MC Crédito ($)', value: mcCredProgressPesos, max: goalsCajero.metaPesosMcCred || 0 },
            { label: 'MC Crédito (U)', value: mcCredProgressUnidades, max: goalsCajero.metaUnidadesMcCred || 0 },
            { label: 'Medias (U)', value: mediasProgress, max: goalsCajero.metaMedias || 0 },
        ];
    }

    return {
        totalRevenue, totalUnits, totalTickets,
        goalsWithProgress: goalsWithProgress.filter(g => g.max > 0),
    };
  }, [currentUser, individualProgress, goals, currentMonthStr]);

  const sortedMessages = useMemo(() => messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [messages]);

  if (!currentUser) return null;

  // Manager View
  if (currentUser.role === 'Encargado' && managerData) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Panel de Control</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Ventas Totales del Mes" value={`$${managerData.totalRevenue.toLocaleString('es-AR')}`} description="Suma de todos los progresos diarios" />
          <StatCard title="Unidades Vendidas" value={managerData.totalUnits.toLocaleString('es-AR')} description="Total de unidades este mes" />
          <StatCard title="Ticket Promedio" value={`$${managerData.avgTicket.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} description="Promedio por ticket" />
          <StatCard title="Unidades por Ticket" value={managerData.unitsPerTicket.toFixed(2)} description="Promedio de unidades" />
          <StatCard title="Meta Diaria ($)" value={`$${managerData.dailyGoal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} description="Basado en la meta mensual" />
          <StatCard title="Venta de Hoy" value={`$${managerData.todayProgress.toLocaleString('es-AR')}`} description="Progreso cargado para hoy" />
          <StatCard title="Faltante para Hoy" value={`$${Math.max(0, managerData.remainingForDay).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} description="Para alcanzar la meta diaria" />
          <StatCard title="Ritmo por Hora Necesario" value={`$${managerData.hourlyRateNeeded.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} description="Ritmo para las horas restantes" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Rendimiento de Vendedores (vs Meta en Pesos)</h3>
                <div className="space-y-4">
                {managerData.sellerProgress.map(seller => (
                    <div key={seller.id}>
                        <div className="flex items-center space-x-3 mb-2">
                            <img src={seller.avatarUrl} alt={seller.name} className="h-8 w-8 rounded-full" />
                            <div className="flex-grow">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{seller.name}</span>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-red-400">
                                        {seller.progress.toFixed(1)}%
                                        <span className="font-medium text-slate-500 dark:text-slate-400 ml-2">(${seller.sold.toLocaleString('es-AR')}/${seller.goal.toLocaleString('es-AR')})</span>
                                    </span>
                                </div>
                                <ProgressBar value={seller.sold} max={seller.goal} />
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Comunicados Recientes</h3>
              {sortedMessages.length > 0 ? (
                    <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {sortedMessages.slice(0, 5).map(msg => (
                            <li key={msg.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(msg.date).toLocaleString('es-AR')}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 mt-4">No hay mensajes enviados.</p>
                )}
            </div>
        </div>

      </div>
    );
  }

  // Vendedor & Cajero View
  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Mi Panel</h2>
        
        {userData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Mis Ventas ($)" value={`$${userData.totalRevenue.toLocaleString('es-AR')}`} description="Total de tus ventas este mes" />
                <StatCard title="Mis Unidades" value={userData.totalUnits.toLocaleString('es-AR')} description="Total de unidades vendidas" />
                <StatCard title="Mis Tickets" value={userData.totalTickets.toLocaleString('es-AR')} description="Cantidad de operaciones" />
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Progreso de Mis Metas</h3>
                {userData?.goalsWithProgress.length > 0 ? (
                    <div className="space-y-4">
                    {userData.goalsWithProgress.map(g => (
                        <div key={g.label}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{g.label}</span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-red-400">
                                    {((g.value / g.max) * 100).toFixed(1)}%
                                    <span className="font-medium text-slate-500 dark:text-slate-400 ml-2">({g.label.includes('$') ? '$' : ''}{g.value.toLocaleString('es-AR')}/{g.label.includes('$') ? '$' : ''}{g.max.toLocaleString('es-AR')})</span>
                                </span>
                            </div>
                            <ProgressBar value={g.value} max={g.max} />
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">No tienes metas asignadas para este mes.</p>
                )}
             </div>

             <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Comunicados del Equipo</h3>
               {sortedMessages.length > 0 ? (
                    <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {sortedMessages.slice(0, 5).map(msg => (
                            <li key={msg.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(msg.date).toLocaleString('es-AR')}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 mt-4">No hay mensajes enviados.</p>
                )}
            </div>
        </div>

    </div>
  );
};

export default Dashboard;