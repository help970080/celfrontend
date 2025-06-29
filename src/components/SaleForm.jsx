// Archivo: src/components/SaleForm.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleForm({ onSaleAdded, clients, products, collectors }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [assignedCollectorId, setAssignedCollectorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- INICIO DE LA MODIFICACIÓN ---
    const [paymentFrequency, setPaymentFrequency] = useState('weekly');
    const [numberOfPayments, setNumberOfPayments] = useState('');
    // --- FIN DE LA MODIFICACIÓN ---


    useEffect(() => {
        const newTotal = selectedProducts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (product?.price || 0) * item.quantity;
        }, 0);
        setTotalAmount(parseFloat(newTotal.toFixed(2)));
    }, [selectedProducts, products]);

    const resetForm = () => {
        setClientId('');
        setSelectedProducts([]);
        setIsCredit(false);
        setDownPayment('');
        setAssignedCollectorId('');
        // --- INICIO DE LA MODIFICACIÓN ---
        setPaymentFrequency('weekly');
        setNumberOfPayments('');
        // --- FIN DE LA MODIFICACIÓN ---
        setError(null);
    };

    const handleProductSelection = (e) => {
        const id = parseInt(e.target.value, 10);
        if (id && !selectedProducts.some(item => item.productId === id)) {
            const product = products.find(p => p.id === id);
            if (product && product.stock > 0) {
                setSelectedProducts(prev => [...prev, { productId: id, quantity: 1 }]);
            } else {
                toast.warn("Este producto no tiene stock.");
            }
        }
        e.target.value = "";
    };

    const handleQuantityChange = (id, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity, 10) || 1);
        setSelectedProducts(prev => prev.map(item => item.productId === id ? { ...item, quantity } : item));
    };

    const handleRemoveProduct = (id) => {
        setSelectedProducts(prev => prev.filter(item => item.productId !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!clientId || selectedProducts.length === 0) {
            toast.error('Cliente y productos son obligatorios.');
            setLoading(false);
            return;
        }
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // Se incluyen los nuevos campos en el objeto a enviar
        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts,
            isCredit,
            downPayment: isCredit ? parseFloat(downPayment || 0) : totalAmount,
            assignedCollectorId: isCredit && assignedCollectorId ? parseInt(assignedCollectorId, 10) : null,
            paymentFrequency: isCredit ? paymentFrequency : null,
            numberOfPayments: isCredit ? parseInt(numberOfPayments, 10) : null,
        };
        // --- FIN DE LA MODIFICACIÓN ---


        try {
            const response = await fetch(`${API_BASE_URL}/api/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(saleData),
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || "Error al registrar la venta.");
            }
            toast.success("¡Venta registrada con éxito!");
            onSaleAdded();
            resetForm();
        } catch (err) {
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Lógica de cálculo actualizada ---
    const remainingForCalculation = totalAmount - parseFloat(downPayment || 0);
    const numPayments = parseInt(numberOfPayments, 10);
    const calculatedInstallment = isCredit && remainingForCalculation > 0 && numPayments > 0 
        ? parseFloat((remainingForCalculation / numPayments).toFixed(2)) 
        : 0;
    
    const isFormValid = () => {
        if (!clientId || selectedProducts.length === 0) return false;
        if (isCredit && (downPayment === '' || parseFloat(downPayment) < 0 || parseFloat(downPayment) > totalAmount || !numberOfPayments || parseInt(numberOfPayments, 10) <= 0)) return false;
        return true;
    };

    return (
        <div className="sale-form-container">
            <h2>Registrar Nueva Venta</h2>
            <form onSubmit={handleSubmit} className="sale-form">
                {error && <p className="error-message">{error}</p>}
                <div className="form-group"><label>Cliente:</label><select value={clientId} onChange={(e) => setClientId(e.target.value)} required><option value="">Selecciona un cliente</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}</select></div>
                <div className="form-group"><label>Añadir Producto:</label><select onChange={handleProductSelection} value=""><option value="">Selecciona un producto</option>{products.map(p => <option key={p.id} value={p.id} disabled={selectedProducts.some(i => i.productId === p.id) || p.stock === 0}>{p.name} (Stock: {p.stock})</option>)}</select></div>
                {selectedProducts.length > 0 && (
                    <div className="selected-products-list">
                        <h3>Productos en Venta:</h3>
                        {selectedProducts.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={item.productId} className="selected-product-item">
                                    <span>{product?.name || 'N/A'}</span>
                                    <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.productId, e.target.value)} min="1" max={product?.stock} required/>
                                    <span>x ${product?.price?.toLocaleString('es-MX')} = <strong>${((product?.price || 0) * item.quantity).toLocaleString('es-MX')}</strong></span>
                                    <button type="button" onClick={() => handleRemoveProduct(item.productId)} className="remove-item-button">X</button>
                                </div>
                            );
                        })}
                        <p className="total-amount-display">Monto Total: <strong>${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    </div>
                )}
                <div className="form-group checkbox-group"><input type="checkbox" id="isCredit" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} /><label htmlFor="isCredit">Venta a Crédito</label></div>
                {isCredit && (
                    <div className="credit-details">
                        <h3>Detalles del Crédito</h3>
                        <div className="form-group"><label>Enganche:</label><input type="number" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} step="0.01" required={isCredit} /></div>
                        
                        {/* --- INICIO DE LA MODIFICACIÓN --- */}
                        <div className="form-group">
                            <label>Frecuencia de Pago:</label>
                            <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value)}>
                                <option value="daily">Diario</option>
                                <option value="weekly">Semanal</option>
                                <option value="fortnightly">Quincenal</option>
                                <option value="monthly">Mensual</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Número de Pagos:</label>
                            <input type="number" value={numberOfPayments} onChange={(e) => setNumberOfPayments(e.target.value)} required={isCredit} placeholder="Ej: 12, 17, 24..." />
                        </div>
                        {/* --- FIN DE LA MODIFICACIÓN --- */}
                        
                        <div className="form-group">
                            <label>Asignar a Gestor (Opcional):</label>
                            <select value={assignedCollectorId} onChange={(e) => setAssignedCollectorId(e.target.value)}>
                                <option value="">Sin Asignar</option>
                                {collectors.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                            </select>
                        </div>
                        
                        {/* --- Cálculo actualizado --- */}
                        {calculatedInstallment > 0 && <p className="calculated-payment">Pago por Período Estimado: <strong>${calculatedInstallment.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</strong></p>}
                    </div>
                )}
                <button type="submit" disabled={loading || !isFormValid()}>{loading ? 'Registrando...' : 'Registrar Venta'}</button>
                <button type="button" onClick={resetForm} disabled={loading} className="cancel-button">Limpiar</button>
            </form>
        </div>
    );
}
export default SaleForm;