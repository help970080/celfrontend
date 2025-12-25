// UserManager.jsx - VERSIÓN CORREGIDA CON API UNIFICADA

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'regular_admin',
    tiendaId: ''
  });

  // ⭐ CORREGIDO: Usar VITE_APP_API_BASE_URL como el resto del sistema
  const API_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

  const ROLES = [
    { value: 'super_admin', label: 'Super Administrador' },
    { value: 'regular_admin', label: 'Administrador' },
    { value: 'sales_admin', label: 'Administrador de Ventas' },
    { value: 'inventory_admin', label: 'Administrador de Inventario' },
    { value: 'collector_agent', label: 'Gestor de Cobranza' },
    { value: 'viewer_reports', label: 'Visualizador de Reportes' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchStores();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar usuarios');
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar usuarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/stores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Error al cargar tiendas');
      
      const data = await response.json();
      setStores(data.filter(store => store.isActive));
    } catch (error) {
      toast.error('Error al cargar tiendas');
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tiendaId) {
      toast.error('Debes seleccionar una tienda');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `${API_URL}/api/users/${editingUser.id}`
        : `${API_URL}/api/users`;
      
      const method = editingUser ? 'PUT' : 'POST';

      const dataToSend = { ...formData };
      if (editingUser && !formData.password) {
        delete dataToSend.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar usuario');
      }

      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado exitosamente');
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', role: 'regular_admin', tiendaId: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      tiendaId: user.tienda_id || user.tiendaId
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al eliminar usuario');

      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'regular_admin', tiendaId: '' });
  };

  const getStoreName = (tiendaId) => {
    const store = stores.find(s => s.id === tiendaId);
    return store ? store.name : 'Desconocida';
  };

  const getRoleLabel = (role) => {
    const roleObj = ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  return (
    <div className="user-manager">
      <div className="header">
        <h2>Gestión de Usuarios</h2>
        {!showForm && (
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            + Nuevo Usuario
          </button>
        )}
      </div>

      {showForm && (
        <div className="user-form-card">
          <h3>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="usuario123"
                  disabled={editingUser}
                />
              </div>

              <div className="form-group">
                <label>Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}</label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="********"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Rol *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tienda *</label>
                <select
                  required
                  value={formData.tiendaId}
                  onChange={(e) => setFormData({ ...formData, tiendaId: e.target.value })}
                >
                  <option value="">-- Seleccionar Tienda --</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <div className="loading">Cargando usuarios...</div>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Tienda</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.username}</strong>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className="store-tag">
                      {getStoreName(user.tienda_id || user.tiendaId)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(user)} className="btn-edit">
                        Editar
                      </button>
                      {user.role !== 'super_admin' && (
                        <button onClick={() => handleDelete(user.id)} className="btn-delete">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        /* Estilos idénticos al original - mantenidos para no romper UI */
        .user-manager {
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

        .user-form-card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .user-form-card h3 {
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

        .form-group input,
        .form-group select {
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

        .users-table {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f8f9fa;
        }

        th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #555;
          border-bottom: 2px solid #dee2e6;
        }

        td {
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
        }

        tbody tr:hover {
          background: #f8f9fa;
        }

        .role-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }

        .role-badge.super_admin {
          background: #dc3545;
          color: white;
        }

        .role-badge.regular_admin {
          background: #007bff;
          color: white;
        }

        .role-badge.sales_admin {
          background: #28a745;
          color: white;
        }

        .role-badge.inventory_admin {
          background: #ffc107;
          color: #000;
        }

        .role-badge.collector_agent {
          background: #17a2b8;
          color: white;
        }

        .role-badge.viewer_reports {
          background: #6c757d;
          color: white;
        }

        .store-tag {
          background: #e9ecef;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #495057;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary, .btn-edit, .btn-delete {
          padding: 8px 16px;
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
          background: #ffc107;
          color: #000;
        }

        .btn-edit:hover {
          background: #e0a800;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover {
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

        input:disabled {
          background: #e9ecef;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default UserManager;