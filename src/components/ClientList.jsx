// Archivo: components/ClientList.jsx - VERSIÓN CORREGIDA

import React from 'react';
import { Link } from 'react-router-dom';

function ClientList({ clients, onEditClient, onDeleteClient, userRole }) {
    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    if (clients.length === 0) {
        return (
            <div className="client-list-container">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No hay clientes registrados.
                </p>
            </div>
        );
    }

    return (
        <div className="client-list-container">
            <h2>Clientes Registrados</h2>
            
            {/* ===== WRAPPER CON SCROLL HORIZONTAL ===== */}
            <div className="table-responsive">
                <table className="client-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre Completo</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Dirección</th>
                            <th>ID Identificación</th>
                            <th style={{ minWidth: '280px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client.id}>
                                <td>
                                    <strong style={{ color: 'var(--success)' }}>
                                        {client.id}
                                    </strong>
                                </td>
                                
                                <td style={{ minWidth: '180px' }}>
                                    <strong>{client.name} {client.lastName}</strong>
                                </td>
                                
                                <td style={{ minWidth: '130px' }}>
                                    {client.phone ? (
                                        <a 
                                            href={`tel:${client.phone}`}
                                            style={{
                                                color: 'var(--primary)',
                                                textDecoration: 'none',
                                                fontWeight: '600',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}
                                        >
                                            📞 {client.phone}
                                        </a>
                                    ) : (
                                        <span style={{ color: 'var(--gray-600)' }}>N/A</span>
                                    )}
                                </td>
                                
                                <td style={{ minWidth: '180px' }}>
                                    {client.email ? (
                                        <a 
                                            href={`mailto:${client.email}`}
                                            style={{
                                                color: 'var(--info)',
                                                textDecoration: 'none',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {client.email}
                                        </a>
                                    ) : (
                                        <span style={{ color: 'var(--gray-600)' }}>N/A</span>
                                    )}
                                </td>
                                
                                <td style={{ minWidth: '200px', maxWidth: '300px', whiteSpace: 'normal' }}>
                                    📍 {`${client.address}, ${client.city}`}
                                </td>
                                
                                <td style={{ minWidth: '120px' }}>
                                    {client.identificationId ? (
                                        <span 
                                            style={{
                                                background: 'var(--gray-100)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontFamily: 'monospace',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                display: 'inline-block'
                                            }}
                                        >
                                            {client.identificationId}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--gray-600)' }}>N/A</span>
                                    )}
                                </td>
                                
                                <td>
                                    <div style={{ 
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '0.5rem',
                                        minWidth: '280px'
                                    }}>
                                        {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                            <>
                                                <button 
                                                    onClick={() => onEditClient(client)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--warning), var(--warning-dark))',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.6rem 0.8rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '0.8rem',
                                                        transition: 'var(--transition)',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    title="Editar cliente"
                                                >
                                                    ✏️ Editar
                                                </button>
                                                
                                                <Link 
                                                    to={`/admin/clients/payments/${client.id}`} 
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--secondary), #6b21a8)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.6rem 0.8rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                        fontSize: '0.8rem',
                                                        transition: 'var(--transition)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                    title="Gestionar cobranza"
                                                >
                                                    💰 Cobranza
                                                </Link>
                                                
                                                <Link 
                                                    to={`/admin/clients/statement/${client.id}`}
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--info), var(--info-dark))',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.6rem 0.8rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        textDecoration: 'none',
                                                        fontWeight: '600',
                                                        fontSize: '0.8rem',
                                                        transition: 'var(--transition)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        whiteSpace: 'nowrap',
                                                        gridColumn: hasPermission('super_admin') ? 'auto' : '1 / -1'
                                                    }}
                                                    title="Ver estado de cuenta"
                                                >
                                                    📄 Estado
                                                </Link>
                                            </>
                                        )}
                                        
                                        {hasPermission('super_admin') && (
                                            <button 
                                                className="delete-button" 
                                                onClick={() => onDeleteClient(client.id)}
                                                style={{
                                                    background: 'linear-gradient(135deg, var(--danger), var(--danger-dark))',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.6rem 0.8rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    fontSize: '0.8rem',
                                                    transition: 'var(--transition)',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                title="Eliminar cliente"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* ===== FIN DEL WRAPPER ===== */}
        </div>
    );
}

export default ClientList;