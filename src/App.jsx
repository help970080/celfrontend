// App.jsx
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'; // <-- AÑADIDO: lazy y Suspense
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Ya no importamos estos directamente aquí al inicio:
// import ProductAdminPanel from './components/ProductAdminPanel';
// import ClientAdminPanel from './components/ClientAdminPanel';
// import SaleAdminPanel from './components/SaleAdminPanel';
// import ReportsAdminPanel from './components/ReportsAdminPanel';
// import ReceiptViewer from './components/ReceiptViewer';
// import ClientStatementViewer from './components/ClientStatementViewer';
// import ClientPayments from './components/ClientPayments';
// import UserAdminPanel from './components/UserAdminPanel';

// Sigue importando Auth y PublicCatalog de forma estática si son parte de la carga inicial
import Auth from './components/Auth';
import PublicCatalog from './components/PublicCatalog';

import './App.css';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// --- CAMBIOS AQUÍ: Importaciones dinámicas con lazy ---
const ProductAdminPanel = lazy(() => import('./components/ProductAdminPanel'));
const ClientAdminPanel = lazy(() => import('./components/ClientAdminPanel'));
const SaleAdminPanel = lazy(() => import('./components/SaleAdminPanel'));
const ReportsAdminPanel = lazy(() => import('./components/ReportsAdminPanel'));
const UserAdminPanel = lazy(() => import('./components/UserAdminPanel'));
const ReceiptViewer = lazy(() => import('./components/ReceiptViewer')); // Este también podría ser dinámico
const ClientStatementViewer = lazy(() => import('./components/ClientStatementViewer')); // Este también
const ClientPayments = lazy(() => import('./components/ClientPayments')); // Y este
// --- FIN CAMBIOS ---

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  const [userId, setUserId] = useState(() => localStorage.getItem('userId') || null);

  const handleLoginSuccess = useCallback((newToken, newUsername, newUserRole, newUserId) => {
    setToken(newToken);
    setUsername(newUsername);
    setUserRole(newUserRole);
    setUserId(newUserId);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userRole', newUserRole);
    localStorage.setItem('userId', newUserId);
    toast.success(`Bienvenido, ${newUsername}!`);
  }, []);

  const handleLogout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setUserRole(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    toast.info('Sesión cerrada.');
  }, []);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    if (!token) {
      return Promise.reject(new Error('No hay token de autenticación. Por favor, inicia sesión.'));
    }

    const headers = {
      ...options.headers,
      'Content-Type': options.headers && options.headers['Content-Type'] ? options.headers['Content-Type'] : 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      toast.error('Sesión expirada o token inválido. Por favor, inicia sesión de nuevo.');
      handleLogout();
      return Promise.reject(new Error('Sesión expirada o token inválido. Por favor, inicia sesión de nuevo.'));
    } else if (response.status === 403) {
        const errorData = await response.json();
        toast.error(`Acceso denegado: ${errorData.message || 'No tienes los permisos para esta acción.'}`);
        return Promise.reject(new Error(`Acceso denegado: ${errorData.message}`));
    }

    return response;
  }, [token, handleLogout]);

  const handleDeleteProduct = useCallback(async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) { return; }
    try {
      await authenticatedFetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      toast.success('Producto eliminado con éxito!');
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      if (!err.message.includes('Acceso denegado')) {
          toast.error(`Error al eliminar el producto: ${err.message}`);
      }
    }
  }, [authenticatedFetch]);

  const handleDeleteClient = useCallback(async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esto también eliminará sus ventas y pagos.')) { return; }
    try {
      await authenticatedFetch(`${API_BASE_URL}/api/clients/${id}`, { method: 'DELETE' });
      toast.success('Cliente eliminado con éxito!');
    }  catch (err) {
      console.error("Error al eliminar cliente:", err);
      if (!err.message.includes('Acceso denegado')) {
          toast.error(`Error al eliminar el cliente: ${err.message}`);
      }
    }
  }, [authenticatedFetch]);

  const handleDeleteSale = useCallback(async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esto también eliminará sus pagos asociados.')) { return; }
    try {
      await authenticatedFetch(`${API_BASE_URL}/api/sales/${id}`, { method: 'DELETE' });
      toast.success('Venta eliminada con éxito!');
    } catch (err) {
      console.error("Error al eliminar venta:", err);
      if (!err.message.includes('Acceso denegado')) {
          toast.error(`Error al eliminar la venta: ${err.message}`);
      }
    }
  }, [authenticatedFetch]);

  const hasRole = (roles) => {
    if (!userRole) return false;
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <div className="App">
        <header className="app-header">
          <nav className="main-nav">
            <Link to="/" className="nav-button">Catálogo Público</Link>
            {token ? (
              <>
                {/* Control de visibilidad de navegación por rol */}
                {hasRole(['super_admin', 'regular_admin', 'inventory_admin']) && (
                    <Link to="/admin/products" className="nav-button">Gestión Productos</Link>
                )}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) && (
                    <Link to="/admin/clients" className="nav-button">Gestión Clientes</Link>
                )}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) && (
                    <Link to="/admin/sales" className="nav-button">Gestión Ventas</Link>
                )}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports']) && (
                    <Link to="/admin/reports" className="nav-button">Reportes</Link>
                )}
                {hasRole('super_admin') && (
                    <Link to="/admin/users" className="nav-button">Gestión Usuarios</Link>
                )}


                <span className="user-info">Bienvenido, {username} ({userRole})</span>
                <button onClick={handleLogout} className="logout-button nav-button">Cerrar Sesión</button>
              </>
            ) : (
              <Link to="/login" className="nav-button">Iniciar Sesión Admin</Link>
            )}
          </nav>
        </header>

        <main className="app-main-content">
          {/* --- CAMBIO AQUÍ: Envuelve las rutas dinámicas con Suspense --- */}
          <Suspense fallback={
            <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.5em', color: '#007bff' }}>
              Cargando sección...
            </div>
          }>
            <Routes>
              <Route path="/" element={<PublicCatalog />} />
              <Route path="/login" element={<Auth onLoginSuccess={handleLoginSuccess} />} />

              {/* Rutas Protegidas del Panel de Administración (ahora cargadas dinámicamente) */}
              <Route
                path="/admin/products"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ProductAdminPanel authenticatedFetch={authenticatedFetch} onDeleteProduct={handleDeleteProduct} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/clients"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ClientAdminPanel authenticatedFetch={authenticatedFetch} onDeleteClient={handleDeleteClient} userRole={userRole} />
                  </PrivateRoute>
                }
              />
               <Route
                path="/admin/sales"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <SaleAdminPanel authenticatedFetch={authenticatedFetch} onDeleteSale={handleDeleteSale} userRole={userRole} />
                  </PrivateRoute>
                }
              />
                <Route
                path="/admin/reports"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ReportsAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/sales/receipt/:saleId"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ReceiptViewer />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/clients/statement/:clientId"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ClientStatementViewer authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/clients/payments/:clientId"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ClientPayments authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <UserAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />

              {token && <Route path="/admin" element={<Navigate to="/admin/products" />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense> {/* --- FIN CAMBIO: Cierra Suspense --- */}
        </main>
      </div>
    </Router>
  );
}

export default App;