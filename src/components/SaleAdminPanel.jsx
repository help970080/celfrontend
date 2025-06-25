import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleAdminPanel({ authenticatedFetch, onDeleteSale, userRole }) { 
    const [sales, setSales] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [collectors, setCollectors] = useState([]); // Estado para guardar los gestores
    const [loadingSales, setLoadingSales] = useState(true);
    const [errorSales, setErrorSales] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showSaleForm, setShowSaleForm] = useState(false);

    const handleSaleAdded = () => {
        setShowSaleForm(false);
        fetchSales();
    };
    
    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const fetchSales = useCallback(async () => {
        setLoadingSales(true);
        setErrorSales(null);
        try {
            let url = `${API_BASE_URL}/api/sales?page=${currentPage}&limit=${itemsPerPage}`;
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            const response = await authenticatedFetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Error al cargar ventas");
            }
            const data = await response.json();
            setSales(data.sales || []);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error("Error al obtener ventas:", err);
            setErrorSales(err.message);
        } finally {
            setLoadingSales(false);
        }
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

    const fetchSupportingData = useCallback(async () => {
        try {
            // Se piden todos los datos necesarios en paralelo para mayor eficiencia
            const [clientsRes, productsRes, usersRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/clients?limit=9999`),
                authenticatedFetch(`${API_BASE_URL}/api/products?limit=9999`),
                authenticatedFetch(`${API_BASE_URL}/api/users`)
            ]);

            if (clientsRes.ok) setClients((await clientsRes.json()).clients || []);
            if (productsRes.ok) setProducts((await productsRes.json()).products || []);
            if (usersRes.ok) {
                const allUsers = await usersRes.json();
                setCollectors(allUsers.filter(user => user.role === 'collector_agent'));
            }
        } catch (err) {
            console.error("Error al cargar datos de soporte:", err);
            toast.error("Error al cargar datos necesarios para la venta.");
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchSales();
        fetchSupportingData();
    }, [fetchSales, fetchSupportingData]);

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>
            <div className="panel-actions">
                {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                    <button onClick={() => setShowSaleForm(!showSaleForm)} className="action-button primary-button">
                        {showSaleForm ? 'Ocultar Formulario de Venta' : '+ Registrar Nueva Venta'}
                    </button>
                )}
            </div>
            {showSaleForm && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <SaleForm
                    onSaleAdded={handleSaleAdded}
                    clients={clients}
                    products={products}
                />
            )}
            <div className="admin-controls">
                <div className="control-group">
                    <label htmlFor="searchSale">Buscar Venta:</label>
                    <input type="text" id="searchSale" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Buscar por ID, cliente o producto..."/>
                </div>
                <div className="control-group">
                    <label htmlFor="itemsPerPage">Ítems por página:</label>
                    <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}>
                        <option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option>
                    </select>
                </div>
            </div>
            {loadingSales ? <p>Cargando ventas...</p> : errorSales ? <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorSales}</p> : (
                <>
                    <SaleList
                        sales={sales}
                        onDeleteSale={onDeleteSale}
                        userRole={userRole}
                        collectors={collectors}
                        onSaleAssigned={fetchSales}
                        authenticatedFetch={authenticatedFetch}
                    />
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
                            <span>Página {currentPage} de {totalPages} ({totalItems} ítems)</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;