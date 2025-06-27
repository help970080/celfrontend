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
        fetchClientData();
    };
    
    const handleOpenReceiptModal = (saleId) => {
        setSelectedSaleIdForReceipt(saleId);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setShowReceiptModal(false);
        setSelectedSaleIdForReceipt(null);
    };

    if (loading) return <p>Cargando datos del cliente...</p>;
    if (error) return <p className="error-message">{error}</p>;

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
                                
                                {/* ESTE ES EL BLOQUE QUE GENERA LOS BOTONES */}
                                <div className="card-actions">
                                    <button className="action-button" onClick={() => handleOpenPaymentForm(sale)}>Registrar Abono</button>
                                    <button className="secondary-button" onClick={() => handleOpenReceiptModal(sale.id)}>Ver Recibo</button>
                                </div>
                                
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
                />
            )}
        </>
    );
}

export default ClientPayments;