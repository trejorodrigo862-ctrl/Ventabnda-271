import React, { useState, useMemo } from 'react';
import { IndividualProgress } from '../types';
import { useAppContext } from '../context/AppContext';
import { calculateCommissionData } from '../services/commissionService';
import FormattedInput from './FormInputs';

const ResultCard: React.FC<{ title: string; value: string; isProjected?: boolean }> = ({ title, value, isProjected }) => (
    <div className={`p-4 rounded-lg ${isProjected ? 'bg-green-100 dark:bg-green-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-2xl font-bold ${isProjected ? 'text-green-600 dark:text-green-400' : 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
);

const CommissionCalculator: React.FC = () => {
    const { currentUser, users, goals, storeProgress, individualProgress } = useAppContext();
    const teamMembers = useMemo(() => users.filter(u => u.role !== 'Encargado'), [users]);
    
    if (!currentUser) return null;

    const [selectedUserId, setSelectedUserId] = useState(currentUser.role === 'Encargado' ? teamMembers[0]?.id : currentUser.id);
    const [simulationInput, setSimulationInput] = useState<Partial<IndividualProgress>>({});

    const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId), [users, selectedUserId]);
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentGoal = goals.find(g => g.month === currentMonthStr);

    const handleSimInputChange = (field: keyof IndividualProgress, value: string | number) => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        setSimulationInput(prev => ({ ...prev, [field]: isNaN(numericValue) ? 0 : numericValue }));
    };

    const calculationArgs = useMemo(() => {
        if (!selectedUser || !currentGoal) return null;
        return {
            user: selectedUser,
            currentGoal,
            storeProgress,
            individualProgressForUser: individualProgress.filter(p => p.userId === selectedUser.id),
        };
    }, [selectedUser, currentGoal, storeProgress, individualProgress]);

    const currentData = useMemo(() => {
        if (!calculationArgs) return null;
        return calculateCommissionData({ ...calculationArgs });
    }, [calculationArgs]);
    
    const projectedData = useMemo(() => {
        if (!calculationArgs) return null;
        return calculateCommissionData({ ...calculationArgs, simulationInput });
    }, [calculationArgs, simulationInput]);

    if (!selectedUser || !currentGoal) {
        return (
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Calculadora de Comisiones</h2>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md text-center">
                    <p className="text-slate-500 dark:text-slate-400">No se pueden calcular las comisiones. Asegúrate de que haya metas definidas para el mes actual y miembros en el equipo.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Calculadora de Comisiones</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Panel */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Simulador de Rendimiento</h3>
                    
                    {currentUser.role === 'Encargado' && (
                        <div className="mb-4">
                            <label htmlFor="user-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar Miembro</label>
                            <select 
                                id="user-select"
                                value={selectedUserId}
                                onChange={e => {
                                    setSelectedUserId(e.target.value);
                                    setSimulationInput({});
                                }}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-md">
                                {teamMembers.map(user => <option key={user.id} value={user.id}>{user.name} ({user.role})</option>)}
                            </select>
                        </div>
                    )}

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Introduce el rendimiento ADICIONAL que quieres simular para este mes.</p>

                    <div className="space-y-4">
                        {selectedUser.role === 'Vendedor' && (
                            <>
                                <FormattedInput isCurrency label="Venta en Pesos ($)" name="pesos" value={simulationInput.pesos || 0} onChange={v => handleSimInputChange('pesos', v)} />
                                <FormattedInput type="number" label="Unidades Calzado" name="calzado" value={simulationInput.calzado || 0} onChange={v => handleSimInputChange('calzado', v)} />
                                <FormattedInput type="number" label="Unidades Indumentaria" name="indumentaria" value={simulationInput.indumentaria || 0} onChange={v => handleSimInputChange('indumentaria', v)} />
                                <FormattedInput type="number" label="Unidades Camisetas" name="camiseta" value={simulationInput.camiseta || 0} onChange={v => handleSimInputChange('camiseta', v)} />
                                <FormattedInput type="number" label="Unidades Accesorios" name="accesorios" value={simulationInput.accesorios || 0} onChange={v => handleSimInputChange('accesorios', v)} />
                                <FormattedInput isCurrency label="MC Crédito ($)" name="pesosMcCred" value={simulationInput.pesosMcCred || 0} onChange={v => handleSimInputChange('pesosMcCred', v)} />
                                <FormattedInput type="number" label="MC Crédito (U)" name="unidadesMcCred" value={simulationInput.unidadesMcCred || 0} onChange={v => handleSimInputChange('unidadesMcCred', v)} />
                            </>
                        )}
                        {selectedUser.role === 'Cajero' && (
                            <>
                                <FormattedInput type="number" label="Unidades Medias" name="medias" value={simulationInput.medias || 0} onChange={v => handleSimInputChange('medias', v)} />
                                <FormattedInput isCurrency label="MC Crédito ($)" name="pesosMcCred" value={simulationInput.pesosMcCred || 0} onChange={v => handleSimInputChange('pesosMcCred', v)} />
                                <FormattedInput type="number" label="MC Crédito (U)" name="unidadesMcCred" value={simulationInput.unidadesMcCred || 0} onChange={v => handleSimInputChange('unidadesMcCred', v)} />
                            </>
                        )}
                    </div>
                </div>

                {/* Results Panel */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Resultados Proyectados</h3>
                    <div className="space-y-4">
                        <ResultCard title="Comisión Actual (Estimada)" value={`$${(currentData?.commission || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`} />
                        <ResultCard title="Comisión Proyectada" value={`$${(projectedData?.commission || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`} isProjected/>
                        <ResultCard title="Puntaje Rendimiento Proyectado" value={`${((projectedData?.finalScore || 0) * 100).toFixed(1)}%`} isProjected/>
                        
                        <div className="pt-4 border-t dark:border-gray-700">
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Desglose del Puntaje Proyectado</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Rendimiento Propio (70%)</span>
                                <span className="font-bold text-indigo-600 dark:text-red-400">{((projectedData?.scoreVentaPropia || 0) * 100).toFixed(1)}%</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Rendimiento Sucursal (30%)</span>
                                <span className="font-bold text-indigo-600 dark:text-red-400">{((projectedData?.scoreVentaSucursal || 0) * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommissionCalculator;