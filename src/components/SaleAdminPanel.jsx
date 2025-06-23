import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';
import { toast } from 'react-toastify'; // <-- IMPORTANTE: Añadir toast

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleAdminPanel({ authenticatedFetch, userRole }) { 
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

    // --- INICIO DEL CÓDIGO A AGREGAR ---
    const handleDeleteSale = useCallback(async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esto también eliminará sus pagos asociados y restaurará el stock del producto.')) { 
            return; 
        }
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/sales/${id}`, { method: 'DELETE' });
            toast.success('Venta eliminada con éxito!');
            fetchSales(); // <-- ¡ESTA ES LA LÍNEA CLAVE QUE REFRESCA LA TABLA!
        } catch (err) {
            console.error("Error al eliminar venta:", err);
            toast.error(`Error al eliminar la venta: ${err.message}`);
        }
    }, [authenticatedFetch, fetchSales]);
    // --- FIN DEL CÓDIGO A AGREGAR ---


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
    }, [fetchSales, fetchClients, fetchProducts]);

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
                {/* ... tus controles de búsqueda y paginación ... */}
            </div>

            {loadingSales ? (
                <p>Cargando ventas...</p>
            ) : errorSales ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorSales}</p>
            ) : (
                <>
                    {/* --- MODIFICACIÓN AQUÍ --- */}
                    <SaleList
                        sales={sales}
                        onDeleteSale={handleDeleteSale} // <-- Usamos la nueva función local
                        userRole={userRole} 
                    />
                    {/* --- FIN DE LA MODIFICACIÓN --- */}
                    {totalPages > 1 && (
                       {/* ... tus controles de paginación ... */}
                    )}
                </>
            )}
        </section>
    );
}
export default SaleAdminPanel;