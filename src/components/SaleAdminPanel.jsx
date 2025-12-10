import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleAdminPanel({ authenticatedFetch, userRole }) { 
    const [sales, setSales] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [collectors, setCollectors] = useState([]);
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
                const errorData = await response.json().catch(() => ({ message: "Error del servidor." }));
                throw new Error(errorData.message);
            }
            const data = await response.json();
            setSales(data.sales || []);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error("Error al obtener ventas:", err);
            setErrorSales(err.message);
            setSales([]);
        } finally {
            setLoadingSales(false);
        }
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

    const fetchSupportingData = useCallback(async () => {
        try {
            // ⭐ NUEVO: Obtener tiendaId del localStorage
            const userTiendaId = localStorage.getItem('tiendaId');
            
            // ⭐ CORREGIDO: Agregar tiendaId a las URLs
            let clientsUrl = `${API_BASE_URL}/api/clients?limit=9999`;
            let productsUrl = `${API_BASE_URL}/api/products?limit=9999`;
            
            // ⭐ FILTRO CRÍTICO: Solo si no es super_admin
            if (userRole !== 'super_admin' && userTiendaId) {
                clientsUrl += `&tiendaId=${userTiendaId}`;
                productsUrl += `&tiendaId=${userTiendaId}`;
            }
            
            const [clientsRes, productsRes, usersRes] = await Promise.all([
                authenticatedFetch(clientsUrl),
                authenticatedFetch(productsUrl),
                authenticatedFetch(`${API_BASE_URL}/api/users`)
            ]);
            
            if (clientsRes.ok) setClients((await clientsRes.json()).clients || []);
            if (productsRes.ok) setProducts((await productsRes.json()).products || []);
            if (usersRes.ok) {
                const allUsers = await usersRes.json();
                setCollectors(allUsers.filter(user => user.role === 'collector_agent'));
            }
        } catch (err) {
            toast.error("Error al cargar datos de soporte.");
        }
    }, [authenticatedFetch, userRole]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    useEffect(() => {
        if (showSaleForm) {
            fetchSupportingData();
        }
    }, [showSaleForm, fetchSupportingData]);

    const onDeleteSale = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción es irreversible y restaurará el stock de los productos vendidos.')) {
            return;
        }
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/${id}`, { 
                method: 'DELETE' 
            });
            
            if (response.status === 204) {
                toast.success('¡Venta eliminada con éxito!');
                fetchSales();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la venta.');
            }
        } catch (err) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleExportSalesExcel = async () => {
        if (!hasPermission(['super_admin', 'regular_admin', 'sales_admin', 'viewer_reports'])) {
            toast.error('No tienes permisos para exportar ventas.');
            return;
        }
        try {
            toast.info('Generando reporte de ventas en Excel...');
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/export-excel`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al generar el reporte.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Reporte_Ventas.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Reporte de ventas exportado con éxito!');
        } catch (err) {
            console.error("Error al exportar ventas:", err);
            toast.error(`Error al exportar: ${err.message || "Error desconocido."}`);
        }
    };

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
            {showSaleForm && (
                <SaleForm
                    onSaleAdded={handleSaleAdded}
                    clients={clients}
                    products={products}
                    collectors={collectors}
                />
            )}
            <div className="admin-controls">
                <div className="control-group">
                    <label htmlFor="searchSale">Buscar Venta:</label>
                    <input type="text" id="searchSale" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Buscar por ID, cliente..."/>
                </div>
                <div className="control-group">
                    <label htmlFor="itemsPerPage">Ítems por página:</label>
                    <select id="itemsPerPage" value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}>
                        <option value="10">10</option><option value="20">20</option><option value="50">50</option>
                    </select>
                </div>
                
                <div className="control-group">
                     <button onClick={handleExportSalesExcel} className="action-button export-button">
                        Exportar a Excel
                    </button>
                </div>

            </div>
            {loadingSales ? <p>Cargando...</p> : errorSales ? <p className="error-message">{errorSales}</p> : (
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
                            <span>Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;