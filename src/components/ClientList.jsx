// ClientList.jsx - VERSIÓN OPTIMIZADA CON ANCHOS BALANCEADOS

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CollectionManagementModal from './CollectionManagementModal';

function ClientList({ clients, onEditClient, onDeleteClient, userRole, authenticatedFetch }) {
    const [selectedClientForManagement, setSelectedClientForManagement] = useState(null);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    const getRiskBadge = (riskData) => {
        if (!riskData) {
            return {
                icon: '⚪',
                text: 'SIN DEUDA',
                color: '#6c757d',
                bgColor: '#f8f9fa'
            };
        }

        const { riskCategory, totalBalance, daysOverdue } = riskData;

        switch (riskCategory) {
            case 'HIGH':
                return {
                    icon: '🔴',
                    text: 'ALTO',
                    color: '#dc3545',
                    bgColor: '#f8d7da',
                    totalBalance,
                    daysOverdue
                };
            case 'MEDIUM':
                return {
                    icon: '🟡',
                    text: 'MEDIO',
                    color: '#ffc107',
                    bgColor: '#fff3cd',
                    totalBalance,
                    daysOverdue
                };
            case 'LOW':
                return {
                    icon: '🟢',
                    text: 'BAJO',
                    color: '#28a745',
                    bgColor: '#d4edda',
                    totalBalance,
                    daysOverdue
                };
            default:
                return {
                    icon: '⚪',
                    text: 'SIN DEUDA',
                    color: '#6c757d',
                    bgColor: '#f8f9fa'
                };
        }
    };

    if (clients.length === 0) {
        return (
            <div className="client-list-container">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    📋 No hay clientes que coincidan con los filtros seleccionados.
                </p>
            </div>
        );
    }

    return (
        <div className="client-list-container">
            <h2>Clientes Registrados</h2>
            
            <div className="table-responsive">
                <table className="client-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th style={{ minWidth: '180px' }}>Nombre Completo</th>
                            <th style={{ minWidth: '130px' }}>Teléfono</th>
                            <th style={{ minWidth: '180px', width: '180px' }}>Nivel de Riesgo</th>
                            <th style={{ minWidth: '120px', width: '120px' }}>Adeudo Total</th>
                            <th style={{ minWidth: '180px' }}>Email</th>
                            <th style={{ minWidth: '200px' }}>Dirección</th>
                            <th style={{ minWidth: '300px', width: '300px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => {
                            const riskBadge = getRiskBadge(client.riskData);
                            
                            return (
                                <tr key={client.id}>
                                    {/* ID */}
                                    <td style={{ width: '60px', textAlign: 'center' }}>
                                        <strong style={{ color: 'var(--success)' }}>
                                            {client.id}
                                        </strong>
                                    </td>
                                    
                                    {/* Nombre */}
                                    <td style={{ minWidth: '180px' }}>
                                        <strong>{client.name} {client.lastName}</strong>
                                    </td>
                                    
                                    {/* Teléfono */}
                                    <td style={{ minWidth: '130px' }}>
                                        {client.phone ? (
                                            <a 
                                                href={`https://wa.me/52${client.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#25D366',
                                                    textDecoration: 'none',
                                                    fontWeight: '600',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                                title="Abrir WhatsApp"
                                            >
                                                💬 {client.phone}
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--gray-600)' }}>N/A</span>
                                        )}
                                    </td>

                                    {/* Nivel de Riesgo + Botón Gestionar */}
                                    <td style={{ minWidth: '180px', width: '180px' }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px',
                                            alignItems: 'flex-start'
                                        }}>
                                            {/* Badge de riesgo */}
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontWeight: '700',
                                                fontSize: '0.75rem',
                                                color: riskBadge.color,
                                                background: riskBadge.bgColor,
                                                border: `2px solid ${riskBadge.color}`,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                <span style={{ fontSize: '1rem' }}>{riskBadge.icon}</span>
                                                {riskBadge.text}
                                            </span>

                                            {/* Días de atraso */}
                                            {riskBadge.daysOverdue > 0 && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: '#dc3545',
                                                    fontWeight: '600'
                                                }}>
                                                    ⏰ {riskBadge.daysOverdue}d
                                                </span>
                                            )}

                                            {/* Botón Gestionar */}
                                            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                                <button
                                                    onClick={() => setSelectedClientForManagement(client)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '4px 10px',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '0.7rem',
                                                        transition: 'all 0.2s',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                                                        width: '100%',
                                                        maxWidth: '110px'
                                                    }}
                                                    title="Registrar gestión de cobranza"
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                                                    }}
                                                >
                                                    📋 Gestionar
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Adeudo Total */}
                                    <td style={{ minWidth: '120px', width: '120px' }}>
                                        {riskBadge.totalBalance > 0 ? (
                                            <span style={{
                                                fontSize: '1rem',
                                                fontWeight: '700',
                                                color: riskBadge.totalBalance > 1000 ? '#dc3545' : '#ffc107',
                                                display: 'block'
                                            }}>
                                                ${riskBadge.totalBalance.toLocaleString('es-MX', { 
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2 
                                                })}
                                            </span>
                                        ) : (
                                            <span style={{ 
                                                color: '#28a745',
                                                fontWeight: '600',
                                                fontSize: '0.85rem'
                                            }}>
                                                ✓ Al corriente
                                            </span>
                                        )}
                                    </td>
                                    
                                    {/* Email */}
                                    <td style={{ minWidth: '180px' }}>
                                        {client.email ? (
                                            <a 
                                                href={`mailto:${client.email}`}
                                                style={{
                                                    color: 'var(--info)',
                                                    textDecoration: 'none',
                                                    fontWeight: '500',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {client.email}
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--gray-600)' }}>N/A</span>
                                        )}
                                    </td>
                                    
                                    {/* Dirección */}
                                    <td style={{ minWidth: '200px', maxWidth: '300px', whiteSpace: 'normal' }}>
                                        <span style={{ fontSize: '0.85rem' }}>
                                            📍 {`${client.address}, ${client.city}`}
                                        </span>
                                    </td>
                                    
                                    {/* Acciones */}
                                    <td style={{ minWidth: '300px', width: '300px' }}>
                                        <div style={{ 
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2, 1fr)',
                                            gap: '0.4rem'
                                        }}>
                                            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                                <>
                                                    {/* Editar */}
                                                    <button 
                                                        onClick={() => onEditClient(client)}
                                                        style={{
                                                            background: 'linear-gradient(135deg, var(--warning), var(--warning-dark))',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.5rem 0.6rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            fontSize: '0.75rem',
                                                            transition: 'var(--transition)',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title="Editar cliente"
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    
                                                    {/* Cobrar */}
                                                    <Link 
                                                        to={`/admin/clients/payments/${client.id}`} 
                                                        style={{
                                                            background: riskBadge.totalBalance > 0 
                                                                ? 'linear-gradient(135deg, #dc3545, #bd2130)'
                                                                : 'linear-gradient(135deg, var(--secondary), #6b21a8)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.5rem 0.6rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            textDecoration: 'none',
                                                            fontWeight: '600',
                                                            fontSize: '0.75rem',
                                                            transition: 'var(--transition)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title={riskBadge.totalBalance > 0 ? "¡Gestionar cobro urgente!" : "Gestionar cobranza"}
                                                    >
                                                        {riskBadge.totalBalance > 0 ? '🚨 Cobrar' : '💰 Cobranza'}
                                                    </Link>
                                                    
                                                    {/* Estado */}
                                                    <Link 
                                                        to={`/admin/clients/statement/${client.id}`}
                                                        style={{
                                                            background: 'linear-gradient(135deg, var(--info), var(--info-dark))',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '0.5rem 0.6rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            textDecoration: 'none',
                                                            fontWeight: '600',
                                                            fontSize: '0.75rem',
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
                                            
                                            {/* Eliminar (solo super_admin) */}
                                            {hasPermission('super_admin') && (
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => onDeleteClient(client.id)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, var(--danger), var(--danger-dark))',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.5rem 0.6rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '0.75rem',
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
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Gestión */}
            {selectedClientForManagement && (
                <CollectionManagementModal
                    client={selectedClientForManagement}
                    onClose={() => setSelectedClientForManagement(null)}
                    authenticatedFetch={authenticatedFetch}
                />
            )}
        </div>
    );
}

export default ClientList;