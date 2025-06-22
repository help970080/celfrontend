import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom'; // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!
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
    const { clientId } = useParams(); // Esta línea ahora funcionará porque useParams está importado
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
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const fetchClientDataAndAnalysis = useCallback(async () => {
        setLoading(true);
        setError(null);
        setLoadingRisk(true);
        setErrorRisk(null);
        try {
            const [clientRes, salesRes, riskRes] = await Promise.all([
                authenticatedFetch(`/api/clients/${clientId}`),
                authenticatedFetch(`/api/reports/client-statement/${clientId}`),
                authenticatedFetch(`/api/reports/client-risk/${clientId}`)
            ]);

            if (!clientRes.ok) throw new Error('Error al cargar datos del cliente');
            const clientData = await clientRes.json();
            setClient(clientData);

            if (!salesRes.ok) throw new Error('Error al cargar el estado de cuenta');
            const salesData = await salesRes.json();
            setSales(salesData.sales.filter(sale => sale.isCredit));

            if (!riskRes.ok) throw new Error('Error al cargar el análisis de riesgo');
            const riskData = await riskRes.json();
            setRiskAnalysis(riskData);

        } catch (err) {
            console.error("Error al cargar datos del cliente:", err);
            setError(err.message || "No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
            setLoadingRisk(false);
        }
    }, [clientId, authenticatedFetch]);

    useEffect(() => {
        fetchClientDataAndAnalysis();
    }, [fetchClientDataAndAnalysis]);
    
    // ... El resto de tus funciones (handleOpenPaymentForm, handleRegisterPayment, etc.) se mantienen igual ...
    const handleOpenPaymentForm = (sale) => {
        setSelectedSaleForPayment(sale);
        setShowPaymentForm(true);
        setPaymentAmount(sale.weeklyPaymentAmount > 0 ? sale.weeklyPaymentAmount.toFixed(2) : '');
        setPaymentMethod('cash');
        setPaymentNotes('');
    };

    const handleClosePaymentForm = () => {
        setShowPaymentForm(false);
        fetchClientDataAndAnalysis();
    };

    const handleRegisterPayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return toast.error('Monto de pago inválido.');
        if (amount > selectedSaleForPayment.balanceDue) return toast.error('Monto excede el saldo pendiente.');
        
        setLoadingPayment(true);
        try {
            const response = await authenticatedFetch(`/api/sales/${selectedSaleForPayment.id}/payments`, {
                method: 'POST',
                body: JSON.stringify({ amount, paymentMethod, notes: paymentNotes })
            });
            if (!response.ok) throw new Error((await response.json()).message);
            toast.success('Pago registrado con éxito!');
            handleClosePaymentForm();
        } catch (err) {
            toast.error(`Error al registrar pago: ${err.message}`);
        } finally {
            setLoadingPayment(false);
        }
    };
    
    const handleOpenReceiptModal = (sale) => {
        setSelectedSaleForReceipt(sale);
        setShowReceiptModal(true);
    };

    if (loading) return <section><p>Cargando datos del cliente...</p></section>;
    if (error) return <section><p className="error-message">Error: {error}</p></section>;
    if (!client) return <section><p>Cliente no encontrado.</p></section>;

    const getRiskBadgeClass = (riskCategory) => { /* ... tu lógica de clases ... */ };
    
    return (
        <section className="client-payments-section">
            <h2>Gestión de Cobranza para {client.name} {client.lastName}</h2>
            {/* ... El resto de tu JSX se mantiene igual ... */}

            <h3>Historial de Ventas a Crédito:</h3>
            {sales.length === 0 ? <p>Este cliente no tiene ventas a crédito activas.</p> : (
                <div className="credit-sales-list">
                    {sales.map(sale => (
                        <div key={sale.id} className="credit-sale-card">
                            <h4>Venta #{sale.id} - {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY')}</h4>
                            <p><strong>Producto(s):</strong> {sale.saleItems?.map(item => item.product?.name).join(', ') || 'N/A'}</p>
                            <p className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>
                                <strong>Saldo Pendiente:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                {sale.balanceDue <= 0 && <span className="status-badge status-paid_off">(Pagada)</span>}
                            </p>
                            <div className="card-actions">
                                {sale.balanceDue > 0 && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                    <button onClick={() => handleOpenPaymentForm(sale)}>Registrar Abono</button>
                                )}
                                <button onClick={() => handleOpenReceiptModal(sale)} className="secondary-button">Ver Recibo</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showPaymentForm && (
                <div className="payment-form-modal-overlay">
                    {/* ... tu formulario de pago ... */}
                </div>
            )}
            
            {showReceiptModal && (
                <ReceiptViewer sale={selectedSaleForReceipt} onClose={() => setShowReceiptModal(false)} />
            )}
        </section>
    );
}

export default ClientPayments;