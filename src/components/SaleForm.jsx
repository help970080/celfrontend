// SaleForm.jsx - VALIDA IMEI EN ZOHO ANTES DE CREAR VENTA
// Usa SOLO endpoints existentes:
//   - GET  /api/mdm/devices/search/:imei  (verificar IMEI en Zoho)
//   - POST /api/sales                      (crear venta clásico)
//   - POST /api/mdm/sales/:saleId/link-device  (vincular IMEI a venta)

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

    // Checkbox: ¿la venta incluye celular?
    const [includesPhone, setIncludesPhone] = useState(false);

    // Campos IMEI (solo si includesPhone)
    const [imei, setImei] = useState('');
    const [imeiStatus, setImeiStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid' | 'not_in_zoho'
    const [imeiMessage, setImeiMessage] = useState('');
    const [imeiZohoInfo, setImeiZohoInfo] = useState(null); // {deviceName, model, account, imei}

    useEffect(() => {
        const newTotal = selectedProducts.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (Number(product?.price || 0)) * item.quantity; 
        }, 0);
        setTotalAmount(parseFloat(newTotal.toFixed(2)));
    }, [selectedProducts, products]);

    // Limpiar IMEI cuando se destilda el checkbox o se cambia a contado
    useEffect(() => {
        if (!isCredit || !includesPhone) {
            setImei('');
            setImeiStatus(null);
            setImeiMessage('');
            setImeiZohoInfo(null);
        }
    }, [isCredit, includesPhone]);

    useEffect(() => {
        if (!isCredit) setIncludesPhone(false);
    }, [isCredit]);

    // ⭐ Verificación automática del IMEI contra Zoho (debounce 500ms)
    useEffect(() => {
        if (!includesPhone || !imei || imei.length < 14) {
            setImeiStatus(null);
            setImeiMessage('');
            setImeiZohoInfo(null);
            return;
        }

        // Validación de formato (solo dígitos)
        if (imei.length < 14 || imei.length > 17) {
            setImeiStatus('invalid');
            setImeiMessage('IMEI debe tener 14-17 dígitos');
            setImeiZohoInfo(null);
            return;
        }

        const timer = setTimeout(async () => {
            setImeiStatus('checking');
            setImeiMessage('Verificando IMEI en Zoho MDM...');
            setImeiZohoInfo(null);

            try {
                // ⭐ Usa el endpoint EXISTENTE de mdmRoutes.js
                const response = await authenticatedFetch(
                    `${API_BASE_URL}/api/mdm/devices/search/${imei}`
                );
                const data = await response.json();

                if (response.status === 404) {
                    setImeiStatus('not_in_zoho');
                    setImeiMessage('❌ Este IMEI NO está enrolado en Zoho MDM. Enrólalo antes de vender.');
                    setImeiZohoInfo(null);
                    return;
                }

                if (!response.ok) {
                    setImeiStatus('invalid');
                    setImeiMessage(data.message || 'Error al verificar IMEI');
                    return;
                }

                if (data.success && data.device) {
                    setImeiStatus('valid');
                    setImeiMessage(`✓ IMEI encontrado en cuenta Zoho: ${data.account}`);
                    setImeiZohoInfo({
                        deviceName: data.device.deviceName,
                        model: data.device.model,
                        account: data.account,
                        imei: data.device.imei,
                        isLostMode: data.device.isLostMode
                    });
                } else {
                    setImeiStatus('not_in_zoho');
                    setImeiMessage('IMEI no encontrado en Zoho');
                }
            } catch (err) {
                setImeiStatus('invalid');
                setImeiMessage('Error de red al verificar en Zoho');
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
        setImeiZohoInfo(null);
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

        // Validaciones básicas
        if (!clientId || selectedProducts.length === 0) {
            toast.error('Cliente y productos son obligatorios.');
            setLoading(false);
            return;
        }

        // ⭐ VALIDACIÓN DURA: si hay celular, IMEI debe estar verificado en Zoho
        if (isCredit && includesPhone) {
            if (!imei || imei.length < 14) {
                toast.error('IMEI es obligatorio cuando la venta incluye un celular');
                setLoading(false);
                return;
            }
            if (imeiStatus !== 'valid') {
                toast.error('El IMEI no está verificado en Zoho. No se puede continuar.');
                setLoading(false);
                return;
            }

            // ⭐ DOBLE VERIFICACIÓN antes de submit (por si pasó tiempo desde la última)
            try {
                const recheck = await authenticatedFetch(
                    `${API_BASE_URL}/api/mdm/devices/search/${imei}`
                );
                if (!recheck.ok) {
                    toast.error('❌ El IMEI ya no está disponible en Zoho. Verifica de nuevo.');
                    setImeiStatus('not_in_zoho');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                toast.error('No se pudo confirmar IMEI en Zoho. Reintenta.');
                setLoading(false);
                return;
            }
        }

        // ⭐ FLUJO DE CREACIÓN DE VENTA (usa tus endpoints existentes)
        try {
            // 1) Crear venta con el endpoint clásico
            const saleData = {
                clientId: parseInt(clientId),
                saleItems: selectedProducts,
                isCredit,
                downPayment: isCredit ? parseFloat(downPayment || 0) : totalAmount,
                assignedCollectorId: isCredit && assignedCollectorId ? parseInt(assignedCollectorId, 10) : null,
                paymentFrequency: isCredit ? paymentFrequency : null,
                numberOfPayments: isCredit ? parseInt(numberOfPayments, 10) : null,
            };

            const saleResponse = await authenticatedFetch(`${API_BASE_URL}/api/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });

            const newSale = await saleResponse.json();

            if (!saleResponse.ok) {
                throw new Error(newSale.message || 'Error al registrar la venta.');
            }

            // 2) Si lleva celular, vincular IMEI a la venta usando el endpoint EXISTENTE
            if (isCredit && includesPhone && imei) {
                try {
                    const linkResponse = await authenticatedFetch(
                        `${API_BASE_URL}/api/mdm/sales/${newSale.id}/link-device`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ imei })
                        }
                    );

                    const linkData = await linkResponse.json();

                    if (!linkResponse.ok) {
                        // ⚠️ La venta ya se creó pero no se pudo vincular
                        // Esto NO debería pasar porque ya validamos 2 veces, pero por seguridad:
                        toast.warn(
                            `⚠️ Venta #${newSale.id} creada, pero la vinculación del IMEI falló. ` +
                            `Vincula manualmente desde el panel MDM. Error: ${linkData.message}`,
                            { autoClose: 10000 }
                        );
                    } else {
                        toast.success(
                            `✅ Venta #${newSale.id} registrada.\n` +
                            `📱 IMEI vinculado a cuenta Zoho: ${imeiZohoInfo?.account || 'OK'}`,
                            { autoClose: 6000 }
                        );
                    }
                } catch (linkErr) {
                    toast.warn(
                        `⚠️ Venta #${newSale.id} creada, pero error de red al vincular IMEI. ` +
                        `Vincula manualmente desde el panel MDM.`,
                        { autoClose: 10000 }
                    );
                }
            } else {
                toast.success(isCredit ? '¡Venta a crédito registrada!' : '¡Venta de contado registrada!');
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
            // ⭐ IMEI debe estar VERIFICADO en Zoho si se marcó celular
            if (includesPhone) {
                if (!imei || imei.length < 14 || imeiStatus !== 'valid') return false;
            }
        }
        return true;
    };

    const imeiBorderColor =
        imeiStatus === 'valid' ? '#10b981' :
        imeiStatus === 'invalid' ? '#ef4444' :
        imeiStatus === 'not_in_zoho' ? '#ef4444' :
        imeiStatus === 'checking' ? '#f59e0b' :
        '#d1d5db';

    const imeiBadge =
        imeiStatus === 'valid' ? { bg: '#d1fae5', fg: '#065f46', txt: '✓ En Zoho' } :
        imeiStatus === 'not_in_zoho' ? { bg: '#fee2e2', fg: '#991b1b', txt: '✗ No enrolado' } :
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

                        {/* CHECKBOX: ¿Esta venta incluye un celular? */}
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
                            <p style={{ fontSize: '12px', color: '#991b1b', marginTop: '6px', marginLeft: '24px', fontWeight: 'bold' }}>
                                ⚠️ El celular DEBE estar pre-enrolado en Zoho MDM. Si no, el sistema rechazará la venta.
                            </p>
                        </div>

                        {/* Campos IMEI: solo aparecen si se marca el checkbox */}
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
                                        {imeiZohoInfo && (
                                            <span style={{ display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                                                {imeiZohoInfo.deviceName && `📱 ${imeiZohoInfo.deviceName}`}
                                                {imeiZohoInfo.model && ` — ${imeiZohoInfo.model}`}
                                                {imeiZohoInfo.isLostMode === 'true' && (
                                                    <span style={{ color: '#dc2626', display: 'block' }}>
                                                        ⚠️ Este dispositivo está actualmente bloqueado en Zoho
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </p>
                                )}

                                <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                                    💡 El sistema busca el IMEI en TODAS tus cuentas Zoho y vincula automáticamente al cliente para el bloqueo en caso de mora.
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
