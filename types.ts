export type UserRole = 'Encargado' | 'Vendedor' | 'Cajero';

export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  assignedHours?: { [month: string]: number };
}

export type SaleCategory = 'Calzado' | 'Indumentaria' | 'Accesorios' | 'Camisetas' | 'Medias';
export type SaleType = 'Contado' | 'Credito Personal' | 'Tarjeta';

export interface Sale {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  units: number;
  category: SaleCategory;
  type: SaleType;
  date: string; // YYYY-MM-DD
}

export interface Message {
  id: string;
  content: string;
  date: string; // ISO String
}


// NEW: Goal structures
export interface TeamGoalSet {
    metaPesos?: number;
    metaTickets?: number;
    metaUnidades?: number;
    metaPesosMcCred?: number;
    metaUnidadesMcCred?: number;
    // Sub-metas de unidades por categoría
    metaCalzado?: number;
    metaIndumentaria?: number;
    metaAccesorios?: number;
    metaCamiseta?: number;
    metaMedias?: number;
}

export interface VendedorGoalSet {
    metaPesos?: number;
    metaTickets?: number;
    metaUnidades?: number;
    metaPesosMcCred?: number;
    metaUnidadesMcCred?: number;
    // Sub-metas por categoría
    metaCalzado?: number;
    metaIndumentaria?: number;
    metaCamiseta?: number;
    metaAccesorios?: number;
}

export interface CajeroGoalSet {
    metaPesosMcCred?: number;
    metaUnidadesMcCred?: number;
    metaMedias?: number;
}

// UPDATE: Goal interface
export interface Goal {
    month: string; // YYYY-MM
    teamGoal: TeamGoalSet; // Use the new structure
    userGoals: {
        [userId: string]: VendedorGoalSet | CajeroGoalSet;
    };
    assignedHoursSnapshot: {
        [userId: string]: number;
    };
}

export interface StoreProgress {
    id: string;
    date: string; // YYYY-MM-DD
    pesos: number;
    tickets: number;
    unidades: number;
    calzado: number;
    indumentaria: number;
    camiseta: number;
    accesorios: number;
    medias: number;
    pesosMcCred: number;
    unidadesMcCred: number;
}

export interface IndividualProgress {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  // Vendedor fields
  pesos?: number;
  unidades?: number;
  tickets?: number;
  calzado?: number;
  indumentaria?: number;
  camiseta?: number;
  accesorios?: number;
  // Shared fields (Vendedor & Cajero)
  pesosMcCred?: number;
  unidadesMcCred?: number;
  // Cajero fields
  medias?: number;
}