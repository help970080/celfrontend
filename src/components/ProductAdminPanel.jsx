// VERSIÓN FINAL Y FUNCIONAL: Incluye la importación de useMemo que faltaba.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ProductForm from './ProductForm';
import { toast } from 'react-toastify';

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

    const hasPermission = useCallback((roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    }, [userRole]);

    const calculateCreditDetails = (price) => {
        if (typeof price !== 'number' || price <= 0) {
            return { downPayment: 0, weeklyPayment: 0 };
        }
        const downPayment = price * 0.10;
        const weeklyPayment = (price - downPayment) / 17;
        return {
            downPayment: parseFloat(downPayment.toFixed(2)),
            weeklyPayment: parseFloat(weeklyPayment.toFixed(2)),
        };
    };

    const fetchProducts = useCallback(async () => {
        setLoadingProducts(true);
        try {
            const params = new URLSearchParams({
                sortBy, order, page: currentPage, limit: itemsPerPage,
                ...(categoryFilter && { category: categoryFilter }),
                ...(searchTerm && { search: searchTerm }),
            });
            const response = await authenticatedFetch(`${API_BASE_URL}/api/products?${params.toString()}`);
            if (!response.ok) throw new Error((await response.json()).message || 'Error al cargar productos');
            const data = await response.json();
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.totalItems || 0);
        } catch (err) {
            setErrorProducts(err.message);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }, [authenticatedFetch, searchTerm, sortBy, order, categoryFilter, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const uniqueCategories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);

    const getMediaType = (url) => {
        if (!url) return { type: 'none' };
        if (url.includes('youtu.be') || url.includes('youtube.com')) {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return { type: 'youtube', id: videoId };
        }
        return { type: 'image' };
    };
    
    const handleExportExcel = async () => {
        if (!hasPermission(['super_admin', 'regular_admin', 'inventory_admin'])) {
            return toast.error('No tienes permisos para esta acción.');
        }
        try {
            toast.info('Generando reporte Excel...');
            const response = await authenticatedFetch(`${API_BASE_URL}/api/products/export-excel`, { method: 'GET' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'El servidor devolvió una respuesta inesperada.' }));
                throw new Error(errorData.message || `Error HTTP ${response.status}`);
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
            toast.success('Reporte exportado con éxito.');
        } catch (err) {
            toast.error(`Error al exportar: ${err.message}`);
        }
    };

    return (
        <section className="products-section">
            <h2>Gestión de Productos</h2>
            {hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (
                <ProductForm onProductAdded={fetchProducts} productToEdit={productToEdit} setProductToEdit={setProductToEdit} />
            )}
            <div className="admin-controls">
                <div className="control-group"><label htmlFor="searchProduct">Buscar:</label><input type="text" id="searchProduct" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..."/></div>
                <div className="control-group"><label htmlFor="sortBy">Ordenar por:</label><select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="name">Nombre</option><option value="price">Precio</option><option value="createdAt">Más Recientes</option></select></div>
                <div className="control-group"><label htmlFor="order">Orden:</label><select id="order" value={order} onChange={(e) => setOrder(e.target.value)}><option value="asc">Asc</option><option value="desc">Desc</option></select></div>
                <div className="control-group"><label htmlFor="categoryFilter">Categoría:</label><select id="categoryFilter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="">Todas</option>{uniqueCategories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                {hasPermission(['super_admin', 'regular_admin', 'inventory_admin']) && (<div className="control-group"><button onClick={handleExportExcel} className="action-button">Exportar a Excel</button></div>)}
            </div>
            {loadingProducts ? <p>Cargando...</p> : errorProducts ? <p className="error-message">Error: {errorProducts}</p> : (
                <>
                    <div className="product-list">
                        {products.length > 0 ? products.map(product => {
                            const firstMedia = (product.imageUrls && product.imageUrls[0]) || 'https://via.placeholder.com/150';
                            const mediaType = getMediaType(firstMedia);
                            const credit = calculateCreditDetails(product.price);
                            return (
                                <div key={product.id} className="product-card">
                                    {mediaType.type === 'youtube' ? <iframe width="100%" height="150" src={`https://www.youtube.com/embed/${mediaType.id}`} title={product.name} frameBorder="0" allowFullScreen></iframe> : <img src={firstMedia} alt={product.name} />}
                                    <h2>{product.name}</h2>
                                    <p>{product.description}</p>
                                    <p>Precio: ${product.price?.toLocaleString('es-MX') || 'N/A'}</p>
                                    {credit.downPayment > 0 && <div className="credit-info"><p>Enganche: <strong>${credit.downPayment.toLocaleString('es-MX')}</strong></p><p>Semanal: <strong>${credit.weeklyPayment.toLocaleString('es-MX')}</strong></p></div>}
                                    <div className="product-actions">
                                        {hasPermission(['super_admin', 'regular_admin']) && <button onClick={() => setProductToEdit(product)}>Editar</button>}
                                        {hasPermission('super_admin') && <button onClick={() => onDeleteProduct(product.id)} className="delete-button">Eliminar</button>}
                                    </div>
                                </div>
                            );
                        }) : <p>No se encontraron productos.</p>}
                    </div>
                    <div className="pagination-controls">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
                        <span>Página {currentPage} de {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
                    </div>
                </>
            )}
        </section>
    );
}

export default ProductAdminPanel;