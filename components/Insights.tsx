import React, { useState, useMemo } from 'react';
import { SaleCategory, TeamGoalSet } from '../types';
import { useAppContext } from '../context/AppContext';
import { getCoachingPlan } from '../services/geminiService';

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100);
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-indigo-600 dark:bg-red-500 h-2.5 rounded-full" style={{ width: `${displayPercentage}%` }}></div>
        </div>
    );
};

const Reports: React.FC = () => {
  const { users, goals, storeProgress, individualProgress } = useAppContext();
  const [prompt, setPrompt] = useState('');
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    setInsight('');
    const currentGoal = goals.find(g => g.month === currentMonth);
    const individualProgressThisMonth = individualProgress.filter(p => p.date.startsWith(currentMonth));
    const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonth));
    const response = await getCoachingPlan(prompt, users, individualProgressThisMonth, currentGoal, progressThisMonth);
    setInsight(response);
    setIsLoading(false);
  };
  
  const rankedTeamUnitGoals = useMemo(() => {
    const individualProgressThisMonth = individualProgress.filter(p => p.date.startsWith(currentMonth));
    const currentGoal = goals.find(g => g.month === currentMonth);
    const teamGoal = currentGoal?.teamGoal;

    if (!teamGoal) return [];
    
    const progressByCategory = individualProgressThisMonth.reduce((acc, p) => {
        acc.Calzado = (acc.Calzado || 0) + (p.calzado || 0);
        acc.Indumentaria = (acc.Indumentaria || 0) + (p.indumentaria || 0);
        acc.Accesorios = (acc.Accesorios || 0) + (p.accesorios || 0);
        acc.Camisetas = (acc.Camisetas || 0) + (p.camiseta || 0);
        acc.Medias = (acc.Medias || 0) + (p.medias || 0);
        return acc;
    }, {} as Record<SaleCategory, number>);

    const goalMap: { key: keyof TeamGoalSet, label: SaleCategory }[] = [
        { key: 'metaCalzado', label: 'Calzado' },
        { key: 'metaIndumentaria', label: 'Indumentaria' },
        { key: 'metaAccesorios', label: 'Accesorios' },
        { key: 'metaCamiseta', label: 'Camisetas' },
        { key: 'metaMedias', label: 'Medias' },
    ];
    
    const goalsWithProgress = goalMap.map(({ key, label }) => {
        const goal = teamGoal[key] || 0;
        const sold = progressByCategory[label] || 0;
        const progress = goal > 0 ? (sold / goal) * 100 : 0;
        return { name: label, sold, goal, progress };
    }).filter(g => g.goal > 0);

    return goalsWithProgress.sort((a, b) => a.progress - b.progress);
  }, [individualProgress, goals, currentMonth]);


  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Reportes e IA</h2>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 mb-6">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Progreso de Metas de Unidades (Equipo)</h3>
        {rankedTeamUnitGoals.length > 0 ? (
            <div className="space-y-4">
                {rankedTeamUnitGoals.map(g => (
                    <div key={g.name}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{g.name}</span>
                            <span className="text-sm font-bold text-indigo-600 dark:text-red-400">
                                {g.progress.toFixed(1)}%
                                <span className="font-medium text-slate-500 dark:text-slate-400 ml-2">({g.sold}/{g.goal})</span>
                            </span>
                        </div>
                        <ProgressBar value={g.sold} max={g.goal} />
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex items-center justify-center h-full min-h-[150px]">
                <p className="text-slate-500 dark:text-slate-400">No hay metas de unidades de equipo asignadas para este mes.</p>
            </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Asistente de Coaching con IA</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">Describe tu objetivo principal para el equipo este mes y la IA generará un plan de acción basado en los datos actuales.</p>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Aumentar la venta de Calzado un 15%"
            className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-red-500 dark:focus:border-red-500"
          />
          <button
            onClick={handleGeneratePlan}
            disabled={isLoading || !prompt}
            className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-slate-500"
          >
            {isLoading ? 'Analizando...' : 'Generar Plan'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-red-500"></div>
            <p className="ml-3 text-slate-600 dark:text-slate-300">Generando plan, por favor espera...</p>
          </div>
        )}
        {insight && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 prose prose-indigo dark:prose-invert max-w-none">
            <h3 className="font-bold text-lg mb-2">Plan de Acción Sugerido:</h3>
            {insight.split('\n').map((line, i) => {
              line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              line = line.replace(/\* (.*)/g, '<li class="ml-4">$1</li>');
              if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                return <h4 key={i} className="font-bold mt-4" dangerouslySetInnerHTML={{ __html: line }} />;
              }
              return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;