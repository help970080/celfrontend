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
    
    // Aquí no está la función handleDeleteClient

    const handleExportExcel = async () => {
        // ...código de exportación...
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

            {/* ...controles de búsqueda y filtros... */}

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
                    {/* ...controles de paginación... */}
                </>
            )}
        </section>
    );
}
export default ClientAdminPanel;