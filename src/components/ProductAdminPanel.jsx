import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

// --- INICIO DE LA CORRECCIÓN ---
// Se ha eliminado la prop 'onDeleteProduct' que no se estaba utilizando
function ProductAdminPanel({ authenticatedFetch, userRole }) {
// --- FIN DE LA CORRECCIÓN ---
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);
    const [productToEdit, setProductToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [categoryFilter, setCategoryFilter] = useState('');

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

    const calculateCreditDetails = (price) => {
        const downPaymentPercentage = 0.10;
        const numberOfWeeks = 17;

        const downPayment = price * downPaymentPercentage;
        const remainingBalance = price - downPayment;
        const weeklyPayment = remainingBalance / numberOfWeeks;

        return {
            downPayment: parseFloat(downPayment.toFixed(2)),
            weeklyPayment: parseFloat(weeklyPayment.toFixed(2)),
        };
    };

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        setErrorProducts(null);
        try {
            let url = `${API_BASE_URL}/api/products?sortBy=${sortBy}&order=${order}`;
            if (categoryFilter) {
                url += `&category=${encodeURIComponent(categoryFilter)}`;
            }
            if (searchTerm) {
                url += `&search=${encodeURIComponent(searchTerm)}`;
            }
            url += `&page=${currentPage}&limit=${itemsPerPage}`;

            const response = await authenticatedFetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data.products || []);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error("Error al obtener productos:", err);
            setErrorProducts(err.message || "No se pudieron cargar los productos.");
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [authenticatedFetch, searchTerm, sortBy, order, categoryFilter, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- INICIO DE LA CORRECCIÓN ---
    // Se añade la función para manejar la eliminación directamente en este componente.
    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${productId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el producto.');
            }
            
            toast.success('¡Producto eliminado con éxito!');
            fetchProducts(); // Refrescar la lista de productos
        } catch (err) {
            console.error("Error al eliminar producto:", err);
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };
    // --- FIN DE LA CORRECCIÓN ---


    const handleExportExcel = async () => {
        if (!hasPermission(['super_admin', 'regular_admin', 'inventory_admin'])) {
            toast.error('No tienes permisos para exportar el inventario.');
            return;
        }
        try {
            toast.info('Generando reporte de inventario en Excel...');
            const response = await authenticatedFetch(`${API_BASE_URL}/api/products/export-excel`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Reporte_Inventario.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Reporte de inventario exportado con éxito!');
        } catch (err) {
            console.error("Error al exportar inventario a Excel:", err);
            toast.error(`Error al exportar: ${err.message || "Error desconocido."}`);
        }
    };

    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const getMediaType = (url) => {
        if (!url) return 'none';
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return { type: 'youtube', id: videoId };
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('/').pop().split('?')[0];
            return { type: 'vimeo', id: videoId };
        }
        return { type: 'image' };
    };

    return (
        <section className="products-section">
            <h2>Gestión de Productos</h2>
            {hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (
                <ProductForm
                    onProductAdded={fetchProducts}
                    productToEdit={productToEdit}
                    setProductToEdit={setProductToEdit}
                />
            )}

            <div className="admin-controls">
                {/* ... (controles de búsqueda y filtro no cambian) ... */}
            </div>

            {loadingProducts ? (
                <p>Cargando productos...</p>
            ) : errorProducts ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorProducts}</p>
            ) : (
                <>
                    <div className="product-list">
                        {products.length === 0 ? (
                            <p>No hay productos que coincidan con los criterios de búsqueda o filtro.</p>
                        ) : (
                            products.map(product => {
                                // ... (lógica de renderizado de la tarjeta no cambia) ...
                                const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : (typeof product.imageUrls === 'string' && product.imageUrls ? product.imageUrls.split(/[\n,]/).map(url => url.trim()).filter(Boolean) : []);
                                const firstMedia = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/150';
                                const mediaType = getMediaType(firstMedia);
                                const { downPayment, weeklyPayment } = calculateCreditDetails(product.price);

                                return (
                                    <div key={product.id} className="product-card">
                                        {/* ... JSX para renderizar media ... */}
                                        <h2>{product.name}</h2>
                                        <p>{product.description}</p>
                                        <p>Precio: ${product.price ? product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</p>
                                        <p>Stock: {product.stock}</p>
                                        <p>Categoría: {product.category}</p>
                                        <p>Marca: {product.brand}</p>
                                        {product.price > 0 && (
                                            <div className="credit-info">
                                                <p>Enganche: <strong>${downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                                                <p>Pago Semanal: <strong>${weeklyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (17 semanas)</strong></p>
                                            </div>
                                        )}
                                        <div className="product-actions">
                                            {hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (
                                                <button onClick={() => setProductToEdit(product)}>Editar</button>
                                            )}
                                            {hasPermission('super_admin') && (
                                                // --- INICIO DE LA CORRECCIÓN ---
                                                // El onClick ahora llama a la función local handleDeleteProduct
                                                <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                                                // --- FIN DE LA CORRECCIÓN ---
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            {/* ... (controles de paginación no cambian) ... */}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
export default ProductAdminPanel;