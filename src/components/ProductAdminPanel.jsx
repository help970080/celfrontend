import React, { useState, useEffect, useCallback } from 'react';
import ProductForm from './ProductForm';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ProductAdminPanel({ authenticatedFetch, userRole }) {
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState(null);
    const [productToEdit, setProductToEdit] = useState(null);
    // ...otros estados...

    const fetchProducts = useCallback(async () => {
        // ...código para buscar productos...
    }, [authenticatedFetch, /* ...otras dependencias... */]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- FUNCIÓN DE ELIMINAR AGREGADA AQUÍ ---
    const handleDeleteProduct = useCallback(async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) { return; }
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
            toast.success('Producto eliminado con éxito!');
            fetchProducts(); // ¡Refresca la lista!
        } catch (err) {
            console.error("Error al eliminar producto:", err);
            if (!err.message.includes('Acceso denegado')) {
                toast.error(`Error al eliminar el producto: ${err.message}`);
            }
        }
    }, [authenticatedFetch, fetchProducts]);
    
    // ...resto del componente...

    return (
        <section className="products-section">
            <h2>Gestión de Productos</h2>
            {/* ...código del formulario y controles... */}
            
            {loadingProducts ? (
                <p>Cargando productos...</p>
            ) : (
                <div className="product-list">
                    {products.map(product => (
                        <div key={product.id} className="product-card">
                            {/* ...detalles del producto... */}
                            <div className="product-actions">
                                {/* ...botón de editar... */}
                                {hasPermission('super_admin') && (
                                    // Pasamos la nueva función de eliminar
                                    <button className="delete-button" onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* ...código de paginación... */}
        </section>
    );
}

export default ProductAdminPanel;