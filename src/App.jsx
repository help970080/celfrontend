import { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
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
import RouteTracker from './components/RouteTracker';
import StoreManager from './components/StoreManager';
import UserManager from './components/UserManager';
import MdmAdminPanel from './components/MdmAdminPanel';
import TandasAdminPanel from './components/TandasAdminPanel';
import LlamadasPanel from './components/LlamadasPanel';
import PosPanel from './components/PosPanel';
import WhatsAppWidget from './components/WhatsAppWidget';

import './App.css';
import './shell.css';

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
  const [tiendaId, setTiendaId] = useState(() => localStorage.getItem('tiendaId') || null);

  const [clientToken, setClientToken] = useState(() => localStorage.getItem('clientToken') || null);
  const [clientName, setClientName] = useState(() => localStorage.getItem('clientName') || null);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAdminLoginSuccess = useCallback((newToken, newUsername, newUserRole, newTiendaId) => {
    setToken(newToken);
    setUsername(newUsername);
    setUserRole(newUserRole);
    setTiendaId(newTiendaId);
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userRole', newUserRole);
    localStorage.setItem('tiendaId', newTiendaId);
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
    setTiendaId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tiendaId');

    setClientToken(null);
    setClientName(null);
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientName');

    setDrawerOpen(false);
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
      'Authorization': `Bearer ${currentToken}`
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

  const closeDrawer = () => setDrawerOpen(false);

  // Un ítem del menú lateral
  const NavItem = ({ to, icon, label }) => (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={closeDrawer}
      className={({ isActive }) => `lx-ditem ${isActive ? 'active' : ''}`}
    >
      <span className="ic">{icon}</span> {label}
    </NavLink>
  );

  return (
    <Router>
      <RouteTracker />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} style={{ zIndex: 99999 }} />
      <WhatsAppWidget />

      <div className="App">
        {token ? (
          <>
            <div className="lx-topbar">
              <button className="lx-burger" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">☰</button>
              <div className="lx-brand">
                <b>CelExpress</b>
                <small>Admin: {username} ({userRole})</small>
              </div>
              <button className="lx-toplogout" onClick={handleLogout}>Cerrar sesión</button>
            </div>

            <div className={`lx-overlay ${drawerOpen ? 'open' : ''}`} onClick={closeDrawer} />
            <div className={`lx-drawer ${drawerOpen ? 'open' : ''}`}>
              <div className="lx-dhead">
                <b>CelExpress</b>
                <small>{username} · {userRole}</small>
              </div>

              <div className="lx-dgroup">
                <div className="lx-dlabel">Operación diaria</div>
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) &&
                  <NavItem to="/admin/pos" icon="🛒" label="Punto de venta" />}
                {hasRole('collector_agent') &&
                  <NavItem to="/admin/my-collections" icon="💵" label="Mis cobranzas" />}
                <NavItem to="/" icon="🌐" label="Catálogo público" />
              </div>

              <div className="lx-dgroup">
                <div className="lx-dlabel">⚙️ Administración</div>
                {hasRole(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports']) &&
                  <NavItem to="/admin/visual-dashboard" icon="📊" label="Dashboard visual" />}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) &&
                  <NavItem to="/admin/sales" icon="🧾" label="Gestión de ventas" />}
                {hasRole(['super_admin', 'regular_admin', 'inventory_admin']) &&
                  <NavItem to="/admin/products" icon="📦" label="Productos e inventario" />}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin']) &&
                  <NavItem to="/admin/clients" icon="👤" label="Clientes" />}
                {hasRole(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports']) &&
                  <NavItem to="/admin/reports" icon="📈" label="Reportes" />}
                {hasRole('super_admin') && <NavItem to="/admin/stores" icon="🏪" label="Tiendas" />}
                {hasRole('super_admin') && <NavItem to="/admin/users-manager" icon="👥" label="Usuarios" />}
                {hasRole('super_admin') && <NavItem to="/admin/mdm" icon="🔒" label="MDM" />}
                {hasRole('super_admin') && <NavItem to="/admin/tandas" icon="🏦" label="Tandas" />}
                {hasRole('super_admin') && <NavItem to="/admin/llamadas" icon="📞" label="Llamadas" />}
                {hasRole('super_admin') && <NavItem to="/admin/audit" icon="📝" label="Auditoría" />}
              </div>

              <button className="lx-logout" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </>
        ) : clientToken ? (
          <div className="lx-topbar">
            <div className="lx-brand"><b>CelExpress</b><small>Cliente: {clientName}</small></div>
            <NavLink to="/portal/dashboard" className="lx-userchip" style={{ textDecoration: 'none' }}>Mi portal</NavLink>
            <button className="lx-toplogout" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        ) : (
          <div className="lx-topbar">
            <div className="lx-brand"><b>CelExpress</b><small>Bienvenido</small></div>
            <NavLink to="/login" className="lx-userchip" style={{ textDecoration: 'none' }}>Acceso admin</NavLink>
            <NavLink to="/portal/login" className="lx-userchip" style={{ textDecoration: 'none' }}>Portal clientes</NavLink>
          </div>
        )}

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

            <Route path="/admin/pos" element={
              <PrivateRoute isAuthenticated={!!token}>
                <PosPanel authenticatedFetch={authenticatedFetch} userRole={userRole} userTiendaId={tiendaId} />
              </PrivateRoute>
            } />

            <Route path="/admin/sales" element={
              <PrivateRoute isAuthenticated={!!token}>
                <SaleAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} userTiendaId={tiendaId} />
              </PrivateRoute>
            } />

            <Route path="/admin/products" element={
              <PrivateRoute isAuthenticated={!!token}>
                <ProductAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
              </PrivateRoute>
            } />

            <Route path="/admin/clients" element={
              <PrivateRoute isAuthenticated={!!token}>
                <ClientAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
              </PrivateRoute>
            } />

            <Route path="/admin/reports" element={
              <PrivateRoute isAuthenticated={!!token}>
                <ReportsAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} userTiendaId={tiendaId} />
              </PrivateRoute>
            } />

            <Route path="/admin/users" element={
              <PrivateRoute isAuthenticated={!!token}>
                <UserAdminPanel authenticatedFetch={authenticatedFetch} userRole={userRole} />
              </PrivateRoute>
            } />

            <Route path="/admin/stores" element={
              <PrivateRoute isAuthenticated={!!token}>
                <StoreManager authenticatedFetch={authenticatedFetch} userRole={userRole} />
              </PrivateRoute>
            } />

            <Route path="/admin/users-manager" element={
              <PrivateRoute isAuthenticated={!!token}>
                <UserManager authenticatedFetch={authenticatedFetch} userRole={userRole} />
              </PrivateRoute>
            } />

            <Route path="/admin/mdm" element={
              <PrivateRoute isAuthenticated={!!token}>
                <MdmAdminPanel />
              </PrivateRoute>
            } />

            <Route path="/admin/tandas" element={
              <PrivateRoute isAuthenticated={!!token}>
                <TandasAdminPanel authenticatedFetch={authenticatedFetch} />
              </PrivateRoute>
            } />

            <Route path="/admin/llamadas" element={
              <PrivateRoute isAuthenticated={!!token}>
                <LlamadasPanel authenticatedFetch={authenticatedFetch} />
              </PrivateRoute>
            } />

            <Route path="/admin/clients/statement/:clientId" element={
              <PrivateRoute isAuthenticated={!!token}>
                <ClientStatementViewer authenticatedFetch={authenticatedFetch} />
              </PrivateRoute>
            } />

            <Route path="/admin/clients/payments/:clientId" element={
              <PrivateRoute isAuthenticated={!!token}>
                <ClientPayments authenticatedFetch={authenticatedFetch} userRole={userRole} />
              </PrivateRoute>
            } />

            <Route path="/admin/my-collections" element={
              <PrivateRoute isAuthenticated={!!token}>
                <CollectorDashboard authenticatedFetch={authenticatedFetch} />
              </PrivateRoute>
            } />

            <Route path="/admin/audit" element={
              <PrivateRoute isAuthenticated={!!token}>
                <AuditLogViewer authenticatedFetch={authenticatedFetch} />
              </PrivateRoute>
            } />

            <Route path="/admin/visual-dashboard" element={
              <PrivateRoute isAuthenticated={!!token}>
                <VisualDashboard authenticatedFetch={authenticatedFetch} />
              </PrivateRoute>
            } />

            {token && <Route path="/admin" element={<Navigate to="/admin/pos" />} />}
            {clientToken && <Route path="/portal" element={<Navigate to="/portal/dashboard" />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
