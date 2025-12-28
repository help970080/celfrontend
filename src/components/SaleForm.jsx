// SaleForm.jsx - CON CAMPO IMEI PARA MDM

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleForm({ onSaleAdded, clients, products, collectors, authenticatedFetch }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [assignedCollectorId, setAssignedCollectorId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Campos de crédito
    const [paymentFrequency, setPaymentFrequency] = useState('weekly');
    const [numberOfPayments, setNumberOfPayments] = useState('');

    // ⭐ NUEVO: Campo IMEI para MDM
    const [imei, setImei] = useState('');
    const [imeiStatus, setImeiStatus] = useState(null); // null, 'checking', 'valid', 'invalid'
    const [imeiDevice, setImeiDevice] = useState(null);

    useEffect(() => {
        const newTotal = selectedProducts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (Number(product?.price || 0)) * item.quantity; 
        }, 0);
        setTotalAmount(parseFloat(newTotal.toFixed(2)));
    }, [selectedProducts, products]);

    // ⭐ NUEVO: Verificar IMEI en MDM
    const verifyImei = async () => {
        if (!imei || imei.length < 15) {
            toast.warn('El IMEI debe tener 15 dígitos');
            return;
        }

        setImeiStatus('checking');
        setImeiDevice(null);

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/mdm/devices/search/${imei}`);
            const data = await response.json();

            if (response.ok && data.success) {
                setImeiStatus('valid');
                setImeiDevice(data.device);
                toast.success(`✅ Dispositivo encontrado: ${data.device.model || data.device.deviceName}`);
            } else {
                setImeiStatus('invalid');
                toast.error('❌ IMEI no encontrado en MDM. Asegúrate de que el dispositivo esté enrollado.');
            }
        } catch (err) {
            setImeiStatus('invalid');
            toast.error('Error al verificar IMEI');
        }
    };

    const resetForm = () => {
        setClientId('');
        setSelectedProducts([]);
        setIsCredit(false);
        setDownPayment('');
        setAssignedCollectorId('');
        setPaymentFrequency('weekly');
        setNumberOfPayments('');
        setImei('');
        setImeiStatus(null);
        setImeiDevice(null);
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
        setSelectedProducts(prev => prev.map(item => 
            item.productId === id ? { ...item, quantity } : item
        ));
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

        // ⭐ Validar IMEI si es crédito y se ingresó
        if (isCredit && imei && imeiStatus !== 'valid') {
            toast.error('Verifica el IMEI antes de continuar');
            setLoading(false);
            return;
        }
        
        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts,
            isCredit,
            downPayment: isCredit ? parseFloat(downPayment || 0) : totalAmount, 
            assignedCollectorId: isCredit && assignedCollectorId ? parseInt(assignedCollectorId, 10) : null,
            paymentFrequency: isCredit ? paymentFrequency : null,
            numberOfPayments: isCredit ? parseInt(numberOfPayments, 10) : null,
            imei: isCredit && imei ? imei : null, // ⭐ NUEVO
        };

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData),
            });
            
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || "Error al registrar la venta.");
            }

            // ⭐ NUEVO: Vincular dispositivo MDM a la venta
            if (isCredit && imei && imeiStatus === 'valid' && responseData.sale?.id) {
                try {
                    await authenticatedFetch(`${API_BASE_URL}/api/mdm/sales/${responseData.sale.id}/link-device`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imei }),
                    });
                    toast.success("📱 Dispositivo vinculado a la venta para bloqueo automático");
                } catch (mdmErr) {
                    toast.warn("Venta creada pero no se pudo vincular el dispositivo MDM");
                }
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
    
    const remainingForCalculation = totalAmount - parseFloat(downPayment || 0);
    const numPayments = parseInt(numberOfPayments, 10);
    const calculatedInstallment = isCredit && remainingForCalculation > 0 && numPayments > 0 
        ? parseFloat((remainingForCalculation / numPayments).toFixed(2)) 
        : 0;
    
    const isFormValid = () => {
        if (!clientId || selectedProducts.length === 0) return false;
        if (isCredit) {
            if (downPayment === '' || parseFloat(downPayment) < 0 || parseFloat(downPayment) > totalAmount) return false;
            if (!numberOfPayments || parseInt(numberOfPayments, 10) <= 0) return false;
            if (!assignedCollectorId) return false;
            // IMEI es opcional, pero si se ingresa debe ser válido
            if (imei && imeiStatus !== 'valid') return false;
        }
        return true;
    };

    return (
        <div className="sale-form-container">
            <h2>Registrar Nueva Venta</h2>
            <form onSubmit={handleSubmit} className="sale-form">
                {error && <p className="error-message">{error}</p>}
                
                <div className="form-group">
                    <label>Cliente:</label>
                    <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
                        <option value="">Selecciona un cliente</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>
                        ))}
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Añadir Producto:</label>
                    <select onChange={handleProductSelection} value="">
                        <option value="">Selecciona un producto</option>
                        {products.map(p => (
                            <option 
                                key={p.id} 
                                value={p.id} 
                                disabled={selectedProducts.some(i => i.productId === p.id) || p.stock === 0}
                            >
                                {p.name} (Stock: {p.stock})
                            </option>
                        ))}
                    </select>
                </div>
                
                {selectedProducts.length > 0 && (
                    <div className="selected-products-list">
                        <h3>Productos en Venta:</h3>
                        {selectedProducts.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={item.productId} className="selected-product-item">
                                    <span>{product?.name || 'N/A'}</span>
                                    <input 
                                        type="number" 
                                        value={item.quantity} 
                                        onChange={(e) => handleQuantityChange(item.productId, e.target.value)} 
                                        min="1" 
                                        max={product?.stock} 
                                        required
                                    />
                                    <span>
                                        x ${Number(product?.price || 0).toLocaleString('es-MX')} = 
                                        <strong> ${((product?.price || 0) * item.quantity).toLocaleString('es-MX')}</strong>
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveProduct(item.productId)} 
                                        className="remove-item-button"
                                    >
                                        X
                                    </button>
                                </div>
                            );
                        })}
                        <p className="total-amount-display">
                            Monto Total: <strong>${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                        </p>
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
                            <label>Enganche:</label>
                            <input 
                                type="number" 
                                value={downPayment} 
                                onChange={(e) => setDownPayment(e.target.value)} 
                                step="0.01" 
                                required={isCredit} 
                            />
                        </div>
                        
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
                            <input 
                                type="number" 
                                value={numberOfPayments} 
                                onChange={(e) => setNumberOfPayments(e.target.value)} 
                                required={isCredit} 
                                placeholder="Ej: 12, 17, 24..." 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Asignar a Gestor (*):</label>
                            <select value={assignedCollectorId} onChange={(e) => setAssignedCollectorId(e.target.value)} required>
                                <option value="">Seleccionar Gestor</option>
                                {collectors.map(c => (
                                    <option key={c.id} value={c.id}>{c.username}</option>
                                ))}
                            </select>
                        </div>

                        {/* ⭐ NUEVO: Campo IMEI para MDM */}
                        <div className="form-group" style={{ borderTop: '1px dashed #ccc', paddingTop: '15px', marginTop: '15px' }}>
                            <label>
                                📱 IMEI del Dispositivo (para bloqueo automático):
                                {imeiStatus === 'valid' && (
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginLeft: '10px', fontWeight: 'bold', backgroundColor: '#d1fae5', color: '#065f46' }}>
                                        ✓ Verificado
                                    </span>
                                )}
                                {imeiStatus === 'invalid' && (
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginLeft: '10px', fontWeight: 'bold', backgroundColor: '#fee2e2', color: '#991b1b' }}>
                                        ✗ No encontrado
                                    </span>
                                )}
                                {imeiStatus === 'checking' && (
                                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginLeft: '10px', fontWeight: 'bold', backgroundColor: '#fef3c7', color: '#92400e' }}>
                                        Verificando...
                                    </span>
                                )}
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
                                <input 
                                    type="text" 
                                    value={imei} 
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                                        setImei(val);
                                        setImeiStatus(null);
                                        setImeiDevice(null);
                                    }}
                                    placeholder="Ej: 860734072994372"
                                    maxLength={15}
                                    style={{ 
                                        flex: 1,
                                        padding: '10px',
                                        fontSize: '16px',
                                        border: imeiStatus === 'valid' ? '2px solid #10b981' : imeiStatus === 'invalid' ? '2px solid #ef4444' : '2px solid #d1d5db',
                                        borderRadius: '5px',
                                        minWidth: '200px'
                                    }}
                                />
                                <button 
                                    type="button" 
                                    onClick={verifyImei}
                                    disabled={imei.length < 15 || imeiStatus === 'checking'}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: imei.length < 15 ? '#9ca3af' : '#7c3aed',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: imei.length < 15 ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    {imeiStatus === 'checking' ? '...' : 'Verificar'}
                                </button>
                            </div>
                            {imeiDevice && (
                                <p style={{ fontSize: '12px', color: '#059669', marginTop: '8px' }}>
                                    📱 {imeiDevice.deviceName || imeiDevice.model} - {imeiDevice.platform}
                                </p>
                            )}
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '5px' }}>
                                El dispositivo debe estar enrollado en ManageEngine antes de registrar la venta.
                            </p>
                        </div>
                        
                        {calculatedInstallment > 0 && (
                            <p className="calculated-payment">
                                Pago por Período Estimado: 
                                <strong> ${calculatedInstallment.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</strong>
                            </p>
                        )}
                    </div>
                )}
                
                <button type="submit" disabled={loading || !isFormValid()}>
                    {loading ? 'Registrando...' : 'Registrar Venta'}
                </button>
                <button type="button" onClick={resetForm} disabled={loading} className="cancel-button">
                    Limpiar
                </button>
            </form>
        </div>
    );
}

export default SaleForm;
