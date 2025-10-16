// Archivo: src/components/RemindersPanel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const isMobileDevice = () => {
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
    return navigator.userAgentData.mobile;
  }
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
};

// Función segura para formatear números como moneda (CRÍTICO para evitar TypeError)
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
    // Limpia y asegura el código de país +52 (México) si falta
    const cleaned = String(rawPhone).replace(/[^\d]/g, '');
    if (cleaned.startsWith('52')) return `+${cleaned}`;
    return `+52${cleaned}`;
};


function RemindersPanel({ authenticatedFetch }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Esta ruta ya debe devolver datos seguros (cero en lugar de null)
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

  const renderRemindersTable = (list, severity) => {
    if (!list.length) {
      return <p>No hay clientes en esta categoría.</p>;
    }

    return (
      <table className="reminders-table client-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Venta ID</th>
            <th>Cuota ({severity === 'POR_VENCER' ? 'Sug.' : 'Venc.'})</th>
            <th>Saldo Pendiente</th>
            <th>Días Atraso</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.sale?.id || r.client?.id}>
              <td>
                {r.client?.name} {r.client?.lastName}
              </td>
              <td>{r.client?.phone}</td>
              <td>{r.sale?.id || 'N/A'}</td>
              {/* Uso seguro de formatMXN */}
              <td>${formatMXN(r.sale?.weeklyPaymentAmount)}</td> 
              <td>${formatMXN(r.sale?.balanceDue)}</td>
              <td>{r.daysLate || 0}</td>
              <td>
                <button 
                    onClick={() => handleSendMessage(r)} 
                    className={`btn btn-sm btn-${severity === 'ALTO' ? 'danger' : (severity === 'BAJO' ? 'warning' : 'success')}`}
                    style={{backgroundColor: '#25D366', color: 'white', border: 'none'}}
                >
                    Enviar WA
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      
      <hr />

      <div style={{ marginBottom: '20px' }}>
        <h4>🔴 Riesgo ALTO (Pago Vencido, Mayor Saldo o Atraso) - {highRisk.length} clientes</h4>
        {renderRemindersTable(highRisk, 'ALTO')}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>🟡 Riesgo BAJO (Atraso Menor) - {lowRisk.length} clientes</h4>
        {renderRemindersTable(lowRisk, 'BAJO')}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>🟢 Por Vencer (Recordatorio Amistoso) - {dueSoon.length} clientes</h4>
        {renderRemindersTable(dueSoon, 'POR_VENCER')}
      </div>
    </div>
  );
}

export default RemindersPanel;