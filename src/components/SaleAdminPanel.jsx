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

    const fetchSales = useCallback(async () => { /* ...código sin cambios... */ }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);
    const fetchSupportingData = useCallback(async () => { /* ...código sin cambios... */ }, [authenticatedFetch]);

    useEffect(() => {
        fetchSales();
        fetchSupportingData();
    }, [fetchSales, fetchSupportingData]);

    const onDeleteSale = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) return;
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/sales/${id}`, { method: 'DELETE' });
            toast.success('Venta eliminada con éxito!');
            fetchSales();
        } catch (err) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>
            <div className="panel-actions">
                {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                    <button onClick={() => setShowSaleForm(!showSaleForm)} className="action-button primary-button">
                        {showSaleForm ? 'Ocultar Formulario' : '+ Registrar Venta'}
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
                 {/* ...controles de búsqueda y paginación... */}
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
                    {/* ...paginación... */}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;