// ClientList.jsx - CON BOTÓN DE DOCUMENTOS Y VERIFICACIÓN FACIAL

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CollectionManagementModal from './CollectionManagementModal';
import ClientDocuments from './ClientDocuments'; // ⭐ NUEVO

function ClientList({ clients, onEditClient, onDeleteClient, userRole, authenticatedFetch }) {
    const [selectedClientForManagement, setSelectedClientForManagement] = useState(null);
    const [selectedClientForDocs, setSelectedClientForDocs] = useState(null); // ⭐ NUEVO

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

    // ⭐ NUEVO: Indicador de verificación
    const getVerificationBadge = (client) => {
        const status = client.estadoVerificacion;
        if (!status || status === 'pendiente') {
            return { icon: '⏳', color: '#6c757d', text: 'Sin verificar' };
        }
        if (status === 'verificado') {
            return { icon: '✅', color: '#28a745', text: 'Verificado' };
        }
        if (status === 'revision') {
            return { icon: '⚠️', color: '#ffc107', text: 'En revisión' };
        }
        return { icon: '❌', color: '#dc3545', text: 'Rechazado' };
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
                            <th style={{ minWidth: '80px', width: '80px' }}>Verif.</th>
                            <th style={{ minWidth: '180px' }}>Email</th>
                            <th style={{ minWidth: '200px' }}>Dirección</th>
                            <th style={{ minWidth: '340px', width: '340px' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => {
                            const riskBadge = getRiskBadge(client.riskData);
                            const verifBadge = getVerificationBadge(client); // ⭐ NUEVO
                            
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
                                            gap: '0.4rem'
                                        }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                                backgroundColor: riskBadge.bgColor,
                                                color: riskBadge.color,
                                                width: 'fit-content'
                                            }}>
                                                {riskBadge.icon} {riskBadge.text}
                                            </span>
                                            
                                            {riskBadge.daysOverdue > 0 && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: '#dc3545',
                                                    fontWeight: '600'
                                                }}>
                                                    ⚠️ {riskBadge.daysOverdue} días vencido
                                                </span>
                                            )}
                                            
                                            {riskBadge.totalBalance > 0 && (
                                                <button
                                                    onClick={() => setSelectedClientForManagement(client)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.35rem 0.6rem',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        fontSize: '0.7rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        width: 'fit-content'
                                                    }}
                                                    title="Registrar gestión de cobranza"
                                                >
                                                    📋 Gestionar
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                    {/* Adeudo Total */}
                                    <td style={{ 
                                        minWidth: '120px', 
                                        width: '120px',
                                        textAlign: 'right',
                                        fontWeight: '700',
                                        color: riskBadge.totalBalance > 0 ? 'var(--danger)' : 'var(--success)'
                                    }}>
                                        ${(riskBadge.totalBalance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>

                                    {/* ⭐ NUEVO: Columna de Verificación */}
                                    <td style={{ minWidth: '80px', width: '80px', textAlign: 'center' }}>
                                        <span 
                                            title={verifBadge.text}
                                            style={{
                                                fontSize: '1.2rem',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setSelectedClientForDocs(client)}
                                        >
                                            {verifBadge.icon}
                                        </span>
                                    </td>

                                    {/* Email */}
                                    <td style={{ minWidth: '180px' }}>
                                        {client.email ? (
                                            <a 
                                                href={`mailto:${client.email}`}
                                                style={{
                                                    color: 'var(--info)',
                                                    textDecoration: 'none',
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
                                    <td style={{ minWidth: '340px', width: '340px' }}>
                                        <div style={{ 
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
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
                                                    
                                                    {/* ⭐ NUEVO: Documentos */}
                                                    <button 
                                                        onClick={() => setSelectedClientForDocs(client)}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
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
                                                        title="Ver documentos e INE"
                                                    >
                                                        📄 Docs
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
                                                        {riskBadge.totalBalance > 0 ? '🚨 Cobrar' : '💰 Cobrar'}
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
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title="Ver estado de cuenta"
                                                    >
                                                        📊 Estado
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
                                                        whiteSpace: 'nowrap',
                                                        gridColumn: 'span 2'
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

            {/* ⭐ NUEVO: Modal de Documentos */}
            {selectedClientForDocs && (
                <ClientDocuments
                    clientId={selectedClientForDocs.id}
                    clientName={`${selectedClientForDocs.name} ${selectedClientForDocs.lastName}`}
                    onClose={() => setSelectedClientForDocs(null)}
                    authenticatedFetch={authenticatedFetch}
                />
            )}
        </div>
    );
}

export default ClientList;