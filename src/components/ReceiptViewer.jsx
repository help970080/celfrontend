// src/components/ReceiptViewer.jsx - VERSIÓN FINAL CON LEYENDAS
import React, { useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './thermal-print.css';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

function ReceiptViewer({ sale, onClose }) {
    const receiptRef = useRef();
    const businessInfo = { /* ... tu info de negocio ... */ };

    let dueDate = null;
    if (sale && sale.isCredit && sale.numberOfPayments > 0) {
        dueDate = dayjs(sale.saleDate).tz(TIMEZONE).add(sale.numberOfPayments, 'weeks').format('DD/MM/YYYY');
    }

    if (!sale) return null; // No renderiza nada si no hay venta
    
    // ... tus funciones handleGeneratePdf y handleShareWhatsApp ...

    return (
        <div className="receipt-modal-overlay" onClick={onClose}>
            <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button no-print" onClick={onClose}>×</button>
                <div ref={receiptRef} className="receipt-container">
                    <div className="receipt-header">{/* ... */}</div>
                    <div className="receipt-items">{/* ... */}</div>
                    <div className="receipt-totals">{/* ... */}</div>
                    {sale.payments && sale.payments.length > 0 && <div className="receipt-payments">{/* ... */}</div>}

                    {/* LEYENDA Y PAGARÉ (SOLO PARA CRÉDITO) */}
                    {sale.isCredit && (
                        <>
                            <div className="receipt-credit-warning" style={{ marginTop: '15px', border: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '8pt' }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>
                                    Esta es una Venta a crédito. Usted No puede Vender o Empeñar este artículo hasta que esté completamente liquidado.
                                </p>
                            </div>
                            <div className="receipt-promissory-note" style={{ marginTop: '15px', fontSize: '9pt' }}>
                                <p style={{ textAlign: 'justify', margin: '5px 0' }}>
                                    <strong>DEBO Y PAGARÉ</strong> incondicionalmente la cantidad de <strong>{`$${(sale.totalAmount || 0).toLocaleString('es-MX')} MXN`}</strong> a DANIEL GUERRERO BARRANCO... el día <strong>{dueDate || '[Fecha no calculada]'}</strong>.
                                </p>
                                <p style={{ textAlign: 'justify', margin: '5px 0' }}>
                                    De no pagar en la fecha estipulada, este pagaré generará un interés moratorio del 6% mensual sobre el saldo insoluto hasta su total liquidación.
                                </p>
                                <div className="signature-line" style={{ marginTop: '30px', textAlign: 'center' }}>
                                    <p style={{ margin: '0' }}>_________________________</p>
                                    <p style={{ margin: '2px 0' }}>{sale.client?.name || 'Nombre del Cliente'}</p>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="receipt-footer">{/* ... */}</div>
                </div>
                <div className="receipt-actions">{/* ... */}</div>
            </div>
        </div>
    );
}
export default ReceiptViewer;