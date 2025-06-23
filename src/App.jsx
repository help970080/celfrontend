import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProductAdminPanel from './components/ProductAdminPanel';
import ClientAdminPanel from './components/ClientAdminPanel';
import SaleAdminPanel from './components/SaleAdminPanel';
import ReportsAdminPanel from './components/ReportsAdminPanel';
import Auth from './components/Auth';
import PublicCatalog from './components/PublicCatalog';
import ReceiptViewer from './components/ReceiptViewer';
import ClientStatementViewer from './components/ClientStatementViewer';
import ClientPayments from './components/ClientPayments';
import UserAdminPanel from './components/UserAdminPanel';

import './App.css';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

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
    const currentToken = localStorage.getItem('token'); // Leer el token más reciente
    if (!currentToken) {
      handleLogout();
      return Promise.reject(new Error('No hay token de autenticación. Por favor, inicia sesión.'));
    }

    const headers = {
      ...options.headers,
      'Content-Type': options.headers && options.headers['Content-Type'] ? options.headers['Content-Type'] : 'application/json',
      'Authorization': `Bearer ${currentToken}`,
    };

    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, { ...options, headers });

    if (response.status === 401) {
      toast.error('Sesión expirada o token inválido. Por favor, inicia sesión de nuevo.');
      handleLogout();
      return Promise.reject(new Error('Sesión expirada o token inválido.'));
    } else if (response.status === 403) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'No tienes los permisos para esta acción.';
        toast.error(`Acceso denegado: ${errorMessage}`);
        return Promise.reject(new Error(`Acceso denegado: ${errorMessage}`));
    }

    return response;
  }, [handleLogout]);

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
        <div className="no-print">
          <header className="app-header">
            <nav className="main-nav">
              <Link to="/" className="nav-button">Catálogo Público</Link>
              {token ? (
                <>
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
            <Routes>
              <Route path="/" element={<PublicCatalog />} />
              <Route path="/login" element={<Auth onLoginSuccess={handleLoginSuccess} />} />

              {/* --- RUTAS MODIFICADAS SIN PROPS DE ELIMINACIÓN --- */}
              <Route
                path="/admin/products"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ProductAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/clients"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ClientAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/sales"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <SaleAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              {/* --- FIN DE RUTAS MODIFICADAS --- */}
              
              <Route
                path="/admin/reports"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <ReportsAdminPanel authenticatedFetch={authenticatedFetch} />
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
                    <ClientStatementViewer authenticatedFetch={authenticatedFetch} />
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

              {token && <Route path="/admin" element={<Navigate to="/admin/reports" />} />}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;