import React, { useState, useEffect, useCallback } from 'react';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientAdminPanel({ authenticatedFetch, onDeleteClient, userRole }) {
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [errorClients, setErrorClients] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const hasPermission = (roles) => {
        let permissionGranted = false;
        if (!userRole) {
            permissionGranted = false;
        } else if (Array.isArray(roles)) {
            permissionGranted = roles.includes(userRole);
        } else { 
            permissionGranted = userRole === roles;
        }
        return permissionGranted;
    };


    const fetchClients = useCallback(async () => {
        setLoadingClients(true);
        setErrorClients(null);
        try {
            let url = `${API_BASE_URL}/api/clients`;
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            url += `${searchTerm ? '&' : '?'}page=${currentPage}&limit=${itemsPerPage}`;

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

    const handleExportExcel = async () => {
        if (!hasPermission(['super_admin', 'regular_admin', 'sales_admin'])) {
            toast.error('No tienes permisos para exportar clientes.');
            return;
        }

        try {
            toast.info('Generando archivo Excel de clientes...');
            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients/export-excel`, {
                method: 'GET',
                headers: {},
            });

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
            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <ClientForm
                    onClientAdded={fetchClients}
                    clientToEdit={clientToEdit}
                    setClientToEdit={setClientToEdit}
                />
            )}

            <div className="admin-controls">
                <div className="control-group">
                    <label htmlFor="searchClient">Buscar Cliente:</label>
                    <input type="text" id="searchClient" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Buscar por nombre, apellido, teléfono, email, ID..."/>
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
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {errorClients}</p>
            ) : (
                <>
                    <ClientList
                        clients={clients}
                        onEditClient={setClientToEdit}
                        onDeleteClient={onDeleteClient}
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