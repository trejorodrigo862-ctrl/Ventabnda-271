import React, { createContext, useContext, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Sale, User, Goal, Theme, StoreProgress, Message, IndividualProgress } from '../types';

const currentMonth = new Date().toISOString().slice(0, 7);

const initialUsers: User[] = [
    { id: 'user-1', name: 'Admin', role: 'Encargado', avatarUrl: 'https://i.pravatar.cc/150?u=admin', assignedHours: { [currentMonth]: 160 } },
    { id: 'user-2', name: 'Álvaro', role: 'Vendedor', avatarUrl: 'https://i.pravatar.cc/150?u=alvaro', assignedHours: { [currentMonth]: 140 } },
    { id: 'user-3', name: 'Matías', role: 'Vendedor', avatarUrl: 'https://i.pravatar.cc/150?u=matias', assignedHours: { [currentMonth]: 80 } },
    { id: 'user-4', name: 'Luis', role: 'Cajero', avatarUrl: 'https://i.pravatar.cc/150?u=luis', assignedHours: { [currentMonth]: 120 } },
];

const SALE_CATEGORIES_FOR_MOCK = ['Calzado', 'Indumentaria', 'Accesorios', 'Camisetas', 'Medias'];
const initialSales: Sale[] = Array.from({ length: 50 }, (_, i) => {
    const seller = initialUsers[Math.floor(Math.random() * 2) + 1];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    return {
        id: `sale-${i}`,
        sellerId: seller.id,
        sellerName: seller.name,
        amount: Math.floor(Math.random() * 20000) + 500,
        units: Math.floor(Math.random() * 5) + 1,
        category: SALE_CATEGORIES_FOR_MOCK[Math.floor(Math.random() * SALE_CATEGORIES_FOR_MOCK.length)] as any,
        type: ['Contado', 'Tarjeta'][Math.floor(Math.random() * 2)] as any,
        date: date.toISOString().split('T')[0],
    };
});

const initialGoals: Goal[] = [{
    month: new Date().toISOString().slice(0, 7),
    teamGoal: { 
        metaPesos: 3000000, metaTickets: 350, metaUnidades: 1200,
        metaPesosMcCred: 500000, metaUnidadesMcCred: 200,
        metaCalzado: 500, metaIndumentaria: 350, metaAccesorios: 150,
        metaCamiseta: 150, metaMedias: 50
    },
    userGoals: {
        'user-2': { // Álvaro (Vendedor)
            metaPesos: 150000, metaUnidades: 100,
            metaCalzado: 40, metaIndumentaria: 30, metaCamiseta: 10, metaAccesorios: 15,
        },
        'user-3': { // Matías (Vendedor)
            metaPesos: 150000, metaUnidades: 100,
            metaCalzado: 40, metaIndumentaria: 30, metaCamiseta: 10, metaAccesorios: 15,
        },
        'user-4': { // Luis (Cajero)
            metaPesosMcCred: 50000, metaUnidadesMcCred: 20, metaMedias: 10,
        }
    },
    assignedHoursSnapshot: {
        'user-1': 160,
        'user-2': 140,
        'user-3': 80,
        'user-4': 120,
    }
}];

// Data migration functions
const migrateUsers = (storedData: any): User[] => {
    if (!Array.isArray(storedData)) return initialUsers;
    return storedData.map((user: any) => {
        if (typeof user.assignedHours !== 'object' || user.assignedHours === null) {
            return { ...user, assignedHours: {} };
        }
        return user;
    });
};

const migrateGoals = (storedData: any): Goal[] => {
    if (!Array.isArray(storedData)) return initialGoals;
    return storedData.map((goal: any) => {
        if (!goal.assignedHoursSnapshot) {
            return { ...goal, assignedHoursSnapshot: {} };
        }
        return goal;
    });
};


interface AppContextType {
    users: User[];
    sales: Sale[];
    goals: Goal[];
    storeProgress: StoreProgress[];
    currentUser: User | null;
    isSidebarOpen: boolean;
    theme: Theme;
    messages: Message[];
    individualProgress: IndividualProgress[];
    handleLogin: (user: User) => void;
    handleLogout: () => void;
    addUser: (userData: Omit<User, 'id'>) => void;
    updateUser: (id: string, updatedData: Partial<Omit<User, 'id'>>) => void;
    deleteUser: (id: string) => void;
    addSale: (saleData: Omit<Sale, 'id' | 'sellerName'>) => void;
    deleteSale: (saleId: string) => void;
    handleSetGoals: (newGoalsForMonth: Goal) => void;
    addStoreProgress: (progressData: Omit<StoreProgress, 'id'>) => void;
    updateStoreProgress: (id: string, updatedData: Partial<Omit<StoreProgress, 'id'>>) => void;
    deleteStoreProgress: (id: string) => void;
    addIndividualProgress: (progressData: Omit<IndividualProgress, 'id' | 'userId'>) => void;
    updateIndividualProgress: (id: string, updatedData: Partial<Omit<IndividualProgress, 'id' | 'userId'>>) => void;
    deleteIndividualProgress: (id: string) => void;
    addMessage: (content: string) => void;
    deleteMessage: (id: string) => void;
    setTheme: React.Dispatch<React.SetStateAction<Theme>>;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [users, setUsers] = useLocalStorage<User[]>('mcbanda_users', initialUsers, migrateUsers);
    const [sales, setSales] = useLocalStorage<Sale[]>('mcbanda_sales', initialSales);
    const [goals, setGoals] = useLocalStorage<Goal[]>('mcbanda_goals', initialGoals, migrateGoals);
    const [storeProgress, setStoreProgress] = useLocalStorage<StoreProgress[]>('mcbanda_store_progress', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('mcbanda_currentUser', null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useLocalStorage<Theme>('mcbanda_theme', 'dark');
    const [messages, setMessages] = useLocalStorage<Message[]>('mcbanda_messages', []);
    const [individualProgress, setIndividualProgress] = useLocalStorage<IndividualProgress[]>('mcbanda_individual_progress', []);

    const handleLogin = (user: User) => setCurrentUser(user);
    const handleLogout = () => setCurrentUser(null);

    const addUser = (userData: Omit<User, 'id'>) => {
        const newUser: User = { ...userData, id: new Date().getTime().toString(), assignedHours: {} };
        setUsers([...users, newUser]);
    };

    const updateUser = (id: string, updatedData: Partial<Omit<User, 'id'>>) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === id ? { ...u, ...updatedData } : u));
        if (currentUser && currentUser.id === id) {
             setCurrentUser(prevUser => (prevUser ? { ...prevUser, ...updatedData } : null) as User | null);
        }
    };

    const deleteUser = (id: string) => {
        if (sales.some(sale => sale.sellerId === id)) {
            alert("No se puede eliminar un usuario con ventas asociadas.");
            return;
        }
        setUsers(users.filter(u => u.id !== id));
    };

    const addSale = (saleData: Omit<Sale, 'id' | 'sellerName'>) => {
        const seller = users.find(u => u.id === saleData.sellerId);
        if (!seller) return;
        const newSale: Sale = { ...saleData, id: new Date().getTime().toString(), sellerName: seller.name };
        setSales([...sales, newSale]);
    };

    const deleteSale = (saleId: string) => setSales(sales.filter(s => s.id !== saleId));

    const handleSetGoals = (newGoalsForMonth: Goal) => {
        const otherMonthsGoals = goals.filter(g => g.month !== newGoalsForMonth.month);
        setGoals([...otherMonthsGoals, newGoalsForMonth]);
    };

    const addStoreProgress = (progressData: Omit<StoreProgress, 'id'>) => {
        const newProgress: StoreProgress = { ...progressData, id: new Date().getTime().toString() };
        setStoreProgress(prev => [newProgress, ...prev]);
    };

    const updateStoreProgress = (id: string, updatedData: Partial<Omit<StoreProgress, 'id'>>) => {
        setStoreProgress(storeProgress.map(p => p.id === id ? { ...p, ...updatedData } : p));
    };

    const deleteStoreProgress = (id: string) => {
        setStoreProgress(storeProgress.filter(p => p.id !== id));
    };

    const addIndividualProgress = (progressData: Omit<IndividualProgress, 'id' | 'userId'>) => {
        if (!currentUser) return;
        const newProgress: IndividualProgress = { ...progressData, id: new Date().getTime().toString(), userId: currentUser.id };
        setIndividualProgress(prev => [newProgress, ...prev]);
    };

    const updateIndividualProgress = (id: string, updatedData: Partial<Omit<IndividualProgress, 'id' | 'userId'>>) => {
        setIndividualProgress(individualProgress.map(p => (p.id === id ? { ...p, ...updatedData } : p)));
    };

    const deleteIndividualProgress = (id: string) => {
        setIndividualProgress(individualProgress.filter(p => p.id !== id));
    };

    const addMessage = (content: string) => {
        const newMessage: Message = { id: new Date().getTime().toString(), content, date: new Date().toISOString() };
        setMessages(prev => [newMessage, ...prev]);
    };

    const deleteMessage = (id: string) => setMessages(messages.filter(m => m.id !== id));

    const value = {
        users, sales, goals, storeProgress, currentUser, isSidebarOpen, theme, messages, individualProgress,
        handleLogin, handleLogout, addUser, updateUser, deleteUser, addSale, deleteSale, handleSetGoals,
        addStoreProgress, updateStoreProgress, deleteStoreProgress, addIndividualProgress, updateIndividualProgress,
        deleteIndividualProgress, addMessage, deleteMessage, setTheme, setIsSidebarOpen
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
