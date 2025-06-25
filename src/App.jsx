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
import ClientStatementViewer from './components/ClientStatementViewer';
import ClientPayments from './components/ClientPayments';
import UserAdminPanel from './components/UserAdminPanel';
import CollectorDashboard from './components/CollectorDashboard';

import './App.css';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);

  const handleLoginSuccess = useCallback((newToken, newUsername, newUserRole) => {
    setToken(newToken);
    setUsername(newUsername);
    setUserRole(newUserRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userRole', newUserRole);
    toast.success(`Bienvenido, ${newUsername}!`);
  }, []);

  const handleLogout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    toast.info('Sesión cerrada.');
  }, []);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      handleLogout();
      return Promise.reject(new Error('No hay token de autenticación.'));
    }
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      toast.error('Sesión expirada. Por favor, inicia sesión de nuevo.');
      handleLogout();
      return Promise.reject(new Error('Sesión expirada.'));
    }
    return response;
  }, [handleLogout]);

  const hasRole = (roles) => {
    if (!userRole) return false;
    return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="App">
        <header className="app-header">
          <nav className="main-nav">
            <Link to="/" className="nav-button">Catálogo Público</Link>
            {token ? (
              <>
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) && <Link to="/admin/sales" className="nav-button">Gestión Ventas</Link>}
                {hasRole(['super_admin', 'regular_admin', 'inventory_admin']) && <Link to="/admin/products" className="nav-button">Gestión Productos</Link>}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) && <Link to="/admin/clients" className="nav-button">Gestión Clientes</Link>}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports']) && <Link to="/admin/reports" className="nav-button">Reportes</Link>}
                {hasRole('super_admin') && <Link to="/admin/users" className="nav-button">Gestión Usuarios</Link>}
                
                {/* Enlace para el Gestor de Cobranza */}
                {hasRole('collector_agent') && <Link to="/admin/my-collections" className="nav-button">Mis Cobranzas</Link>}

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
            <Route path="/admin/sales" element={<PrivateRoute isAuthenticated={!!token}><SaleAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute isAuthenticated={!!token}><ProductAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/clients" element={<PrivateRoute isAuthenticated={!!token}><ClientAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute isAuthenticated={!!token}><ReportsAdminPanel authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute isAuthenticated={!!token}><UserAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/clients/statement/:clientId" element={<PrivateRoute isAuthenticated={!!token}><ClientStatementViewer authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />
            <Route path="/admin/clients/payments/:clientId" element={<PrivateRoute isAuthenticated={!!token}><ClientPayments authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            
            {/* --- LA CORRECCIÓN ESTÁ EN ESTA LÍNEA --- */}
            {/* Se añade la prop 'authenticatedFetch' que faltaba */}
            <Route path="/admin/my-collections" element={<PrivateRoute isAuthenticated={!!token}><CollectorDashboard authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />

            {token && <Route path="/admin" element={<Navigate to="/admin/sales" />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;