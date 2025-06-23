import React, { useState, useEffect, useCallback } from 'react';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientAdminPanel({ authenticatedFetch, userRole }) {
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [errorClients, setErrorClients] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);
    // ...otros estados...

    const fetchClients = useCallback(async () => {
        // ...código para buscar clientes...
    }, [authenticatedFetch, /* ...otras dependencias... */]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // --- FUNCIÓN DE ELIMINAR AGREGADA AQUÍ ---
    const handleDeleteClient = useCallback(async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esto también eliminará sus ventas y pagos asociados.')) { return; }
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/clients/${id}`, { method: 'DELETE' });
            toast.success('Cliente eliminado con éxito!');
            fetchClients(); // ¡Refresca la lista!
        } catch (err) {
            console.error("Error al eliminar cliente:", err);
            if (!err.message.includes('Acceso denegado')) {
                toast.error(`Error al eliminar el cliente: ${err.message}`);
            }
        }
    }, [authenticatedFetch, fetchClients]);

    // ...resto del componente...

    return (
        <section className="clients-section">
            <h2>Gestión de Clientes</h2>
            {/* ...código del formulario y controles... */}

            {loadingClients ? (
                <p>Cargando clientes...</p>
            ) : (
                <>
                    <ClientList
                        clients={clients}
                        onEditClient={setClientToEdit}
                        onDeleteClient={handleDeleteClient} // Pasamos la nueva función local
                        userRole={userRole}
                    />
                    {/* ...código de paginación... */}
                </>
            )}
        </section>
    );
}

export default ClientAdminPanel;