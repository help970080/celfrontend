import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

// Se mantiene la versión que recibe onDeleteSale desde App.jsx
function SaleAdminPanel({ authenticatedFetch, onDeleteSale, userRole }) { 
    const [sales, setSales] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingSales, setLoadingSales] = useState(true);
    const [errorSales, setErrorSales] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // --- INICIO DE LA MODIFICACIÓN ---
    const [collectors, setCollectors] = useState([]); // 1. Nuevo estado para guardar los gestores.
    
    // 2. Nueva función para obtener solo los usuarios con el rol de gestor.
    const fetchCollectors = useCallback(async () => {
        if (!userRole || !['super_admin', 'regular_admin', 'sales_admin'].includes(userRole)) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/users`);
            if (response.ok) {
                const allUsers = await response.json();
                // Filtramos para quedarnos solo con los gestores de cobranza
                const collectorUsers = allUsers.filter(user => user.role === 'collector_agent');
                setCollectors(collectorUsers);
            }
        } catch (err) {
            console.error("Error al cargar gestores de cobranza:", err);
            toast.error("No se pudieron cargar los gestores de cobranza.");
        }
    }, [authenticatedFetch, userRole]);
    // --- FIN DE LA MODIFICACIÓN ---

    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    const fetchSales = useCallback(async () => {
        setLoadingSales(true);
        setErrorSales(null);
        try {
            let url = `${API_BASE_URL}/api/sales`;
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            url += `${searchTerm ? '&' : '?'}page=${currentPage}&limit=${itemsPerPage}`;

            const response = await authenticatedFetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setSales(data.sales || []);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error("Error al obtener ventas:", err);
            setErrorSales(err.message || "No se pudieron cargar las ventas.");
            setSales([]);
        } finally {
            setLoadingSales(false);
        }
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

    const fetchClients = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients?limit=9999`); 
            if (response.ok) {
                const data = await response.json();
                setClients(data.clients || []);
            }
        } catch (err) { console.error("Error al cargar clientes para ventas:", err); }
    }, [authenticatedFetch]);

    const fetchProducts = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/products?limit=9999`); 
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        } catch (err) { console.error("Error al cargar productos para ventas:", err); }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchSales();
        fetchClients();
        fetchProducts();
        fetchCollectors(); // 3. Se llama a la nueva función al cargar el panel.
    }, [fetchSales, fetchClients, fetchProducts, fetchCollectors]);

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>
            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <SaleForm
                    onSaleAdded={fetchSales}
                    clients={clients}
                    products={products}
                />
            )}

            <div className="admin-controls">
                <div className="control-group">
                    <label htmlFor="searchSale">Buscar Venta:</label>
                    <input
                        type="text"
                        id="searchSale"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Buscar por ID de venta, cliente o producto..."
                    />
                </div>
                 <div className="control-group">
                    <label htmlFor="itemsPerPage">Ítems por página:</label>
                    <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
            </div>

            {loadingSales ? (
                <p>Cargando ventas...</p>
            ) : errorSales ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorSales}</p>
            ) : (
                <>
                    {/* --- INICIO DE LA MODIFICACIÓN --- */}
                    {/* 4. Se pasan las nuevas propiedades a SaleList. */}
                    <SaleList
                        sales={sales}
                        onDeleteSale={onDeleteSale}
                        userRole={userRole}
                        collectors={collectors} 
                        onSaleAssigned={fetchSales}
                        authenticatedFetch={authenticatedFetch}
                    />
                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                                Anterior
                            </button>
                            <span>Página {currentPage} de {totalPages} ({totalItems} ítems)</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;