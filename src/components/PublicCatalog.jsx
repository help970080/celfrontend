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
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState(new Set());

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

    return (
        <div className="modern-catalog">
            <div className="catalog-header">
                <h1>📱 Descubre Nuestra Colección</h1>
                <p className="catalog-subtitle">Los mejores productos con planes de crédito flexibles</p>
            </div>

            {/* Juego Promocional */}
            <div className="promotional-section game-section">
                <iframe 
                    src="/game.html" 
                    className="promotional-game"
                    style={{
                        width: '100%',
                        maxWidth: '800px',
                        height: '600px',
                        border: 'none',
                        borderRadius: '20px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        display: 'block',
                        margin: '0 auto',
                        backgroundColor: '#f0f4ff'
                    }}
                    title="Juego - Atrapa los Celulares"
                    loading="lazy"
                />
                <p className="promotional-text" style={{marginTop: '20px', textAlign: 'center', fontSize: '18px'}}>
                    🎮 ¡Juega mientras navegas! - 📱 Celulares a Crédito + 📦 Servicio de Paquetería (DHL, ESTAFETA, UPS)
                </p>
            </div>

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
                                        <a
                                            href={firstMedia}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="video-thumbnail-link"
                                        >
                                            <img 
                                                src={`https://img.youtube.com/vi/${mediaType.id}/maxresdefault.jpg`}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.target.src = `https://img.youtube.com/vi/${mediaType.id}/hqdefault.jpg`;
                                                }}
                                            />
                                            <div className="play-button-overlay">
                                                <svg viewBox="0 0 68 48" width="68" height="48">
                                                    <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
                                                    <path d="M 45,24 27,14 27,34" fill="#fff"></path>
                                                </svg>
                                            </div>
                                        </a>
                                    ) : mediaType.type === 'vimeo' && mediaType.id ? (
                                        <a
                                            href={firstMedia}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="video-thumbnail-link"
                                        >
                                            <img 
                                                src={`https://vumbnail.com/${mediaType.id}.jpg`}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/400x300/667eea/ffffff?text=Video+Vimeo';
                                                }}
                                            />
                                            <div className="play-button-overlay vimeo">
                                                <svg viewBox="0 0 24 24" width="60" height="60" fill="#00adef">
                                                    <circle cx="12" cy="12" r="10" fill="#00adef"/>
                                                    <path d="M10 8l6 4-6 4V8z" fill="#fff"/>
                                                </svg>
                                            </div>
                                        </a>
                                    ) : mediaType.type === 'vidnoz' && mediaType.id ? (
                                        <a
                                            href={firstMedia}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="video-thumbnail-link"
                                        >
                                            <img 
                                                src="https://via.placeholder.com/400x300/667eea/ffffff?text=Video+Vidnoz"
                                                alt={product.name}
                                            />
                                            <div className="play-button-overlay">
                                                <svg viewBox="0 0 24 24" width="60" height="60" fill="#667eea">
                                                    <circle cx="12" cy="12" r="10" fill="#667eea"/>
                                                    <path d="M10 8l6 4-6 4V8z" fill="#fff"/>
                                                </svg>
                                            </div>
                                        </a>
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