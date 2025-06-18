import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import moment from 'moment-timezone';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function PaymentManager({ sale, onClose, authenticatedFetch, onPaymentSuccess }) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [errorPayment, setErrorPayment] = useState(null);
    const [currentSale, setCurrentSale] = useState(sale);

    useEffect(() => {
        if (!sale) return;

        setCurrentSale(sale);
        if (sale.weeklyPaymentAmount > 0 && paymentAmount === '') {
            setPaymentAmount(sale.weeklyPaymentAmount.toFixed(2));
        }

    }, [sale, paymentAmount]); 

    const handleRegisterPayment = useCallback(async (e) => {
        e.preventDefault();
        
        if (!currentSale || !currentSale.id) {
            setErrorPayment('No se ha proporcionado una venta válida.');
            toast.error('No se puede registrar el pago: Venta inválida.');
            return;
        }

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
            setErrorPayment('Por favor, ingresa un monto de pago válido mayor a cero.');
            toast.error('Monto de pago inválido.');
            return;
        }
        if (amount > currentSale.balanceDue) {
            setErrorPayment(`El monto del pago no puede ser mayor al saldo pendiente de $${currentSale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`);
            toast.error('Monto de pago excede el saldo pendiente.');
            return;
        }

        setLoadingPayment(true);
        setErrorPayment(null);

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/${currentSale.id}/payments`, {
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

            const result = await response.json();
            toast.success('Pago registrado con éxito!');
            onPaymentSuccess(currentSale.id);
            onClose();
            resetForm();
        } catch (err) {
            console.error('Error al registrar pago:', err);
            setErrorPayment(err.message || 'Error al registrar el pago. Intenta de nuevo.');
            toast.error('Ocurrió un error al registrar el pago.');
        } finally {
            setLoadingPayment(false);
        }
    }, [currentSale, paymentAmount, paymentMethod, paymentNotes, authenticatedFetch, onClose, onPaymentSuccess]); 

    const resetForm = () => {
        setPaymentAmount(currentSale?.weeklyPaymentAmount > 0 ? currentSale.weeklyPaymentAmount.toFixed(2) : '');
        setPaymentMethod('cash');
        setPaymentNotes('');
        setErrorPayment(null);
    };

    if (!currentSale) {
        return (
            <div className="payment-manager-modal-overlay">
                <div className="payment-manager-modal-content">
                    <p>Cargando detalles de la venta...</p>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-manager-modal-overlay">
            <div className="payment-manager-modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>
                <h3>Registrar Pago para Venta #{currentSale.id}</h3>
                
                <div className="payment-sale-summary">
                    <p><strong>Cliente:</strong> {currentSale.client ? `${currentSale.client.name} ${currentSale.client.lastName}` : 'N/A'}</p>
                    <p><strong>Producto(s):</strong> {currentSale.saleItems && currentSale.saleItems.map(item =>
                        item.product ? `${item.product.name} (x${item.quantity})` : `Producto ID ${item.productId} (x${item.quantity})`
                    ).join(', ')}</p>
                    <p><strong>Monto Total Venta:</strong> ${currentSale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    <p className="highlight-balance"><strong>Saldo Pendiente Actual:</strong> ${currentSale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    {currentSale.weeklyPaymentAmount > 0 &&
                        <p><strong>Pago Semanal Sugerido:</strong> ${currentSale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    }
                </div>

                <form onSubmit={handleRegisterPayment} className="payment-manager-form">
                    {errorPayment && <p className="error-message">{errorPayment}</p>}

                    <div className="form-group">
                        <label htmlFor="paymentAmountManager">Monto del Pago:</label>
                        <input
                            type="number"
                            id="paymentAmountManager"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="paymentMethodManager">Método de Pago:</label>
                        <select id="paymentMethodManager" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                            <option value="card">Tarjeta</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="paymentNotesManager">Notas (Opcional):</label>
                        <input
                            type="text"
                            id="paymentNotesManager"
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={loadingPayment}>
                        {loadingPayment ? 'Registrando...' : 'Confirmar Pago'}
                    </button>
                    <button type="button" onClick={resetForm} disabled={loadingPayment} className="cancel-button">
                        Limpiar Formulario
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PaymentManager;