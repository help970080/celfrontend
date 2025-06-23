import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';
import { toast } from 'react-toastify'; // Asegúrate de que toast esté importado si no lo estaba

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleAdminPanel({ authenticatedFetch, userRole }) { 
    const [sales, setSales] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingSales, setLoadingSales] = useState(true);
    const [errorSales, setErrorSales] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- INICIO DE NUEVOS ESTADOS Y FUNCIONES ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    
    const handleSaleAdded = (newSale) => {
        toast.success('Venta registrada con éxito!');
        setIsFormModalOpen(false); // Cierra el modal
        fetchSales(); // Recarga la lista de ventas
    };
    // --- FIN DE NUEVOS ESTADOS Y FUNCIONES ---

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    const fetchSales = useCallback(async () => {
        // ... tu código existente para fetchSales está bien ...
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

    const fetchClients = useCallback(async () => {
        // ... tu código existente para fetchClients está bien ...
    }, [authenticatedFetch]);

    const fetchProducts = useCallback(async () => {
        // ... tu código existente para fetchProducts está bien ...
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchSales();
        fetchClients();
        fetchProducts();
    }, [fetchSales, fetchClients, fetchProducts]);

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>

            {/* --- INICIO: BOTÓN PARA ABRIR EL MODAL --- */}
            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <div className="panel-actions">
                    <button onClick={() => setIsFormModalOpen(true)} className="action-button primary-button">
                        + Registrar Nueva Venta
                    </button>
                </div>
            )}
            {/* --- FIN: BOTÓN PARA ABRIR EL MODAL --- */}


            {/* --- INICIO: LÓGICA DEL MODAL --- */}
            {isFormModalOpen && (
                <div className="form-modal-overlay">
                    <div className="form-modal-content">
                        <button onClick={() => setIsFormModalOpen(false)} className="close-button">&times;</button>
                        <SaleForm
                            onSaleAdded={handleSaleAdded} // Usamos la nueva función
                            clients={clients}
                            products={products}
                        />
                    </div>
                </div>
            )}
            {/* --- FIN: LÓGICA DEL MODAL --- */}
            

            <div className="admin-controls">
                {/* ... tus controles de búsqueda y paginación ... */}
            </div>

            {loadingSales ? (
                <p>Cargando ventas...</p>
            ) : errorSales ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorSales}</p>
            ) : (
                <>
                    <SaleList
                        sales={sales}
                        // La prop onDeleteSale debería venir de App.jsx en la versión restaurada
                        // Si moviste la lógica aquí, asegúrate de que esté definida
                        userRole={userRole} 
                    />
                    {/* ... tus controles de paginación ... */}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;