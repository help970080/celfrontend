// src/components/SaleForm.jsx - VERSIÓN CON CÁLCULO CORREGIDO
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

function SaleForm({ onSaleAdded, clients, products, authenticatedFetch }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [interestRate, setInterestRate] = useState('0.15'); // Tasa del 15% por defecto
    const [numberOfPayments, setNumberOfPayments] = useState('17');
    const [loading, setLoading] = useState(false);

    const totalAmount = useMemo(() => {
        return selectedProducts.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);
    }, [selectedProducts]);

    // --- CÁLCULO DINÁMICO DEL PAGO SEMANAL ---
    const weeklyPayment = useMemo(() => {
        if (!isCredit || totalAmount <= 0) return 0;
        const balance = totalAmount - (parseFloat(downPayment) || 0);
        if (balance <= 0) return 0;
        // La fórmula ahora sí resta el enganche antes de dividir.
        return balance / parseInt(numberOfPayments, 10);
    }, [totalAmount, downPayment, numberOfPayments, isCredit]);

    const resetForm = () => { /* ... tu función resetForm ... */ };
    const handleProductSelection = (e) => { /* ... tu función handleProductSelection ... */ };
    const handleQuantityChange = (id, newQuantity) => { /* ... tu función handleQuantityChange ... */ };
    const handleRemoveProduct = (id) => { /* ... tu función handleRemoveProduct ... */ };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (Validaciones del formulario se mantienen igual) ...
        
        // --- PAYLOAD DE DATOS CORREGIDO ---
        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtSale: item.priceAtSale
            })),
            totalAmount: totalAmount,
            isCredit,
            // Los datos de crédito ahora incluyen el pago semanal calculado
            downPayment: isCredit ? (parseFloat(downPayment) || 0) : 0,
            interestRate: isCredit ? (parseFloat(interestRate) || 0) : 0,
            numberOfPayments: isCredit ? parseInt(numberOfPayments, 10) : null,
            weeklyPaymentAmount: isCredit ? parseFloat(weeklyPayment.toFixed(2)) : null,
            balanceDue: isCredit ? totalAmount - (parseFloat(downPayment) || 0) : 0,
        };

        setLoading(true);
        try {
            // Usamos la función authenticatedFetch pasada por props
            const response = await authenticatedFetch('/api/sales', {
                method: 'POST',
                body: JSON.stringify(saleData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar la venta.');
            }
            const result = await response.json();
            toast.success('Venta registrada con éxito!');
            onSaleAdded(result);
            resetForm();
        } catch (err) {
            console.error("Error al registrar venta:", err);
            toast.error(err.message || "Ocurrió un error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sale-form-container">
            <h2>Registrar Nueva Venta</h2>
            <form onSubmit={handleSubmit} className="sale-form">
                {/* ... (resto del formulario JSX se mantiene igual) ... */}
                {/* El campo de pago semanal estimado ahora usará la nueva variable 'weeklyPayment' */}
                {isCredit && (
                    <div className="credit-details">
                        {/* ... otros campos de crédito ... */}
                        <div className="form-group">
                            <label htmlFor="numberOfPayments">Número de Pagos Semanales (Fijo: 17):</label>
                            <input type="number" id="numberOfPayments" value={numberOfPayments} readOnly />
                        </div>
                        {weeklyPayment > 0 && (
                            <p className="calculated-payment">
                                Pago Semanal Estimado: <strong>${weeklyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </p>
                        )}
                    </div>
                )}
                <button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar Venta'}</button>
            </form>
        </div>
    );
}

export default SaleForm;