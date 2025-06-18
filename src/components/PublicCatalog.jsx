import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function PublicCatalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [category, setCategory] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

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

    useEffect(() => {
        const fetchPublicProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                let url = `${API_BASE_URL}/api/products?sortBy=${sortBy}&order=${order}`;
                if (category) {
                    url += `&category=${encodeURIComponent(category)}`;
                }
                url += `&page=${currentPage}&limit=${itemsPerPage}`;

                const response = await fetch(url);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                setProducts(data.products || []); 
                setTotalPages(data.totalPages);
                setTotalItems(data.totalItems);
            } catch (err) {
                console.error("Error al obtener productos para catálogo público:", err);
                setError(err.message || "No se pudieron cargar los productos del catálogo.");
                setProducts([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchPublicProducts();
    }, [sortBy, order, category, currentPage, itemsPerPage]);


    if (loading) {
        return (
            <div className="public-catalog">
                <h1>Nuestro Catálogo de Celulares</h1>
                <p>Cargando los productos más recientes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="public-catalog">
                <h1>Nuestro Catálogo de Celulares</h1>
                <p style={{ color: 'red' }}>Error: {error}</p>
            </div>
        );
    }

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
        <div className="public-catalog">
            <h1>Nuestro Catálogo de Celulares</h1>
            <p className="catalog-intro">Descubre las últimas novedades y ofertas en celulares y accesorios.</p>

            <div className="catalog-controls">
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
                    <label htmlFor="category">Categoría:</label>
                    <select id="category" value={category} onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}>
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

            <div className="product-list">
                {products.length === 0 ? (
                    <p>No hay productos disponibles en el catálogo que coincidan con los criterios.</p>
                ) : (
                    products.map(product => {
                        const imageUrls = Array.isArray(product.imageUrls) ? product.imageUrls : (typeof product.imageUrls === 'string' && product.imageUrls ? product.imageUrls.split(/[\n,]/).map(url => url.trim()).filter(Boolean) : []);
                        const firstMedia = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/200';
                        const mediaType = getMediaType(firstMedia);
                        
                        const { downPayment, weeklyPayment } = calculateCreditDetails(product.price);

                        return (
                            <div key={product.id} className="product-card">
                                {mediaType.type === 'youtube' ? (
                                    // URL de incrustación de YouTube corregida
                                    <iframe
                                        width="100%"
                                        height="200"
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
                                <p className="product-description">{product.description}</p>
                                <p className="product-price">Precio: ${product.price ? product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}</p>
                                {product.price > 0 && ( 
                                    <div className="credit-info">
                                        <p>Enganche: <strong>${downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                                        <p>Pago Semanal: <strong>${weeklyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (17 semanas)</strong></p>
                                    </div>
                                )}
                                <button className="contact-button">Contactar para comprar</button>
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
        </div>
    );
}

export default PublicCatalog;