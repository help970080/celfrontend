import React from 'react';
import { Link } from 'react-router-dom';

function ClientList({ clients, onEditClient, onDeleteClient, userRole }) { // Recibe userRole
    // Helper para verificar roles
    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    if (clients.length === 0) {
        return <p>No hay clientes registrados.</p>;
    }

    return (
        <div className="client-list-container">
            <h2>Clientes Registrados</h2>
            <table className="client-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Dirección</th>
                        <th>ID Identificación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map(client => (
                        <tr key={client.id}>
                            <td>{client.id}</td>
                            <td>{client.name}</td>
                            <td>{client.lastName}</td>
                            <td>{client.phone}</td>
                            <td>{client.email || 'N/A'}</td>
                            <td>{`${client.address}, ${client.city}`}</td>
                            <td>{client.identificationId || 'N/A'}</td>
                            <td>
                                <div className="action-buttons">
                                    {/* Solo permitir editar a ciertos roles */}
                                    {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                        <button onClick={() => onEditClient(client)}>Editar</button>
                                    )}
                                    {/* Gestionar Cobranza y Estado de Cuenta: accesibles para roles de ventas/admin */}
                                    {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                        <>
                                            <Link to={`/admin/clients/payments/${client.id}`} className="button-as-link">Gestionar Cobranza</Link>
                                            <Link to={`/admin/clients/statement/${client.id}`} className="button-as-link">Ver Estado Cuenta</Link>
                                        </>
                                    )}
                                    {/* Solo permitir eliminar a super_admin */}
                                    {hasPermission('super_admin') && (
                                        <button className="delete-button" onClick={() => onDeleteClient(client.id)}>Eliminar</button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ClientList;