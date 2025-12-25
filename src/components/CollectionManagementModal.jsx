// CollectionManagementModal.jsx - VERSIÓN CORREGIDA CON VENTA REAL

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function CollectionManagementModal({ client, onClose, authenticatedFetch }) {
    const [contactType, setContactType] = useState('phone_call');
    const [contactResult, setContactResult] = useState('payment_promise');
    const [notes, setNotes] = useState('');
    const [nextContactDate, setNextContactDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [activeSaleId, setActiveSaleId] = useState(null);
    const [loadingSale, setLoadingSale] = useState(true);

    // Cargar primera venta activa del cliente
    useEffect(() => {
        const fetchActiveSale = async () => {
            setLoadingSale(true);
            try {
                // Usar la ruta de estado de cuenta para obtener ventas
                const response = await authenticatedFetch(
                    `${API_BASE_URL}/api/sales/client/${client.id}/statement`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    const sales = data.sales || [];
                    
                    // Buscar primera venta con saldo pendiente
                    const pendingSale = sales.find(s => s.balanceDue > 0);
                    
                    if (pendingSale) {
                        setActiveSaleId(pendingSale.id);
                    } else if (sales.length > 0) {
                        // Si no hay ventas pendientes, usar la más reciente
                        setActiveSaleId(sales[0].id);
                    }
                } else {
                    console.log('No se pudieron cargar ventas del cliente');
                }
            } catch (error) {
                console.error('Error al cargar venta activa:', error);
            } finally {
                setLoadingSale(false);
            }
        };

        fetchActiveSale();
    }, [client.id, authenticatedFetch]);

    // Cargar historial de gestiones del cliente
    useEffect(() => {
        const fetchLogs = async () => {
            setLoadingLogs(true);
            try {
                const response = await authenticatedFetch(
                    `${API_BASE_URL}/api/collections/client/${client.id}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                } else {
                    console.log('No se pudo cargar historial');
                    setLogs([]);
                }
            } catch (error) {
                console.error('Error al cargar historial:', error);
                setLogs([]);
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [client.id, authenticatedFetch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!activeSaleId) {
            toast.error('No hay ventas disponibles para este cliente');
            return;
        }

        setLoading(true);

        try {
            const logData = {
                saleId: activeSaleId,
                contactType,
                contactResult,
                notes: notes.trim() || null,
                nextContactDate: nextContactDate || null
            };

            const response = await authenticatedFetch(
                `${API_BASE_URL}/api/collections`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(logData)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar gestión');
            }

            const newLog = await response.json();
            
            toast.success('✅ Gestión registrada exitosamente');
            
            // Agregar al historial
            setLogs([newLog, ...logs]);
            
            // Limpiar formulario
            setNotes('');
            setNextContactDate('');
            setContactResult('payment_promise');
            
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'Error al guardar gestión');
        } finally {
            setLoading(false);
        }
    };

    const getContactTypeLabel = (type) => {
        const types = {
            'phone_call': '📞 Llamada',
            'whatsapp': '💬 WhatsApp',
            'home_visit': '🏠 Visita',
            'sms': '📱 SMS',
            'email': '📧 Email'
        };
        return types[type] || type;
    };

    const getResultLabel = (result) => {
        const results = {
            'payment_promise': '✅ Promesa de pago',
            'no_answer': '❌ No contesta',
            'payment_made': '💰 Realizó pago',
            'partial_payment': '💵 Pago parcial',
            'refuses_to_pay': '🚫 Se niega a pagar',
            'wrong_number': '📵 Número equivocado',
            'other': '📝 Otro'
        };
        return results[result] || result;
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '2px solid #f0f0f0',
                    position: 'sticky',
                    top: 0,
                    background: 'white',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>🚨 Gestión de Cobranza</h2>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '5px 10px',
                        color: '#666',
                        transition: 'color 0.2s'
                    }} onMouseOver={(e) => e.target.style.color = '#dc3545'}
                       onMouseOut={(e) => e.target.style.color = '#666'}>✕</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {/* Info del cliente */}
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem' }}>
                            {client.name} {client.lastName}
                        </h3>
                        <div>
                            <p style={{ margin: '5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📱 {client.phone}
                                {client.phone && (
                                    <a 
                                        href={`https://wa.me/52${client.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            background: '#25D366',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            textDecoration: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        💬 WhatsApp
                                    </a>
                                )}
                            </p>
                            {client.riskData && (
                                <>
                                    <p style={{ margin: '5px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                                        💰 Adeudo: ${client.riskData.totalBalance?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </p>
                                    {client.riskData.daysOverdue > 0 && (
                                        <p style={{ 
                                            margin: '5px 0', 
                                            background: 'rgba(255,255,255,0.2)',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            display: 'inline-block'
                                        }}>
                                            ⏰ {client.riskData.daysOverdue} días de atraso
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                    {/* Estado de carga */}
                    {loadingSale ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p>⏳ Cargando información de ventas...</p>
                        </div>
                    ) : !activeSaleId ? (
                        <div style={{
                            background: '#fff3cd',
                            border: '2px solid #ffc107',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '20px'
                        }}>
                            <p style={{ margin: 0, fontWeight: '600', color: '#856404' }}>
                                ⚠️ Este cliente no tiene ventas registradas.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Formulario */}
                            <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                                <h3 style={{ marginBottom: '15px' }}>📝 Nueva Gestión</h3>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                        Tipo de contacto:
                                    </label>
                                    <select 
                                        value={contactType} 
                                        onChange={(e) => setContactType(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            border: '2px solid #ddd',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="phone_call">📞 Llamada telefónica</option>
                                        <option value="whatsapp">💬 WhatsApp</option>
                                        <option value="home_visit">🏠 Visita domiciliaria</option>
                                        <option value="sms">📱 SMS</option>
                                        <option value="email">📧 Email</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                        Resultado:
                                    </label>
                                    <select 
                                        value={contactResult} 
                                        onChange={(e) => setContactResult(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            border: '2px solid #ddd',
                                            fontSize: '1rem'
                                        }}
                                    >
                                        <option value="payment_promise">✅ Promesa de pago</option>
                                        <option value="payment_made">💰 Realizó pago</option>
                                        <option value="partial_payment">💵 Pago parcial</option>
                                        <option value="no_answer">❌ No contesta</option>
                                        <option value="refuses_to_pay">🚫 Se niega a pagar</option>
                                        <option value="wrong_number">📵 Número equivocado</option>
                                        <option value="other">📝 Otro</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                        Notas:
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows="4"
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            border: '2px solid #ddd', 
                                            fontFamily: 'inherit',
                                            fontSize: '1rem',
                                            resize: 'vertical'
                                        }}
                                        placeholder="Descripción detallada de la gestión realizada..."
                                    />
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                        Próximo contacto (opcional):
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={nextContactDate}
                                        onChange={(e) => setNextContactDate(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '10px', 
                                            borderRadius: '8px', 
                                            border: '2px solid #ddd',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <button type="submit" disabled={loading} style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1.1rem',
                                    fontWeight: '700',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s',
                                    boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)'
                                }}>
                                    {loading ? '⏳ Guardando...' : '💾 Guardar Gestión'}
                                </button>
                            </form>
                        </>
                    )}

                    <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                    {/* Historial */}
                    <div>
                        <h3 style={{ marginBottom: '15px' }}>📋 Historial de Gestiones</h3>
                        
                        {loadingLogs ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                ⏳ Cargando historial...
                            </p>
                        ) : logs.length === 0 ? (
                            <div style={{
                                background: '#f8f9fa',
                                padding: '20px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                color: '#666'
                            }}>
                                <p style={{ margin: 0 }}>📭 No hay gestiones registradas aún.</p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                                    Las gestiones que registres aparecerán aquí.
                                </p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {logs.map((log) => (
                                    <div key={log.id} style={{
                                        background: '#f8f9fa',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '10px',
                                        border: '1px solid #e0e0e0'
                                    }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            marginBottom: '8px',
                                            flexWrap: 'wrap',
                                            gap: '8px'
                                        }}>
                                            <strong style={{ color: '#667eea' }}>
                                                {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm')}
                                            </strong>
                                            <span style={{ 
                                                background: 'white',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '0.9rem'
                                            }}>
                                                {getContactTypeLabel(log.contactType)}
                                            </span>
                                        </div>
                                        <div style={{ 
                                            color: '#28a745', 
                                            fontWeight: '600', 
                                            marginBottom: '8px',
                                            fontSize: '1.05rem'
                                        }}>
                                            {getResultLabel(log.contactResult)}
                                        </div>
                                        {log.notes && (
                                            <div style={{ 
                                                color: '#555', 
                                                marginBottom: '8px', 
                                                fontStyle: 'italic',
                                                background: 'white',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                borderLeft: '3px solid #667eea'
                                            }}>
                                                "{log.notes}"
                                            </div>
                                        )}
                                        {log.nextContactDate && (
                                            <div style={{ 
                                                fontSize: '0.9rem', 
                                                color: '#dc3545',
                                                fontWeight: '600',
                                                marginBottom: '8px'
                                            }}>
                                                📅 Próximo contacto: {dayjs(log.nextContactDate).format('DD/MM/YYYY HH:mm')}
                                            </div>
                                        )}
                                        <div style={{ 
                                            fontSize: '0.85rem', 
                                            color: '#999', 
                                            marginTop: '8px', 
                                            paddingTop: '8px', 
                                            borderTop: '1px solid #ddd'
                                        }}>
                                            👤 {log.collector?.username || log.collector?.name || 'Usuario'}
                                            {log.sale && ` • Venta #${log.sale.id}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CollectionManagementModal;