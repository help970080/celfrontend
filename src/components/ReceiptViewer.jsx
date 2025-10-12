// Archivo: src/components/ReceiptViewer.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'America/Mexico_City';
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ReceiptViewer({
  saleId,
  onClose,
  authenticatedFetch,
  /** Opcional: si lo pasas, el mensaje/archivo se hará respecto a este pago, no al "último" */
  paymentId,
}) {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const receiptRef = useRef(null);

  const appName = 'CelExpress Pro Powered by Leonardo Luna';
  const businessInfo = {
    name: 'Celexpress Tu Tienda de Celulares',
    address: 'Morelos Sn.col.Centro Juchitepec,EdoMex',
    phone: '56 66548 9522',
    email: 'contacto@tuempresa.com',
  };

  const toE164 = (rawPhone) => {
    if (!rawPhone) return '';
    const cleaned = String(rawPhone).replace(/[^\d+]/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('52')) return `+${cleaned}`;
    return `+52${cleaned}`;
  };

  const fetchSaleData = useCallback(async () => {
    if (!saleId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/api/sales/${saleId}?_=${Date.now()}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      setSale(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el recibo.');
      toast.error('Error al cargar datos del recibo.');
    } finally {
      setLoading(false);
    }
  }, [saleId, authenticatedFetch]);

  useEffect(() => {
    fetchSaleData();
  }, [fetchSaleData]);

  const getPaymentToShare = (saleObj) => {
    const list = Array.isArray(saleObj?.payments) ? saleObj.payments : [];
    if (!list.length) return null;
    if (paymentId) return list.find((p) => p.id === paymentId) || null;
    return [...list].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  };

  // Genera PDF a 80mm de ancho con alto proporcional al contenido de receiptRef
  const generatePdfFromDom = async () => {
    const node = receiptRef.current;
    if (!node) throw new Error('No se encontró el contenedor del recibo.');

    const canvas = await html2canvas(node, {
      scale: Math.max(2, window.devicePixelRatio || 1),
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidthMM = 80;
    const pdfHeightMM = (canvas.height * pdfWidthMM) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidthMM, pdfHeightMM],
      putOnlyUsedFonts: true,
      compress: true,
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidthMM, pdfHeightMM, undefined, 'FAST');
    return pdf;
  };

  const handleGeneratePdf = async () => {
    try {
      toast.info('Generando PDF...');
      const pdf = await generatePdfFromDom();
      pdf.save(`recibo_${sale?.id || saleId}.pdf`);
      toast.success('Recibo PDF generado.');
    } catch (e) {
      console.error(e);
      toast.error('Error al generar PDF.');
    }
  };

  // WhatsApp: si hay pagos, comparte como "Recibo de abono"; si no, "Recibo de venta".
  // En móviles con Web Share API + archivos, adjunta el PDF; en escritorio, descarga + texto.
  const handleShareWhatsApp = async () => {
    if (!sale?.client?.phone) {
      return toast.error('Cliente sin teléfono registrado.');
    }
    const phoneE164 = toE164(sale.client.phone);
    const payment = getPaymentToShare(sale);

    const fmt = (n) =>
      Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const message = payment
      ? `¡Hola ${sale.client.name || 'cliente'}! Tu RECIBO DE ABONO #${payment.id} de ${appName}.
Fecha: ${dayjs(payment.paymentDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}
Monto del abono: $${fmt(payment.amount)}
Saldo pendiente: $${fmt(sale.balanceDue)}`
      : `¡Hola ${sale.client.name || 'cliente'}! Tu RECIBO DE VENTA #${sale?.id || saleId} de ${appName}.
Monto Total: $${fmt(sale?.totalAmount)}`;

    try {
      const pdf = await generatePdfFromDom();
      const blob = pdf.output('blob');
      const fileName = payment ? `recibo_abono_${payment.id}.pdf` : `recibo_venta_${sale?.id || saleId}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: payment ? `Recibo de abono #${payment.id}` : `Recibo de venta #${sale?.id || saleId}`,
          text: message,
          files: [file],
        });
        toast.success('Recibo listo para compartir.');
        return;
      }

      // Escritorio / sin Web Share: descargar y abrir WA con texto
      pdf.save(fileName);
      const url = phoneE164
        ? `https://wa.me/${encodeURIComponent(phoneE164)}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.info('PDF descargado. Abriendo WhatsApp con el mensaje.');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo preparar el recibo. Abriendo WhatsApp con texto.');
      const url = phoneE164
        ? `https://wa.me/${encodeURIComponent(phoneE164)}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrintThermal = () => window.print();

  const renderContent = () => {
    if (loading) return <p>Cargando recibo...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!sale) return <p>No se encontraron datos para este recibo.</p>;

    const saleDate = sale?.saleDate
      ? dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')
      : '';
    const clientName = sale?.client
      ? `${sale.client.name || ''} ${sale.client.lastName || ''}`.trim()
      : 'N/A';
    const items = Array.isArray(sale?.saleItems) ? sale.saleItems : [];
    const payments = Array.isArray(sale?.payments) ? sale.payments : [];

    return (
      <>
        <div ref={receiptRef} className="receipt-container">
          <div className="receipt-header">
            <h2>{businessInfo.name}</h2>
            <p>{businessInfo.address}</p>
            <p>Tel: {businessInfo.phone}</p>
            <hr />
          </div>

          <div className="receipt-details">
            <p><strong>Fecha:</strong> {saleDate}</p>
            <p><strong>Venta ID:</strong> {sale?.id}</p>
            <p><strong>Cliente:</strong> {clientName}</p>
            {(sale?.client?.address || sale?.client?.city) && (
              <p><strong>Dirección:</strong> {[sale.client.address, sale.client.city].filter(Boolean).join(', ')}</p>
            )}
            {sale?.client?.phone && <p><strong>Teléfono:</strong> {sale.client.phone}</p>}
            <hr />
          </div>

          <div className="receipt-products">
            <p><strong>Producto(s):</strong></p>
            <ul className="receipt-product-list">
              {items.map((item, index) => (
                <li key={item.id || index}>
                  {item.product
                    ? `${item.product.name} (x${item.quantity})`
                    : `ID ${item.productId} (x${item.quantity})`}
                </li>
              ))}
            </ul>
            <hr />
          </div>

          <div className="receipt-totals">
            <p><strong>Monto Total:</strong></p>
            <h2 style={{ margin: 0 }}>
              ${Number(sale?.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h2>
            {sale?.isCredit ? (
              <>
                <p><strong>Tipo:</strong> Crédito</p>
                <p><strong>Enganche:</strong> ${Number(sale?.downPayment || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                <p><strong>Saldo Pendiente:</strong> ${Number(sale?.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                {sale?.weeklyPaymentAmount ? (
                  <p><strong>Pago Semanal:</strong> ${Number(sale?.weeklyPaymentAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                ) : null}
              </>
            ) : (
              <p><strong>Tipo:</strong> Contado</p>
            )}
            <hr />
          </div>

          {payments.length > 0 && (
            <div className="payments-detail">
              <h5>Pagos Realizados:</h5>
              <ul>
                {payments.map((p) => (
                  <li key={p.id}>
                    {dayjs(p.paymentDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')} — $
                    {Number(p.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    {p.paymentMethod ? ` (${p.paymentMethod})` : ''}
                  </li>
                ))}
              </ul>
              <hr />
            </div>
          )}

          <p className="receipt-footer-text" style={{ textAlign: 'center' }}>
            ¡Gracias por tu compra!
          </p>
        </div>

        <div
          className="receipt-actions no-print"
          style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}
        >
          <button onClick={handleGeneratePdf}>Descargar PDF</button>
          <button onClick={handlePrintThermal}>Imprimir Ticket</button>
          <button onClick={handleShareWhatsApp}>Compartir WhatsApp</button>
        </div>
      </>
    );
  };

  return ReactDOM.createPortal(
    <div className="receipt-modal-overlay">
      <div className="receipt-modal-content">
        <button className="close-button no-print" onClick={onClose}>
          &times;
        </button>
        <h3>Recibo de Venta #{saleId}</h3>
        {renderContent()}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}

export default ReceiptViewer;
