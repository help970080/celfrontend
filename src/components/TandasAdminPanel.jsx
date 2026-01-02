// src/components/TandasAdminPanel.jsx - Panel de gestión de Tandas/Caja de Ahorro
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const TandasAdminPanel = ({ authenticatedFetch }) => {
    const [tandas, setTandas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboard, setDashboard] = useState(null);
    const [config, setConfig] = useState(null);
    const [editingConfig, setEditingConfig] = useState(false);
    const [showTandaModal, setShowTandaModal] = useState(false);
    const [editingTanda, setEditingTanda] = useState(null);
    const [tandaForm, setTandaForm] = useState({
        nombre: '', descripcion: '', montoTurno: '', aportacion: '',
        numParticipantes: '', frecuencia: 'quincenal', fechaInicio: '', notas: ''
    });
    const [selectedTanda, setSelectedTanda] = useState(null);
    const [showAportacionModal, setShowAportacionModal] = useState(false);
    const [aportacionForm, setAportacionForm] = useState({
        participanteId: '', monto: '', numPeriodo: '', metodoPago: 'efectivo', notas: ''
    });
    const [showParticipanteModal, setShowParticipanteModal] = useState(false);
    const [participanteForm, setParticipanteForm] = useState({
        nombre: '', telefono: '', email: '', numTurno: '', notas: ''
    });

    useEffect(() => {
        fetchDashboard();
        fetchConfig();
        fetchTandas();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/dashboard`);
            const data = await res.json();
            if (data.success) setDashboard(data.dashboard);
        } catch (error) {
            console.error('Error al cargar dashboard:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/config`);
            const data = await res.json();
            if (data.success) setConfig(data.config);
        } catch (error) {
            console.error('Error al cargar config:', error);
        }
    };

    const fetchTandas = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas`);
            const data = await res.json();
            if (data.success) setTandas(data.tandas);
        } catch (error) {
            console.error('Error al cargar tandas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTandaDetalle = async (id) => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/${id}`);
            const data = await res.json();
            if (data.success) setSelectedTanda(data.tanda);
        } catch (error) {
            console.error('Error al cargar detalle:', error);
        }
    };

    const saveConfig = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/config`, {
                method: 'PUT',
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Configuración guardada');
                setEditingConfig(false);
                fetchDashboard();
            } else {
                toast.error(data.message || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error al guardar configuración');
        }
    };

    const saveTanda = async (e) => {
        e.preventDefault();
        try {
            const url = editingTanda ? `${API_URL}/api/tandas/${editingTanda.id}` : `${API_URL}/api/tandas`;
            const res = await authenticatedFetch(url, {
                method: editingTanda ? 'PUT' : 'POST',
                body: JSON.stringify(tandaForm)
            });
            const data = await res.json();
            if (data.success) {
                toast.success(editingTanda ? 'Tanda actualizada' : 'Tanda creada');
                setShowTandaModal(false);
                setEditingTanda(null);
                resetTandaForm();
                fetchTandas();
                fetchDashboard();
            } else {
                toast.error(data.message || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error al guardar tanda');
        }
    };

    const resetTandaForm = () => {
        setTandaForm({
            nombre: '', descripcion: '', montoTurno: '', aportacion: '',
            numParticipantes: '', frecuencia: 'quincenal', fechaInicio: '', notas: ''
        });
    };

    const handleTandaFormChange = (field, value) => {
        const newForm = { ...tandaForm, [field]: value };
        if (field === 'aportacion' || field === 'numParticipantes') {
            const aport = parseFloat(newForm.aportacion) || 0;
            const num = parseInt(newForm.numParticipantes) || 0;
            if (aport > 0 && num > 0) {
                newForm.montoTurno = (aport * num).toFixed(2);
            }
        }
        setTandaForm(newForm);
    };

    const saveAportacion = async (e) => {
        e.preventDefault();
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/${selectedTanda.id}/aportaciones`, {
                method: 'POST',
                body: JSON.stringify({
                    ...aportacionForm,
                    monto: aportacionForm.monto || selectedTanda.aportacion
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Aportación registrada. Folio: ${data.folio}`);
                setShowAportacionModal(false);
                setAportacionForm({ participanteId: '', monto: '', numPeriodo: '', metodoPago: 'efectivo', notas: '' });
                fetchTandaDetalle(selectedTanda.id);
            } else {
                toast.error(data.message || 'Error al registrar');
            }
        } catch (error) {
            toast.error('Error al registrar aportación');
        }
    };

    const saveParticipante = async (e) => {
        e.preventDefault();
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/${selectedTanda.id}/participantes`, {
                method: 'POST',
                body: JSON.stringify(participanteForm)
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Participante agregado');
                setShowParticipanteModal(false);
                setParticipanteForm({ nombre: '', telefono: '', email: '', numTurno: '', notas: '' });
                fetchTandaDetalle(selectedTanda.id);
            } else {
                toast.error(data.message || 'Error al agregar');
            }
        } catch (error) {
            toast.error('Error al agregar participante');
        }
    };

    const registrarEntrega = async (participante) => {
        if (!window.confirm(`¿Confirmar entrega de $${selectedTanda.montoTurno} a ${participante.nombre}?`)) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/${selectedTanda.id}/entregas`, {
                method: 'POST',
                body: JSON.stringify({ participanteId: participante.id, montoEntregado: selectedTanda.montoTurno })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Entrega registrada');
                fetchTandaDetalle(selectedTanda.id);
                fetchDashboard();
            } else {
                toast.error(data.message || 'Error al registrar entrega');
            }
        } catch (error) {
            toast.error('Error al registrar entrega');
        }
    };

    const realizarSorteo = async () => {
        if (!window.confirm('¿Realizar sorteo de turnos? Los turnos actuales serán reemplazados.')) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/tandas/${selectedTanda.id}/sorteo`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                toast.success('Sorteo realizado');
                setSelectedTanda(data.tanda);
            } else {
                toast.error(data.message || 'Error en sorteo');
            }
        } catch (error) {
            toast.error('Error al realizar sorteo');
        }
    };

    const descargarRecibo = (aportacionId) => {
        const token = localStorage.getItem('token');
        window.open(`${API_URL}/api/tandas/recibo/${aportacionId}?token=${token}`, '_blank');
    };

    const descargarComprobante = (participanteId) => {
        const token = localStorage.getItem('token');
        window.open(`${API_URL}/api/tandas/comprobante/${participanteId}?token=${token}`, '_blank');
    };

    const styles = {
        container: { padding: '20px', maxWidth: '1400px', margin: '0 auto' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
        title: { fontSize: '24px', fontWeight: 'bold', color: '#333' },
        tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' },
        tab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#666', borderRadius: '8px 8px 0 0' },
        tabActive: { backgroundColor: '#7c3aed', color: 'white' },
        card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
        statCard: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', textAlign: 'center' },
        statNumber: { fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' },
        statLabel: { fontSize: '12px', color: '#666', marginTop: '5px' },
        progressBar: { width: '100%', height: '20px', backgroundColor: '#e9ecef', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' },
        progressFill: { height: '100%', borderRadius: '10px', transition: 'width 0.3s' },
        btn: { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' },
        btnPrimary: { backgroundColor: '#7c3aed', color: 'white' },
        btnSuccess: { backgroundColor: '#10b981', color: 'white' },
        btnDanger: { backgroundColor: '#ef4444', color: 'white' },
        btnSecondary: { backgroundColor: '#6b7280', color: 'white' },
        btnSmall: { padding: '6px 12px', fontSize: '12px' },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #eee', color: '#374151', fontSize: '14px' },
        td: { padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px' },
        badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
        badgeGreen: { backgroundColor: '#d1fae5', color: '#065f46' },
        badgeYellow: { backgroundColor: '#fef3c7', color: '#92400e' },
        badgeRed: { backgroundColor: '#fee2e2', color: '#991b1b' },
        badgeGray: { backgroundColor: '#e5e7eb', color: '#374151' },
        modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
        modalContent: { backgroundColor: 'white', borderRadius: '12px', padding: '25px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' },
        formGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#374151' },
        input: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' },
        select: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' },
        textarea: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', minHeight: '80px', boxSizing: 'border-box' }
    };

    const renderDashboard = () => {
        if (!dashboard) return <p>Cargando...</p>;
        const getProgressColor = () => {
            if (dashboard.porcentajeUsado >= 90) return '#ef4444';
            if (dashboard.porcentajeUsado >= 70) return '#f59e0b';
            return '#10b981';
        };

        return (
            <div>
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>⚙️ Configuración Financiera</h3>
                        {!editingConfig ? (
                            <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => setEditingConfig(true)}>✏️ Editar</button>
                        ) : (
                            <div>
                                <button style={{ ...styles.btn, ...styles.btnSuccess, ...styles.btnSmall, marginRight: '10px' }} onClick={saveConfig}>💾 Guardar</button>
                                <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => setEditingConfig(false)}>Cancelar</button>
                            </div>
                        )}
                    </div>
                    {config && (
                        <div style={styles.grid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Ingreso Mensual Promedio</label>
                                <input type="number" style={styles.input} value={config.ingresoMensualPromedio || ''} onChange={(e) => setConfig({ ...config, ingresoMensualPromedio: e.target.value })} disabled={!editingConfig} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Liquidez Disponible</label>
                                <input type="number" style={styles.input} value={config.liquidezDisponible || ''} onChange={(e) => setConfig({ ...config, liquidezDisponible: e.target.value })} disabled={!editingConfig} />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>% Techo Permitido</label>
                                <input type="number" style={styles.input} value={config.porcentajeTecho || ''} onChange={(e) => setConfig({ ...config, porcentajeTecho: e.target.value })} disabled={!editingConfig} />
                            </div>
                        </div>
                    )}
                </div>

                <div style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>💰 Salud Financiera - Tandas</h3>
                    <div style={styles.grid}>
                        <div style={styles.statCard}>
                            <div style={styles.statNumber}>{dashboard.tandasActivas}</div>
                            <div style={styles.statLabel}>Tandas Activas</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#ef4444' }}>${dashboard.compromisoTotal?.toLocaleString()}</div>
                            <div style={styles.statLabel}>Compromiso Total</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#f59e0b' }}>${dashboard.proximasEntregas30Dias?.toLocaleString()}</div>
                            <div style={styles.statLabel}>Próximas Entregas (30 días)</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={{ ...styles.statNumber, color: '#10b981' }}>${dashboard.capacidadDisponible?.toLocaleString()}</div>
                            <div style={styles.statLabel}>Capacidad Disponible</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontWeight: '600' }}>TECHO DE ENDEUDAMIENTO</span>
                            <span style={{ fontWeight: '600' }}>{dashboard.porcentajeUsado}%</span>
                        </div>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${Math.min(dashboard.porcentajeUsado, 100)}%`, backgroundColor: getProgressColor() }} />
                        </div>
                        <p style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>${dashboard.compromisoTotal?.toLocaleString()} de ${dashboard.techoPermitido?.toLocaleString()} permitido</p>
                    </div>
                    <div style={{ marginTop: '20px', padding: '15px', borderRadius: '10px', backgroundColor: dashboard.estadoColor === 'green' ? '#d1fae5' : dashboard.estadoColor === 'orange' ? '#fef3c7' : '#fee2e2', textAlign: 'center' }}>
                        <span style={{ fontSize: '20px', marginRight: '10px' }}>{dashboard.estado === 'saludable' ? '✅' : dashboard.estado === 'advertencia' ? '⚠️' : '🔴'}</span>
                        <span style={{ fontWeight: '600', fontSize: '16px' }}>{dashboard.estado?.toUpperCase()}: {dashboard.mensaje}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderTandas = () => (
        <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>📋 Tandas Registradas</h3>
                <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => { resetTandaForm(); setEditingTanda(null); setShowTandaModal(true); }}>+ Nueva Tanda</button>
            </div>
            {loading ? <p>Cargando...</p> : tandas.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>No hay tandas registradas</p>
            ) : (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Nombre</th>
                            <th style={styles.th}>Monto/Turno</th>
                            <th style={styles.th}>Aportación</th>
                            <th style={styles.th}>Participantes</th>
                            <th style={styles.th}>Frecuencia</th>
                            <th style={styles.th}>Estado</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tandas.map(tanda => (
                            <tr key={tanda.id}>
                                <td style={styles.td}><strong>{tanda.nombre}</strong>{tanda.descripcion && <div style={{ fontSize: '12px', color: '#666' }}>{tanda.descripcion}</div>}</td>
                                <td style={styles.td}>${parseFloat(tanda.montoTurno).toLocaleString()}</td>
                                <td style={styles.td}>${parseFloat(tanda.aportacion).toLocaleString()}</td>
                                <td style={styles.td}>{tanda.participantes?.length || 0}/{tanda.numParticipantes}</td>
                                <td style={styles.td}>{tanda.frecuencia}</td>
                                <td style={styles.td}><span style={{ ...styles.badge, ...(tanda.estado === 'activa' ? styles.badgeGreen : tanda.estado === 'completada' ? styles.badgeGray : styles.badgeRed) }}>{tanda.estado}</span></td>
                                <td style={styles.td}><button style={{ ...styles.btn, ...styles.btnPrimary, ...styles.btnSmall }} onClick={() => { fetchTandaDetalle(tanda.id); setActiveTab('detalle'); }}>👁️ Ver</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderDetalleTanda = () => {
        if (!selectedTanda) return <p>Selecciona una tanda</p>;
        const participantesOrdenados = [...(selectedTanda.participantes || [])].sort((a, b) => a.numTurno - b.numTurno);

        return (
            <div>
                <div style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: '0 0 10px 0' }}>{selectedTanda.nombre}</h2>
                            <p style={{ color: '#666', margin: 0 }}>{selectedTanda.descripcion}</p>
                        </div>
                        <span style={{ ...styles.badge, ...(selectedTanda.estado === 'activa' ? styles.badgeGreen : styles.badgeGray) }}>{selectedTanda.estado}</span>
                    </div>
                    <div style={{ ...styles.grid, marginTop: '20px' }}>
                        <div><strong>Monto por turno:</strong> ${parseFloat(selectedTanda.montoTurno).toLocaleString()}</div>
                        <div><strong>Aportación:</strong> ${parseFloat(selectedTanda.aportacion).toLocaleString()}</div>
                        <div><strong>Frecuencia:</strong> {selectedTanda.frecuencia}</div>
                        <div><strong>Período actual:</strong> {selectedTanda.periodoActual}</div>
                        <div><strong>Inicio:</strong> {new Date(selectedTanda.fechaInicio).toLocaleDateString()}</div>
                        <div><strong>Fin estimado:</strong> {selectedTanda.fechaFin ? new Date(selectedTanda.fechaFin).toLocaleDateString() : '-'}</div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button style={{ ...styles.btn, ...styles.btnSuccess }} onClick={() => { setAportacionForm({ ...aportacionForm, numPeriodo: selectedTanda.periodoActual }); setShowAportacionModal(true); }}>💵 Registrar Aportación</button>
                        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setShowParticipanteModal(true)} disabled={participantesOrdenados.length >= selectedTanda.numParticipantes}>👤 Agregar Participante</button>
                        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={realizarSorteo}>🎲 Sortear Turnos</button>
                        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setActiveTab('tandas')}>← Volver</button>
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>👥 Participantes ({participantesOrdenados.length}/{selectedTanda.numParticipantes})</h3>
                    {participantesOrdenados.length === 0 ? <p style={{ color: '#666', textAlign: 'center' }}>No hay participantes</p> : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Turno</th>
                                    <th style={styles.th}>Nombre</th>
                                    <th style={styles.th}>Teléfono</th>
                                    <th style={styles.th}>Aportado</th>
                                    <th style={styles.th}>Fecha Entrega</th>
                                    <th style={styles.th}>Estado</th>
                                    <th style={styles.th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participantesOrdenados.map(p => (
                                    <tr key={p.id} style={{ backgroundColor: p.entregaRealizada ? '#f0fdf4' : 'transparent' }}>
                                        <td style={styles.td}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#7c3aed', color: 'white', fontWeight: 'bold' }}>{p.numTurno}</span></td>
                                        <td style={styles.td}><strong>{p.nombre}</strong></td>
                                        <td style={styles.td}>{p.telefono || '-'}</td>
                                        <td style={styles.td}>${parseFloat(p.totalAportado || 0).toLocaleString()}<div style={{ fontSize: '11px', color: '#666' }}>de ${parseFloat(selectedTanda.montoTurno).toLocaleString()}</div></td>
                                        <td style={styles.td}>{p.fechaEntregaEstimada ? new Date(p.fechaEntregaEstimada).toLocaleDateString() : '-'}</td>
                                        <td style={styles.td}>{p.entregaRealizada ? <span style={{ ...styles.badge, ...styles.badgeGreen }}>✅ Entregado</span> : <span style={{ ...styles.badge, ...styles.badgeYellow }}>⏳ Pendiente</span>}</td>
                                        <td style={styles.td}>
                                            {!p.entregaRealizada && <button style={{ ...styles.btn, ...styles.btnSuccess, ...styles.btnSmall, marginRight: '5px' }} onClick={() => registrarEntrega(p)}>💰 Entregar</button>}
                                            {p.entregaRealizada && <button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => descargarComprobante(p.id)}>📄 Comprobante</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={styles.card}>
                    <h3 style={{ marginTop: 0 }}>📜 Historial de Aportaciones</h3>
                    {selectedTanda.participantes?.every(p => !p.aportaciones?.length) ? <p style={{ color: '#666', textAlign: 'center' }}>No hay aportaciones</p> : (
                        <table style={styles.table}>
                            <thead><tr><th style={styles.th}>Fecha</th><th style={styles.th}>Participante</th><th style={styles.th}>Período</th><th style={styles.th}>Monto</th><th style={styles.th}>Método</th><th style={styles.th}>Folio</th><th style={styles.th}>Recibo</th></tr></thead>
                            <tbody>
                                {selectedTanda.participantes?.flatMap(p => (p.aportaciones || []).map(a => (
                                    <tr key={a.id}>
                                        <td style={styles.td}>{new Date(a.fechaPago).toLocaleDateString()}</td>
                                        <td style={styles.td}>{p.nombre}</td>
                                        <td style={styles.td}>#{a.numPeriodo}</td>
                                        <td style={styles.td}>${parseFloat(a.monto).toLocaleString()}</td>
                                        <td style={styles.td}>{a.metodoPago}</td>
                                        <td style={styles.td}><code>{a.reciboFolio}</code></td>
                                        <td style={styles.td}><button style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }} onClick={() => descargarRecibo(a.id)}>📄 PDF</button></td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}><h1 style={styles.title}>🏦 Tandas / Caja de Ahorro</h1></div>
            <div style={styles.tabs}>
                <button style={{ ...styles.tab, ...(activeTab === 'dashboard' ? styles.tabActive : {}) }} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</button>
                <button style={{ ...styles.tab, ...(activeTab === 'tandas' ? styles.tabActive : {}) }} onClick={() => setActiveTab('tandas')}>📋 Tandas</button>
                {selectedTanda && <button style={{ ...styles.tab, ...(activeTab === 'detalle' ? styles.tabActive : {}) }} onClick={() => setActiveTab('detalle')}>👁️ {selectedTanda.nombre}</button>}
            </div>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'tandas' && renderTandas()}
            {activeTab === 'detalle' && renderDetalleTanda()}

            {showTandaModal && (
                <div style={styles.modal}><div style={styles.modalContent}>
                    <h2 style={{ marginTop: 0 }}>{editingTanda ? 'Editar Tanda' : 'Nueva Tanda'}</h2>
                    <form onSubmit={saveTanda}>
                        <div style={styles.formGroup}><label style={styles.label}>Nombre *</label><input style={styles.input} type="text" value={tandaForm.nombre} onChange={(e) => handleTandaFormChange('nombre', e.target.value)} required /></div>
                        <div style={styles.formGroup}><label style={styles.label}>Descripción</label><textarea style={styles.textarea} value={tandaForm.descripcion} onChange={(e) => handleTandaFormChange('descripcion', e.target.value)} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={styles.formGroup}><label style={styles.label}>Aportación por período *</label><input style={styles.input} type="number" value={tandaForm.aportacion} onChange={(e) => handleTandaFormChange('aportacion', e.target.value)} required /></div>
                            <div style={styles.formGroup}><label style={styles.label}>Número de participantes *</label><input style={styles.input} type="number" value={tandaForm.numParticipantes} onChange={(e) => handleTandaFormChange('numParticipantes', e.target.value)} required /></div>
                        </div>
                        <div style={styles.formGroup}><label style={styles.label}>Monto por turno (calculado)</label><input style={{ ...styles.input, backgroundColor: '#f3f4f6' }} value={tandaForm.montoTurno ? `$${parseFloat(tandaForm.montoTurno).toLocaleString()}` : ''} disabled /><small style={{ color: '#666' }}>= Aportación × Participantes</small></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={styles.formGroup}><label style={styles.label}>Frecuencia *</label><select style={styles.select} value={tandaForm.frecuencia} onChange={(e) => handleTandaFormChange('frecuencia', e.target.value)}><option value="semanal">Semanal</option><option value="quincenal">Quincenal</option><option value="mensual">Mensual</option></select></div>
                            <div style={styles.formGroup}><label style={styles.label}>Fecha de inicio *</label><input style={styles.input} type="date" value={tandaForm.fechaInicio} onChange={(e) => handleTandaFormChange('fechaInicio', e.target.value)} required /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowTandaModal(false)}>Cancelar</button>
                            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>{editingTanda ? 'Guardar' : 'Crear Tanda'}</button>
                        </div>
                    </form>
                </div></div>
            )}

            {showAportacionModal && selectedTanda && (
                <div style={styles.modal}><div style={styles.modalContent}>
                    <h2 style={{ marginTop: 0 }}>💵 Registrar Aportación</h2>
                    <form onSubmit={saveAportacion}>
                        <div style={styles.formGroup}><label style={styles.label}>Participante *</label><select style={styles.select} value={aportacionForm.participanteId} onChange={(e) => setAportacionForm({ ...aportacionForm, participanteId: e.target.value })} required><option value="">Seleccionar...</option>{selectedTanda.participantes?.map(p => <option key={p.id} value={p.id}>#{p.numTurno} - {p.nombre}</option>)}</select></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={styles.formGroup}><label style={styles.label}>Monto</label><input style={styles.input} type="number" value={aportacionForm.monto || selectedTanda.aportacion} onChange={(e) => setAportacionForm({ ...aportacionForm, monto: e.target.value })} /></div>
                            <div style={styles.formGroup}><label style={styles.label}>Período #</label><input style={styles.input} type="number" value={aportacionForm.numPeriodo} onChange={(e) => setAportacionForm({ ...aportacionForm, numPeriodo: e.target.value })} min="1" max={selectedTanda.numParticipantes} /></div>
                        </div>
                        <div style={styles.formGroup}><label style={styles.label}>Método de pago</label><select style={styles.select} value={aportacionForm.metodoPago} onChange={(e) => setAportacionForm({ ...aportacionForm, metodoPago: e.target.value })}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="descuento_nomina">Descuento Nómina</option></select></div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowAportacionModal(false)}>Cancelar</button>
                            <button type="submit" style={{ ...styles.btn, ...styles.btnSuccess }}>Registrar</button>
                        </div>
                    </form>
                </div></div>
            )}

            {showParticipanteModal && selectedTanda && (
                <div style={styles.modal}><div style={styles.modalContent}>
                    <h2 style={{ marginTop: 0 }}>👤 Agregar Participante</h2>
                    <form onSubmit={saveParticipante}>
                        <div style={styles.formGroup}><label style={styles.label}>Nombre completo *</label><input style={styles.input} type="text" value={participanteForm.nombre} onChange={(e) => setParticipanteForm({ ...participanteForm, nombre: e.target.value })} required /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input style={styles.input} type="tel" value={participanteForm.telefono} onChange={(e) => setParticipanteForm({ ...participanteForm, telefono: e.target.value })} /></div>
                            <div style={styles.formGroup}><label style={styles.label}>Email</label><input style={styles.input} type="email" value={participanteForm.email} onChange={(e) => setParticipanteForm({ ...participanteForm, email: e.target.value })} /></div>
                        </div>
                        <div style={styles.formGroup}><label style={styles.label}>Número de turno</label><input style={styles.input} type="number" value={participanteForm.numTurno} onChange={(e) => setParticipanteForm({ ...participanteForm, numTurno: e.target.value })} min="1" max={selectedTanda.numParticipantes} /><small style={{ color: '#666' }}>Dejar vacío para asignar automáticamente</small></div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button type="button" style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => setShowParticipanteModal(false)}>Cancelar</button>
                            <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>Agregar</button>
                        </div>
                    </form>
                </div></div>
            )}
        </div>
    );
};

export default TandasAdminPanel;
