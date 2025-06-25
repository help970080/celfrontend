import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleForm({ onSaleAdded, clients, products, collectors }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [interestRate, setInterestRate] = useState('0');
    const [numberOfPayments, setNumberOfPayments] = useState('17'); 
    const [assignedCollectorId, setAssignedCollectorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
        setInterestRate('0');
        setAssignedCollectorId('');
        setError(null);
    };
    
    const handleProductSelection = (e) => {
        const id = parseInt(e.target.value, 10);
        if (id && !selectedProducts.some(item => item.productId === id)) {
            const product = products.find(p => p.id === id);
            if (product && product.stock > 0) {
                setSelectedProducts(prev => [...prev, { productId: id, quantity: 1 }]);
            } else {
                toast.warn("Este producto no tiene stock disponible.");
            }
        }
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

        if (!clientId) {
            toast.error('Por favor, selecciona un cliente.');
            setLoading(false);
            return;
        }
        if (selectedProducts.length === 0) {
            toast.error('Por favor, añade al menos un producto.');
            setLoading(false);
            return;
        }

        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts,
            isCredit,
            downPayment: isCredit ? parseFloat(downPayment || 0) : totalAmount,
            interestRate: isCredit ? parseFloat(interestRate || 0) : 0,
            numberOfPayments: isCredit ? parseInt(numberOfPayments, 10) : null,
            assignedCollectorId: isCredit && assignedCollectorId ? parseInt(assignedCollectorId, 10) : null
        };

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
            toast.error(`Error al registrar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const suggestedDownPayment = totalAmount > 0 ? parseFloat((totalAmount * 0.10).toFixed(2)) : 0;
    const remainingForCalculation = totalAmount - parseFloat(downPayment || 0);
    const calculatedWeeklyPayment = isCredit && remainingForCalculation >= 0 ? parseFloat((remainingForCalculation / 17).toFixed(2)) : 0;
    
    // Validaciones en tiempo real para el botón de registro
    const isFormValid = () => {
        if (!clientId || selectedProducts.length === 0) return false;
        if (isCredit && (downPayment === '' || parseFloat(downPayment) < 0 || parseFloat(downPayment) > totalAmount)) return false;
        return true;
    };

    return (
        <div className="sale-form-container">
            <h2>Registrar Nueva Venta</h2>
            <form onSubmit={handleSubmit} className="sale-form">
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="clientId">Cliente:</label>
                    <select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                        <option value="">Selecciona un cliente</option>
                        {clients.map(client => <option key={client.id} value={client.id}>{client.name} {client.lastName}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="selectProduct">Añadir Producto:</label>
                    <select id="selectProduct" onChange={handleProductSelection} value="">
                        <option value="">Selecciona un producto</option>
                        {products.map(product => <option key={product.id} value={product.id} disabled={selectedProducts.some(item => item.productId === product.id) || product.stock === 0}>{product.name} - ${product.price} (Stock: {product.stock})</option>)}
                    </select>
                </div>
                {selectedProducts.length > 0 && (
                    <div className="selected-products-list">
                        <h3>Productos en Venta:</h3>
                        {selectedProducts.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;
                            return (
                                <div key={item.productId} className="selected-product-item">
                                    <span>{product.name}</span>
                                    <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.productId, e.target.value)} min="1" max={product.stock} required/>
                                    <span>x ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} = <strong>${(product.price * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
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
                        <div className="form-group"><label htmlFor="downPayment">Enganche:</label><input type="number" id="downPayment" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} step="0.01" required={isCredit} placeholder={suggestedDownPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}/><p className="hint-text">Sugerido (10%): <strong>${suggestedDownPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p></div>
                        <div className="form-group"><label htmlFor="interestRate">Tasa de Interés Anual (%):</label><input type="number" id="interestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} step="0.01" /></div>
                        <div className="form-group"><label htmlFor="numberOfPayments">Pagos Semanales (Fijo: 17):</label><input type="number" id="numberOfPayments" value={numberOfPayments} readOnly /></div>
                        <div className="form-group"><label htmlFor="assignedCollector">Asignar a Gestor (Opcional):</label><select id="assignedCollector" value={assignedCollectorId} onChange={(e) => setAssignedCollectorId(e.target.value)}><option value="">Sin Asignar</option>{collectors.map(collector => <option key={collector.id} value={collector.id}>{collector.username}</option>)}</select></div>
                        {calculatedWeeklyPayment > 0 && <p className="calculated-payment">Pago Semanal Estimado: <strong>${calculatedWeeklyPayment.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</strong></p>}
                    </div>
                )}
                <button type="submit" disabled={loading || !isFormValid()}>{loading ? 'Registrando...' : 'Registrar Venta'}</button>
                <button type="button" onClick={resetForm} disabled={loading} className="cancel-button">Limpiar</button>
            </form>
        </div>
    );
}
export default SaleForm;