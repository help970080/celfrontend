import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function PublicCatalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [category, setCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12); // Más productos por página
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState(new Set());

    const PROMOTIONAL_VIDEO_URL = "https://youtu.be/l96NpPj1uTc";

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
                if (category) url += `&category=${encodeURIComponent(category)}`;
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
                console.error("Error al obtener productos:", err);
                setError(err.message || "No se pudieron cargar los productos.");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicProducts();
    }, [sortBy, order, category, currentPage, itemsPerPage]);

    const toggleDetails = (productId) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const getMediaType = (url) => {
        if (!url) return 'none';
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/shorts')) {
            const videoIdMatch = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            return { type: 'youtube', id: videoId };
        }
        if (url.includes('vimeo.com/')) {
            const videoId = url.split('/').pop();
            return { type: 'vimeo', id: videoId.split('?')[0] };
        }
        if (url.includes('share.vidnoz.com/aivideo')) {
            const videoIdMatch = url.match(/id=(aishare-[a-zA-Z0-9_-]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            return { type: 'vidnoz', id: videoId };
        }
        return { type: 'image' };
    };

    if (loading) {
        return (
            <div className="modern-catalog">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>Cargando los mejores productos...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modern-catalog">
                <h1>📱 Nuestro Catálogo</h1>
                <p className="error-message">Error: {error}</p>
            </div>
        );
    }

    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const promotionalMediaDetails = getMediaType(PROMOTIONAL_VIDEO_URL);

    return (
        <div className="modern-catalog">
            <div className="catalog-header">
                <h1>📱 Descubre Nuestra Colección</h1>
                <p className="catalog-subtitle">Los mejores productos con planes de crédito flexibles</p>
            </div>

            {/* Video Promocional */}
            {PROMOTIONAL_VIDEO_URL && (
                <div className="promotional-section">
                    {promotionalMediaDetails.type === 'youtube' && promotionalMediaDetails.id ? (
                        <iframe
                            className="promotional-video"
                            src={`https://www.youtube.com/embed/${promotionalMediaDetails.id}?autoplay=0&mute=0&loop=0`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Video Promocional"
                        ></iframe>
                    ) : promotionalMediaDetails.type === 'vimeo' && promotionalMediaDetails.id ? (
                        <iframe
                            className="promotional-video"
                            src={`https://player.vimeo.com/video/${promotionalMediaDetails.id}?autoplay=0&loop=0`}
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Video Promocional"
                        ></iframe>
                    ) : promotionalMediaDetails.type === 'vidnoz' && promotionalMediaDetails.id ? (
                        <iframe
                            className="promotional-video"
                            src={`https://share.vidnoz.com/embed/${promotionalMediaDetails.id}`}
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                            title="Video Promocional"
                        ></iframe>
                    ) : (
                        <img
                            src={PROMOTIONAL_VIDEO_URL || 'https://via.placeholder.com/800x450'}
                            alt="Contenido Destacado"
                            className="promotional-video"
                        />
                    )}
                    <p className="promotional-text">
                        ¡Descubre la innovación que cabe en tu bolsillo!
                    </p>
                </div>
            )}

            {/* Filtros */}
            <button className="modern-filter-button" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? '✕ Ocultar Filtros' : '⚙️ Filtros'}
            </button>
            
            {showFilters && (
                <div className="modern-filters">
                    <div className="filter-item">
                        <label>Ordenar por:</label>
                        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                            <option value="name">Nombre</option>
                            <option value="price">Precio</option>
                            <option value="createdAt">Más Recientes</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Orden:</label>
                        <select value={order} onChange={(e) => { setOrder(e.target.value); setCurrentPage(1); }}>
                            <option value="asc">Ascendente</option>
                            <option value="desc">Descendente</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Categoría:</label>
                        <select value={category} onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}>
                            <option value="">Todas</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Por página:</label>
                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}>
                            <option value="6">6</option>
                            <option value="12">12</option>
                            <option value="24">24</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Grid de Productos */}
            <div className="modern-products-grid">
                {products.length === 0 ? (
                    <p className="no-products">No hay productos disponibles que coincidan con los criterios.</p>
                ) : (
                    products.map(product => {
                        const imageUrls = Array.isArray(product.imageUrls) 
                            ? product.imageUrls 
                            : (typeof product.imageUrls === 'string' && product.imageUrls 
                                ? product.imageUrls.split(/[\n,]/).map(url => url.trim()).filter(Boolean) 
                                : []);
                        const firstMedia = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/400x300/667eea/ffffff?text=Imagen+No+Disponible';
                        const mediaType = getMediaType(firstMedia);
                        const { downPayment, weeklyPayment } = calculateCreditDetails(product.price);
                        const isExpanded = expandedProducts.has(product.id);

                        return (
                            <div key={product.id} className="modern-product-card">
                                {/* Badge de Crédito */}
                                <div className="product-badge">A Crédito</div>

                                {/* Imagen/Video */}
                                <div className="product-media">
                                    {mediaType.type === 'youtube' && mediaType.id ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${mediaType.id}`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            title={product.name}
                                        ></iframe>
                                    ) : mediaType.type === 'vimeo' && mediaType.id ? (
                                        <iframe
                                            src={`https://player.vimeo.com/video/${mediaType.id}`}
                                            frameBorder="0"
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                            title={product.name}
                                        ></iframe>
                                    ) : mediaType.type === 'vidnoz' && mediaType.id ? (
                                        <iframe
                                            src={`https://share.vidnoz.com/embed/${mediaType.id}`}
                                            frameBorder="0"
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                            title={product.name}
                                        ></iframe>
                                    ) : (
                                        <img src={firstMedia} alt={product.name} />
                                    )}
                                </div>

                                {/* Info del Producto */}
                                <div className="product-content">
                                    <h3 className="product-title">{product.name}</h3>
                                    
                                    {/* Precio Principal */}
                                    <div className="price-section">
                                        <div className="price-label">Precio Total</div>
                                        <div className="price-value">
                                            ${product.price ? product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'N/A'}
                                        </div>
                                    </div>

                                    {/* Info de Crédito Compacta */}
                                    {product.price > 0 && (
                                        <div className="credit-compact">
                                            <div className="credit-item">
                                                <span className="credit-label">Enganche:</span>
                                                <span className="credit-amount">${downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="credit-item">
                                                <span className="credit-label">Pago Semanal:</span>
                                                <span className="credit-amount">${weeklyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="credit-weeks">(17 semanas)</div>
                                        </div>
                                    )}

                                    {/* Botón para Ver Detalles */}
                                    <button 
                                        className="toggle-details-btn"
                                        onClick={() => toggleDetails(product.id)}
                                    >
                                        {isExpanded ? '▲ Ocultar Detalles' : '▼ Ver Detalles'}
                                    </button>

                                    {/* Detalles Expandibles */}
                                    <div className={`product-details ${isExpanded ? 'expanded' : ''}`}>
                                        <p className="product-description">{product.description}</p>
                                        {product.category && (
                                            <div className="detail-row">
                                                <strong>Categoría:</strong> {product.category}
                                            </div>
                                        )}
                                        {product.brand && (
                                            <div className="detail-row">
                                                <strong>Marca:</strong> {product.brand}
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón de Contacto */}
                                    <a
                                        href="https://wa.me/525665489522"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="contact-btn-modern"
                                    >
                                        📞 Contactar para comprar
                                    </a>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="modern-pagination">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                        className="pagination-btn"
                    >
                        ← Anterior
                    </button>
                    <span className="pagination-info">
                        Página {currentPage} de {totalPages} ({totalItems} productos)
                    </span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}

export default PublicCatalog;