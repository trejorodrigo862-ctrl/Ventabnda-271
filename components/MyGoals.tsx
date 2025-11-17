import React from 'react';
import { VendedorGoalSet, CajeroGoalSet } from '../types';
import { useAppContext } from '../context/AppContext';
import { TrophyIcon } from './icons';

const GoalCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex items-center space-x-4">
    {icon && <div className="text-indigo-500 dark:text-red-500">{icon}</div>}
    <div>
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
    </div>
  </div>
);

const MyGoals: React.FC = () => {
  const { currentUser, goals } = useAppContext();
  
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentGoal = goals.find(g => g.month === currentMonthStr);
  
  if (!currentUser) return null;
  const userGoals = currentGoal?.userGoals[currentUser.id];

  const monthName = new Date(currentMonthStr + '-02').toLocaleString('es-AR', {
      month: 'long',
      year: 'numeric'
  });

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Mis Metas</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Tus objetivos para el mes de {monthName}.</p>

      {!userGoals ? (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md text-center">
            <p className="text-slate-500 dark:text-slate-400">Aún no se han asignado metas para este mes.</p>
        </div>
      ) : (
        <div className="space-y-6">
            {currentUser.role === 'Vendedor' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <GoalCard title="Meta de Pesos" value={`$${(userGoals as VendedorGoalSet).metaPesos?.toLocaleString('es-AR') || 0}`} icon={<TrophyIcon className="h-8 w-8"/>} />
                        <GoalCard title="Meta de Unidades" value={(userGoals as VendedorGoalSet).metaUnidades?.toLocaleString('es-AR') || 0} />
                        <GoalCard title="Meta Cantidad de Tickets" value={(userGoals as VendedorGoalSet).metaTickets?.toLocaleString('es-AR') || 0} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Sub-Metas de Unidades por Categoría</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <GoalCard title="Calzado" value={(userGoals as VendedorGoalSet).metaCalzado || 0} />
                             <GoalCard title="Indumentaria" value={(userGoals as VendedorGoalSet).metaIndumentaria || 0} />
                             <GoalCard title="Camisetas" value={(userGoals as VendedorGoalSet).metaCamiseta || 0} />
                             <GoalCard title="Accesorios" value={(userGoals as VendedorGoalSet).metaAccesorios || 0} />
                         </div>
                    </div>
                </>
            )}
             {currentUser.role === 'Cajero' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GoalCard title="Meta Pesos MC Crédito" value={`$${(userGoals as CajeroGoalSet).metaPesosMcCred?.toLocaleString('es-AR') || 0}`} icon={<TrophyIcon className="h-8 w-8"/>} />
                    <GoalCard title="Meta Unidades MC Crédito" value={(userGoals as CajeroGoalSet).metaUnidadesMcCred?.toLocaleString('es-AR') || 0} />
                    <GoalCard title="Meta Unidades Medias" value={(userGoals as CajeroGoalSet).metaMedias?.toLocaleString('es-AR') || 0} />
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default MyGoals;