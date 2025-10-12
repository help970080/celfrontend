// Archivo: src/components/RemindersPanel.jsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'react-toastify';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'America/Mexico_City';
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

const isMobileDevice = () => {
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
    return navigator.userAgentData.mobile;
  }
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
};

const toE164 = (rawPhone) => {
  if (!rawPhone) return '';
  const cleaned = String(rawPhone).replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('52')) return `+${cleaned}`;
  return `+52${cleaned}`;
};

const MXN = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RemindersPanel({ authenticatedFetch }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALTO'); // 'ALTO' | 'BAJO'

  const business = useMemo(() => ({
    appName: 'CelExpress Pro', // sin "Powered by ..."
    depositLegend: 'Deposita en OXXO a la cuenta 4152 3137 4220 8650',
  }), []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/reminders/overdue?_=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron obtener los recordatorios.');
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter(r => r.severity === tab);

  const makeMessage = (row) => {
    const name = [row.client?.name, row.client?.lastName].filter(Boolean).join(' ') || 'cliente';
    const ventaId = row.sale?.id;
    const saldo = MXN.format(row.sale?.balanceDue || 0);
    const semanal = MXN.format(row.sale?.weeklyPaymentAmount || 0);
    const fechaLimite = row.sale?.nextDueDate
      ? dayjs(row.sale.nextDueDate).tz(TIMEZONE).format('DD/MM/YYYY')
      : 'próxima fecha';
    const dias = row.daysLate || 0;

    if (row.severity === 'ALTO') {
      return `Hola ${name}.
Seguimos sin recibir tu pago de la venta #${ventaId}.
• Días de atraso: ${dias}
• Monto a pagar: $${semanal}
• Saldo pendiente: $${saldo}

Para evitar cargos o acciones de cobro, realiza tu depósito hoy:
${business.depositLegend}

Si ya pagaste, ignora este mensaje y compártenos tu comprobante. Gracias.`;
    }

    // BAJO
    return `¡Hola ${name}!
Te recordamos tu pago de la venta #${ventaId}.
• Monto a pagar: $${semanal}
• Saldo pendiente: $${saldo}
• Fecha límite: ${fechaLimite}

${business.depositLegend}

Cualquier duda, responde a este mensaje. Gracias 🙌`;
  };

  const openWhatsApp = (row) => {
    const phone = toE164(row.client?.phone || '');
    const text = makeMessage(row);
    let url;

    if (isMobileDevice()) {
      // móvil
      url = phone
        ? `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    } else {
      // desktop → forzar WhatsApp Web
      url = phone
        ? `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`
        : `https://web.whatsapp.com/`;
    }
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) toast.info('Permite ventanas emergentes para continuar con WhatsApp Web.');
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0 }}>Recordatorios de pago</h3>
          <small>Segmentados por grado de atraso (ALTO / BAJO)</small>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={tab === 'ALTO' ? 'btn btn-primary' : 'btn'} onClick={() => setTab('ALTO')}>ALTO</button>
          <button className={tab === 'BAJO' ? 'btn btn-primary' : 'btn'} onClick={() => setTab('BAJO')}>BAJO</button>
          <button className="btn" onClick={fetchData}>Actualizar</button>
        </div>
      </div>

      <div className="card-content">
        {loading ? (
          <p>Cargando…</p>
        ) : filtered.length === 0 ? (
          <p>No hay clientes con atraso {tab.toLowerCase()} en este momento.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Venta</th>
                  <th>Días atraso</th>
                  <th>Semanal</th>
                  <th>Saldo</th>
                  <th>Próx. fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={`${r.client.id}-${r.sale.id}`}>
                    <td>
                      {[r.client.name, r.client.lastName].filter(Boolean).join(' ')}<br />
                      <small>{r.client.phone || 'Sin teléfono'}</small>
                    </td>
                    <td>#{r.sale.id}</td>
                    <td>{r.daysLate}</td>
                    <td>${MXN.format(r.sale.weeklyPaymentAmount || 0)}</td>
                    <td>${MXN.format(r.sale.balanceDue || 0)}</td>
                    <td>{r.sale.nextDueDate ? dayjs(r.sale.nextDueDate).tz(TIMEZONE).format('DD/MM/YYYY') : '-'}</td>
                    <td>
                      <button className="btn btn-success" onClick={() => openWhatsApp(r)}>
                        WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: 8 }}>
              <small>Consejo: evita mandar muchos mensajes seguidos; deja unos segundos entre envíos para no parecer spam.</small>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
