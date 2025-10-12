// Archivo: src/components/ClientAdminPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import RemindersPanel from './RemindersPanel'; // 🔹 Importamos el nuevo panel

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientAdminPanel({ authenticatedFetch, userRole }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showReminders, setShowReminders] = useState(false); // 🔹 estado para mostrar/ocultar recordatorios

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/clients`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al obtener los clientes.');
      }
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleEdit = (client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleFormClose = (updated = false) => {
    setShowForm(false);
    setSelectedClient(null);
    if (updated) fetchClients();
  };

  return (
    <section className="client-admin-panel">
      <div
        className="panel-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h2 style={{ margin: 0 }}>Gestión de Clientes</h2>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* 🔹 Botón Recordatorios */}
          <button
            className="btn btn-secondary"
            style={{
              backgroundColor: showReminders ? '#dc3545' : '#28a745',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            onClick={() => setShowReminders((v) => !v)}
          >
            {showReminders ? 'Ocultar Recordatorios' : '📲 Recordatorios de Pago'}
          </button>

          {/* Botón agregar nuevo cliente */}
          {userRole === 'super_admin' || userRole === 'regular_admin' ? (
            <button
              className="btn btn-primary"
              style={{
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onClick={handleAddNew}
            >
              ➕ Nuevo Cliente
            </button>
          ) : null}
        </div>
      </div>

      <hr style={{ margin: '12px 0' }} />

      {/* 🔹 Panel de recordatorios */}
      {showReminders && (
        <div style={{ marginTop: '15px', marginBottom: '25px' }}>
          <RemindersPanel authenticatedFetch={authenticatedFetch} />
          <hr style={{ marginTop: '25px' }} />
        </div>
      )}

      {/* 🔹 Listado o formulario */}
      {showForm ? (
        <ClientForm
          client={selectedClient}
          onClose={handleFormClose}
          authenticatedFetch={authenticatedFetch}
        />
      ) : loading ? (
        <p>Cargando clientes...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <ClientList
          clients={clients}
          onEdit={handleEdit}
          authenticatedFetch={authenticatedFetch}
        />
      )}
    </section>
  );
}

export default ClientAdminPanel;
