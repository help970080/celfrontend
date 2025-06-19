import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs'; // <-- ¡CAMBIADO!
import utc from 'dayjs/plugin/utc'; // <-- ¡AGREGADO!
import timezone from 'dayjs/plugin/timezone'; // <-- ¡AGREGADO!
import ReceiptViewer from './ReceiptViewer';

dayjs.extend(utc); // <-- ¡AGREGADO!
dayjs.extend(timezone); // <-- ¡AGREGADO!

const TIMEZONE = "America/Mexico_City"; // <-- ¡AGREGADO!

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
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);

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
            // CORRECCIÓN DE URL: ELIMINADOS <span class="math-inline"> Y ESPACIOS INCORRECTOS
            const clientResponse = await authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}`);
            if (!clientResponse.ok) {
                const errorData = await clientResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${clientResponse.status}`);
            }
            const clientData = await clientResponse.json();
            setClient(clientData);

            // CORRECCIÓN DE URL: ELIMINADOS <span class="math-inline"> Y ESPACIOS INCORRECTOS
            const salesResponse = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-statement/${clientId}`);
            if (!salesResponse.ok) {
                const errorData = await salesResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${salesResponse.status}`);
            }
            const salesData = await salesResponse.json();
            const creditSales = salesData.sales.filter(sale => sale.isCredit);
            setSales(creditSales);

            // CORRECCIÓN DE URL: ELIMINADOS <span class="math-inline"> Y ESPACIOS INCORRECTOS
            const riskResponse = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-risk/${clientId}`);
            if (!riskResponse.ok) {
                const errorData = await riskResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${riskResponse.status}`);
            }
            const riskData = await riskResponse.json();
            setRiskAnalysis(riskData);

        } catch (err) {
            console.error("Error al cargar datos del cliente o análisis de riesgo:", err);
            setError(err.message || "No se pudieron cargar los datos del cliente o el análisis de riesgo.");
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
        setSelectedSaleForPayment(null);
        setShowPaymentForm(false);
        resetPaymentFormStates();
        fetchClientDataAndAnalysis();
    };

    const resetPaymentFormStates = () => {
        setPaymentAmount('');
        setPaymentMethod('cash');
        setPaymentNotes('');
        setLoadingPayment(false);
        setErrorPayment(null);
    };

    const handleRegisterPayment = useCallback(async (e) => {
        e.preventDefault();

        if (!selectedSaleForPayment || !selectedSaleForPayment.id) {
            setErrorPayment('No se ha proporcionado una venta válida para registrar el pago.');
            toast.error('Error: Venta inválida para pago.');
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            setErrorPayment('Por favor, ingresa un monto de pago válido mayor a cero.');
            toast.error('Monto de pago inválido.');
            return;
        }
        if (amount > selectedSaleForPayment.balanceDue) {
            setErrorPayment(`El monto del pago ($${amount.toLocaleString('es-MX', {minimumFractionDigits: 2})}) no puede ser mayor al saldo pendiente de $${selectedSaleForPayment.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`);
            toast.error('Monto de pago excede el saldo pendiente.');
            return;
        }

        setLoadingPayment(true);
        setErrorPayment(null);

        try {
            // CORRECCIÓN DE URL: ELIMINADOS <span class="math-inline"> Y ESPACIOS INCORRECTOS
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/${selectedSaleForPayment.id}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    paymentMethod,
                    notes: paymentNotes
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            toast.success('Pago registrado con éxito!');
            handleClosePaymentForm();
        } catch (err) {
            console.error('Error al registrar pago:', err);
            setErrorPayment(err.message || 'Error al registrar el pago. Intenta de nuevo.');
            toast.error('Ocurrió un error al registrar el pago.');
        } finally {
            setLoadingPayment(false);
        }
    }, [selectedSaleForPayment, paymentAmount, paymentMethod, paymentNotes, authenticatedFetch, handleClosePaymentForm]);


    const handleOpenReceiptModal = (sale) => {
        setSelectedSaleForReceipt(sale);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setSelectedSaleForReceipt(null);
        setShowReceiptModal(false);
    };


    if (loading) {
        return <section className="client-payments-section">Cargando cobranza y análisis de riesgo del cliente...</section>;
    }

    if (error) {
        return <section className="client-payments-section"><p className="error-message">Error: {error}</p></section>;
    }

    if (!client) {
        return <section className="client-payments-section"><p>Cliente no encontrado.</p></section>;
    }

    const getRiskBadgeClass = (riskCategory) => {
        switch (riskCategory) {
            case 'BAJO': return 'risk-badge risk-low';
            case 'MEDIO': return 'risk-badge risk-medium';
            case 'ALTO': return 'risk-badge risk-high';
            default: return 'risk-badge risk-unknown';
        }
    };

    return (
        <section className="client-payments-section">
            <h2>Gestión de Cobranza para {client.name} {client.lastName}</h2>
            <p><strong>Teléfono:</strong> {client.phone}</p>
            <p><strong>Email:</strong> {client.email || 'N/A'}</p>
            <hr/>

            <h3>Análisis de Riesgo de Crédito:</h3>
            {loadingRisk ? (
                <p>Cargando análisis de riesgo...</p>
            ) : errorRisk ? (
                <p className="error-message">Error al cargar riesgo: {errorRisk}</p>
            ) : riskAnalysis ? (
                <div className="risk-analysis-card">
                    <p>Categoría de Riesgo: <span className={getRiskBadgeClass(riskAnalysis.riskCategory)}>{riskAnalysis.riskCategory}</span></p>
                    <p>{riskAnalysis.riskDetails}</p>
                </div>
            ) : (
                <p>No se pudo realizar el análisis de riesgo.</p>
            )}
            <hr/>

            <h3>Historial de Ventas a Crédito:</h3>
            {sales.length === 0 ? (
                <p>Este cliente no tiene ventas a crédito registradas.</p>
            ) : (
                <div className="credit-sales-list">
                    {sales.map(sale => (
                        <div key={sale.id} className="credit-sale-card">
                            <h4>Venta #{sale.id} - {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY')}</h4>
                            <p><strong>Producto(s):</strong> {sale.saleItems && sale.saleItems.map(item =>
                                item.product ? `${item.product.name} (x${item.quantity})` : `Producto ID ${item.productId} (x${item.quantity})`
                            ).join(', ')}</p>
                            <p><strong>Monto Original:</strong> ${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Enganche:</strong> ${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            <p className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>
                                <strong>Saldo Pendiente:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                {sale.balanceDue <= 0 && <span style={{color: 'green', marginLeft: '5px', fontWeight: 'bold'}}>(Pagada)</span>}
                            </p>
                            <p><strong>Pago Semanal:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({sale.numberOfPayments} pagos)</p>
                            <p><strong>Tasa Interés:</strong> {sale.interestRate * 100}%</p>
                            <p><strong>Estado:</strong> <span className={`status-badge status-${sale.status}`}>{sale.status.replace('_', ' ')}</span></p>
                            <div className="card-actions">
                                {sale.balanceDue > 0 && sale.status !== 'paid_off' && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                    <button
                                        onClick={() => handleOpenPaymentForm(sale)}
                                        className="action-button"
                                    >
                                        Registrar Abono
                                    </button>
                                )}
                                <button onClick={() => handleOpenReceiptModal(sale)} className="action-button secondary-button">
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
                            <p><strong>Saldo Venta Original:</strong> ${selectedSaleForPayment.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            <p className="highlight-balance"><strong>Saldo Pendiente:</strong> ${selectedSaleForPayment.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            {selectedSaleForPayment.weeklyPaymentAmount > 0 && (
                                <p><strong>Pago Semanal Sugerido:</strong> ${selectedSaleForPayment.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            )}
                        </div>

                        <form onSubmit={handleRegisterPayment} className="payment-form-inner">
                            {errorPayment && <p className="error-message">{errorPayment}</p>}

                            <div className="form-group">
                                <label htmlFor="abonoAmount">Monto del Abono:</label>
                                <input
                                    type="number"
                                    id="abonoAmount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    step="0.01"
                                    min="0.01"
                                    max={selectedSaleForPayment.balanceDue}
                                    required
                                />
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
                                <input
                                    type="text"
                                    id="abonoNotes"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                />
                            </div>

                            <button type="submit" disabled={loadingPayment}>
                                {loadingPayment ? 'Registrando...' : 'Confirmar Abono'}
                            </button>
                            <button type="button" onClick={handleClosePaymentForm} disabled={loadingPayment} className="cancel-button">
                                Cancelar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showReceiptModal && selectedSaleForReceipt && (
                <ReceiptViewer sale={selectedSaleForReceipt} onClose={handleCloseReceiptModal} />
            )}
        </section>
    );
}

export default ClientPayments;