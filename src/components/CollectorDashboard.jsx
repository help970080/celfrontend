// Archivo: components/CollectorDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function CollectorDashboard({ authenticatedFetch }) {
    const [groupedClients, setGroupedClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedClientId, setExpandedClientId] = useState(null);

    const fetchAssignedClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/my-assigned`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar los clientes asignados.');
            }
            let data = await response.json();
            
            data.sort((a, b) => b.hasOverdue - a.hasOverdue);

            setGroupedClients(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchAssignedClients();
    }, [fetchAssignedClients]);

    const handleToggleClient = (clientId) => {
        setExpandedClientId(prevId => (prevId === clientId ? null : clientId));
    };

    if (loading) return <section className="collector-dashboard"><h2>Mis Cobranzas Asignadas</h2><p>Cargando...</p></section>;
    if (error) return <section className="collector-dashboard"><h2>Mis Cobranzas Asignadas</h2><p className="error-message">{error}</p></section>;

    return (
        <section className="collector-dashboard">
            <h2>Mis Cobranzas Asignadas</h2>
            <p>Lista de clientes con saldos pendientes. Haz clic en un cliente para ver el detalle de sus ventas.</p>
            
            <div className="client-collection-list">
                {groupedClients.length === 0 ? (
                    <p>¡Felicidades! No tienes clientes con saldos pendientes asignados.</p>
                ) : (
                    groupedClients.map(({ client, sales, hasOverdue }) => (
                        <div key={client.id} className="client-group">
                            <div className="client-summary-row" onClick={() => handleToggleClient(client.id)}>
                                <div className="client-info">
                                    {/* --- INICIO DE LA CORRECCIÓN --- */}
                                    {hasOverdue && <span className="overdue-indicator" title="Este cliente tiene pagos vencidos">⚠️</span>}
                                    {/* --- FIN DE LA CORRECCIÓN --- */}
                                    <span className="client-name">{client.name} {client.lastName}</span>
                                    <span className="sales-count">({sales.length} venta(s) activa(s))</span>
                                </div>
                                <div className="client-actions">
                                    <span className="toggle-details-hint">
                                        {expandedClientId === client.id ? 'Ocultar detalles' : 'Ver detalles'}
                                    </span>
                                </div>
                            </div>

                            {expandedClientId === client.id && (
                                <div className="sales-detail-container">
                                    {sales.map(sale => (
                                        <div key={sale.id} className="collection-card">
                                            {sale.dynamicStatus === 'VENCIDO' && (
                                                <div className="overdue-alert">
                                                    PAGO VENCIDO
                                                </div>
                                            )}
                                            <p className="client-address"><strong>Dirección:</strong> {client.address}, {client.city}</p>
                                            <hr/>
                                            <p><strong>Venta ID:</strong> {sale.id} - {dayjs(sale.saleDate).format('DD/MM/YYYY')}</p>
                                            <p><strong>Productos:</strong> {(sale.saleItems || []).map(item => item.product?.name).join(', ')}</p>
                                            <div className="collection-financials">
                                                <p>Saldo Pendiente: <strong>${(sale.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                                                <p>Pago Semanal: <strong>${(sale.weeklyPaymentAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                                            </div>
                                            <div className="collection-actions">
                                                <Link to={`/admin/clients/payments/${client.id}`} className="button-as-link">Registrar Pago / Ver Historial</Link>
                                                <Link to={`/admin/clients/statement/${client.id}`} className="button-as-link secondary">Estado de Cuenta Completo</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}

export default CollectorDashboard;