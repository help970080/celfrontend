import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import ReceiptViewer from './ReceiptViewer';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientPayments({ authenticatedFetch, userRole }) { 
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [errorPayment, setErrorPayment] = useState(null);

    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);

    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [loadingRisk, setLoadingRisk] = useState(true);
    const [errorRisk, setErrorRisk] = useState(null);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    const fetchClientDataAndAnalysis = useCallback(async () => {
        setLoading(true);
        setError(null);
        setLoadingRisk(true);
        setErrorRisk(null);
        try {
            const clientResponse = await authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}`);
            const clientData = await clientResponse.json();
            setClient(clientData);

            const salesResponse = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-statement/${clientId}`);
            const salesData = await salesResponse.json();
            setSales(salesData.sales.filter(sale => sale.isCredit));

            const riskResponse = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-risk/${clientId}`);
            const riskData = await riskResponse.json();
            setRiskAnalysis(riskData);
        } catch (err) {
            setError(err.message || "No se pudieron cargar los datos.");
            setErrorRisk(err.message || "No se pudo cargar el análisis de riesgo.");
        } finally {
            setLoading(false);
            setLoadingRisk(false);
        }
    }, [clientId, authenticatedFetch]);

    useEffect(() => {
        fetchClientDataAndAnalysis();
    }, [fetchClientDataAndAnalysis]);

    const handleOpenPaymentForm = (sale) => {
        setSelectedSaleForPayment(sale);
        setShowPaymentForm(true);
        setPaymentAmount(sale.weeklyPaymentAmount > 0 ? sale.weeklyPaymentAmount.toFixed(2) : '');
        setPaymentMethod('cash');
        setPaymentNotes('');
        setErrorPayment(null);
    };

    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
        fetchClientDataAndAnalysis();
    };

    const handleRegisterPayment = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedSaleForPayment) return;
        setLoadingPayment(true);
        setErrorPayment(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/${selectedSaleForPayment.id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(paymentAmount),
                    paymentMethod,
                    notes: paymentNotes
                })
            });
            toast.success('Pago registrado con éxito!');
            handleClosePaymentForm();
        } catch (err) {
            setErrorPayment(err.message || 'Error al registrar el pago.');
            toast.error('Ocurrió un error al registrar el pago.');
        } finally {
            setLoadingPayment(false);
        }
    }, [selectedSaleForPayment, paymentAmount, paymentMethod, paymentNotes, authenticatedFetch]);

    const handleOpenReceiptModal = (saleId) => {
        setSelectedSaleIdForReceipt(saleId);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setSelectedSaleIdForReceipt(null);
        setShowReceiptModal(false);
    };
    
    const getRiskBadgeClass = (riskCategory) => {
        switch (riskCategory) {
            case 'BAJO': return 'risk-badge risk-low';
            case 'MEDIO': return 'risk-badge risk-medium';
            case 'ALTO': return 'risk-badge risk-high';
            default: return 'risk-badge risk-unknown';
        }
    };
    
    if (loading) return <section className="client-payments-section">Cargando...</section>;
    if (error) return <section className="client-payments-section"><p className="error-message">{error}</p></section>;

    return (
        <section className="client-payments-section">
            <h2>Gestión de Cobranza para {client?.name} {client?.lastName}</h2>
            <p><strong>Teléfono:</strong> {client?.phone}</p>
            <p><strong>Email:</strong> {client?.email || 'N/A'}</p>
            <hr/>

            <h3>Análisis de Riesgo de Crédito:</h3>
            {loadingRisk ? <p>Cargando análisis...</p> : errorRisk ? <p className="error-message">{errorRisk}</p> : riskAnalysis && (
                <div className="risk-analysis-card">
                    <p>Categoría de Riesgo: <span className={getRiskBadgeClass(riskAnalysis.riskCategory)}>{riskAnalysis.riskCategory}</span></p>
                    <p>{riskAnalysis.riskDetails}</p>
                </div>
            )}
            <hr/>

            <h3>Historial de Ventas a Crédito:</h3>
            {sales.length === 0 ? <p>Este cliente no tiene ventas a crédito.</p> : (
                <div className="credit-sales-list">
                    {sales.map(sale => (
                        <div key={sale.id} className="credit-sale-card">
                            {/* --- INICIO DEL CÓDIGO RESTAURADO --- */}
                            <h4>Venta #{sale.id} - {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY')}</h4>
                            <p><strong>Producto(s):</strong> {sale.saleItems?.map(item => item.product ? `${item.product.name} (x${item.quantity})` : '').join(', ')}</p>
                            <p><strong>Monto Original:</strong> ${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            <p className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>
                                <strong>Saldo Pendiente:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                {sale.balanceDue <= 0 && <span style={{color: 'green', marginLeft: '5px', fontWeight: 'bold'}}>(Pagada)</span>}
                            </p>
                            <p><strong>Pago Semanal:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Estado:</strong> <span className={`status-badge status-${sale.status}`}>{sale.status.replace('_', ' ')}</span></p>
                            {/* --- FIN DEL CÓDIGO RESTAURADO --- */}

                            <div className="card-actions">
                                {sale.balanceDue > 0 && sale.status !== 'paid_off' && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                    <button onClick={() => handleOpenPaymentForm(sale)} className="action-button">
                                        Registrar Abono
                                    </button>
                                )}
                                <button onClick={() => handleOpenReceiptModal(sale.id)} className="action-button secondary-button">
                                    Ver Recibo
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showPaymentForm && selectedSaleForPayment && (
                <div className="payment-form-modal-overlay">
                    <div className="payment-form-modal-content">
                        <button className="close-button" onClick={handleClosePaymentForm}>×</button>
                        <h3>Registrar Abono para Venta #{selectedSaleForPayment.id}</h3>
                        <div className="payment-summary-info">
                            <p><strong>Saldo Pendiente:</strong> ${selectedSaleForPayment.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <form onSubmit={handleRegisterPayment} className="payment-form-inner">
                            {errorPayment && <p className="error-message">{errorPayment}</p>}
                            <div className="form-group">
                                <label htmlFor="abonoAmount">Monto del Abono:</label>
                                <input type="number" id="abonoAmount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} step="0.01" min="0.01" max={selectedSaleForPayment.balanceDue} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="abonoMethod">Método de Pago:</label>
                                <select id="abonoMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                    <option value="cash">Efectivo</option>
                                    <option value="transfer">Transferencia</option>
                                    <option value="card">Tarjeta</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="abonoNotes">Notas (Opcional):</label>
                                <input type="text" id="abonoNotes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
                            </div>
                            <button type="submit" disabled={loadingPayment}>{loadingPayment ? 'Registrando...' : 'Confirmar Abono'}</button>
                            <button type="button" onClick={handleClosePaymentForm} disabled={loadingPayment} className="cancel-button">Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
            
            {showReceiptModal && (
                <ReceiptViewer saleId={selectedSaleIdForReceipt} onClose={handleCloseReceiptModal} />
            )}
        </section>
    );
}

export default ClientPayments;