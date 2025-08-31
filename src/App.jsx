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
import AuditLogViewer from './components/AuditLogViewer';
import VisualDashboard from './components/VisualDashboard';
import ClientLogin from './components/ClientLogin';
import ClientPortalDashboard from './components/ClientPortalDashboard';
import RouteTracker from './components/RouteTracker'; // --- AÑADIDO: Importa el rastreador de rutas ---

import './App.css';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const ClientPrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/portal/login" />;
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);

  const [clientToken, setClientToken] = useState(() => localStorage.getItem('clientToken') || null);
  const [clientName, setClientName] = useState(() => localStorage.getItem('clientName') || null);

  const handleAdminLoginSuccess = useCallback((newToken, newUsername, newUserRole) => {
    setToken(newToken);
    setUsername(newUsername);
    setUserRole(newUserRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userRole', newUserRole);
    toast.success(`Bienvenido, ${newUsername}!`);
  }, []);

  const handleClientLoginSuccess = (newToken, name) => {
    setClientToken(newToken);
    setClientName(name);
    localStorage.setItem('clientToken', newToken);
    localStorage.setItem('clientName', name);
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');

    setClientToken(null);
    setClientName(null);
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientName');

    toast.info('Sesión cerrada.');
  }, []);

  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      handleLogout();
      return Promise.reject(new Error('No hay token de autenticación.'));
    }
    const headers = { ...options.headers, 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` };
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
      <RouteTracker /> {/* --- AÑADIDO: El componente que rastrea la navegación --- */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <div className="App">
        <header className="app-header">
          <nav className="main-nav">
            <Link to="/" className="nav-button">Catálogo Público</Link>
            
            {token ? (
              <>
                {hasRole(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports']) && <Link to="/admin/visual-dashboard" className="nav-button">Dashboard Visual</Link>}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) && <Link to="/admin/sales" className="nav-button">Gestión Ventas</Link>}
                {hasRole(['super_admin', 'regular_admin', 'inventory_admin']) && <Link to="/admin/products" className="nav-button">Gestión Productos</Link>}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) && <Link to="/admin/clients" className="nav-button">Gestión Clientes</Link>}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports']) && <Link to="/admin/reports" className="nav-button">Reportes</Link>}
                {hasRole('super_admin') && <Link to="/admin/users" className="nav-button">Gestión Usuarios</Link>}
                {hasRole('collector_agent') && <Link to="/admin/my-collections" className="nav-button">Mis Cobranzas</Link>}
                {hasRole('super_admin') && <Link to="/admin/audit" className="nav-button">Auditoría</Link>}
                <span className="user-info">Admin: {username} ({userRole})</span>
                <button onClick={handleLogout} className="logout-button nav-button">Cerrar Sesión</button>
              </>
            ) : clientToken ? (
              <>
                <Link to="/portal/dashboard" className="nav-button">Mi Portal</Link>
                <span className="user-info">Cliente: {clientName}</span>
                <button onClick={handleLogout} className="logout-button nav-button">Cerrar Sesión</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-button">Acceso Admin</Link>
                <Link to="/portal/login" className="nav-button">Portal Clientes</Link>
              </>
            )}
          </nav>
        </header>
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<PublicCatalog />} />
            <Route path="/login" element={<Auth onLoginSuccess={handleAdminLoginSuccess} />} />
            
            <Route path="/portal/login" element={<ClientLogin onClientLoginSuccess={handleClientLoginSuccess} />} />
            <Route path="/portal/dashboard" element={
              <ClientPrivateRoute isAuthenticated={!!clientToken}>
                <ClientPortalDashboard />
              </ClientPrivateRoute>
            } />

            <Route path="/admin/sales" element={<PrivateRoute isAuthenticated={!!token}><SaleAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/products" element={<PrivateRoute isAuthenticated={!!token}><ProductAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/clients" element={<PrivateRoute isAuthenticated={!!token}><ClientAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/reports" element={<PrivateRoute isAuthenticated={!!token}><ReportsAdminPanel authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute isAuthenticated={!!token}><UserAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/clients/statement/:clientId" element={<PrivateRoute isAuthenticated={!!token}><ClientStatementViewer authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />
            <Route path="/admin/clients/payments/:clientId" element={<PrivateRoute isAuthenticated={!!token}><ClientPayments authenticatedFetch={authenticatedFetch} userRole={userRole} /></PrivateRoute>} />
            <Route path="/admin/my-collections" element={<PrivateRoute isAuthenticated={!!token}><CollectorDashboard authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />
            <Route path="/admin/audit" element={<PrivateRoute isAuthenticated={!!token}><AuditLogViewer authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />
            <Route path="/admin/visual-dashboard" element={<PrivateRoute isAuthenticated={!!token}><VisualDashboard authenticatedFetch={authenticatedFetch} /></PrivateRoute>} />

            {token && <Route path="/admin" element={<Navigate to="/admin/sales" />} />}
            {clientToken && <Route path="/portal" element={<Navigate to="/portal/dashboard" />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
/* Nuevo estilo para el botón de Filtros */
.filter-button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 20px;
  transition: background-color 0.3s ease;
}

.filter-button:hover {
  background-color: #0056b3;
}

/* Contenedor de filtros que se mostrará/ocultará */
.filters-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    /* Estilos para ocultar/mostrar */
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.4s ease-out, opacity 0.4s ease-out;
}

.filters-container.open {
    max-height: 500px; /* Suficientemente grande para mostrar todos los filtros */
    opacity: 1;
}

/* Estilos de responsividad para los filtros */
@media (max-width: 768px) {
  .catalog-controls {
    flex-direction: column;
    align-items: center;
  }
}
export default App;