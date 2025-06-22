import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

function SaleForm({ onSaleAdded, clients, products, authenticatedFetch }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [interestRate, setInterestRate] = useState('0.15');
    const [numberOfPayments, setNumberOfPayments] = useState('17');
    const [loading, setLoading] = useState(false);

    const totalAmount = useMemo(() => {
        return selectedProducts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + ((product?.price || 0) * item.quantity);
        }, 0);
    }, [selectedProducts, products]);

    const weeklyPayment = useMemo(() => {
        if (!isCredit || totalAmount <= 0) return 0;
        const dp = parseFloat(downPayment) || 0;
        if (dp >= totalAmount) return 0;
        const balance = totalAmount - dp;
        return balance / parseInt(numberOfPayments, 10);
    }, [totalAmount, downPayment, numberOfPayments, isCredit]);

    const resetForm = () => {
        setClientId('');
        setSelectedProducts([]);
        setIsCredit(false);
        setDownPayment('');
        setInterestRate('0.15');
    };

    const handleProductSelection = (e) => {
        const id = parseInt(e.target.value, 10);
        if (!id) return;
        const product = products.find(p => p.id === id);
        if (product && !selectedProducts.some(item => item.productId === id)) {
            setSelectedProducts(prev => [...prev, { productId: id, quantity: 1, priceAtSale: product.price }]);
        } else {
            toast.warn('Este producto ya ha sido añadido.');
        }
        e.target.value = "";
    };

    const handleQuantityChange = (id, qty) => {
        setSelectedProducts(prev => prev.map(item => item.productId === id ? { ...item, quantity: Math.max(1, parseInt(qty, 10) || 1) } : item));
    };

    const handleRemoveProduct = (id) => {
        setSelectedProducts(prev => prev.filter(item => item.productId !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clientId || selectedProducts.length === 0) {
            return toast.error('Se requiere un cliente y al menos un producto.');
        }
        
        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts,
            totalAmount,
            isCredit,
            downPayment: isCredit ? (parseFloat(downPayment) || 0) : 0,
            weeklyPaymentAmount: isCredit ? parseFloat(weeklyPayment.toFixed(2)) : null,
            balanceDue: isCredit ? totalAmount - (parseFloat(downPayment) || 0) : 0,
            numberOfPayments: isCredit ? 17 : null,
            interestRate: isCredit ? parseFloat(interestRate) : 0,
        };
        
        setLoading(true);
        try {
            const response = await authenticatedFetch('/api/sales', { method: 'POST', body: JSON.stringify(saleData) });
            if (!response.ok) throw new Error((await response.json()).message || 'Error al registrar la venta.');
            toast.success('Venta registrada con éxito!');
            resetForm();
            onSaleAdded();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sale-form-container">
            <h3>Registrar Nueva Venta</h3>
            <form onSubmit={handleSubmit} className="sale-form">
                <div className="form-group">
                    <label htmlFor="clientId">Cliente:</label>
                    <select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                        <option value="">Selecciona un cliente</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name} {client.lastName}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="selectProduct">Añadir Producto:</label>
                    <select id="selectProduct" onChange={handleProductSelection} value="">
                        <option value="">Selecciona un producto</option>
                        {products.filter(p => p.stock > 0).map(product => (
                            <option key={product.id} value={product.id} disabled={selectedProducts.some(item => item.productId === product.id)}>
                                {product.name} - ${(product.price || 0).toLocaleString()} (Stock: {product.stock})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedProducts.length > 0 && (
                    <div className="selected-products-list">
                        <h4>Productos en la Venta:</h4>
                        {selectedProducts.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            if (!product) return null;
                            return (
                                <div key={item.productId} className="selected-product-item">
                                    <span>{product.name}</span>
                                    <input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.productId, e.target.value)} min="1" />
                                    <span>x ${(item.priceAtSale || 0).toLocaleString()}</span>
                                    <button type="button" onClick={() => handleRemoveProduct(item.productId)} className="remove-item-button">×</button>
                                </div>
                            );
                        })}
                        <p className="total-amount-display">Total: <strong>${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    </div>
                )}

                <div className="form-group checkbox-group">
                    <input type="checkbox" id="isCredit" checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} />
                    <label htmlFor="isCredit">Venta a Crédito</label>
                </div>

                {isCredit && (
                    <div className="credit-details">
                        <div className="form-group">
                            <label htmlFor="downPayment">Enganche:</label>
                            <input type="number" id="downPayment" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} step="0.01" required={isCredit} />
                        </div>
                        {weeklyPayment > 0 && (
                            <p className="calculated-payment">Pago Semanal Estimado: <strong>${weeklyPayment.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
                        )}
                    </div>
                )}

                <button type="submit" disabled={loading || selectedProducts.length === 0}>
                    {loading ? 'Registrando...' : 'Registrar Venta'}
                </button>
            </form>
        </div>
    );
}

export default SaleForm;