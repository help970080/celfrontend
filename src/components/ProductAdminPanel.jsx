// Archivo: src/components/ProductAdminPanel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ProductAdminPanel({ authenticatedFetch, userRole }) {
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

    const [showForm, setShowForm] = useState(false);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
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
            let url = `${API_BASE_URL}/api/products?sortBy=${sortBy}&order=${order}&page=${currentPage}&limit=${itemsPerPage}`;
            // ⭐ NUEVO: Obtener tiendaId del localStorage
            const userTiendaId = localStorage.getItem('tiendaId');
            
            if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
            
            // ⭐ FILTRO CRÍTICO: Agregar tiendaId si el usuario no es super_admin
            if (userRole !== 'super_admin' && userTiendaId) {
                url += `&tiendaId=${userTiendaId}`;
            }
            
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

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
    }, [authenticatedFetch, searchTerm, sortBy, order, categoryFilter, currentPage, itemsPerPage, userRole]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) return;
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${productId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar el producto.');
            }
            toast.success('¡Producto eliminado con éxito!');
            fetchProducts();
        } catch (err) {
            console.error("Error al eliminar producto:", err);
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };
    
    useEffect(() => {
        if (productToEdit) {
            setShowForm(true);
        }
    }, [productToEdit]);
    
    const handleFormSuccess = () => {
        fetchProducts();
        setShowForm(false);
        setProductToEdit(null);
    };

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

    const getMediaType = (url) => { 
        if (!url) return 'none';
        if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
            const videoIdMatch = url.match(/(?:v=|\/|embed\/|youtu.be\/)([a-zA-Z0-9_-]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            return { type: 'youtube', id: videoId };
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('/').pop();
            return { type: 'vimeo', id: videoId.split('?')[0] };
        }
        return { type: 'image' };
    };

    const [allCategories, setAllCategories] = useState([]);
    useEffect(() => {
        const fetchAllCategories = async () => {
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/products?limit=9999`);
                if (!response.ok) return;
                const data = await response.json();
                const uniqueCategories = [...new Set(data.products.map(p => p.category).filter(Boolean))];
                setAllCategories(uniqueCategories);
            } catch(e) {
                console.error("No se pudieron cargar las categorías para el filtro");
            }
        };
        fetchAllCategories();
    }, [authenticatedFetch]);


    return (
        <section className="products-section">
            <h2>Gestión de Productos</h2>

            {hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (
                <div className="panel-actions" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    <button 
                        onClick={() => { setShowForm(!showForm); if (showForm) setProductToEdit(null); }} 
                        className="action-button primary-button"
                    >
                        {showForm ? 'Ocultar Formulario' : '+ Agregar Nuevo Producto'}
                    </button>
                    
                    <a 
                        href="https://shopping.google.com/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="action-button google-shopping-button"
                    >
                        Buscar en Google Shopping
                    </a>
                </div>
            )}

            {showForm && hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (
                <ProductForm
                    onProductAdded={handleFormSuccess}
                    productToEdit={productToEdit}
                    setProductToEdit={setProductToEdit}
                    authenticatedFetch={authenticatedFetch}
                />
            )}
            
            <div className="admin-controls">
                 <div className="control-group">
                    <label>Buscar:</label>
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre..."/>
                </div>
                <div className="control-group">
                    <label>Ordenar por:</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="name">Nombre</option>
                        <option value="price">Precio</option>
                        <option value="createdAt">Más recientes</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>Orden:</label>
                    <select value={order} onChange={e => setOrder(e.target.value)}>
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>Categoría:</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                        <option value="">Todas</option>
                        {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                
                {hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (
                    <div className="control-group">
                        <label>&nbsp;</label>
                        <button onClick={handleExportExcel} className="action-button export-button">
                            Exportar a Excel
                        </button>
                    </div>
                )}

            </div>

            {loadingProducts ? (
                <p>Cargando productos...</p>
            ) : errorProducts ? (
                <p className="error-message">{errorProducts}</p>
            ) : (
                <>
                    <div className="product-list">
                        {products.map(product => {
                                const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : (typeof product.imageUrls === 'string' && product.imageUrls ? product.imageUrls.split(/[\n,]/).map(url => url.trim()).filter(Boolean) : []);
                                const firstMedia = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/150';
                                const mediaType = getMediaType(firstMedia);
                                const { downPayment, weeklyPayment } = calculateCreditDetails(product.price);
                                return (
                                    <div key={product.id} className="product-card">
                                        {mediaType.type === 'youtube' && mediaType.id ? (
                                            <iframe
                                                width="100%"
                                                height="200"
                                                src={`https://www.youtube.com/embed/${mediaType.id}`}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title={product.name}
                                            ></iframe>
                                        ) : mediaType.type === 'vimeo' && mediaType.id ? (
                                            <iframe
                                                src={`https://player.vimeo.com/video/${mediaType.id}`}
                                                width="100%"
                                                height="200"
                                                frameBorder="0"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                                title={product.name}
                                            ></iframe>
                                        ) : (
                                            <img src={firstMedia} alt={product.name} />
                                        )}
                                        <h2>{product.name}</h2>
                                        <p>{product.description}</p>
                                        <p>Precio: ${product.price ? product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</p>
                                        <p>Stock: {product.stock}</p>
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
                                                <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
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
export default ProductAdminPanel;