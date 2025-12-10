// StoreManager.jsx - Componente para gestionar tiendas (solo super_admin)
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const StoreManager = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'https://celbackend.onrender.com';

  // Cargar tiendas
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar tiendas');
      
      const data = await response.json();
      setStores(data);
    } catch (error) {
      toast.error('Error al cargar tiendas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingStore 
        ? `${API_URL}/api/stores/${editingStore.id}`
        : `${API_URL}/api/stores`;
      
      const method = editingStore ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al guardar tienda');

      toast.success(editingStore ? 'Tienda actualizada' : 'Tienda creada exitosamente');
      setShowForm(false);
      setEditingStore(null);
      setFormData({ name: '', address: '', phone: '', email: '' });
      fetchStores();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || ''
    });
    setShowForm(true);
  };

  const handleToggleActive = async (store) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/stores/${store.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !store.isActive })
      });

      if (!response.ok) throw new Error('Error al actualizar tienda');

      toast.success(`Tienda ${!store.isActive ? 'activada' : 'desactivada'}`);
      fetchStores();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStore(null);
    setFormData({ name: '', address: '', phone: '', email: '' });
  };

  return (
    <div className="store-manager">
      <div className="header">
        <h2>Gestión de Tiendas</h2>
        {!showForm && (
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Nueva Tienda
          </button>
        )}
      </div>

      {showForm && (
        <div className="store-form-card">
          <h3>{editingStore ? 'Editar Tienda' : 'Nueva Tienda'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la Tienda *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Tienda Centro"
              />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ej: Av. Reforma 123"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="5551234567"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tienda@ejemplo.com"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Guardando...' : editingStore ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="loading">Cargando tiendas...</div>
      ) : (
        <div className="stores-grid">
          {stores.map((store) => (
            <div key={store.id} className={`store-card ${!store.isActive ? 'inactive' : ''}`}>
              <div className="store-header">
                <h3>{store.name}</h3>
                <span className={`status-badge ${store.isActive ? 'active' : 'inactive'}`}>
                  {store.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="store-info">
                {store.address && (
                  <p><strong>📍</strong> {store.address}</p>
                )}
                {store.phone && (
                  <p><strong>📞</strong> {store.phone}</p>
                )}
                {store.email && (
                  <p><strong>✉️</strong> {store.email}</p>
                )}
              </div>

              <div className="store-actions">
                <button onClick={() => handleEdit(store)} className="btn-edit">
                  Editar
                </button>
                <button 
                  onClick={() => handleToggleActive(store)} 
                  className={store.isActive ? 'btn-deactivate' : 'btn-activate'}
                >
                  {store.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .store-manager {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .store-form-card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .store-form-card h3 {
          margin-top: 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #555;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .stores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .store-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .store-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .store-card.inactive {
          opacity: 0.6;
          background: #f5f5f5;
        }

        .store-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }

        .store-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .store-info {
          margin-bottom: 20px;
        }

        .store-info p {
          margin: 8px 0;
          font-size: 14px;
          color: #666;
        }

        .store-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary, .btn-edit, .btn-activate, .btn-deactivate {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-edit {
          flex: 1;
          background: #ffc107;
          color: #000;
        }

        .btn-edit:hover {
          background: #e0a800;
        }

        .btn-activate {
          flex: 1;
          background: #28a745;
          color: white;
        }

        .btn-activate:hover {
          background: #218838;
        }

        .btn-deactivate {
          flex: 1;
          background: #dc3545;
          color: white;
        }

        .btn-deactivate:hover {
          background: #c82333;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default StoreManager;