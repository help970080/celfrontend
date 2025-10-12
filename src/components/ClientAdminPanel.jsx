// Archivo: src/components/ClientAdminPanel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import RemindersPanel from './RemindersPanel'; // 🔹 Panel de recordatorios

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientAdminPanel({ authenticatedFetch, userRole }) {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [errorClients, setErrorClients] = useState(null);

  const [clientToEdit, setClientToEdit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 🔹 Mostrar/ocultar Recordatorios
  const [showReminders, setShowReminders] = useState(false);

  const hasPermission = (roles) => {
    if (!userRole) return false;
    return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
  };

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    setErrorClients(null);
    try {
      let url = `${API_BASE_URL}/api/clients?search=${encodeURIComponent(
        searchTerm
      )}&page=${currentPage}&limit=${itemsPerPage}`;

      const response = await authenticatedFetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      // 🔒 Endurecido: forzar arreglo para evitar ".map is not a function"
      const list =
        Array.isArray(data?.clients) ? data.clients : (Array.isArray(data) ? data : []);
      setClients(list);

      // Soportar paginación si viene; si no, valores por defecto
      setTotalPages(Number.isFinite(data?.totalPages) ? data.totalPages : 1);
      setTotalItems(Number.isFinite(data?.totalItems) ? data.totalItems : list.length);
    } catch (err) {
      console.error('Error al obtener clientes:', err);
      setErrorClients(err.message || 'No se pudieron cargar los clientes.');
      setClients([]); // aseguramos arreglo
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoadingClients(false);
    }
  }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Si seleccionas un cliente para editar, abre el formulario
  useEffect(() => {
    if (clientToEdit) setShowForm(true);
  }, [clientToEdit]);

  const handleFormSuccess = () => {
    fetchClients();
    setShowForm(false);
    setClientToEdit(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setClientToEdit(null);
  };

  const handleDeleteClient = async (clientId) => {
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar este cliente? Esta acción también puede afectar a las ventas asociadas.'
      )
    ) {
      return;
    }
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/clients/${clientId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar cliente');
      toast.success('Cliente eliminado con éxito');
      fetchClients();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExportExcel = async () => {
    if (!hasPermission(['super_admin', 'regular_admin', 'sales_admin'])) {
      toast.error('No tienes permisos para exportar clientes.');
      return;
    }
    try {
      toast.info('Generando archivo Excel de clientes.');
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/clients/export-excel`,
        { method: 'GET', headers: {} }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clientes_con_riesgo.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Archivo Excel exportado con éxito!');
    } catch (err) {
      console.error('Error al exportar clientes a Excel:', err);
      toast.error(`Error al exportar clientes: ${err.message || 'Error desconocido.'}`);
    }
  };

  return (
    <section className="clients-section">
      <div
        className="panel-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ margin: 0 }}>Gestión de Clientes</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* 🔹 Botón Recordatorios dentro de Gestión de Clientes */}
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

          {/* Botón agregar/ocultar formulario */}
          {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) setClientToEdit(null);
              }}
              className="action-button primary-button"
              style={{
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              {showForm ? 'Ocultar Formulario' : '+ Agregar Nuevo Cliente'}
            </button>
          )}
        </div>
      </div>

      <hr style={{ margin: '12px 0' }} />

      {/* 🔹 Panel de recordatorios (visible/oculto con el botón) */}
      {showReminders && (
        <div style={{ marginTop: 10, marginBottom: 20 }}>
          <RemindersPanel authenticatedFetch={authenticatedFetch} />
          <hr style={{ marginTop: 20 }} />
        </div>
      )}

      {/* Formulario condicional */}
      {showForm &&
        hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
          <ClientForm
            onClientAdded={handleFormSuccess}
            clientToEdit={clientToEdit}
            setClientToEdit={setClientToEdit}
            onCancel={handleFormCancel}
          />
        )}

      {/* Controles */}
      <div className="admin-controls">
        <div className="control-group">
          <label htmlFor="searchClient">Buscar Cliente:</label>
          <input
            type="text"
            id="searchClient"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por nombre, apellido, teléfono."
          />
        </div>

        <div className="control-group">
          <label htmlFor="itemsPerPage">Ítems por página:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value, 10));
              setCurrentPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
          <div className="control-group">
            <button onClick={handleExportExcel} className="action-button primary-button">
              Exportar a Excel
            </button>
          </div>
        )}
      </div>

      {/* Lista o estados */}
      {loadingClients ? (
        <p>Cargando clientes...</p>
      ) : errorClients ? (
        <p className="error-message">{errorClients}</p>
      ) : (
        <>
          <ClientList
            clients={Array.isArray(clients) ? clients : []} // 🔒 asegurar arreglo a ClientList
            onEditClient={setClientToEdit}
            onDeleteClient={handleDeleteClient}
            userRole={userRole}
          />

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages} ({totalItems} ítems)
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default ClientAdminPanel;
