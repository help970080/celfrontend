import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleForm({ onSaleAdded, clients, products }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [numberOfPayments, setNumberOfPayments] = useState('17'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        let currentTotal = 0;
        selectedProducts.forEach(item => {
            const priceToUse = item.priceAtSale !== undefined
                ? item.priceAtSale
                : (products.find(p => p.id === item.productId)?.price || 0);

            currentTotal += priceToUse * item.quantity;
        });
        setTotalAmount(parseFloat(currentTotal.toFixed(2)));
    }, [selectedProducts, products]); 

    const resetForm = () => {
        setClientId('');
        setSelectedProducts([]);
        setTotalAmount(0);
        setIsCredit(false);
        setDownPayment('');
        setInterestRate('');
        setNumberOfPayments('17');
        setError(null);
        setSuccess(null);
    };

    const handleProductSelection = (e) => {
        const id = parseInt(e.target.value, 10);
        const productExistsInSelection = selectedProducts.some(item => item.productId === id);
        const productInMasterList = products.find(p => p.id === id);

        if (id && productInMasterList && !productExistsInSelection) {
            setSelectedProducts(prevSelected => [
                ...prevSelected,
                { productId: id, quantity: 1, priceAtSale: productInMasterList.price }
            ]);
            e.target.value = "";
        } else if (productExistsInSelection) {
            toast.warn("Este producto ya ha sido añadido a la venta.");
        }
    };

    const handleQuantityChange = (id, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);
        setSelectedProducts(prevSelected =>
            prevSelected.map(item =>
                item.productId === id ? { ...item, quantity: quantity > 0 ? quantity : 1 } : item
            )
        );
    };

    const handleRemoveProduct = (id) => {
        setSelectedProducts(prevSelected => prevSelected.filter(item => item.productId !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!clientId) {
            setError('Por favor, selecciona un cliente.');
            toast.error('Cliente es obligatorio.');
            setLoading(false);
            return;
        }
        if (selectedProducts.length === 0) {
            setError('Por favor, añade al menos un producto a la venta.');
            toast.error('Se requiere al menos un producto.');
            setLoading(false);
            return;
        }

        for (const item of selectedProducts) {
            const product = products.find(p => p.id === item.productId);
            if (product && item.quantity > product.stock) {
                setError(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}.`);
                toast.error(`Stock insuficiente para ${product.name}.`);
                setLoading(false);
                return;
            }
        }

        if (isCredit) {
            if (parseInt(numberOfPayments, 10) !== 17) {
                setError('El número de pagos semanales debe ser 17. El backend validará esto.');
                toast.error('Número de pagos semanales debe ser 17.');
                setLoading(false);
                return;
            }
            if (!downPayment || parseFloat(downPayment) < 0) {
                setError('El enganche es obligatorio y debe ser un valor positivo para ventas a crédito.');
                toast.error('Enganche obligatorio.');
                setLoading(false);
                return;
            }
            if (parseFloat(downPayment || 0) > totalAmount) {
                setError('El enganche no puede ser mayor al monto total de la venta.');
                toast.error('Enganche inválido.');
                setLoading(false);
                return;
            }
        }

        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtSale: item.priceAtSale
            })),
            totalAmount: totalAmount,
            isCredit,
            downPayment: isCredit ? (downPayment !== '' ? parseFloat(downPayment) : 0) : totalAmount,
            interestRate: isCredit ? (interestRate !== '' ? parseFloat(interestRate) : 0) : 0,
            numberOfPayments: isCredit ? parseInt(numberOfPayments, 10) : null,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(saleData),
            });

            if (response.ok) {
                const result = await response.json();
                setSuccess('Venta registrada con éxito!');
                toast.success('Venta registrada!');
                onSaleAdded(result);
                resetForm();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

        } catch (err) {
            console.error("Error al registrar venta:", err);
            setError(err.message || "Error al registrar la venta. Intenta de nuevo.");
            toast.error('Ocurrió un error al registrar la venta.');
        } finally {
            setLoading(false);
        }
    };

    const suggestedDownPayment = parseFloat((totalAmount * 0.10).toFixed(2));
    const remainingForCalculation = totalAmount - (parseFloat(downPayment || 0));
    const calculatedWeeklyPaymentForDisplay = isCredit && remainingForCalculation > 0 ? parseFloat((remainingForCalculation / 17).toFixed(2)) : 0;


    return (
        <div className="sale-form-container">
            <h2>Registrar Nueva Venta</h2>
            <form onSubmit={handleSubmit} className="sale-form">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group">
                    <label htmlFor="clientId">Cliente:</label>
                    <select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                        <option value="">Selecciona un cliente</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name} {client.lastName} ({client.phone})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="selectProduct">Añadir Producto(s) a la Venta:</label>
                    <select id="selectProduct" onChange={handleProductSelection} value="">
                        <option value="">Selecciona un producto</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id} disabled={selectedProducts.some(item => item.productId === product.id)}>
                                {product.name} - ${product.price} (Stock: {product.stock})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedProducts.length > 0 && (
                    <div className="selected-products-list" key={selectedProducts.map(item => item.productId).join('-')}> 
                        <h3>Productos en esta Venta:</h3>
                        {selectedProducts.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            const displayPrice = item.priceAtSale !== undefined ? item.priceAtSale : (product?.price || 0);

                            if (!product) return null;

                            return (
                                <div key={item.productId} className="selected-product-item">
                                    <span>{product.name}</span>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                        min="1"
                                        max={product.stock}
                                        required
                                    />
                                    <span>x ${displayPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })} = <strong>${(displayPrice * item.quantity).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
                                    <button type="button" onClick={() => handleRemoveProduct(item.productId)} className="remove-item-button">X</button>
                                </div>
                            );
                        })}
                        <p className="total-amount-display">Monto Total de la Venta: <strong>${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                    </div>
                )}

                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="isCredit"
                        checked={isCredit}
                        onChange={(e) => setIsCredit(e.target.checked)}
                    />
                    <label htmlFor="isCredit">Venta a Crédito</label>
                </div>

                {isCredit && (
                    <div className="credit-details">
                        <h3>Detalles del Crédito</h3>
                        <div className="form-group">
                            <label htmlFor="downPayment">Enganche:</label>
                            <input
                                type="number"
                                id="downPayment"
                                value={downPayment}
                                onChange={(e) => setDownPayment(e.target.value)}
                                step="0.01"
                                required={isCredit}
                            />
                            <p className="hint-text">Enganche sugerido (10% del total): <strong>${suggestedDownPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="interestRate">Tasa de Interés Anual (%):</label>
                            <input
                                type="number"
                                id="interestRate"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                step="0.01"
                                required={isCredit}
                            />
                            <p className="hint-text">Ej: 0.15 para 15%</p>
                        </div>
                        <div className="form-group">
                            <label htmlFor="numberOfPayments">Número de Pagos Semanales (Fijo: 17):</label>
                            <input
                                type="number"
                                id="numberOfPayments"
                                value={numberOfPayments}
                                onChange={(e) => setNumberOfPayments(e.target.value)}
                                required={isCredit}
                                min="17"
                                max="17"
                                readOnly
                            />
                            <p className="hint-text">El pago semanal se calcula y valida en el servidor dividiendo el saldo entre 17 semanas fijas.</p>
                        </div>
                        {calculatedWeeklyPaymentForDisplay > 0 && (
                            <p className="calculated-payment">
                                Pago Semanal Estimado: <strong>${calculatedWeeklyPaymentForDisplay.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                            </p>
                        )}
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Registrando...' : 'Registrar Venta'}
                </button>
                <button type="button" onClick={resetForm} disabled={loading} className="cancel-button">
                    Limpiar Formulario
                </button>
            </form>
        </div>
    );
}

export default SaleForm;