// Archivo: src/components/RemindersPanel.jsx (CORREGIDO CON BOTONES VISIBLES)

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import CollectionLogForm from './CollectionLogForm'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const isMobileDevice = () => {
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
    return navigator.userAgentData.mobile;
  }
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
};

const formatMXN = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '0.00';
  return num.toLocaleString('es-MX', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

const toE164 = (rawPhone) => {
    if (!rawPhone) return '';
    const cleaned = String(rawPhone).replace(/[^\d]/g, '');
    if (cleaned.startsWith('52')) return `+${cleaned}`;
    return `+52${cleaned}`;
};

function RemindersPanel({ authenticatedFetch }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedSaleToLog, setSelectedSaleToLog] = useState(null); 

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/reminders/overdue`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      setReminders(data);
    } catch (err) {
      console.error('Error al obtener recordatorios:', err);
      setError(err.message || 'No se pudieron cargar los recordatorios.');
      setReminders([]);
      toast.error('Error al cargar recordatorios.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const makeMessage = (row) => {
    const name = row.client?.name || 'Cliente';
    const balance = formatMXN(row.sale?.balanceDue);
    const weeklyPayment = formatMXN(row.sale?.weeklyPaymentAmount);
    const daysLate = row.daysLate || 0;
    const paymentFreq = row.sale?.paymentFrequency || 'semanal';

    let message = `¡Hola ${name}! Te escribimos de CelExpress Pro.\n\n`;

    switch (row.severity) {
      case 'ALTO':
        message += `⚠️ *URGENTE*: Tu crédito presenta ${daysLate} días de atraso y un saldo pendiente de $${balance}. Por favor, realiza tu pago a la brevedad para evitar acciones de cobranza.
• Monto de tu cuota (${paymentFreq}): $${weeklyPayment}
• ¡Regulariza tu cuenta hoy mismo!`;
        break;
      case 'BAJO':
        message += `Tu cuenta tiene un pequeño atraso (${daysLate} días).
• El monto de tu cuota (${paymentFreq}) es de $${weeklyPayment}.
• Tu saldo actual es $${balance}. ¡Agradecemos tu pronto pago!`;
        break;
      case 'POR_VENCER':
        message += `Recordatorio amistoso: Tu pago de crédito vence *pronto*.
• Cuota: $${weeklyPayment}
• Saldo pendiente: $${balance}
• ¡No olvides pagar a tiempo para mantener tu buen historial!`;
        break;
      default:
        message += `Tu saldo pendiente es $${balance}. Cuota sugerida: $${weeklyPayment}.`;
    }
    return message;
  };

  const handleSendMessage = (row) => {
    const phoneE164 = toE164(row.client?.phone);
    if (!phoneE164) {
      toast.error('Cliente sin número de teléfono válido.');
      return;
    }
    const message = makeMessage(row);

    const url = isMobileDevice()
      ? `https://wa.me/${encodeURIComponent(phoneE164)}?text=${encodeURIComponent(message)}`
      : `https://web.whatsapp.com/send?phone=${encodeURIComponent(phoneE164)}&text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    toast.info(`Abriendo WhatsApp para ${row.client?.name || 'cliente'}.`);
  };

  const handleOpenLogModal = (saleData) => {
    setSelectedSaleToLog(saleData);
    setShowLogModal(true);
  };
  
  const handleCloseLogModal = () => {
    setSelectedSaleToLog(null);
    setShowLogModal(false);
    fetchReminders();
  };
  
  const handleExportLog = async () => {
    try {
        toast.info('Generando archivo Excel con el registro de gestiones...');
        const response = await authenticatedFetch(`${API_BASE_URL}/api/collections/export-log`); 
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registro_gestiones_${dayjs().format('YYYYMMDD')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Archivo de gestiones exportado con éxito!');
    } catch (err) {
        console.error('Error al exportar gestiones a Excel:', err);
        toast.error(`Error al exportar: ${err.message || 'Error desconocido.'}`);
    }
  };

  const getGestionButtonStyle = (lastManagement) => {
      if (!lastManagement) {
          return { backgroundColor: '#007bff', color: 'white', border: 'none' };
      }
      if (lastManagement.result === 'PROMISE') { 
          return { backgroundColor: '#ffc107', color: 'black', border: 'none' };
      }
      return { backgroundColor: '#6c757d', color: 'white', border: 'none' }; 
  }

  const renderLastManagement = (lastManagement) => {
      if (!lastManagement) {
          return <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '0.85rem' }}>SIN GESTIÓN</span>;
      }
      const date = dayjs(lastManagement.date).format('DD/MM/YY');
      const result = lastManagement.result || 'N/A';

      const resultTextMap = {
          'PROMISE': 'Promesa 🤝',
          'PAID': 'Pagó ✓',
          'NO_ANSWER': 'No Contesta 📵',
          'WRONG_NUMBER': 'N° Mal',
          'REFUSAL': 'Rechazó 😡',
          'LOCATED': 'Ubicado',
          'CONTACT_SUCCESS': 'OK',
      };
      const displayResult = resultTextMap[result] || result;

      return (
          <div style={{ fontSize: '0.85rem' }} title={`Gestor: ${lastManagement.collector || 'N/A'}`}>
              <div style={{ marginBottom: '0.25rem' }}>{date}</div>
              <strong>{displayResult}</strong>
          </div>
      );
  };

  const renderRemindersTable = (list, severity) => {
    if (!list.length) {
      return <p>No hay clientes en esta categoría.</p>;
    }

    return (
      <div className="table-responsive">
        <table className="reminders-table client-table">
          <thead>
            <tr>
              <th style={{ minWidth: '180px' }}>Cliente</th>
              <th style={{ minWidth: '130px' }}>Teléfono</th>
              <th style={{ minWidth: '80px' }}>Venta ID</th>
              <th style={{ minWidth: '110px' }}>Cuota (Venc.)</th>
              <th style={{ minWidth: '130px' }}>Saldo Pendiente</th>
              <th style={{ minWidth: '90px' }}>Días Atraso</th>
              <th style={{ minWidth: '200px' }}>ÚLTIMA GESTIÓN</th>
              <th style={{ minWidth: '240px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.sale?.id || r.client?.id}>
                <td style={{ minWidth: '180px' }}>
                  <strong>{r.client?.name} {r.client?.lastName}</strong>
                </td>
                <td style={{ minWidth: '130px' }}>
                  {r.client?.phone ? (
                    <a 
                      href={`tel:${r.client.phone}`}
                      style={{
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      📞 {r.client.phone}
                    </a>
                  ) : 'N/A'}
                </td>
                <td style={{ minWidth: '80px' }}>
                  <strong style={{ color: 'var(--info)' }}>{r.sale?.id || 'N/A'}</strong>
                </td>
                <td style={{ minWidth: '110px' }}>${formatMXN(r.sale?.weeklyPaymentAmount)}</td> 
                <td style={{ minWidth: '130px', fontWeight: 'bold', color: 'var(--danger)' }}>
                  ${formatMXN(r.sale?.balanceDue)}
                </td>
                <td style={{ minWidth: '90px' }}>
                  <span style={{
                    background: r.daysLate > 30 ? '#fee2e2' : (r.daysLate > 15 ? '#fef3c7' : '#d1fae5'),
                    color: r.daysLate > 30 ? '#991b1b' : (r.daysLate > 15 ? '#92400e' : '#065f46'),
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {r.daysLate || 0}
                  </span>
                </td>
                
                <td style={{ minWidth: '200px' }}>
                  {renderLastManagement(r.lastManagement)}
                </td>
                
                <td style={{ minWidth: '240px' }}>
                  <div style={{ 
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'nowrap'
                  }}>
                    <button 
                      onClick={() => handleOpenLogModal(r)} 
                      style={{
                        ...getGestionButtonStyle(r.lastManagement),
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        transition: 'var(--transition)',
                        whiteSpace: 'nowrap',
                        flex: '1',
                        minWidth: '110px'
                      }}
                      title="Registrar nueva gestión de cobranza"
                    >
                      📋 Gestión
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(r)} 
                      style={{
                        backgroundColor: '#25D366',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        transition: 'var(--transition)',
                        whiteSpace: 'nowrap',
                        flex: '1',
                        minWidth: '110px'
                      }}
                      title="Enviar mensaje por WhatsApp"
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const highRisk = reminders.filter((r) => r.severity === 'ALTO');
  const lowRisk = reminders.filter((r) => r.severity === 'BAJO');
  const dueSoon = reminders.filter((r) => r.severity === 'POR_VENCER');

  if (loading) return <p>Cargando panel de recordatorios...</p>;
  if (error) return <p className="error-message">Error al cargar recordatorios: {error}</p>;

  return (
    <div className="reminders-panel">
      <h3>Panel de Recordatorios y Cobranza</h3>
      <p>Gestión automatizada de recordatorios vía WhatsApp. Haz clic para enviar el mensaje predefinido.</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="action-button export-button" 
          onClick={handleExportLog}
          style={{
            background: 'linear-gradient(135deg, var(--success), var(--success-dark))',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.95rem'
          }}
        >
          📊 Exportar Registro de Gestión (Excel)
        </button>
      </div>
      
      <hr />

      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ 
          color: 'var(--danger)', 
          padding: '1rem', 
          background: '#fee2e2', 
          borderRadius: 'var(--radius-sm)',
          borderLeft: '4px solid var(--danger)'
        }}>
          🔴 Riesgo ALTO (Pago Vencido, Mayor Saldo o Atraso) - {highRisk.length} clientes
        </h4>
        {renderRemindersTable(highRisk, 'ALTO')}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ 
          color: '#92400e', 
          padding: '1rem', 
          background: '#fef3c7', 
          borderRadius: 'var(--radius-sm)',
          borderLeft: '4px solid var(--warning)'
        }}>
          🟡 Riesgo BAJO (Atraso Menor) - {lowRisk.length} clientes
        </h4>
        {renderRemindersTable(lowRisk, 'BAJO')}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h4 style={{ 
          color: '#065f46', 
          padding: '1rem', 
          background: '#d1fae5', 
          borderRadius: 'var(--radius-sm)',
          borderLeft: '4px solid var(--success)'
        }}>
          🟢 Por Vencer (Recordatorio Amistoso) - {dueSoon.length} clientes
        </h4>
        {renderRemindersTable(dueSoon, 'POR_VENCER')}
      </div>
      
      {showLogModal && selectedSaleToLog && (
          <CollectionLogForm
              saleData={selectedSaleToLog}
              onClose={handleCloseLogModal}
              authenticatedFetch={authenticatedFetch}
          />
      )}
    </div>
  );
}

export default RemindersPanel;