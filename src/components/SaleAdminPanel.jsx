// src/components/SaleAdminPanel.jsx - VERSIÓN AJUSTADA
import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

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

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const fetchSales = useCallback(async () => {
        setLoadingSales(true);
        setErrorSales(null);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                ...(searchTerm && { search: searchTerm })
            });
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales?${params.toString()}`);
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
        } finally {
            setLoadingSales(false);
        }
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

    const fetchClientsAndProducts = useCallback(async () => {
        try {
            const [clientResponse, productResponse] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/clients?limit=9999`),
                authenticatedFetch(`${API_BASE_URL}/api/products?limit=9999`)
            ]);
            if (clientResponse.ok) setClients((await clientResponse.json()).clients || []);
            if (productResponse.ok) setProducts((await productResponse.json()).products || []);
        } catch (err) {
            console.error("Error al cargar clientes y productos:", err);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchSales();
        fetchClientsAndProducts();
    }, [fetchSales, fetchClientsAndProducts]);

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>
            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <SaleForm
                    onSaleAdded={fetchSales}
                    clients={clients}
                    products={products}
                    authenticatedFetch={authenticatedFetch} // <-- Prop añadida para consistencia
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

            {loadingSales ? (<p>Cargando ventas...</p>) : errorSales ? (<p className="error-message">Error: {errorSales}</p>) : (
                <>
                    <SaleList
                        sales={sales}
                        onDeleteSale={onDeleteSale}
                        userRole={userRole} 
                    />
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</button>
                            <span>Página {currentPage} de {totalPages} ({totalItems} ítems)</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;