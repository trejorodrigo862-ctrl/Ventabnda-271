import { User, Goal, StoreProgress, IndividualProgress, VendedorGoalSet, CajeroGoalSet, TeamGoalSet } from '../types';

const commissionTiers = {
    'Encargado/a': { min: 170000, theo: 280000, max: 384000 },
    'Vendedor/a': { min: 40000, theo: 140000, max: 192000 },
    'Vendedor/a 4 hs': { min: 20000, theo: 70000, max: 96000 },
    'Cajero/a': { min: 40000, theo: 80000, max: 96000 },
};

const managerPerformanceWeights: { key: keyof Omit<StoreProgress, 'id' | 'date'>, weight: number, label: string, goalKey: keyof TeamGoalSet}[] = [
    { key: 'pesos', weight: 0.25, label: 'Venta en Pesos', goalKey: 'metaPesos' },
    { key: 'calzado', weight: 0.22, label: 'U. Calzado', goalKey: 'metaCalzado' },
    { key: 'indumentaria', weight: 0.10, label: 'U. Indumentaria', goalKey: 'metaIndumentaria' },
    { key: 'camiseta', weight: 0.10, label: 'U. Camisetas', goalKey: 'metaCamiseta' },
    { key: 'accesorios', weight: 0.05, label: 'U. Accesorios', goalKey: 'metaAccesorios' },
    { key: 'medias', weight: 0.03, label: 'U. Medias', goalKey: 'metaMedias' },
    { key: 'pesosMcCred', weight: 0.125, label: '$ MC Crédito', goalKey: 'metaPesosMcCred' },
    { key: 'unidadesMcCred', weight: 0.125, label: 'U. MC Crédito', goalKey: 'metaUnidadesMcCred' },
];

const calculateCommissionValue = (score: number, tiers: { min: number; theo: number; max: number }) => {
  if (score < 0.8) return tiers.min;
  if (score >= 1.2) return tiers.max;
  
  if (score < 1.0) {
    const percentage = (score - 0.8) / 0.2;
    return tiers.min + percentage * (tiers.theo - tiers.min);
  }
  
  const percentage = (score - 1.0) / 0.2;
  return tiers.theo + percentage * (tiers.max - tiers.min);
};

interface CalculationParams {
    user: User;
    currentGoal: Goal;
    storeProgress: StoreProgress[];
    individualProgressForUser: IndividualProgress[];
    simulationInput?: Partial<IndividualProgress>;
}

// A helper to safely perform division
const safeDivide = (numerator?: number, denominator?: number): number => {
    const num = numerator || 0;
    const den = denominator || 0;
    if (den === 0) return 0;
    return num / den;
};

export const calculateCommissionData = ({ user, currentGoal, storeProgress, individualProgressForUser, simulationInput = {} }: CalculationParams) => {
    if (!currentGoal.userGoals || !currentGoal.teamGoal) {
        return null;
    }

    const currentMonthStr = currentGoal.month;

    // --- ENCARGADO CALCULATION ---
    if (user.role === 'Encargado') {
        const teamGoal = currentGoal.teamGoal;
        const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
        
        const aggregatedProgress = progressThisMonth.reduce((acc, p) => {
            managerPerformanceWeights.forEach(({ key }) => {
                acc[key] = (acc[key] || 0) + (p[key] || 0);
            });
            return acc;
        }, {} as { [key in keyof Omit<StoreProgress, 'id'|'date'>]: number });

        const performanceDetails = managerPerformanceWeights.map(metric => {
            const actual = aggregatedProgress[metric.key] || 0;
            const goal = teamGoal[metric.goalKey] || 0;
            const achievement = safeDivide(actual, goal);
            const cappedAchievement = Math.min(achievement, 1.2);
            const weightedScore = cappedAchievement * metric.weight;
            return { ...metric, actual, goal, achievement, weightedScore };
        });

        const finalScore = performanceDetails.reduce((sum, item) => sum + item.weightedScore, 0);
        const commission = calculateCommissionValue(finalScore, commissionTiers['Encargado/a']);

        return {
            // FIX: Add 'as const' to help TypeScript with discriminated union type inference.
            role: 'Encargado' as const,
            achievement: finalScore,
            commission: commission,
            details: performanceDetails,
        };
    }

    // --- VENDEDOR & CAJERO CALCULATION ---
    const aggregatedIndividualProgress = individualProgressForUser
        .filter(p => p.date.startsWith(currentMonthStr))
        .reduce((acc, p) => {
            Object.keys(p).forEach(key => {
                const typedKey = key as keyof IndividualProgress;
                if (typedKey !== 'id' && typedKey !== 'date' && typedKey !== 'userId') {
                    acc[typedKey] = (acc[typedKey] || 0) + (p[typedKey] || 0);
                }
            });
            return acc;
        }, {} as Partial<Omit<IndividualProgress, 'id'|'date'|'userId'>>);

    // Apply simulation input on top of aggregated progress
    Object.keys(simulationInput).forEach(key => {
        const typedKey = key as keyof IndividualProgress;
        aggregatedIndividualProgress[typedKey] = (aggregatedIndividualProgress[typedKey] || 0) + (simulationInput[typedKey] || 0);
    });

    const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
    const totalStoreRevenue = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
    const storeRevenueGoal = currentGoal.teamGoal.metaPesos || 0;
    const storeAchievement = safeDivide(totalStoreRevenue, storeRevenueGoal);
    const cappedStoreAchievement = Math.min(storeAchievement, 1.2);

    const scoreVentaSucursal = cappedStoreAchievement;

    if (user.role === 'Vendedor') {
        const userGoals = currentGoal.userGoals[user.id] as VendedorGoalSet;
        if (!userGoals) return null;
        
        const monthlyHours = user.assignedHours?.[currentMonthStr] || 0;
        const tierKey = monthlyHours < 120 ? 'Vendedor/a 4 hs' : 'Vendedor/a';
        const tiers = commissionTiers[tierKey];

        const ach = {
            pesos: safeDivide(aggregatedIndividualProgress.pesos, userGoals.metaPesos),
            calzado: safeDivide(aggregatedIndividualProgress.calzado, userGoals.metaCalzado),
            indumentaria: safeDivide(aggregatedIndividualProgress.indumentaria, userGoals.metaIndumentaria),
            camiseta: safeDivide(aggregatedIndividualProgress.camiseta, userGoals.metaCamiseta),
            accesorios: safeDivide(aggregatedIndividualProgress.accesorios, userGoals.metaAccesorios),
            creditosPesos: safeDivide(aggregatedIndividualProgress.pesosMcCred, userGoals.metaPesosMcCred),
            creditosUnidades: safeDivide(aggregatedIndividualProgress.unidadesMcCred, userGoals.metaUnidadesMcCred),
        };

        const scorePesos = Math.min(ach.pesos, 1.2);
        const scoreCantidades = (
            (Math.min(ach.calzado, 1.2) * 0.40) +
            (Math.min(ach.indumentaria, 1.2) * 0.30) +
            (Math.min(ach.camiseta, 1.2) * 0.20) +
            (Math.min(ach.accesorios, 1.2) * 0.10)
        );
        const scoreCreditos = (Math.min(ach.creditosPesos, 1.2) * 0.5) + (Math.min(ach.creditosUnidades, 1.2) * 0.5);

        const scoreVentaPropia = (scorePesos * 0.25) + (scoreCantidades * 0.50) + (scoreCreditos * 0.25);
        const finalScore = (scoreVentaPropia * 0.70) + (scoreVentaSucursal * 0.30);
        
        const commission = calculateCommissionValue(finalScore, tiers);

        return {
            // FIX: Add 'as const' to help TypeScript with discriminated union type inference.
            role: 'Vendedor' as const,
            commission,
            finalScore: finalScore,
            achievement: finalScore, // Alias for finalScore for consistency
            scoreVentaPropia,
            scoreVentaSucursal,
            details: {
                scorePesos, scoreCantidades, scoreCreditos, ach,
                detailsVentaPropia: { // For manager view compatibility
                    pesos: { achievement: ach.pesos },
                    cantidades: { achievement: scoreCantidades },
                    creditos: { achievement: scoreCreditos },
                }
            }
        };
    }

    if (user.role === 'Cajero') {
        const userGoals = currentGoal.userGoals[user.id] as CajeroGoalSet;
        if (!userGoals) return null;
        
        const monthlyHours = user.assignedHours?.[currentMonthStr] || 0;
        // NOTE: No part-time tier exists for Cajero yet, but the logic is prepared.
        const tierKey = monthlyHours < 120 ? 'Cajero/a' : 'Cajero/a';
        const tiers = commissionTiers[tierKey];

        const ach = {
            medias: safeDivide(aggregatedIndividualProgress.medias, userGoals.metaMedias),
            creditosPesos: safeDivide(aggregatedIndividualProgress.pesosMcCred, userGoals.metaPesosMcCred),
            creditosUnidades: safeDivide(aggregatedIndividualProgress.unidadesMcCred, userGoals.metaUnidadesMcCred),
        };
        
        const scoreMedias = Math.min(ach.medias, 1.2);
        const scoreCreditos = (Math.min(ach.creditosPesos, 1.2) * 0.5) + (Math.min(ach.creditosUnidades, 1.2) * 0.5);

        const scoreVentaPropia = (scoreMedias * 0.25) + (scoreCreditos * 0.75);
        const finalScore = (scoreVentaPropia * 0.70) + (scoreVentaSucursal * 0.30);

        const commission = calculateCommissionValue(finalScore, tiers);

        return {
            // FIX: Add 'as const' to help TypeScript with discriminated union type inference.
            role: 'Cajero' as const,
            commission,
            finalScore,
            achievement: finalScore, // Alias for finalScore for consistency
            scoreVentaPropia,
            scoreVentaSucursal,
            details: {
                ach,
                scoreCreditos,
                detailsVentaPropia: { // For manager view compatibility
                    medias: { achievement: ach.medias },
                    creditos: { achievement: scoreCreditos },
                }
            }
        };
    }

    return null;
};