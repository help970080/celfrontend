// src/components/RemindersPanel.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { toast } from 'react-toastify';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'America/Mexico_City';
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

export default function RemindersPanel({ authenticatedFetch }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE_URL}/api/reminders/overdue?_=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron obtener los recordatorios.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔥 Agrupar todos los clientes con saldo
  const todos = useMemo(() => (Array.isArray(rows) ? rows.filter(r => r?.sale?.balanceDue > 0) : []), [rows]);

  const counts = useMemo(() => {
    const c = { ALTO: 0, BAJO: 0 };
    todos.forEach(r => {
      if (r.severity === 'ALTO') c.ALTO++;
      else c.BAJO++;
    });
    return c;
  }, [todos]);

  const totalConSaldo = todos.length;

  function makeMessage(row) {
    const nombre = `${row.client?.name || ''} ${row.client?.lastName || ''}`.trim();
    const saldo = row.sale?.balanceDue || 0;
    const semanal = row.sale?.weeklyPaymentAmount || 0;
    const fecha = row.sale?.nextDueDate ? dayjs(row.sale.nextDueDate).tz(TIMEZONE).format('DD/MM/YYYY') : 'Próxima fecha';

    return `¡Hola ${nombre}!
Te recordamos tu pago pendiente:
• Monto semanal: $${semanal.toFixed(2)}
• Saldo total: $${saldo.toFixed(2)}
• Fecha límite: ${fecha}
Deposita en OXXO a la cuenta 4152 3137 4220 8650.

Gracias por tu confianza con CELEXPRESS.`;
  }

  function enviarWhatsApp(row) {
    const phone = row.client?.phone ? row.client.phone.replace(/[^\d]/g, '') : '';
    const text = encodeURIComponent(makeMessage(row));
    const url = phone ? `https://wa.me/52${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Recordatorios de pago</h3>
        <small>Total clientes con saldo: <strong>{totalConSaldo}</strong></small>
        <div>
          <span style={{ marginRight: 15 }}>ALTO: {counts.ALTO}</span>
          <span>BAJO: {counts.BAJO}</span>
        </div>
        <button onClick={fetchData}>Actualizar</button>
      </div>

      <div className="card-content">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Saldo</th>
                <th>Riesgo</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {todos.map((r, i) => (
                <tr key={i}>
                  <td>{`${r.client?.name || ''} ${r.client?.lastName || ''}`}</td>
                  <td>{r.client?.phone || ''}</td>
                  <td>${(r.sale?.balanceDue || 0).toFixed(2)}</td>
                  <td>{r.severity}</td>
                  <td><button onClick={() => enviarWhatsApp(r)}>WhatsApp</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
