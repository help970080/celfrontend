// src/pages/MdmAdminPanel.jsx - Panel de Administración MDM
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://celbackend.onrender.com';

const MdmAdminPanel = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [stores, setStores] = useState([]);
  const [status, setStatus] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [viewingDevices, setViewingDevices] = useState(null);
  const [devices, setDevices] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    tiendaId: '',
    notas: ''
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Cargar cuentas
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/mdm-admin/accounts`, getAuthHeaders());
      setAccounts(res.data.accounts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estado general
  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/mdm-admin/status`, getAuthHeaders());
      setStatus(res.data);
    } catch (err) {
      console.error('Error al cargar estado:', err);
    }
  };

  // Cargar tiendas
  const fetchStores = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/mdm-admin/stores`, getAuthHeaders());
      setStores(res.data.stores || []);
    } catch (err) {
      console.error('Error al cargar tiendas:', err);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchStatus();
    fetchStores();
  }, []);

  // Crear/Actualizar cuenta
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingAccount) {
        await axios.put(
          `${API_URL}/api/mdm-admin/accounts/${editingAccount.id}`,
          formData,
          getAuthHeaders()
        );
        setSuccess('Cuenta actualizada correctamente');
      } else {
        const res = await axios.post(
          `${API_URL}/api/mdm-admin/accounts`,
          formData,
          getAuthHeaders()
        );
        if (res.data.connectionTest?.success) {
          setSuccess(`Cuenta creada y conexión verificada. ${res.data.connectionTest.deviceCount} dispositivos encontrados.`);
        } else {
          setSuccess('Cuenta creada. Verifica las credenciales.');
        }
      }
      
      setShowForm(false);
      setEditingAccount(null);
      resetForm();
      fetchAccounts();
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar cuenta');
    }
  };

  // Eliminar cuenta
  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar cuenta "${nombre}"?`)) return;

    try {
      await axios.delete(`${API_URL}/api/mdm-admin/accounts/${id}`, getAuthHeaders());
      setSuccess('Cuenta eliminada');
      fetchAccounts();
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  // Probar conexión
  const handleTest = async (id) => {
    setTestingId(id);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(
        `${API_URL}/api/mdm-admin/accounts/${id}/test`,
        {},
        getAuthHeaders()
      );
      
      if (res.data.test?.success) {
        setSuccess(`✅ Conexión exitosa: ${res.data.test.deviceCount} dispositivos`);
      } else {
        setError(`❌ Error: ${res.data.test?.error || 'Conexión fallida'}`);
      }
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al probar conexión');
    } finally {
      setTestingId(null);
    }
  };

  // Ver dispositivos
  const handleViewDevices = async (id, nombre) => {
    setViewingDevices(nombre);
    setDevices([]);

    try {
      const res = await axios.get(
        `${API_URL}/api/mdm-admin/accounts/${id}/devices`,
        getAuthHeaders()
      );
      setDevices(res.data.devices || []);
    } catch (err) {
      setError('Error al cargar dispositivos');
      setViewingDevices(null);
    }
  };

  // Editar cuenta
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      nombre: account.nombre || '',
      email: account.email || '',
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      tiendaId: account.tiendaId || '',
      notas: account.notas || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      clientId: '',
      clientSecret: '',
      refreshToken: '',
      tiendaId: '',
      notas: ''
    });
  };

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333'
    },
    btn: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    btnPrimary: {
      backgroundColor: '#7c3aed',
      color: 'white'
    },
    btnSecondary: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    btnDanger: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    btnSuccess: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    btnSmall: {
      padding: '5px 10px',
      fontSize: '12px',
      marginRight: '5px'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '20px',
      marginBottom: '20px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statCard: {
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '15px',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#7c3aed'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '12px',
      borderBottom: '2px solid #e5e7eb',
      color: '#374151',
      fontSize: '14px'
    },
    td: {
      padding: '12px',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '14px'
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500'
    },
    badgeSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    badgeError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    badgeWarning: {
      backgroundColor: '#fef3c7',
      color: '#92400e'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '5px',
      fontSize: '14px'
    },
    textarea: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '5px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical'
    },
    select: {
      padding: '10px',
      border: '1px solid #d1d5db',
      borderRadius: '5px',
      fontSize: '14px'
    },
    alert: {
      padding: '12px',
      borderRadius: '5px',
      marginBottom: '15px'
    },
    alertError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b'
    },
    alertSuccess: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '25px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280'
    },
    deviceList: {
      maxHeight: '400px',
      overflow: 'auto'
    },
    deviceItem: {
      padding: '10px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 Panel MDM - ManageEngine</h1>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary }}
          onClick={() => { setShowForm(true); setEditingAccount(null); resetForm(); }}
        >
          + Nueva Cuenta
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      {success && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Stats */}
      {status && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{status.summary?.totalAccounts || 0}</div>
            <div style={styles.statLabel}>Cuentas Totales</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: '#10b981' }}>{status.summary?.connectedAccounts || 0}</div>
            <div style={styles.statLabel}>Conectadas</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: '#3b82f6' }}>{status.summary?.totalDevices || 0}</div>
            <div style={styles.statLabel}>Dispositivos</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: '#f59e0b' }}>{25 - (status.summary?.totalDevices || 0) % 25}</div>
            <div style={styles.statLabel}>Disponibles/Cuenta</div>
          </div>
        </div>
      )}

      {/* Tabla de cuentas */}
      <div style={styles.card}>
        <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>Cuentas MDM Registradas</h2>
        
        {accounts.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            No hay cuentas configuradas. Crea una nueva cuenta para comenzar.
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Client ID</th>
                <th style={styles.th}>Tienda</th>
                <th style={styles.th}>Dispositivos</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.id}>
                  <td style={styles.td}>
                    <strong>{account.nombre}</strong>
                    {account.email && <div style={{ fontSize: '12px', color: '#6b7280' }}>{account.email}</div>}
                  </td>
                  <td style={styles.td}>
                    <code style={{ fontSize: '11px', backgroundColor: '#f3f4f6', padding: '2px 5px', borderRadius: '3px' }}>
                      {account.clientId}
                    </code>
                  </td>
                  <td style={styles.td}>{account.tiendaNombre || '-'}</td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>{account.deviceCount}</span>/25
                  </td>
                  <td style={styles.td}>
                    {account.activo ? (
                      account.lastStatus === 'active' ? (
                        <span style={{ ...styles.badge, ...styles.badgeSuccess }}>✓ Conectada</span>
                      ) : account.lastStatus === 'error' ? (
                        <span style={{ ...styles.badge, ...styles.badgeError }}>✗ Error</span>
                      ) : (
                        <span style={{ ...styles.badge, ...styles.badgeWarning }}>? Sin verificar</span>
                      )
                    ) : (
                      <span style={{ ...styles.badge, ...styles.badgeError }}>Inactiva</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.btn, ...styles.btnSuccess, ...styles.btnSmall }}
                      onClick={() => handleTest(account.id)}
                      disabled={testingId === account.id}
                    >
                      {testingId === account.id ? '...' : '🔌 Probar'}
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnPrimary, ...styles.btnSmall }}
                      onClick={() => handleViewDevices(account.id, account.nombre)}
                    >
                      📱 Ver
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary, ...styles.btnSmall }}
                      onClick={() => handleEdit(account)}
                    >
                      ✏️
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnDanger, ...styles.btnSmall }}
                      onClick={() => handleDelete(account.id, account.nombre)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Instrucciones */}
      <div style={styles.card}>
        <h3 style={{ marginBottom: '10px' }}>📖 Cómo agregar una cuenta</h3>
        <ol style={{ paddingLeft: '20px', color: '#4b5563', lineHeight: '1.8' }}>
          <li>Ve a <a href="https://api-console.zoho.com" target="_blank" rel="noopener noreferrer">api-console.zoho.com</a> (logueado con la cuenta de ManageEngine)</li>
          <li>Selecciona "Self Client" → "Generate Code"</li>
          <li>En Scope escribe: <code style={{ backgroundColor: '#f3f4f6', padding: '2px 5px' }}>MDMOnDemand.MDMDeviceMgmt.CREATE,MDMOnDemand.MDMDeviceMgmt.UPDATE,MDMOnDemand.MDMDeviceMgmt.DELETE,MDMOnDemand.MDMDeviceMgmt.READ,MDMOnDemand.MDMInventory.READ,MDMOnDemand.MDMInventory.CREATE,MDMOnDemand.MDMInventory.UPDATE</code></li>
          <li>Genera el código y conviértelo en refresh_token con PowerShell</li>
          <li>Copia Client ID, Client Secret y Refresh Token aquí</li>
        </ol>
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta MDM'}</h2>
              <button style={styles.closeBtn} onClick={() => { setShowForm(false); setEditingAccount(null); }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre de la cuenta *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Cuenta Juchitepec"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email (opcional)</label>
                <input
                  style={styles.input}
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Client ID *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.clientId}
                  onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="1000.XXXX..."
                  required={!editingAccount}
                />
                {editingAccount && <small style={{ color: '#6b7280' }}>Dejar vacío para mantener el actual</small>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Client Secret *</label>
                <input
                  style={styles.input}
                  type="password"
                  value={formData.clientSecret}
                  onChange={e => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder="••••••••••"
                  required={!editingAccount}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Refresh Token *</label>
                <input
                  style={styles.input}
                  type="password"
                  value={formData.refreshToken}
                  onChange={e => setFormData({ ...formData, refreshToken: e.target.value })}
                  placeholder="1000.XXXX..."
                  required={!editingAccount}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Asignar a Tienda (opcional)</label>
                <select
                  style={styles.select}
                  value={formData.tiendaId}
                  onChange={e => setFormData({ ...formData, tiendaId: e.target.value })}
                >
                  <option value="">-- Sin asignar --</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas</label>
                <textarea
                  style={styles.textarea}
                  value={formData.notas}
                  onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{ ...styles.btn, ...styles.btnSecondary }}
                  onClick={() => { setShowForm(false); setEditingAccount(null); }}
                >
                  Cancelar
                </button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>
                  {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dispositivos */}
      {viewingDevices && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>📱 Dispositivos - {viewingDevices}</h2>
              <button style={styles.closeBtn} onClick={() => setViewingDevices(null)}>×</button>
            </div>

            <div style={styles.deviceList}>
              {devices.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando dispositivos...</p>
              ) : (
                devices.map(device => (
                  <div key={device.deviceId} style={styles.deviceItem}>
                    <div>
                      <strong>{device.deviceName}</strong>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {device.model} | IMEI: {Array.isArray(device.imei) ? device.imei[0] : device.imei}
                      </div>
                    </div>
                    <span style={{
                      ...styles.badge,
                      ...(device.isLostMode ? styles.badgeError : styles.badgeSuccess)
                    }}>
                      {device.isLostMode ? '🔒 Bloqueado' : '✓ Activo'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button
                style={{ ...styles.btn, ...styles.btnSecondary }}
                onClick={() => setViewingDevices(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MdmAdminPanel;
