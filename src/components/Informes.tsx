import React, { useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { VendedorGoalSet, CajeroGoalSet, Goal, StoreProgress, User, IndividualProgress } from '../types';
import { useAppContext } from '../context/AppContext';
import { getDetailedReportAnalysis } from '../services/geminiService';

interface ReportContentProps {
  analysis: string;
  currentMonth: string;
  individualProgress: IndividualProgress[];
  users: User[];
  goals: Goal[];
  storeProgress: StoreProgress[];
}

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100).toFixed(2);
    return (
        <div className="relative w-full bg-slate-200 rounded-full h-4">
            <div className="bg-indigo-600 h-4 rounded-full text-center text-white text-xs" style={{ width: `${displayPercentage}%` }}>
            </div>
             <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800">{displayPercentage}%</span>
        </div>
    );
};

const ReportStat: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div className="bg-slate-100 p-3 rounded-lg text-center">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
);


const ReportContent: React.FC<ReportContentProps> = ({ individualProgress, users, goals, storeProgress, analysis, currentMonth }) => {
    const currentGoal = goals.find(g => g.month === currentMonth);
    const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonth));
    const individualProgressThisMonth = individualProgress.filter(p => p.date.startsWith(currentMonth));
    
    const totalRevenue = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
    const totalUnits = progressThisMonth.reduce((sum, p) => sum + p.unidades, 0);
    const totalTickets = progressThisMonth.reduce((sum, p) => sum + p.tickets, 0);
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    
    const teamGoal = currentGoal?.teamGoal;

    const vendedores = users.filter(u => u.role === 'Vendedor');
    const cajeros = users.filter(u => u.role === 'Cajero');

    return (
        <div id="report-content" className="p-8 bg-white text-black" style={{ width: '794px', minHeight: '1123px' }}>
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-800">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Informe de Rendimiento Mensual</h1>
                    <p className="text-slate-600">Ventas Mc Banda</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{new Date(currentMonth + '-02').toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                    <p className="text-sm text-slate-500">Generado: {new Date().toLocaleDateString('es-AR')}</p>
                </div>
            </div>

            {/* Resumen del Local */}
            <div className="my-6">
                <h2 className="text-xl font-bold text-slate-800 mb-3">Resumen General del Local</h2>
                <div className="grid grid-cols-3 gap-4">
                    <ReportStat label="Ventas Totales" value={`$${totalRevenue.toLocaleString('es-AR')}`} />
                    <ReportStat label="Unidades Totales" value={totalUnits.toLocaleString('es-AR')} />
                    <ReportStat label="Ticket Promedio" value={`$${avgTicket.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`} />
                    <ReportStat label="Meta de Ventas" value={`$${(teamGoal?.metaPesos || 0).toLocaleString('es-AR')}`} />
                    <ReportStat label="Meta de Unidades" value={`${(teamGoal?.metaUnidades || 0).toLocaleString('es-AR')}`} />
                    <ReportStat label="Meta Tickets" value={`${(teamGoal?.metaTickets || 0).toLocaleString('es-AR')}`} />
                </div>
            </div>

            {/* Rendimiento por Miembro */}
            <div className="my-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Rendimiento por Miembro del Equipo</h2>
                <div className="space-y-5">
                    {vendedores.map(vendedor => {
                        const vendedorSales = individualProgressThisMonth.filter(s => s.userId === vendedor.id).reduce((sum, s) => sum + (s.pesos || 0), 0);
                        const vendedorGoal = (currentGoal?.userGoals?.[vendedor.id] as VendedorGoalSet)?.metaPesos || 0;
                        return (
                            <div key={vendedor.id}>
                                <div className="flex justify-between items-end mb-1">
                                    <p className="font-bold text-slate-700">{vendedor.name} <span className="text-sm font-normal text-slate-500">- Vendedor</span></p>
                                    <p className="text-sm text-slate-600 font-medium">
                                        ${vendedorSales.toLocaleString('es-AR')} / <span className="font-bold">${vendedorGoal.toLocaleString('es-AR')}</span>
                                    </p>
                                </div>
                                <ProgressBar value={vendedorSales} max={vendedorGoal} />
                            </div>
                        )
                    })}
                     {cajeros.map(cajero => {
                        const cajeroGoals = (currentGoal?.userGoals?.[cajero.id] as CajeroGoalSet);
                        return (
                            <div key={cajero.id} className="pt-2">
                                <p className="font-bold text-slate-700">{cajero.name} <span className="text-sm font-normal text-slate-500">- Cajero</span></p>
                                <div className="text-xs text-slate-600 grid grid-cols-3 gap-2 mt-1">
                                    <p>Meta MC Cred: <span className="font-bold">${(cajeroGoals?.metaPesosMcCred || 0).toLocaleString('es-AR')}</span></p>
                                    <p>Meta U. MC Cred: <span className="font-bold">{(cajeroGoals?.metaUnidadesMcCred || 0)}</span></p>
                                    <p>Meta Medias: <span className="font-bold">{(cajeroGoals?.metaMedias || 0)}</span></p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Análisis y Plan de Mejora por IA */}
            <div className="my-6 pt-4 border-t border-slate-300">
                <h2 className="text-xl font-bold text-slate-800 mb-3">Análisis y Plan de Mejora por IA</h2>
                {analysis ? (
                    <div className="prose prose-sm max-w-none text-slate-800"
                        dangerouslySetInnerHTML={{
                            __html: analysis
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\n/g, '<br />')
                                .replace(/(\d+\.\s*<strong>.*?<\/strong>)/g, '<h4 class="font-bold text-slate-700 mt-3 mb-1">$1</h4>')
                                .replace(/-\s(.*?)(<br \/>|$)/g, '<li class="ml-4 list-disc">$1</li>')
                        }}>
                    </div>
                ) : (
                    <p className="text-slate-500">El análisis de la IA aparecerá aquí una vez generado.</p>
                )}
            </div>
        </div>
    );
};


const Informes: React.FC = () => {
  const { users, goals, storeProgress, individualProgress } = useAppContext();
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const handleGenerateAnalysis = async () => {
    setIsLoading(true);
    setAnalysis('');
    const currentGoal = goals.find(g => g.month === currentMonth);
    if (!currentGoal) {
        alert("No se han establecido metas para el mes actual. Por favor, créalas en la sección 'Metas Mensuales' antes de generar un informe.");
        setIsLoading(false);
        return;
    }
    const individualProgressThisMonth = individualProgress.filter(p => p.date.startsWith(currentMonth));
    const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonth));
    const response = await getDetailedReportAnalysis(users, currentGoal, progressThisMonth, individualProgressThisMonth);
    setAnalysis(response);
    setIsLoading(false);
  };

  const downloadReport = () => {
    const reportElement = document.getElementById('report-content');
    if (reportElement) {
        setIsLoading(true);
        html2canvas(reportElement, { scale: 2 }) 
            .then((canvas) => {
                const link = document.createElement('a');
                const monthName = new Date(currentMonth + '-02').toLocaleString('es-AR', { month: 'long' });
                link.download = `informe-rendimiento-${monthName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            })
            .finally(() => {
                setIsLoading(false);
            });
    }
  };


  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Informes y Descargas</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Genera un análisis de rendimiento con IA y descarga un informe completo del mes.</p>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleGenerateAnalysis}
                disabled={isLoading}
                className="w-full sm:w-auto flex-1 px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-slate-500 transition-colors"
                >
                {isLoading && !analysis ? 'Analizando...' : 'Generar Análisis con IA'}
            </button>
             <button
                onClick={downloadReport}
                disabled={!analysis || isLoading}
                className="w-full sm:w-auto flex-1 px-6 py-3 font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-slate-100 disabled:text-slate-400 dark:text-red-100 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition-colors"
                >
                {isLoading && analysis ? 'Descargando...' : 'Descargar Informe'}
            </button>
        </div>
      </div>
      
       {isLoading && !analysis && (
          <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-red-500"></div>
            <p className="ml-3 text-slate-600 dark:text-slate-300">Generando análisis, esto puede tardar un momento...</p>
          </div>
        )}

      {analysis && (
         <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Análisis de IA</h3>
            <div className="prose prose-indigo dark:prose-invert max-w-none"
             dangerouslySetInnerHTML={{
                __html: analysis
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />')
                    .replace(/(\d+\.\s*<strong>.*?<\/strong>)/g, '<h4 class="font-bold text-slate-700 mt-4 mb-2">$1</h4>')
                    .replace(/-\s(.*?)(<br \/>|$)/g, '<li class="ml-4 list-disc">$1</li>')
             }}>
            </div>
        </div>
      )}
      
      {/* Hidden element for rendering the report for download */}
       <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <ReportContent 
            individualProgress={individualProgress}
            users={users}
            goals={goals}
            storeProgress={storeProgress}
            analysis={analysis}
            currentMonth={currentMonth}
          />
      </div>

    </div>
  );
};

export default Informes;