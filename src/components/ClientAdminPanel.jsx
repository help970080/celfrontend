// Archivo: src/components/ClientAdminPanel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientAdminPanel({ authenticatedFetch, userRole }) { // onDeleteClient no se usa, se puede quitar
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [errorClients, setErrorClients] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // --- INICIO DE LA MODIFICACIÓN ---
    const [showForm, setShowForm] = useState(false); // Estado para controlar la visibilidad del formulario
    // --- FIN DE LA MODIFICACIÓN ---

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const fetchClients = useCallback(async () => {
        setLoadingClients(true);
        setErrorClients(null);
        try {
            let url = `${API_BASE_URL}/api/clients?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${itemsPerPage}`;
            const response = await authenticatedFetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setClients(data.clients || []);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error("Error al obtener clientes:", err);
            setErrorClients(err.message || "No se pudieron cargar los clientes.");
            setClients([]);
        } finally {
            setLoadingClients(false);
        }
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // Efecto para mostrar el formulario cuando se selecciona un cliente para editar
    useEffect(() => {
        if (clientToEdit) {
            setShowForm(true);
        }
    }, [clientToEdit]);

    // Nuevo manejador para cuando se agrega o actualiza un cliente
    const handleFormSuccess = () => {
        fetchClients(); // Refresca la lista
        setShowForm(false); // Oculta el formulario
        setClientToEdit(null); // Limpia el estado de edición
    };

    // Nuevo manejador para el botón de cancelar en el formulario
    const handleFormCancel = () => {
        setShowForm(false);
        setClientToEdit(null);
    };

    // Función para eliminar cliente
    const handleDeleteClient = async (clientId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción también puede afectar a las ventas asociadas.')) {
            return;
        }
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar cliente');
            toast.success('Cliente eliminado con éxito');
            fetchClients();
        } catch(err) {
            toast.error(err.message);
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---

    const handleExportExcel = async () => {
        // ... (el código de exportar no cambia)
        if (!hasPermission(['super_admin', 'regular_admin', 'sales_admin'])) {
            toast.error('No tienes permisos para exportar clientes.');
            return;
        }
        try {
            toast.info('Generando archivo Excel de clientes...');
            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients/export-excel`, { method: 'GET', headers: {} });
            if (!response.ok) {
                const errorData = await response.json();
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
            console.error("Error al exportar clientes a Excel:", err);
            toast.error(`Error al exportar clientes: ${err.message || "Error desconocido."}`);
        }
    };

    return (
        <section className="clients-section">
            <h2>Gestión de Clientes</h2>

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            <div className="panel-actions" style={{ marginBottom: '20px' }}>
                <button onClick={() => { setShowForm(!showForm); if (showForm) setClientToEdit(null); }} className="action-button primary-button">
                    {showForm ? 'Ocultar Formulario' : '+ Agregar Nuevo Cliente'}
                </button>
            </div>

            {/* El formulario ahora se renderiza condicionalmente */}
            {showForm && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <ClientForm
                    onClientAdded={handleFormSuccess}
                    clientToEdit={clientToEdit}
                    setClientToEdit={setClientToEdit} // setClientToEdit se pasa para que el formulario se pueda auto-limpiar
                    onCancel={handleFormCancel} // Prop para cancelar
                />
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            <div className="admin-controls">
                <div className="control-group">
                    <label htmlFor="searchClient">Buscar Cliente:</label>
                    <input type="text" id="searchClient" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Buscar por nombre, apellido, teléfono..."/>
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
                {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                    <div className="control-group">
                        <button onClick={handleExportExcel} className="action-button primary-button">
                            Exportar a Excel
                        </button>
                    </div>
                )}
            </div>

            {loadingClients ? (
                <p>Cargando clientes...</p>
            ) : errorClients ? (
                <p className="error-message">{errorClients}</p>
            ) : (
                <>
                    <ClientList
                        clients={clients}
                        onEditClient={setClientToEdit}
                        onDeleteClient={handleDeleteClient} // Se usa la nueva función
                        userRole={userRole}
                    />
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
                </>
            )}
        </section>
    );
}
export default ClientAdminPanel;