import React, { useState, useEffect } from 'react';
import './PublicCatalog.css';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function PublicCatalog() {
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null); // ⭐ CAMBIO: null inicial
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('name');
    const [order, setOrder] = useState('asc');
    const [category, setCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    const PROMOTIONAL_VIDEO_URL = "https://youtu.be/fPBLV2kcjKw";

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

    // ⭐ EFECTO 1: Cargar tiendas desde el endpoint público
    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/stores/public`); // ⭐ CAMBIO
                if (response.ok) {
                    const data = await response.json();
                    const activeStores = data.filter(store => store.isActive !== false);
                    setStores(activeStores);
                    
                    // ⭐ NUEVO: Seleccionar automáticamente la primera tienda
                    if (activeStores.length > 0 && !selectedStore) {
                        setSelectedStore(activeStores[0].id);
                    }
                } else {
                    console.error('Error al cargar tiendas:', response.status);
                    // ⭐ FALLBACK MEJORADO: Al menos intentar cargar productos de tienda 1
                    setStores([{ id: 1, name: 'Celexpress' }]);
                    setSelectedStore(1);
                }
            } catch (error) {
                console.error('Error al cargar tiendas:', error);
                // ⭐ FALLBACK MEJORADO
                setStores([{ id: 1, name: 'Celexpress' }]);
                setSelectedStore(1);
            }
        };
        fetchStores();
    }, []);

    // ⭐ EFECTO 2: Cargar productos (solo cuando selectedStore está definido)
    useEffect(() => {
        // ⭐ NUEVO: No cargar productos hasta que tengamos una tienda seleccionada
        if (!selectedStore) return;

        const fetchPublicProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                let url = `${API_BASE_URL}/api/products?sortBy=${sortBy}&order=${order}&tiendaId=${selectedStore}`;
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
                console.error("Error al obtener productos:", err);
                setError(err.message || "No se pudieron cargar los productos.");
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicProducts();
    }, [sortBy, order, category, currentPage, itemsPerPage, selectedStore]);

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

    const handleStoreChange = (storeId) => {
        setSelectedStore(parseInt(storeId));
        setCurrentPage(1);
    };

    const getStoreName = () => {
        const store = stores.find(s => s.id === selectedStore);
        return store ? store.name : 'Tienda';
    };

    // ⭐ LOADING mejorado
    if (loading || !selectedStore) {
        return (
            <div className="mobile-catalog">
                <div className="mobile-header">
                    <h1>📱 Catálogo</h1>
                </div>
                <div className="loading-mobile">
                    <div className="spinner"></div>
                    <p>Cargando productos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mobile-catalog">
                <div className="mobile-header">
                    <h1>📱 Catálogo</h1>
                </div>
                <div className="error-mobile">
                    <p>❌ {error}</p>
                </div>
            </div>
        );
    }

    const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const promotionalMediaDetails = getMediaType(PROMOTIONAL_VIDEO_URL);

    return (
        <div className="mobile-catalog">
            {/* Header Mobile */}
            <div className="mobile-header">
                <h1>📱 {getStoreName()}</h1> {/* ⭐ CAMBIO: Mostrar nombre dinámico */}
            </div>

            {/* Selector de Tienda Mobile */}
            {stores.length > 1 && (
                <div className="mobile-store-selector">
                    <label>🏪 Selecciona tu tienda:</label>
                    <select
                        value={selectedStore}
                        onChange={(e) => handleStoreChange(e.target.value)}
                        className="mobile-store-dropdown"
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>
                                {store.name} {/* ⭐ AHORA DINÁMICO */}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Video Promocional */}
            {promotionalMediaDetails.type === 'youtube' && promotionalMediaDetails.id && (
                <div className="mobile-promo-video">
                    <iframe
                        width="100%"
                        height="220"
                        src={`https://www.youtube.com/embed/${promotionalMediaDetails.id}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video Promocional"
                    ></iframe>
                </div>
            )}

            {/* Botón de Filtros */}
            <button 
                onClick={() => setShowFilters(!showFilters)} 
                className="mobile-filter-toggle"
            >
                {showFilters ? '✖️ Cerrar Filtros' : '🔍 Filtrar Productos'}
            </button>

            {/* Panel de Filtros Deslizante */}
            {showFilters && (
                <div className="mobile-filters-panel">
                    <div className="mobile-filter-group">
                        <label>Ordenar:</label>
                        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
                            <option value="name">Nombre</option>
                            <option value="price">Precio</option>
                            <option value="createdAt">Más Recientes</option>
                        </select>
                    </div>

                    <div className="mobile-filter-group">
                        <label>Dirección:</label>
                        <select value={order} onChange={(e) => { setOrder(e.target.value); setCurrentPage(1); }}>
                            <option value="asc">⬆️ Menor a Mayor</option>
                            <option value="desc">⬇️ Mayor a Menor</option>
                        </select>
                    </div>

                    {uniqueCategories.length > 0 && (
                        <div className="mobile-filter-group">
                            <label>Categoría:</label>
                            <select value={category} onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}>
                                <option value="">Todas</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Lista de Productos Mobile */}
            <div className="mobile-product-list">
                {products.length === 0 ? (
                    <div className="mobile-empty">
                        <p>📦 No hay productos disponibles en {getStoreName()}</p>
                    </div>
                ) : (
                    products.map(product => {
                        const imageUrls = Array.isArray(product.imageUrls) 
                            ? product.imageUrls 
                            : (typeof product.imageUrls === 'string' && product.imageUrls 
                                ? product.imageUrls.split(/[\n,]/).map(url => url.trim()).filter(Boolean) 
                                : []);
                        const firstMedia = imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/400x300?text=Sin+Imagen';
                        const mediaType = getMediaType(firstMedia);
                        const { downPayment, weeklyPayment } = calculateCreditDetails(product.price);

                        return (
                            <div key={product.id} className="mobile-product-card">
                                {/* Media (Video o Imagen) */}
                                <div className="mobile-product-media">
                                    {mediaType.type === 'youtube' && mediaType.id ? (
                                        <iframe
                                            width="100%"
                                            height="220"
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
                                            height="220"
                                            frameBorder="0"
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                            title={product.name}
                                        ></iframe>
                                    ) : mediaType.type === 'vidnoz' && mediaType.id ? (
                                        <iframe
                                            src={`https://share.vidnoz.com/embed/${mediaType.id}`}
                                            width="100%"
                                            height="220"
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
                                <div className="mobile-product-info">
                                    <h2 className="mobile-product-name">{product.name}</h2>
                                    
                                    {product.brand && (
                                        <p className="mobile-product-brand">{product.brand}</p>
                                    )}
                                    
                                    {product.description && (
                                        <p className="mobile-product-description">{product.description}</p>
                                    )}

                                    <div className="mobile-price-section">
                                        <p className="mobile-price-label">Precio Contado:</p>
                                        <p className="mobile-price-value">
                                            ${product.price ? product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'N/A'}
                                        </p>
                                    </div>

                                    {product.price > 0 && (
                                        <div className="mobile-credit-box">
                                            <p className="mobile-credit-title">💳 Opción a Crédito:</p>
                                            <div className="mobile-credit-row">
                                                <span>Enganche:</span>
                                                <strong>${downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                                            </div>
                                            <div className="mobile-credit-row">
                                                <span>Semanal (17 semanas):</span>
                                                <strong>${weeklyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                                            </div>
                                        </div>
                                    )}

                                    
                                        href="https://wa.me/525665489522"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mobile-whatsapp-button"
                                    >
                                        <span className="whatsapp-icon">💬</span>
                                        Contactar por WhatsApp
                                    </a>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Paginación Mobile */}
            {totalPages > 1 && (
                <div className="mobile-pagination">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={currentPage === 1}
                        className="mobile-pagination-btn"
                    >
                        ← Anterior
                    </button>
                    <span className="mobile-pagination-info">
                        {currentPage} / {totalPages}
                    </span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={currentPage === totalPages}
                        className="mobile-pagination-btn"
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}

export default PublicCatalog;