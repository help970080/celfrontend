// Archivo: src/components/ClientPayments.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import PaymentManager from './PaymentManager';
import ReceiptViewer from './ReceiptViewer';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientPayments({ authenticatedFetch, userRole }) {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);

    const fetchClientData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [clientRes, statementRes, riskRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}`),
                authenticatedFetch(`${API_BASE_URL}/api/reports/client-statement/${clientId}`),
                authenticatedFetch(`${API_BASE_URL}/api/reports/client-risk/${clientId}`)
            ]);

            if (!clientRes.ok) throw new Error('Error al cargar datos del cliente.');
            if (!statementRes.ok) throw new Error('Error al cargar estado de cuenta.');
            if (!riskRes.ok) throw new Error('Error al cargar análisis de riesgo.');

            setClient(await clientRes.json());
            const statementData = await statementRes.json();
            setSales(statementData.sales.filter(sale => sale.isCredit && sale.balanceDue > 0));
            setRiskAnalysis(await riskRes.json());

        } catch (err) {
            setError(err.message || "No se pudieron cargar los datos.");
            toast.error(err.message || "No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    }, [clientId, authenticatedFetch]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    const handleOpenPaymentForm = (sale) => {
        setSelectedSaleForPayment(sale);
        setShowPaymentForm(true);
    };

    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
        setSelectedSaleForPayment(null);
    };

    const handlePaymentSuccess = () => {
        fetchClientData(); // Refresh data after a payment is successfully registered
    };

    const handleOpenReceiptModal = (saleId) => {
        setSelectedSaleIdForReceipt(saleId);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setShowReceiptModal(false);
        setSelectedSaleIdForReceipt(null);
    };

    // NEW: Handler for canceling a payment (super_admin only)
    const handleCancelPayment = async (paymentId) => {
        if (!window.confirm('¿Estás seguro de que quieres CANCELAR este pago? Esta acción revertirá el monto al saldo de la venta.')) {
            return;
        }

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/payments/${paymentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            toast.success('Pago cancelado y saldo de venta actualizado con éxito.');
            fetchClientData(); // Re-fetch client data to update balances and payment lists
        } catch (err) {
            console.error('Error al cancelar el pago:', err);
            toast.error(`Error al cancelar pago: ${err.message || 'Error desconocido.'}`);
        }
    };

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };


    if (loading) return <p>Cargando datos del cliente...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!client) return <p>Cliente no encontrado o ID inválido.</p>;

    return (
        <>
            <section className="client-payments-section">
                {client && (
                    <>
                        <h2>Gestión de Cobranza de: {client.name} {client.lastName}</h2>
                        <p><strong>Teléfono:</strong> <a href={`tel:${client.phone}`}>{client.phone}</a> | <strong>Dirección:</strong> {client.address}, {client.city}</p>
                    </>
                )}

                {riskAnalysis && (
                    <div className="risk-analysis-card">
                        <p>Nivel de Riesgo del Cliente: <span className={`risk-badge risk-${riskAnalysis.riskCategory?.toLowerCase() || 'unknown'}`}>{riskAnalysis.riskCategory || 'Desconocido'}</span></p>
                        <p><strong>Detalle:</strong> {riskAnalysis.riskDetails}</p>
                    </div>
                )}
                <hr/>
                <h3>Ventas a Crédito con Saldo Pendiente</h3>
                {sales.length > 0 ? (
                    <div className="credit-sales-list">
                        {sales.map(sale => (
                            <div key={sale.id} className="credit-sale-card">
                                <h4>Venta #{sale.id} - {dayjs(sale.saleDate).format('DD/MM/YYYY')}</h4>
                                <p><strong>Productos:</strong> {(sale.saleItems || []).map(item => item.product?.name).join(', ')}</p>
                                <p><strong>Monto Original:</strong> ${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p className="highlight-balance"><strong>Saldo Pendiente:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p><strong>Pago Semanal Sugerido:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>

                                <div className="card-actions">
                                    <button className="action-button" onClick={() => handleOpenPaymentForm(sale)}>Registrar Abono</button>
                                    <button className="secondary-button" onClick={() => handleOpenReceiptModal(sale.id)}>Ver Recibo</button>
                                </div>

                                {sale.payments && sale.payments.length > 0 && (
                                    <div className="payments-detail" style={{ marginTop: '20px', borderTop: '1px dashed #eee', paddingTop: '15px' }}>
                                        <h5>Historial de Pagos para esta Venta:</h5>
                                        <ul>
                                            {sale.payments.map(payment => (
                                                <li key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                                                    <span>
                                                        {dayjs(payment.paymentDate).format('DD/MM/YYYY HH:mm')} - ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({payment.paymentMethod}) - {payment.notes || ''}
                                                    </span>
                                                    {hasPermission('super_admin') && ( // Show "Cancelar" button only for super_admin
                                                        <button
                                                            onClick={() => handleCancelPayment(payment.id)}
                                                            className="delete-button" // Reuse existing delete button style
                                                            style={{ marginLeft: '10px', padding: '5px 8px', fontSize: '0.7em' }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>¡Felicidades! Este cliente no tiene saldos pendientes.</p>
                )}
            </section>

            {showPaymentForm && selectedSaleForPayment && (
                <PaymentManager
                    sale={selectedSaleForPayment}
                    onClose={handleClosePaymentForm}
                    onPaymentSuccess={handlePaymentSuccess}
                    authenticatedFetch={authenticatedFetch}
                />
            )}

            {showReceiptModal && (
                <ReceiptViewer
                    saleId={selectedSaleIdForReceipt}
                    onClose={handleCloseReceiptModal}
                    authenticatedFetch={authenticatedFetch} // Pass authenticatedFetch to ReceiptViewer
                />
            )}
        </>
    );
}

export default ClientPayments;