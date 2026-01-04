// src/components/LlamadasPanel.jsx - Panel de llamadas automáticas
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const LlamadasPanel = ({ authenticatedFetch }) => {
    const [pendientes, setPendientes] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [estadisticas, setEstadisticas] = useState(null);
    const [statsHoy, setStatsHoy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ejecutando, setEjecutando] = useState(false);
    const [activeTab, setActiveTab] = useState('pendientes');
    const [dentroHorario, setDentroHorario] = useState(false);
    const [proximaVentana, setProximaVentana] = useState('');

    useEffect(() => {
        fetchPendientes();
        fetchHistorial();
        fetchEstadisticas();
    }, []);

    const fetchPendientes = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/llamadas/pendientes`);
            const data = await res.json();
            if (data.success) {
                setPendientes(data.pendientes);
                setDentroHorario(data.dentroDeHorario);
                setProximaVentana(data.proximaVentana);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorial = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/llamadas/historial?limit=100`);
            const data = await res.json();
            if (data.success) {
                setHistorial(data.llamadas);
                setStatsHoy(data.estadisticasHoy);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchEstadisticas = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/llamadas/estadisticas`);
            const data = await res.json();
            if (data.success) {
                setEstadisticas(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const ejecutarLlamadas = async () => {
        if (!window.confirm(`¿Ejecutar ${pendientes.length} llamadas automáticas ahora?`)) return;
        
        setEjecutando(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/llamadas/ejecutar`, { method: 'POST' });
            const data = await res.json();
            
            if (data.success) {
                toast.success(data.message);
                fetchPendientes();
                fetchHistorial();
                fetchEstadisticas();
            } else {
                toast.error(data.message || 'Error al ejecutar llamadas');
            }
        } catch (error) {
            toast.error('Error al ejecutar llamadas');
        } finally {
            setEjecutando(false);
        }
    };

    const llamarManual = async (saleId, tipo) => {
        if (!window.confirm('¿Realizar esta llamada ahora?')) return;
        
        try {
            const res = await authenticatedFetch(`${API_URL}/api/llamadas/llamar/${saleId}`, {
                method: 'POST',
                body: JSON.stringify({ tipo })
            });
            const data = await res.json();
            
            if (data.success) {
                toast.success('Llamada iniciada');
                fetchPendientes();
                fetchHistorial();
            } else {
                toast.error(data.message || 'Error al llamar');
            }
        } catch (error) {
            toast.error('Error al realizar llamada');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            completed: { bg: '#d1fae5', color: '#065f46', text: '✅ Completada' },
            'in-progress': { bg: '#dbeafe', color: '#1e40af', text: '📞 En curso' },
            initiated: { bg: '#fef3c7', color: '#92400e', text: '⏳ Iniciada' },
            ringing: { bg: '#fef3c7', color: '#92400e', text: '🔔 Sonando' },
            'no-answer': { bg: '#fee2e2', color: '#991b1b', text: '📵 Sin respuesta' },
            busy: { bg: '#fee2e2', color: '#991b1b', text: '🔴 Ocupado' },
            failed: { bg: '#fee2e2', color: '#991b1b', text: '❌ Fallida' },
            canceled: { bg: '#e5e7eb', color: '#374151', text: '🚫 Cancelada' }
        };
        const s = styles[status] || { bg: '#e5e7eb', color: '#374151', text: status };
        return (
            <span style={{ 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: '500',
                backgroundColor: s.bg,
                color: s.color
            }}>
                {s.text}
            </span>
        );
    };

    const getTipoBadge = (tipo) => {
        if (tipo === 'preventivo') {
            return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af' }}>📅 Preventivo</span>;
        }
        return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', backgroundColor: '#fef3c7', color: '#92400e' }}>⚠️ Vencimiento</span>;
    };

    const styles = {
        container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        title: { fontSize: '24px', fontWeight: 'bold', color: '#333' },
        tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' },
        tab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#666', borderRadius: '8px 8px 0 0' },
        tabActive: { backgroundColor: '#2563eb', color: 'white' },
        card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' },
        statCard: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '15px', textAlign: 'center' },
        statNumber: { fontSize: '24px', fontWeight: 'bold', color: '#2563eb' },
        statLabel: { fontSize: '11px', color: '#666', marginTop: '5px' },
        btn: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' },
        btnPrimary: { backgroundColor: '#2563eb', color: 'white' },
        btnSuccess: { backgroundColor: '#10b981', color: 'white' },
        btnSmall: { padding: '6px 12px', fontSize: '12px' },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee', color: '#374151', fontSize: '13px' },
        td: { padding: '12px', borderBottom: '1px solid #eee', fontSize: '13px' },
        alert: { padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
        alertSuccess: { backgroundColor: '#d1fae5', color: '#065f46' },
        alertWarning: { backgroundColor: '#fef3c7', color: '#92400e' }
    };

    if (loading) return <div style={styles.container}><p>Cargando...</p></div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>📞 Llamadas Automáticas</h1>
                <div>
                    {dentroHorario ? (
                        <span style={{ ...styles.alert, ...styles.alertSuccess, padding: '8px 15px', marginBottom: 0 }}>
                            🟢 Dentro de horario
                        </span>
                    ) : (
                        <span style={{ ...styles.alert, ...styles.alertWarning, padding: '8px 15px', marginBottom: 0 }}>
                            🔴 Fuera de horario - {proximaVentana}
                        </span>
                    )}
                </div>
            </div>

            {/* Estadísticas del día */}
            {statsHoy && (
                <div style={styles.card}>
                    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>📊 Hoy</h3>
                    <div style={styles.grid}>
                        <div style={styles.statCard}>
                            <div style={styles.statNumber}>{statsHoy.total || 0}</div>
                            <div style={styles.statLabel}>Total llamadas</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#10b981' }}>{statsHoy.completadas || 0}</div>
                            <div style={styles.statLabel}>Completadas</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{statsHoy.contestadas_humano || 0}</div>
                            <div style={styles.statLabel}>Contestó persona</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#6b7280' }}>{statsHoy.contestadas_buzon || 0}</div>
                            <div style={styles.statLabel}>Buzón de voz</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#ef4444' }}>{statsHoy.sin_respuesta || 0}</div>
                            <div style={styles.statLabel}>Sin respuesta</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#ef4444' }}>{statsHoy.fallidas || 0}</div>
                            <div style={styles.statLabel}>Fallidas</div>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.tabs}>
                <button 
                    style={{ ...styles.tab, ...(activeTab === 'pendientes' ? styles.tabActive : {}) }} 
                    onClick={() => setActiveTab('pendientes')}
                >
                    📋 Pendientes ({pendientes.length})
                </button>
                <button 
                    style={{ ...styles.tab, ...(activeTab === 'historial' ? styles.tabActive : {}) }} 
                    onClick={() => setActiveTab('historial')}
                >
                    📜 Historial
                </button>
                <button 
                    style={{ ...styles.tab, ...(activeTab === 'estadisticas' ? styles.tabActive : {}) }} 
                    onClick={() => setActiveTab('estadisticas')}
                >
                    📊 Estadísticas
                </button>
            </div>

            {/* Tab Pendientes */}
            {activeTab === 'pendientes' && (
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Llamadas Pendientes de Hoy</h3>
                        {pendientes.length > 0 && dentroHorario && (
                            <button 
                                style={{ ...styles.btn, ...styles.btnPrimary }}
                                onClick={ejecutarLlamadas}
                                disabled={ejecutando}
                            >
                                {ejecutando ? '⏳ Ejecutando...' : `📞 Ejecutar ${pendientes.length} llamadas`}
                            </button>
                        )}
                    </div>

                    {pendientes.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                            ✅ No hay llamadas pendientes para hoy
                        </p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Cliente</th>
                                    <th style={styles.th}>Teléfono</th>
                                    <th style={styles.th}>Monto</th>
                                    <th style={styles.th}>Vencimiento</th>
                                    <th style={styles.th}>Tipo</th>
                                    <th style={styles.th}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendientes.map((p, idx) => (
                                    <tr key={idx}>
                                        <td style={styles.td}><strong>{p.client_name}</strong></td>
                                        <td style={styles.td}>{p.telefono}</td>
                                        <td style={styles.td}>${parseFloat(p.monto_pago).toLocaleString()}</td>
                                        <td style={styles.td}>{new Date(p.fecha_vencimiento).toLocaleDateString()}</td>
                                        <td style={styles.td}>{getTipoBadge(p.tipo_llamada)}</td>
                                        <td style={styles.td}>
                                            <button 
                                                style={{ ...styles.btn, ...styles.btnSuccess, ...styles.btnSmall }}
                                                onClick={() => llamarManual(p.sale_id, p.tipo_llamada)}
                                                disabled={!dentroHorario}
                                            >
                                                📞 Llamar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Tab Historial */}
            {activeTab === 'historial' && (
                <div style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>Historial de Llamadas</h3>
                    {historial.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>No hay llamadas registradas</p>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Fecha</th>
                                    <th style={styles.th}>Cliente</th>
                                    <th style={styles.th}>Teléfono</th>
                                    <th style={styles.th}>Monto</th>
                                    <th style={styles.th}>Tipo</th>
                                    <th style={styles.th}>Estado</th>
                                    <th style={styles.th}>Duración</th>
                                    <th style={styles.th}>Contestó</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historial.map((l) => (
                                    <tr key={l.id}>
                                        <td style={styles.td}>{new Date(l.created_at).toLocaleString()}</td>
                                        <td style={styles.td}><strong>{l.client_name}</strong></td>
                                        <td style={styles.td}>{l.telefono}</td>
                                        <td style={styles.td}>${parseFloat(l.monto || 0).toLocaleString()}</td>
                                        <td style={styles.td}>{getTipoBadge(l.tipo)}</td>
                                        <td style={styles.td}>{getStatusBadge(l.status)}</td>
                                        <td style={styles.td}>{l.duration ? `${l.duration}s` : '-'}</td>
                                        <td style={styles.td}>
                                            {l.answered_by === 'human' ? '👤 Persona' : 
                                             l.answered_by === 'machine' ? '📼 Buzón' : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Tab Estadísticas */}
            {activeTab === 'estadisticas' && estadisticas && (
                <div>
                    <div style={styles.card}>
                        <h3 style={{ marginTop: 0 }}>📊 Estadísticas Generales</h3>
                        <div style={styles.grid}>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{estadisticas.estadisticas?.total_llamadas || 0}</div>
                                <div style={styles.statLabel}>Total llamadas</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{ ...styles.statNumber, color: '#10b981' }}>{estadisticas.tasaContacto || 0}%</div>
                                <div style={styles.statLabel}>Tasa de contacto</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{estadisticas.estadisticas?.contestadas_humano || 0}</div>
                                <div style={styles.statLabel}>Contestó persona</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={styles.statNumber}>{estadisticas.estadisticas?.contestadas_buzon || 0}</div>
                                <div style={styles.statLabel}>Buzón de voz</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{estadisticas.estadisticas?.llamadas_preventivas || 0}</div>
                                <div style={styles.statLabel}>Preventivas</div>
                            </div>
                            <div style={styles.statCard}>
                                <div style={{ ...styles.statNumber, color: '#ef4444' }}>{estadisticas.estadisticas?.llamadas_vencimiento || 0}</div>
                                <div style={styles.statLabel}>Día vencimiento</div>
                            </div>
                        </div>
                    </div>

                    <div style={styles.card}>
                        <h3 style={{ marginTop: 0 }}>📅 Últimos 7 días</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Fecha</th>
                                    <th style={styles.th}>Total</th>
                                    <th style={styles.th}>Completadas</th>
                                    <th style={styles.th}>Tasa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estadisticas.porDia?.map((d, idx) => (
                                    <tr key={idx}>
                                        <td style={styles.td}>{new Date(d.fecha).toLocaleDateString()}</td>
                                        <td style={styles.td}>{d.total}</td>
                                        <td style={styles.td}>{d.completadas}</td>
                                        <td style={styles.td}>{d.total > 0 ? Math.round((d.completadas / d.total) * 100) : 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LlamadasPanel;
