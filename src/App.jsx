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
import CollectorDashboard from './components/CollectorDashboard'; // <-- 1. IMPORTAR EL NUEVO COMPONENTE

import './App.css';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const PrivateRoute = ({ children, isAuthenticated }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [username, setUsername] = useState(() => localStorage.getItem('username') || null);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);
  
  // ... (tus funciones handleLoginSuccess, handleLogout, authenticatedFetch)

  const hasRole = (roles) => {
    if (!userRole) return false;
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
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
                  
                  {/* --- 2. INICIO: NUEVO ENLACE PARA EL GESTOR --- */}
                  {hasRole('collector_agent') && (
                      <Link to="/admin/my-collections" className="nav-button">Mis Cobranzas</Link>
                  )}
                  {/* --- FIN: NUEVO ENLACE PARA EL GESTOR --- */}

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
              {/* ... (tus otras rutas como /, /login, /admin/products, etc.) ... */}
              
              {/* --- 3. INICIO: NUEVA RUTA PARA EL PANEL DEL GESTOR --- */}
              <Route
                path="/admin/my-collections"
                element={
                  <PrivateRoute isAuthenticated={!!token}>
                    <CollectorDashboard authenticatedFetch={authenticatedFetch} userRole={userRole} />
                  </PrivateRoute>
                }
              />
              {/* --- FIN: NUEVA RUTA PARA EL PANEL DEL GESTOR --- */}

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