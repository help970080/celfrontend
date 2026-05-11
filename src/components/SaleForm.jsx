// SaleForm.jsx - IMEI OPCIONAL VÍA CHECKBOX (solo si la venta incluye celular)

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleForm({ onSaleAdded, clients, products, collectors, authenticatedFetch, userTiendaId }) {
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

    // ⭐ Checkbox: ¿esta venta incluye un celular que requiere IMEI/MDM?
    const [includesPhone, setIncludesPhone] = useState(false);

    // Campos IMEI / dispositivo (solo si includesPhone)
    const [imei, setImei] = useState('');
    const [imeiStatus, setImeiStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid' | 'ocupado'
    const [imeiMessage, setImeiMessage] = useState('');
    const [imeiExisting, setImeiExisting] = useState(null);
    const [deviceBrand, setDeviceBrand] = useState('');
    const [deviceModel, setDeviceModel] = useState('');

    useEffect(() => {
        const newTotal = selectedProducts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (Number(product?.price || 0)) * item.quantity; 
        }, 0);
        setTotalAmount(parseFloat(newTotal.toFixed(2)));
    }, [selectedProducts, products]);

    // Si destildan el checkbox o cambian a contado, limpiar IMEI
    useEffect(() => {
        if (!isCredit || !includesPhone) {
            setImei('');
            setImeiStatus(null);
            setImeiMessage('');
            setImeiExisting(null);
            setDeviceBrand('');
            setDeviceModel('');
        }
    }, [isCredit, includesPhone]);

    // Si pasa a contado, destildar el checkbox también
    useEffect(() => {
        if (!isCredit) setIncludesPhone(false);
    }, [isCredit]);

    // ⭐ Verificación automática del IMEI al alcanzar 14+ dígitos (debounce)
    useEffect(() => {
        if (!includesPhone || !imei || imei.length < 14) {
            setImeiStatus(null);
            setImeiMessage('');
            setImeiExisting(null);
            return;
        }

        const timer = setTimeout(async () => {
            setImeiStatus('checking');
            setImeiMessage('Verificando IMEI...');
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/imei/check/${imei}`);
                const data = await response.json();

                if (!response.ok) {
                    setImeiStatus('invalid');
                    setImeiMessage(data.message || 'IMEI inválido');
                    return;
                }

                if (data.available) {
                    setImeiStatus('valid');
                    setImeiMessage('✓ IMEI disponible');
                    setImeiExisting(null);
                } else {
                    setImeiStatus('ocupado');
                    setImeiMessage(data.message || 'IMEI ya vendido a otro cliente');
                    setImeiExisting(data.existing);
                }
            } catch (err) {
                setImeiStatus('invalid');
                setImeiMessage('Error de red al verificar');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [imei, includesPhone, authenticatedFetch]);

    const resetForm = () => {
        setClientId('');
        setSelectedProducts([]);
        setIsCredit(false);
        setDownPayment('');
        setAssignedCollectorId('');
        setPaymentFrequency('weekly');
        setNumberOfPayments('');
        setIncludesPhone(false);
        setImei('');
        setImeiStatus(null);
        setImeiMessage('');
        setImeiExisting(null);
        setDeviceBrand('');
        setDeviceModel('');
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

        // ⭐ Solo validar IMEI si se marcó el checkbox
        if (isCredit && includesPhone) {
            if (!imei || imei.length < 14) {
                toast.error('IMEI es obligatorio cuando la venta incluye un celular');
                setLoading(false);
                return;
            }
            if (imeiStatus !== 'valid') {
                toast.error('El IMEI no está disponible. Verifica antes de continuar.');
                setLoading(false);
                return;
            }
        }
        
        const numPayments = parseInt(numberOfPayments, 10);
        const remainingForCalc = totalAmount - parseFloat(downPayment || 0);
        const installment = isCredit && remainingForCalc > 0 && numPayments > 0
            ? parseFloat((remainingForCalc / numPayments).toFixed(2))
            : 0;

        // ⭐ Decisión de endpoint: SOLO usa el endpoint con IMEI si hay celular
        const usaImeiEndpoint = isCredit && includesPhone && imei && imei.length >= 14;

        try {
            let response, responseData;

            if (usaImeiEndpoint) {
                // POST atómico: crea venta + vincula IMEI en una transacción
                const payload = {
                    clientId: parseInt(clientId),
                    saleItems: selectedProducts,
                    totalAmount,
                    isCredit: true,
                    downPayment: parseFloat(downPayment || 0),
                    interestRate: 0,
                    paymentFrequency,
                    numberOfPayments: numPayments,
                    weeklyPaymentAmount: installment,
                    balanceDue: remainingForCalc,
                    assignedCollectorId: assignedCollectorId ? parseInt(assignedCollectorId, 10) : null,
                    status: 'pending',
                    imei,
                    deviceBrand: deviceBrand || null,
                    deviceModel: deviceModel || null
                };

                response = await authenticatedFetch(`${API_BASE_URL}/api/sales/create-with-imei`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                responseData = await response.json();

                if (!response.ok) {
                    throw new Error(responseData.message || responseData.error || "Error al registrar venta con IMEI.");
                }

                toast.success(`¡Venta #${responseData.sale.id} registrada! 📱 Dispositivo ${responseData.action === 'created' ? 'enrolado' : 'vinculado'}.`);
            } else {
                // Endpoint clásico: contado, o crédito sin celular (accesorios, fundas, audífonos, chips, etc.)
                const saleData = {
                    clientId: parseInt(clientId),
                    saleItems: selectedProducts,
                    isCredit,
                    downPayment: isCredit ? parseFloat(downPayment || 0) : totalAmount,
                    assignedCollectorId: isCredit && assignedCollectorId ? parseInt(assignedCollectorId, 10) : null,
                    paymentFrequency: isCredit ? paymentFrequency : null,
                    numberOfPayments: isCredit ? numPayments : null,
                };

                response = await authenticatedFetch(`${API_BASE_URL}/api/sales`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saleData)
                });
                responseData = await response.json();
                if (!response.ok) throw new Error(responseData.message || "Error al registrar la venta.");
                toast.success(isCredit ? "¡Venta a crédito registrada!" : "¡Venta de contado registrada!");
            }

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
            // ⭐ IMEI solo se exige si se marcó el checkbox
            if (includesPhone) {
                if (!imei || imei.length < 14 || imeiStatus !== 'valid') return false;
            }
        }
        return true;
    };

    const imeiBorderColor =
        imeiStatus === 'valid' ? '#10b981' :
        imeiStatus === 'invalid' ? '#ef4444' :
        imeiStatus === 'ocupado' ? '#ef4444' :
        imeiStatus === 'checking' ? '#f59e0b' :
        '#d1d5db';

    const imeiBadge =
        imeiStatus === 'valid' ? { bg: '#d1fae5', fg: '#065f46', txt: '✓ Disponible' } :
        imeiStatus === 'ocupado' ? { bg: '#fee2e2', fg: '#991b1b', txt: '✗ Ya vendido' } :
        imeiStatus === 'invalid' ? { bg: '#fee2e2', fg: '#991b1b', txt: '✗ Inválido' } :
        imeiStatus === 'checking' ? { bg: '#fef3c7', fg: '#92400e', txt: 'Verificando...' } :
        null;

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

                        {/* ⭐ CHECKBOX: ¿Esta venta incluye un celular? */}
                        <div className="form-group checkbox-group" style={{
                            backgroundColor: '#fef3c7',
                            padding: '12px',
                            borderRadius: '6px',
                            borderLeft: '4px solid #f59e0b',
                            marginTop: '15px'
                        }}>
                            <input 
                                type="checkbox" 
                                id="includesPhone" 
                                checked={includesPhone}
                                onChange={(e) => setIncludesPhone(e.target.checked)}
                            />
                            <label htmlFor="includesPhone" style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                📱 Esta venta incluye un celular (requiere IMEI para bloqueo MDM)
                            </label>
                            <p style={{ fontSize: '12px', color: '#92400e', marginTop: '4px', marginLeft: '24px' }}>
                                Marcar SOLO si vendes un teléfono. No marcar para accesorios, fundas, audífonos, chips, etc.
                            </p>
                        </div>

                        {/* ⭐ Campos IMEI: solo aparecen si se marca el checkbox */}
                        {includesPhone && (
                            <div className="form-group" style={{
                                borderTop: '2px solid #7c3aed',
                                paddingTop: '15px',
                                marginTop: '15px',
                                backgroundColor: '#faf5ff',
                                padding: '15px',
                                borderRadius: '8px'
                            }}>
                                <label style={{ fontWeight: 'bold', fontSize: '15px' }}>
                                    IMEI del Dispositivo <span style={{ color: '#dc2626' }}>*</span>
                                    {imeiBadge && (
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                            marginLeft: '10px', fontWeight: 'bold',
                                            backgroundColor: imeiBadge.bg, color: imeiBadge.fg
                                        }}>
                                            {imeiBadge.txt}
                                        </span>
                                    )}
                                </label>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={imei}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 17);
                                        setImei(val);
                                    }}
                                    placeholder="15 dígitos — marca *#06# en el celular"
                                    maxLength={17}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '16px',
                                        fontFamily: 'monospace',
                                        letterSpacing: '1px',
                                        border: `2px solid ${imeiBorderColor}`,
                                        borderRadius: '5px',
                                        marginTop: '8px'
                                    }}
                                />

                                {imeiMessage && (
                                    <p style={{
                                        fontSize: '13px',
                                        marginTop: '6px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        backgroundColor: imeiBadge?.bg || '#f3f4f6',
                                        color: imeiBadge?.fg || '#374151'
                                    }}>
                                        {imeiMessage}
                                        {imeiExisting && imeiExisting.clientName && (
                                            <span style={{ display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                                                Cliente actual: {imeiExisting.clientName}
                                                {imeiExisting.brand && ` — ${imeiExisting.brand} ${imeiExisting.model || ''}`}
                                            </span>
                                        )}
                                    </p>
                                )}

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Marca (opcional):</label>
                                        <input
                                            type="text"
                                            value={deviceBrand}
                                            onChange={(e) => setDeviceBrand(e.target.value)}
                                            placeholder="Samsung, Motorola..."
                                            style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', color: '#6b7280' }}>Modelo (opcional):</label>
                                        <input
                                            type="text"
                                            value={deviceModel}
                                            onChange={(e) => setDeviceModel(e.target.value)}
                                            placeholder="A14, G24..."
                                            style={{ width: '100%', padding: '8px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>

                                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                                    💡 El IMEI se valida automáticamente y queda vinculado al cliente para el bloqueo MDM si cae en mora.
                                </p>
                            </div>
                        )}
                        
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
