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
    // --- INICIO DE CORRECCIÓN ---
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);
    // --- FIN DE CORRECCIÓN ---

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
    }, [selectedSaleForPayment, paymentAmount, paymentMethod, paymentNotes, authenticatedFetch, handleClosePaymentForm]);

    // --- INICIO DE CORRECCIÓN ---
    const handleOpenReceiptModal = (saleId) => {
        setSelectedSaleIdForReceipt(saleId);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setSelectedSaleIdForReceipt(null);
        setShowReceiptModal(false);
    };
    // --- FIN DE CORRECCIÓN ---

    // ... (El resto del componente sigue igual)
    
    // El renderizado de la lista de ventas ahora usa el ID
    // <button onClick={() => handleOpenReceiptModal(sale.id)} ... >

    // El renderizado del modal ahora pasa el ID
    // {showReceiptModal && (
    //    <ReceiptViewer saleId={selectedSaleIdForReceipt} onClose={handleCloseReceiptModal} />
    // )}

    // ... (Código completo abajo para copiar y pegar)
    if (loading) return <section>Cargando...</section>;
    if (error) return <section><p className="error-message">{error}</p></section>;

    return (
        <section className="client-payments-section">
            <h2>Gestión de Cobranza para {client?.name} {client?.lastName}</h2>
            {/* ... (resto del JSX del encabezado y riesgo) ... */}
            <h3>Historial de Ventas a Crédito:</h3>
            <div className="credit-sales-list">
                {sales.map(sale => (
                    <div key={sale.id} className="credit-sale-card">
                        {/* ... (contenido de la tarjeta de venta) ... */}
                        <div className="card-actions">
                             {sale.balanceDue > 0 && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                                <button onClick={() => handleOpenPaymentForm(sale)} className="action-button">Registrar Abono</button>
                            )}
                            {/* --- INICIO DE CORRECCIÓN --- */}
                            <button onClick={() => handleOpenReceiptModal(sale.id)} className="action-button secondary-button">
                                Ver Recibo
                            </button>
                            {/* --- FIN DE CORRECCIÓN --- */}
                        </div>
                    </div>
                ))}
            </div>

            {/* ... (código del modal del formulario de pago) ... */}
            
            {/* --- INICIO DE CORRECCIÓN --- */}
            {showReceiptModal && (
                <ReceiptViewer saleId={selectedSaleIdForReceipt} onClose={handleCloseReceiptModal} />
            )}
            {/* --- FIN DE CORRECCIÓN --- */}
        </section>
    );
}

export default ClientPayments;