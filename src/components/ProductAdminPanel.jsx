import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ProductAdminPanel({ authenticatedFetch, onDeleteProduct, userRole }) { 
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

    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const getMediaType = (url) => {
        if (!url) return 'none';
        // Ajuste en la URL de YouTube para que la interpolación sea correcta
        if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
            const videoId = url.split('v=')[1] || url.split('/').pop();
            return { type: 'youtube', id: videoId.split('&')[0] };
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('/').pop();
            return { type: 'vimeo', id: videoId.split('?')[0] };
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
                <div className="control-group">
                    <label htmlFor="searchProduct">Buscar:</label>
                    <input
                        type="text"
                        id="searchProduct"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        placeholder="Buscar por nombre, descripción, categoría, marca..."
                    />
                </div>
                <div className="control-group">
                    <label htmlFor="sortBy">Ordenar por:</label>
                    <select id="sortBy" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                        <option value="name">Nombre (A-Z)</option>
                        <option value="price">Precio</option>
                        <option value="createdAt">Más Recientes</option>
                    </select>
                </div>
                <div className="control-group">
                    <label htmlFor="order">Orden:</label>
                    <select id="order" value={order} onChange={(e) => { setOrder(e.target.value); setCurrentPage(1); }}>
                        <option value="asc">Ascendente</option>
                        <option value="desc">Descendente</option>
                    </select>
                </div>
                <div className="control-group">
                    <label htmlFor="categoryFilter">Categoría:</label>
                    <select id="categoryFilter" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="">Todas</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
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
                                const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : (typeof product.imageUrls === 'string' && product.imageUrls ? product.imageUrls.split(/[\n,]/).map(url => url.trim()).filter(Boolean) : []);
                                const firstMedia = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/150';
                                const mediaType = getMediaType(firstMedia);
                                
                                const { downPayment, weeklyPayment } = calculateCreditDetails(product.price);

                                return (
                                    <div key={product.id} className="product-card">
                                        {mediaType.type === 'youtube' ? (
                                            // URL de incrustación de YouTube corregida
                                            <iframe
                                                width="100%"
                                                height="150"
                                                src={`https://www.youtube.com/embed/${mediaType.id}`}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                title={product.name}
                                            ></iframe>
                                        ) : mediaType.type === 'vimeo' ? (
                                            <iframe
                                                src={`https://player.vimeo.com/video/${mediaType.id}`}
                                                width="100%"
                                                height="150"
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
                                                <button className="delete-button" onClick={() => onDeleteProduct(product.id)}>Eliminar</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
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
export default ProductAdminPanel;