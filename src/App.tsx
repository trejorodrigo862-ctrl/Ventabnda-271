import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, query, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ShoppingCart, LayoutGrid, Users, DollarSign, LogOut, Loader2, Menu } from 'lucide-react';

// ====================================================================
// 1. FIREBASE SETUP & CONTEXTS
// ====================================================================

// Global variables provided by the environment
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to get the current user's collection path
const getUserCollectionPath = (userId: string) => 
  `artifacts/${appId}/users/${userId}/sales_data`;
  
// Helper function to get a document reference
const getDocRef = (userId: string, docId: string) =>
  doc(db, getUserCollectionPath(userId), docId);

// --- Types ---

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  date: string; // ISO date string
}

interface AppContextType {
  user: User | null;
  userId: string | null;
  isAuthReady: boolean;
  products: Product[];
  sales: Sale[];
  isLoadingData: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProductStock: (productId: string, newStock: number) => Promise<void>;
  recordSale: (productId: string, productName: string, quantity: number, price: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
};

// ====================================================================
// 2. AUTHENTICATION & PROVIDER
// ====================================================================

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const userId = user?.uid || null;

  // --- Auth Effect ---
  useEffect(() => {
    const signIn = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    signIn();
    return () => unsubscribe();
  }, []);

  // --- Data Fetching Effect (Firestore) ---
  useEffect(() => {
    if (!isAuthReady || !userId) {
      // Data queries must wait until authentication is complete and userId is available
      return;
    }

    setIsLoadingData(true);
    
    // 1. Initial Data Setup (if documents don't exist, create them)
    const setupInitialData = async () => {
        const productDocRef = getDocRef(userId, 'products');
        const salesDocRef = getDocRef(userId, 'sales');

        // Check and create products collection structure
        await setDoc(productDocRef, { items: [] }, { merge: true });
        // Check and create sales collection structure
        await setDoc(salesDocRef, { records: [] }, { merge: true });

        // 2. Real-time Listeners (onSnapshot)
        const unsubscribeProducts = onSnapshot(productDocRef, (docSnap) => {
          const data = docSnap.data();
          if (data && data.items) {
            setProducts(data.items as Product[]);
          }
          setIsLoadingData(false);
        }, (error) => {
          console.error("Error al escuchar productos:", error);
          setIsLoadingData(false);
        });

        const unsubscribeSales = onSnapshot(salesDocRef, (docSnap) => {
          const data = docSnap.data();
          if (data && data.records) {
            setSales(data.records.reverse() as Sale[]); // Reverse to show latest first
          }
        }, (error) => {
          console.error("Error al escuchar ventas:", error);
        });
        
        return () => {
          unsubscribeProducts();
          unsubscribeSales();
        };
    };

    setupInitialData();

  }, [isAuthReady, userId]);

  // --- Firestore Actions ---

  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!userId) return;
    try {
      const newProduct: Product = {
        ...product,
        id: crypto.randomUUID(),
      };
      const productDocRef = getDocRef(userId, 'products');
      await updateDoc(productDocRef, {
        items: arrayUnion(newProduct)
      });
    } catch (e) {
      console.error("Error al añadir producto:", e);
    }
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    if (!userId) return;
    try {
      const productDocRef = getDocRef(userId, 'products');
      const updatedProducts = products.map(p =>
        p.id === productId ? { ...p, stock: newStock } : p
      );
      
      await setDoc(productDocRef, { items: updatedProducts });
    } catch (e) {
      console.error("Error al actualizar stock:", e);
    }
  };

  const recordSale = async (productId: string, productName: string, quantity: number, price: number) => {
    if (!userId) return;
    
    const product = products.find(p => p.id === productId);
    if (!product || product.stock < quantity) {
      console.error("Error: Stock insuficiente o producto no encontrado");
      return;
    }

    try {
      // 1. Record the sale
      const newSale: Sale = {
        id: crypto.randomUUID(),
        productId,
        productName,
        quantity,
        total: quantity * price,
        date: new Date().toISOString(),
      };
      
      const salesDocRef = getDocRef(userId, 'sales');
      await updateDoc(salesDocRef, {
        records: arrayUnion(newSale)
      });
      
      // 2. Update the product stock
      const newStock = product.stock - quantity;
      await updateProductStock(productId, newStock);

    } catch (e) {
      console.error("Error al registrar venta:", e);
    }
  };

  const value = {
    user,
    userId,
    isAuthReady,
    products,
    sales,
    isLoadingData,
    addProduct,
    updateProductStock,
    recordSale,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ====================================================================
// 3. COMPONENTS
// ====================================================================

// --- Shared UI Components ---

const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg ${className}`}>
    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{title}</h2>
    {children}
  </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    className={`px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition duration-150 shadow-md disabled:opacity-50 ${props.className}`}
  >
    {props.children}
  </button>
);

// --- Page Components ---

const Dashboard: React.FC = () => {
  const { products, sales } = useApp();

  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2);
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const productsLowStock = products.filter(p => p.stock < 10);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900">Panel de Control (Dashboard)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Valor Total de Ventas" className="bg-indigo-50 border-indigo-200 border">
          <p className="text-4xl font-mono text-indigo-700">${totalSalesValue}</p>
          <p className="text-sm text-gray-500 mt-1">Registrado en {sales.length} transacciones.</p>
        </Card>
        <Card title="Total de Ítems Vendidos" className="bg-green-50 border-green-200 border">
          <p className="text-4xl font-mono text-green-700">{totalItemsSold}</p>
          <p className="text-sm text-gray-500 mt-1">Unidades despachadas.</p>
        </Card>
        <Card title="Productos con Bajo Stock" className="bg-red-50 border-red-200 border">
          <p className="text-4xl font-mono text-red-700">{productsLowStock.length}</p>
          <p className="text-sm text-gray-500 mt-1">¡Necesitan reabastecimiento urgente!</p>
        </Card>
      </div>

      <Card title="Inventario de Productos">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.slice(0, 5).map(p => (
                <tr key={p.id} className={p.stock < 10 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: p.stock < 10 ? '#dc2626' : '#10b981' }}>{p.stock}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No hay productos. Ve a la sección 'Inventario' para agregar algunos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const Inventory: React.FC = () => {
  const { products, addProduct, updateProductStock } = useApp();
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '' });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState<number | ''>('');

  const handleAddProduct = () => {
    const price = parseFloat(newProduct.price);
    const stock = parseInt(newProduct.stock, 10);
    if (newProduct.name && !isNaN(price) && !isNaN(stock) && price > 0 && stock >= 0) {
      addProduct({ name: newProduct.name, price, stock });
      setNewProduct({ name: '', price: '', stock: '' });
    } else {
      console.error("Datos de producto inválidos");
    }
  };

  const startEditStock = (product: Product) => {
    setEditingStockId(product.id);
    setNewStockValue(product.stock);
  };

  const saveNewStock = async (productId: string) => {
    if (newStockValue !== '' && newStockValue >= 0) {
      await updateProductStock(productId, newStockValue);
      setEditingStockId(null);
      setNewStockValue('');
    }
  };
  
  const ProductForm = () => (
    <Card title="Agregar Nuevo Producto" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Nombre del Producto"
          value={newProduct.name}
          onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
          className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
        <input
          type="number"
          placeholder="Precio ($)"
          value={newProduct.price}
          onChange={(e) => setNewProduct(p => ({ ...p, price: e.target.value }))}
          className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          min="0.01"
          step="0.01"
        />
        <input
          type="number"
          placeholder="Stock Inicial"
          value={newProduct.stock}
          onChange={(e) => setNewProduct(p => ({ ...p, stock: e.target.value }))}
          className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          min="0"
          step="1"
        />
      </div>
      <Button onClick={handleAddProduct} className="mt-4 w-full sm:w-auto">
        Añadir Producto
      </Button>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900">Inventario y Stock</h1>
      <ProductForm />
      
      <Card title="Lista de Productos">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    {editingStockId === p.id ? (
                      <input
                        type="number"
                        value={newStockValue}
                        onChange={(e) => setNewStockValue(parseInt(e.target.value) || 0)}
                        className="w-20 p-1 border rounded"
                        min="0"
                      />
                    ) : (
                      <span className={p.stock < 10 ? 'text-red-600 font-bold' : 'text-green-600'}>
                        {p.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingStockId === p.id ? (
                      <div className="space-x-2 inline-flex">
                        <Button onClick={() => saveNewStock(p.id)} className="bg-green-500 hover:bg-green-600 px-3 py-1 text-xs">
                          Guardar
                        </Button>
                        <Button onClick={() => setEditingStockId(null)} className="bg-gray-500 hover:bg-gray-600 px-3 py-1 text-xs">
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => startEditStock(p)} className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 text-xs">
                        Ajustar Stock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Aún no tienes productos en el inventario.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const RegisterSale: React.FC = () => {
  const { products, recordSale } = useApp();
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const maxQuantity = selectedProduct?.stock || 0;
  const total = selectedProduct && quantity ? (selectedProduct.price * quantity).toFixed(2) : '0.00';

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || quantity <= 0) {
      setMessage({ type: 'error', text: 'Por favor, selecciona un producto y una cantidad válida.' });
      return;
    }

    if (quantity > maxQuantity) {
      setMessage({ type: 'error', text: `Stock insuficiente. Máximo disponible: ${maxQuantity}` });
      return;
    }

    try {
      await recordSale(selectedProduct.id, selectedProduct.name, quantity, selectedProduct.price);
      setMessage({ type: 'success', text: `¡Venta de ${quantity} x ${selectedProduct.name} registrada con éxito!` });
      setSelectedProductId('');
      setQuantity(1);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error al registrar la venta. Revisa la consola.' });
    } finally {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const isFormValid = selectedProduct && quantity && quantity > 0 && quantity <= maxQuantity;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900">Registrar Nueva Venta</h1>
      <Card title="Detalles de la Transacción" className="max-w-xl mx-auto">
        
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Producto</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Seleccionar Producto --</option>
              {products.filter(p => p.stock > 0).map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (${p.price.toFixed(2)}) - Stock: {p.stock}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || '')}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
              max={maxQuantity}
              disabled={!selectedProduct}
            />
            {selectedProduct && <p className="text-xs text-gray-500 mt-1">Stock disponible: {maxQuantity}</p>}
          </div>

          <div className="p-3 bg-indigo-50 rounded-lg">
            <p className="text-lg font-semibold text-indigo-700 flex justify-between">
              <span>Total a Pagar:</span>
              <span>${total}</span>
            </p>
          </div>

          <Button onClick={handleSubmit} disabled={!isFormValid} className="w-full">
            Confirmar Venta
          </Button>
        </div>
      </Card>
    </div>
  );
};

const SalesReport: React.FC = () => {
  const { sales } = useApp();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900">Historial de Ventas</h1>
      <Card title={`Total de Registros: ${sales.length}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700">${s.total.toFixed(2)}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Aún no hay ventas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ====================================================================
// 4. MAIN LAYOUT AND ROUTER
// ====================================================================

const Sidebar: React.FC<{ currentPage: string; setPage: (page: string) => void; userId: string | null }> = ({ currentPage, setPage, userId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', page: 'dashboard', Icon: LayoutGrid },
    { name: 'Inventario', page: 'inventory', Icon: Users },
    { name: 'Registrar Venta', page: 'register-sale', Icon: ShoppingCart },
    { name: 'Reporte de Ventas', page: 'sales-report', Icon: DollarSign },
  ];

  const NavItem: React.FC<{ item: typeof navItems[0] }> = ({ item }) => (
    <button
      onClick={() => { setPage(item.page); setIsOpen(false); }}
      className={`flex items-center w-full p-3 rounded-xl transition duration-150 hover:bg-indigo-700 ${
        currentPage === item.page ? 'bg-indigo-700 text-white font-bold shadow-lg' : 'text-indigo-200 hover:text-white'
      }`}
    >
      <item.Icon className="h-5 w-5 mr-3" />
      <span className="text-left">{item.name}</span>
    </button>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 bg-indigo-600 fixed top-0 left-0 right-0 z-40 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Sales App</h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2 rounded-lg hover:bg-indigo-700">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Content */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-300 ease-in-out w-64 bg-indigo-800 p-6 flex flex-col z-50 shadow-2xl`}
      >
        <h1 className="text-3xl font-extrabold text-white mb-8 border-b border-indigo-700 pb-4">
          SalesApp
        </h1>
        <nav className="flex-grow space-y-2">
          {navItems.map(item => <NavItem key={item.page} item={item} />)}
        </nav>

        <div className="mt-8 pt-4 border-t border-indigo-700 text-sm text-indigo-300 space-y-2">
          <p className="font-semibold">Usuario:</p>
          <p className="truncate">{userId || 'Anónimo'}</p>
          <p>
            <LogOut className="inline h-4 w-4 mr-2" />
            <span className="font-semibold">Sesión Activa</span>
          </p>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

const Router: React.FC<{ page: string }> = ({ page }) => {
  switch (page) {
    case 'dashboard':
      return <Dashboard />;
    case 'inventory':
      return <Inventory />;
    case 'register-sale':
      return <RegisterSale />;
    case 'sales-report':
      return <SalesReport />;
    default:
      return <Dashboard />;
  }
};

const AppContent: React.FC = () => {
  const { isAuthReady, isLoadingData, userId } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
        <p className="text-gray-700 font-semibold">Cargando Autenticación...</p>
      </div>
    );
  }
  
  if (isLoadingData) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
        <p className="text-gray-700 font-semibold">Cargando datos de usuario ({userId ? 'Autenticado' : 'Anónimo'})...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <Sidebar currentPage={currentPage} setPage={setCurrentPage} userId={userId} />
      <main className="flex-grow p-4 sm:p-8 md:ml-0 pt-20 md:pt-8">
        <Router page={currentPage} />
      </main>
    </div>
  );
};

// ====================================================================
// 5. ROOT COMPONENT
// ====================================================================

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
