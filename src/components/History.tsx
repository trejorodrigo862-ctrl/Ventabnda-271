import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Goal, StoreProgress, IndividualProgress, User, TeamGoalSet, VendedorGoalSet, CajeroGoalSet } from '../types';

const formatMonth = (monthStr: string) => {
    return new Date(monthStr + '-02').toLocaleString('es-AR', {
        month: 'long',
        year: 'numeric'
    });
};

const safeDivide = (numerator?: number, denominator?: number): number => {
    const num = numerator || 0;
    const den = denominator || 0;
    if (den === 0) return 0;
    return num / den;
};

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100);
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div className="bg-indigo-600 dark:bg-red-500 h-4 rounded-full text-center text-white text-xs" style={{ width: `${displayPercentage}%` }}>
            </div>
        </div>
    );
};

interface MetricRowProps {
    label: string;
    achieved: number;
    goal: number;
    isCurrency?: boolean;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, achieved, goal, isCurrency }) => {
    const formatValue = (val: number) => isCurrency ? `$${val.toLocaleString('es-AR')}` : val.toLocaleString('es-AR');
    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                    {formatValue(achieved)} / <span className="font-bold text-slate-700 dark:text-slate-200">{formatValue(goal)}</span>
                </span>
            </div>
            <ProgressBar value={achieved} max={goal} />
        </div>
    );
};


interface DetailViewProps {
    month: string;
    onBack: () => void;
}

const DetailView: React.FC<DetailViewProps> = ({ month, onBack }) => {
    const { goals, users, storeProgress, individualProgress } = useAppContext();

    const data = useMemo(() => {
        const goalForMonth = goals.find(g => g.month === month);
        if (!goalForMonth) return null;

        const progressForMonth = storeProgress.filter(p => p.date.startsWith(month));
        
        // Team achievements
        const teamAchievements = progressForMonth.reduce((acc, p) => {
            (Object.keys(p) as Array<keyof StoreProgress>).forEach(key => {
                if (key !== 'id' && key !== 'date' && typeof p[key] === 'number') {
                    acc[key] = (acc[key] || 0) + (p[key] as number);
                }
            });
            return acc;
        }, {} as Partial<Omit<StoreProgress, 'id' | 'date'>>);

        // Individual achievements
        const individualAchievements = users.reduce((acc, user) => {
            const userProgress = individualProgress
                .filter(p => p.userId === user.id && p.date.startsWith(month))
                .reduce((userAcc, p) => {
                    (Object.keys(p) as Array<keyof IndividualProgress>).forEach(key => {
                         if (key !== 'id' && key !== 'date' && key !== 'userId' && typeof p[key] === 'number') {
                            userAcc[key] = (userAcc[key] || 0) + (p[key] as number);
                        }
                    });
                    return userAcc;
                }, {} as Partial<Omit<IndividualProgress, 'id' | 'date' | 'userId'>>);
            acc[user.id] = userProgress;
            return acc;
        }, {} as { [userId: string]: Partial<Omit<IndividualProgress, 'id' | 'date' | 'userId'>> });

        return { goalForMonth, teamAchievements, individualAchievements };
    }, [month, goals, users, storeProgress, individualProgress]);

    if (!data) {
        return <p>No se encontraron datos para este mes.</p>;
    }
    
    const { goalForMonth, teamAchievements, individualAchievements } = data;
    const teamGoal = goalForMonth.teamGoal as TeamGoalSet;

    return (
        <div className="space-y-8">
            <button onClick={onBack} className="text-indigo-600 dark:text-red-500 hover:underline">
                &larr; Volver a la lista de meses
            </button>

            {/* Team Performance */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Rendimiento General del Equipo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <MetricRow label="Venta Total" achieved={teamAchievements.pesos || 0} goal={teamGoal.metaPesos || 0} isCurrency />
                    <MetricRow label="Unidades Totales" achieved={teamAchievements.unidades || 0} goal={teamGoal.metaUnidades || 0} />
                    <MetricRow label="Total Tickets" achieved={teamAchievements.tickets || 0} goal={teamGoal.metaTickets || 0} />
                    <MetricRow label="MC Crédito ($)" achieved={teamAchievements.pesosMcCred || 0} goal={teamGoal.metaPesosMcCred || 0} isCurrency />
                    <MetricRow label="MC Crédito (U)" achieved={teamAchievements.unidadesMcCred || 0} goal={teamGoal.metaUnidadesMcCred || 0} />
                </div>
            </div>
            
             {/* Individual Performance */}
            <div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Rendimiento Individual</h3>
                 <div className="space-y-6">
                    {users.filter(u => u.role !== 'Encargado').map(user => {
                        const userGoal = goalForMonth.userGoals[user.id];
                        const userAchieved = individualAchievements[user.id];
                        if (!userGoal) return null;

                        return (
                            <div key={user.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                  <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">{user.name} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({user.role})</span></h4>
                                   <div className="text-right">
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Horas Asignadas</p>
                                        <p className="font-bold text-lg text-indigo-700 dark:text-red-500">
                                            {goalForMonth.assignedHoursSnapshot?.[user.id] ?? 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {user.role === 'Vendedor' && (
                                    <>
                                        <MetricRow label="Venta ($)" achieved={userAchieved.pesos || 0} goal={(userGoal as VendedorGoalSet).metaPesos || 0} isCurrency />
                                        <MetricRow label="Unidades" achieved={userAchieved.unidades || 0} goal={(userGoal as VendedorGoalSet).metaUnidades || 0} />
                                        <MetricRow label="Calzado (U)" achieved={userAchieved.calzado || 0} goal={(userGoal as VendedorGoalSet).metaCalzado || 0} />
                                        <MetricRow label="Indumentaria (U)" achieved={userAchieved.indumentaria || 0} goal={(userGoal as VendedorGoalSet).metaIndumentaria || 0} />
                                    </>
                                )}
                                 {user.role === 'Cajero' && (
                                    <>
                                        <MetricRow label="MC Crédito ($)" achieved={userAchieved.pesosMcCred || 0} goal={(userGoal as CajeroGoalSet).metaPesosMcCred || 0} isCurrency />
                                        <MetricRow label="MC Crédito (U)" achieved={userAchieved.unidadesMcCred || 0} goal={(userGoal as CajeroGoalSet).metaUnidadesMcCred || 0} />
                                        <MetricRow label="Medias (U)" achieved={userAchieved.medias || 0} goal={(userGoal as CajeroGoalSet).metaMedias || 0} />
                                    </>
                                )}
                                </div>
                            </div>
                        )
                    })}
                 </div>
            </div>
        </div>
    )
};


const History: React.FC = () => {
    const { goals } = useAppContext();
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const savedGoals = useMemo(() => {
        return goals
            .slice()
            .sort((a, b) => b.month.localeCompare(a.month));
    }, [goals]);

    if (selectedMonth) {
        return <DetailView month={selectedMonth} onBack={() => setSelectedMonth(null)} />;
    }

    return (
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Historial de Metas Guardadas y Rendimiento</h2>

            {savedGoals.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {savedGoals.map(goal => (
                        <div 
                            key={goal.month}
                            onClick={() => setSelectedMonth(goal.month)}
                            className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 cursor-pointer transform hover:-translate-y-1 transition-transform duration-300"
                        >
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-red-500 text-center capitalize">
                                {formatMonth(goal.month)}
                            </h3>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md text-center">
                    <p className="text-slate-500 dark:text-slate-400">No hay metas guardadas para mostrar.</p>
                </div>
            )}
        </div>
    );
};

export default History;