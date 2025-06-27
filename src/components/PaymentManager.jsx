import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

// La importación de moment-timezone se ha eliminado al no ser utilizada.

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function PaymentManager({ sale, onClose, authenticatedFetch, onPaymentSuccess }) {
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [errorPayment, setErrorPayment] = useState(null);

    // --- CORRECCIÓN CLAVE: useEffect optimizado ---
    // Se ejecuta solo cuando la 'prop' de la venta cambia, no en cada tipeo.
    useEffect(() => {
        if (sale?.weeklyPaymentAmount > 0) {
            setPaymentAmount(sale.weeklyPaymentAmount.toFixed(2));
        } else {
            setPaymentAmount(''); // Limpiar si no hay pago semanal sugerido
        }
    }, [sale]); 
    
    // --- CORRECCIÓN CLAVE: useCallback optimizado ---
    // Ahora depende de 'sale' directamente, no de un estado local.
    const handleRegisterPayment = useCallback(async (e) => {
        e.preventDefault();
        
        if (!sale || !sale.id) {
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

        // --- LÓGICA DE NEGOCIO MANTENIDA ---
        // Se mantiene tu regla de no permitir pagos que excedan el saldo.
        if (amount > sale.balanceDue) {
            setErrorPayment(`El monto del pago no puede ser mayor al saldo pendiente de $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`);
            toast.error('Monto de pago excede el saldo pendiente.');
            return;
        }

        setLoadingPayment(true);
        setErrorPayment(null);

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/${sale.id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, paymentMethod, notes: paymentNotes })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            toast.success('¡Pago registrado con éxito!');
            onPaymentSuccess(); // Se llama para refrescar la lista de pagos del cliente
            onClose(); // Se cierra el modal
        } catch (err) {
            setErrorPayment(err.message || 'Error al registrar el pago. Intenta de nuevo.');
            toast.error(err.message || 'Ocurrió un error al registrar el pago.');
        } finally {
            setLoadingPayment(false);
        }
    }, [sale, paymentAmount, paymentMethod, paymentNotes, authenticatedFetch, onClose, onPaymentSuccess]); 

    const resetForm = () => {
        setPaymentAmount(sale?.weeklyPaymentAmount > 0 ? sale.weeklyPaymentAmount.toFixed(2) : '');
        setPaymentMethod('cash');
        setPaymentNotes('');
        setErrorPayment(null);
    };

    if (!sale) {
        // Manejo para cuando el modal se está abriendo y la venta aún no está disponible
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
                <h3>Registrar Pago para Venta #{sale.id}</h3>
                
                {/* --- CORRECCIÓN: Se usa la prop 'sale' directamente --- */}
                <div className="payment-sale-summary">
                    <p><strong>Cliente:</strong> {sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A'}</p>
                    <p><strong>Saldo Pendiente Actual:</strong> <span className="highlight-balance">${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></p>
                    {sale.weeklyPaymentAmount > 0 &&
                        <p><strong>Pago Semanal Sugerido:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    }
                </div>

                <form onSubmit={handleRegisterPayment} className="payment-manager-form">
                    {errorPayment && <p className="error-message">{errorPayment}</p>}

                    <div className="form-group">
                        <label htmlFor="paymentAmountManager">Monto del Pago:</label>
                        <input
                            type="number" id="paymentAmountManager" value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            step="0.01" min="0.01" required
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
                            type="text" id="paymentNotesManager" value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={loadingPayment}>
                        {loadingPayment ? 'Registrando...' : 'Confirmar Pago'}
                    </button>
                    <button type="button" onClick={resetForm} disabled={loadingPayment} className="cancel-button">
                        Limpiar
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PaymentManager;