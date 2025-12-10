import { useState, useEffect } from 'react';

const PublicCatalog = () => {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(1); // Default: Tienda 1
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const API_URL = import.meta.env.VITE_API_URL || 'https://celbackend.onrender.com';

  // Cargar tiendas activas
  useEffect(() => {
    fetchStores();
  }, []);

  // Cargar productos cuando cambia la tienda, búsqueda, orden o página
  useEffect(() => {
    fetchProducts();
  }, [selectedStore, searchTerm, sortBy, order, currentPage]);

  const fetchStores = async () => {
    try {
      // Intentar obtener tiendas (sin autenticación)
      // Si falla, usar tiendas por defecto
      const response = await fetch(`${API_URL}/api/stores`);
      if (response.ok) {
        const data = await response.json();
        setStores(data.filter(store => store.isActive));
      } else {
        // Usar tiendas por defecto si la API requiere auth
        setStores([
          { id: 1, name: 'Tienda Principal' },
          { id: 2, name: 'Tienda Sucursal' }
        ]);
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      // Usar tiendas por defecto
      setStores([
        { id: 1, name: 'Tienda Principal' },
        { id: 2, name: 'Tienda Sucursal' }
      ]);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tiendaId: selectedStore,
        sortBy,
        order,
        page: currentPage,
        limit: 12
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${API_URL}/api/products?${params}`);
      const data = await response.json();

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreChange = (storeId) => {
    setSelectedStore(parseInt(storeId));
    setCurrentPage(1); // Reset a primera página
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setOrder('asc');
    }
    setCurrentPage(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getStoreName = () => {
    const store = stores.find(s => s.id === selectedStore);
    return store ? store.name : 'Tienda';
  };

  return (
    <div className="public-catalog">
      <div className="catalog-header">
        <h1>Catálogo de Productos</h1>
        <p className="subtitle">Explora nuestro inventario disponible</p>
      </div>

      {/* Selector de Tienda */}
      <div className="store-selector-container">
        <div className="store-selector">
          <label htmlFor="store-select">
            <span className="store-icon">🏪</span>
            Seleccionar Tienda:
          </label>
          <select
            id="store-select"
            value={selectedStore}
            onChange={(e) => handleStoreChange(e.target.value)}
            className="store-dropdown"
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div className="current-store-badge">
          Viendo: <strong>{getStoreName()}</strong>
        </div>
      </div>

      {/* Barra de búsqueda y ordenamiento */}
      <div className="catalog-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="sort-controls">
          <button
            onClick={() => handleSortChange('name')}
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
          >
            Nombre {sortBy === 'name' && (order === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSortChange('price')}
            className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
          >
            Precio {sortBy === 'price' && (order === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📦</p>
          <h3>No hay productos disponibles</h3>
          <p>Esta tienda aún no tiene productos en el catálogo</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="product-image-placeholder">
                    <span>📱</span>
                  </div>
                )}
                
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  
                  {product.brand && (
                    <p className="product-brand">{product.brand}</p>
                  )}
                  
                  {product.description && (
                    <p className="product-description">
                      {product.description.length > 80
                        ? product.description.substring(0, 80) + '...'
                        : product.description}
                    </p>
                  )}
                  
                  <div className="product-footer">
                    <p className="product-price">{formatPrice(product.price)}</p>
                    <p className={`product-stock ${product.stock < 5 ? 'low-stock' : ''}`}>
                      {product.stock > 0 ? (
                        <>
                          <span className="stock-icon">✓</span>
                          {product.stock} disponibles
                        </>
                      ) : (
                        <>
                          <span className="stock-icon">✗</span>
                          Agotado
                        </>
                      )}
                    </p>
                  </div>

                  {product.category && (
                    <span className="product-category">{product.category}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Anterior
              </button>
              
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .public-catalog {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .catalog-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .catalog-header h1 {
          font-size: 2.5rem;
          color: #333;
          margin-bottom: 10px;
        }

        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }

        /* Selector de Tienda */
        .store-selector-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .store-selector {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .store-selector label {
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .store-icon {
          font-size: 1.5rem;
        }

        .store-dropdown {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          background: white;
          color: #667eea;
          cursor: pointer;
          min-width: 200px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }

        .store-dropdown:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .store-dropdown:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
        }

        .current-store-badge {
          background: rgba(255,255,255,0.2);
          padding: 10px 20px;
          border-radius: 20px;
          color: white;
          font-size: 0.95rem;
          backdrop-filter: blur(10px);
        }

        .current-store-badge strong {
          font-weight: 700;
        }

        /* Controles */
        .catalog-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 250px;
        }

        .search-input {
          width: 100%;
          padding: 12px 45px 12px 15px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
        }

        .sort-controls {
          display: flex;
          gap: 10px;
        }

        .sort-btn {
          padding: 10px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .sort-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .sort-btn.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        /* Grid de Productos */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .product-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
        }

        .product-image-placeholder {
          width: 100%;
          height: 220px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .product-info {
          padding: 20px;
        }

        .product-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 8px;
        }

        .product-brand {
          color: #667eea;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .product-description {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 15px;
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .product-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .product-stock {
          font-size: 0.85rem;
          color: #28a745;
          font-weight: 600;
        }

        .product-stock.low-stock {
          color: #ffc107;
        }

        .stock-icon {
          margin-right: 4px;
        }

        .product-category {
          display: inline-block;
          background: #f0f0f0;
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          color: #666;
        }

        /* Estados */
        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          color: #333;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #666;
        }

        /* Paginación */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-top: 40px;
        }

        .pagination-btn {
          padding: 10px 20px;
          border: 2px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #667eea;
          color: white;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          font-weight: 600;
          color: #333;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .catalog-header h1 {
            font-size: 2rem;
          }

          .store-selector-container {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .catalog-controls {
            flex-direction: column;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicCatalog;