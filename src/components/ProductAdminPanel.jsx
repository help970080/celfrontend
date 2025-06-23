import React, { useState, useEffect, useCallback } from 'react';
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
    
    // Aquí no está la función handleDeleteProduct

    const handleExportExcel = async () => {
        // ...código de exportación...
    };

    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

    const getMediaType = (url) => {
        // ...código para obtener tipo de media...
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

            {/* ...controles de búsqueda y filtros... */}

            {loadingProducts ? (
                <p>Cargando productos...</p>
            ) : errorProducts ? (
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorProducts}</p>
            ) : (
                <>
                    <div className="product-list">
                        {products.map(product => {
                            // ...lógica de renderizado de tarjeta de producto...
                            return (
                                <div key={product.id} className="product-card">
                                    {/* ...media, nombre, descripción, etc.... */}
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
                        })}
                    </div>
                    {/* ...controles de paginación... */}
                </>
            )}
        </section>
    );
}
export default ProductAdminPanel;