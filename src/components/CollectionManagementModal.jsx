// CollectionManagementModal.jsx - Componente de gestión de cobranza

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
                }
            } catch (error) {
                console.error('Error al cargar historial:', error);
            } finally {
                setLoadingLogs(false);
            }
        };

        fetchLogs();
    }, [client.id, authenticatedFetch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Buscar primera venta a crédito con saldo
        const saleId = client.riskData?.activeSalesCount > 0 
            ? client.id  // Esto es temporal, necesitamos el saleId real
            : null;

        if (!saleId) {
            toast.error('No hay ventas activas para este cliente');
            setLoading(false);
            return;
        }

        try {
            const logData = {
                saleId: client.id, // TEMPORAL: usar client.id
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
            
            toast.success('Gestión registrada exitosamente');
            
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
            'sms': '📱 SMS'
        };
        return types[type] || type;
    };

    const getResultLabel = (result) => {
        const results = {
            'payment_promise': '✅ Promesa de pago',
            'no_answer': '❌ No contesta',
            'payment_made': '💰 Realizó pago',
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
                        color: '#666'
                    }}>✕</button>
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
                        <h3 style={{ margin: '0 0 15px 0' }}>{client.name} {client.lastName}</h3>
                        <div>
                            <p>📱 {client.phone}</p>
                            {client.riskData && (
                                <>
                                    <p>💰 Adeudo: ${client.riskData.totalBalance?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                    {client.riskData.daysOverdue > 0 && (
                                        <p>⏰ Atraso: {client.riskData.daysOverdue} días</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <hr />

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                        <h3>Nueva Gestión</h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                Tipo de contacto:
                            </label>
                            <select 
                                value={contactType} 
                                onChange={(e) => setContactType(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                            >
                                <option value="phone_call">📞 Llamada telefónica</option>
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="home_visit">🏠 Visita domiciliaria</option>
                                <option value="sms">📱 SMS</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                Resultado:
                            </label>
                            <select 
                                value={contactResult} 
                                onChange={(e) => setContactResult(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                            >
                                <option value="payment_promise">✅ Promesa de pago</option>
                                <option value="no_answer">❌ No contesta</option>
                                <option value="payment_made">💰 Realizó pago</option>
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
                                rows="3"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                                placeholder="Descripción de la gestión..."
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>
                                Próximo contacto:
                            </label>
                            <input
                                type="datetime-local"
                                value={nextContactDate}
                                onChange={(e) => setNextContactDate(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #ddd' }}
                            />
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}>
                            {loading ? 'Guardando...' : '💾 Guardar Gestión'}
                        </button>
                    </form>

                    <hr />

                    {/* Historial */}
                    <div>
                        <h3>📋 Historial de Gestiones</h3>
                        
                        {loadingLogs ? (
                            <p>Cargando historial...</p>
                        ) : logs.length === 0 ? (
                            <p>No hay gestiones registradas aún.</p>
                        ) : (
                            <div>
                                {logs.map((log) => (
                                    <div key={log.id} style={{
                                        background: '#f8f9fa',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong>{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm')}</strong>
                                            <span>{getContactTypeLabel(log.contactType)}</span>
                                        </div>
                                        <div style={{ color: '#667eea', fontWeight: '600', marginBottom: '5px' }}>
                                            {getResultLabel(log.contactResult)}
                                        </div>
                                        {log.notes && (
                                            <div style={{ color: '#555', marginBottom: '5px' }}>
                                                {log.notes}
                                            </div>
                                        )}
                                        {log.nextContactDate && (
                                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                                📅 Próximo contacto: {dayjs(log.nextContactDate).format('DD/MM/YYYY HH:mm')}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
                                            Por: {log.collector?.username || log.collector?.name || 'Usuario'}
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