import React, { createContext, useContext, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const currentMonth = new Date().toISOString().slice(0, 7);

const initialUsers = [
    { id: 'user-1', name: 'Admin', role: 'Encargado', avatarUrl: 'https://i.pravatar.cc/150?u=admin', assignedHours: { [currentMonth]: 160 } },
    { id: 'user-2', name: 'Álvaro', role: 'Vendedor', avatarUrl: 'https://i.pravatar.cc/150?u=alvaro', assignedHours: { [currentMonth]: 140 } },
    { id: 'user-3', name: 'Matías', role: 'Vendedor', avatarUrl: 'https://i.pravatar.cc/150?u=matias', assignedHours: { [currentMonth]: 80 } },
    { id: 'user-4', name: 'Luis', role: 'Cajero', avatarUrl: 'https://i.pravatar.cc/150?u=luis', assignedHours: { [currentMonth]: 120 } },
];

const SALE_CATEGORIES_FOR_MOCK = ['Calzado', 'Indumentaria', 'Accesorios', 'Camisetas', 'Medias'];
const initialSales = Array.from({ length: 50 }, (_, i) => {
    const seller = initialUsers[Math.floor(Math.random() * 2) + 1];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    return {
        id: `sale-${i}`,
        sellerId: seller.id,
        sellerName: seller.name,
        amount: Math.floor(Math.random() * 20000) + 500,
        units: Math.floor(Math.random() * 5) + 1,
        category: SALE_CATEGORIES_FOR_MOCK[Math.floor(Math.random() * SALE_CATEGORIES_FOR_MOCK.length)],
        type: ['Contado', 'Tarjeta'][Math.floor(Math.random() * 2)],
        date: date.toISOString().split('T')[0],
    };
});

const initialGoals = [{
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
const migrateUsers = (storedData) => {
    if (!Array.isArray(storedData)) return initialUsers;
    return storedData.map((user) => {
        if (typeof user.assignedHours !== 'object' || user.assignedHours === null) {
            return { ...user, assignedHours: {} };
        }
        return user;
    });
};

const migrateGoals = (storedData) => {
    if (!Array.isArray(storedData)) return initialGoals;
    return storedData.map((goal) => {
        if (!goal.assignedHoursSnapshot) {
            return { ...goal, assignedHoursSnapshot: {} };
        }
        return goal;
    });
};


const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [users, setUsers] = useLocalStorage('mcbanda_users', initialUsers, migrateUsers);
    const [sales, setSales] = useLocalStorage('mcbanda_sales', initialSales);
    const [goals, setGoals] = useLocalStorage('mcbanda_goals', initialGoals, migrateGoals);
    const [storeProgress, setStoreProgress] = useLocalStorage('mcbanda_store_progress', []);
    const [currentUser, setCurrentUser] = useLocalStorage('mcbanda_currentUser', null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useLocalStorage('mcbanda_theme', 'dark');
    const [messages, setMessages] = useLocalStorage('mcbanda_messages', []);
    const [individualProgress, setIndividualProgress] = useLocalStorage('mcbanda_individual_progress', []);

    const handleLogin = (user) => setCurrentUser(user);
    const handleLogout = () => setCurrentUser(null);

    const addUser = (userData) => {
        const newUser = { ...userData, id: new Date().getTime().toString(), assignedHours: {} };
        setUsers([...users, newUser]);
    };

    const updateUser = (id, updatedData) => {
        setUsers(prevUsers => prevUsers.map(u => u.id === id ? { ...u, ...updatedData } : u));
        if (currentUser && currentUser.id === id) {
             setCurrentUser(prevUser => (prevUser ? { ...prevUser, ...updatedData } : null));
        }
    };

    const deleteUser = (id) => {
        if (sales.some(sale => sale.sellerId === id)) {
            alert("No se puede eliminar un usuario con ventas asociadas.");
            return;
        }
        setUsers(users.filter(u => u.id !== id));
    };

    const addSale = (saleData) => {
        const seller = users.find(u => u.id === saleData.sellerId);
        if (!seller) return;
        const newSale = { ...saleData, id: new Date().getTime().toString(), sellerName: seller.name };
        setSales([...sales, newSale]);
    };

    const deleteSale = (saleId) => setSales(sales.filter(s => s.id !== saleId));

    const handleSetGoals = (newGoalsForMonth) => {
        const otherMonthsGoals = goals.filter(g => g.month !== newGoalsForMonth.month);
        setGoals([...otherMonthsGoals, newGoalsForMonth]);
    };

    const addStoreProgress = (progressData) => {
        const newProgress = { ...progressData, id: new Date().getTime().toString() };
        setStoreProgress(prev => [newProgress, ...prev]);
    };

    const updateStoreProgress = (id, updatedData) => {
        setStoreProgress(storeProgress.map(p => p.id === id ? { ...p, ...updatedData } : p));
    };

    const deleteStoreProgress = (id) => {
        setStoreProgress(storeProgress.filter(p => p.id !== id));
    };

    const addIndividualProgress = (progressData) => {
        if (!currentUser) return;
        const newProgress = { ...progressData, id: new Date().getTime().toString(), userId: currentUser.id };
        setIndividualProgress(prev => [newProgress, ...prev]);
    };

    const updateIndividualProgress = (id, updatedData) => {
        setIndividualProgress(individualProgress.map(p => (p.id === id ? { ...p, ...updatedData } : p)));
    };

    const deleteIndividualProgress = (id) => {
        setIndividualProgress(individualProgress.filter(p => p.id !== id));
    };

    const addMessage = (content) => {
        const newMessage = { id: new Date().getTime().toString(), content, date: new Date().toISOString() };
        setMessages(prev => [newMessage, ...prev]);
    };

    const deleteMessage = (id) => setMessages(messages.filter(m => m.id !== id));

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
