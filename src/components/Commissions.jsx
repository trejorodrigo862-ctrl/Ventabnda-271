import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { calculateCommissionData } from '../services/commissionService';

const ProgressBar = ({ value }) => {
    const percentage = Math.min(value * 100, 120); // Cap at 120% for display
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
            <div 
                className="bg-indigo-600 dark:bg-red-500 h-4 rounded-full" 
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white mix-blend-difference">
                {(value * 100).toFixed(1)}%
            </span>
        </div>
    );
};

const Commissions = () => {
    const { users, goals, storeProgress, individualProgress } = useAppContext();
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentGoal = goals.find(g => g.month === currentMonthStr);

    const managerData = useMemo(() => {
        if (!currentGoal) return null;
        const manager = users.find(u => u.role === 'Encargado');
        if (!manager) return null;

        const commissionResult = calculateCommissionData({
            user: manager,
            currentGoal,
            storeProgress,
            individualProgressForUser: []
        });

        if (commissionResult?.role !== 'Encargado') return null;

        return {
            manager,
            details: commissionResult.details,
            finalScore: commissionResult.achievement,
            commission: commissionResult.commission
        };
    }, [users, currentGoal, storeProgress]);

    const teamData = useMemo(() => {
        if (!currentGoal) return { vendedores: [], cajeros: [] };
        
        const calculateForRole = (role) => {
            return users
                .filter(u => u.role === role)
                .map(user => {
                    const commissionResult = calculateCommissionData({
                        user,
                        currentGoal,
                        storeProgress,
                        individualProgressForUser: individualProgress.filter(p => p.userId === user.id)
                    });
                    
                    return {
                        ...user,
                        commissionData: commissionResult,
                    };
                });
        };

        const vendedores = calculateForRole('Vendedor');
        const cajeros = calculateForRole('Cajero');
        
        return { vendedores, cajeros };
    }, [users, currentGoal, individualProgress, storeProgress]);

    if (!currentGoal) {
        return (
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Comisiones</h2>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md text-center">
                    <p className="text-slate-500 dark:text-slate-400">No se han definido metas para el mes actual. Por favor, defina las metas en la sección "Metas Mensuales" para poder calcular las comisiones.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Cálculo de Comisiones</h2>
            
            <div className="space-y-8">
                 {/* Manager Section */}
                {managerData && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Comisión de Encargado/a</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Basado en el rendimiento ponderado de la sucursal.</p>
                         <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                                <thead className="bg-gray-50 dark:bg-black">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Métrica</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Real</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Meta</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Alcance</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peso</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Puntaje</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                                    {managerData.details.map(d => (
                                        <tr key={d.key}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200">{d.label}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{d.actual.toLocaleString('es-AR')}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{d.goal.toLocaleString('es-AR')}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-semibold text-indigo-600 dark:text-red-400">{(d.achievement * 100).toFixed(1)}%</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{(d.weight * 100).toFixed(1)}%</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-slate-800 dark:text-slate-100">{(d.weightedScore * 100).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                                 <tfoot className="bg-gray-50 dark:bg-black">
                                    <tr>
                                        <td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-slate-800 dark:text-slate-100 uppercase">Puntaje Final de Rendimiento</td>
                                        <td className="px-3 py-2 text-right text-sm font-extrabold text-indigo-700 dark:text-red-500">{(managerData.finalScore * 100).toFixed(2)}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="text-right bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <span className="text-md font-semibold text-slate-600 dark:text-slate-300">Comisión a Cobrar ({managerData.manager.name}): </span>
                            <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">${managerData.commission.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}

                {/* Team Section */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Comisiones de Vendedores y Cajeros</h3>
                     <div className="mb-8">
                        <h4 className="text-lg font-semibold text-indigo-700 dark:text-red-500 mb-3">Vendedores</h4>
                         <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400 text-purple-800 dark:text-purple-200 p-4 rounded-r-lg mb-4" role="alert">
                            <p className="font-bold">Reglas de Comisión (Vendedores)</p>
                            <ul className="list-disc list-inside text-sm mt-1">
                                <li>El puntaje final se compone de un <strong>70% por rendimiento propio</strong> y un <strong>30% por el rendimiento de la sucursal</strong>.</li>
                                <li>El rendimiento propio pondera el alcance en $, Unidades por categoría y Créditos.</li>
                                <li>El pago final se calcula de forma proporcional entre un mínimo (al 80%) y un máximo (al 120%).</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            {teamData.vendedores.map(v => {
                                const { commissionData } = v;
                                return (
                                    <div key={v.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <p className="font-bold text-md text-slate-800 dark:text-slate-100">{v.name}</p>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Comisión a Cobrar</p>
                                                <p className="font-extrabold text-xl text-green-600 dark:text-green-400">${(commissionData?.commission || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Puntaje Final de Rendimiento</span>
                                                <span className="text-sm font-bold text-indigo-600 dark:text-red-400">{((commissionData?.achievement || 0) * 100).toFixed(1)}%</span>
                                            </div>
                                            <ProgressBar value={commissionData?.achievement || 0} />
                                        </div>
                                        {commissionData?.role === 'Vendedor' && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Propia (Peso: 70%)</p>
                                                    {/* FIX: Access scoreVentaPropia from commissionData, not details */}
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(commissionData.scoreVentaPropia * 100).toFixed(1)}%</span></p>
                                                    <ul className="text-xs mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                                                        <li>- Venta Pesos ($): {((commissionData.details.detailsVentaPropia.pesos.achievement || 0) * 100).toFixed(1)}%</li>
                                                        <li>- Venta Cantidades (U): {((commissionData.details.detailsVentaPropia.cantidades.achievement || 0) * 100).toFixed(1)}%</li>
                                                        <li>- Venta Créditos ($ y U): {((commissionData.details.detailsVentaPropia.creditos.achievement || 0) * 100).toFixed(1)}%</li>
                                                    </ul>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Sucursal (Peso: 30%)</p>
                                                    {/* FIX: Access scoreVentaSucursal from commissionData, not details */}
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(commissionData.scoreVentaSucursal * 100).toFixed(1)}%</span></p>
                                                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">- Basado en Venta Total ($) del local.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold text-indigo-700 dark:text-red-500 mb-3">Cajeros</h4>
                         <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-200 p-4 rounded-r-lg mb-4" role="alert">
                            <p className="font-bold">Reglas de Comisión (Cajeros)</p>
                            <ul className="list-disc list-inside text-sm mt-1">
                                <li>El puntaje final se compone de un <strong>70% por rendimiento propio</strong> y un <strong>30% por el rendimiento de la sucursal</strong>.</li>
                                <li>El rendimiento propio pondera el alcance de metas de Medias (U) y Créditos Mc Cred ($ y U).</li>
                                <li>El pago final se calcula de forma proporcional entre un mínimo (al 80%) y un máximo (al 120%).</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            {teamData.cajeros.map(c => {
                                const { commissionData } = c;
                                return (
                                    <div key={c.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                                        <div className="flex flex-wrap justify-between items-center gap-2">
                                            <p className="font-bold text-md text-slate-800 dark:text-slate-100">{c.name}</p>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Comisión a Cobrar</p>
                                                <p className="font-extrabold text-xl text-green-600 dark:text-green-400">${(commissionData?.commission || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Puntaje Final de Rendimiento</span>
                                                <span className="text-sm font-bold text-indigo-600 dark:text-red-400">{((commissionData?.achievement || 0) * 100).toFixed(1)}%</span>
                                            </div>
                                            <ProgressBar value={commissionData?.achievement || 0} />
                                        </div>
                                        {commissionData?.role === 'Cajero' && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Propia (Peso: 70%)</p>
                                                    {/* FIX: Access scoreVentaPropia from commissionData, not details */}
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(commissionData.scoreVentaPropia * 100).toFixed(1)}%</span></p>
                                                    <ul className="text-xs mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                                                        <li>- Medias (U): {((commissionData.details.detailsVentaPropia.medias.achievement || 0) * 100).toFixed(1)}%</li>
                                                        <li>- Créditos ($ y U): {((commissionData.details.detailsVentaPropia.creditos.achievement || 0) * 100).toFixed(1)}%</li>
                                                    </ul>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Sucursal (Peso: 30%)</p>
                                                    {/* FIX: Access scoreVentaSucursal from commissionData, not details */}
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(commissionData.scoreVentaSucursal * 100).toFixed(1)}%</span></p>
                                                    <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">- Basado en Venta Total ($) del local.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Commissions;
