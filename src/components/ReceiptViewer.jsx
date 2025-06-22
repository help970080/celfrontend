// src/components/ReceiptViewer.jsx - VERSIÓN FINAL CON CONTROL DE VISIBILIDAD
import React, { useRef } from 'react';
import dayjs from 'dayjs';
// ... (tus otras importaciones se mantienen igual)
import './thermal-print.css';

// ... (configuración de dayjs)

// El componente ahora recibe una nueva prop: showLegalInfo
function ReceiptViewer({ sale, onClose, showLegalInfo = false }) {
    const receiptRef = useRef();
    const businessInfo = { /* ... tu info de negocio ... */ };
    let dueDate = null;
    if (sale && sale.isCredit && sale.numberOfPayments > 0) {
        dueDate = dayjs(sale.saleDate).add(sale.numberOfPayments, 'weeks').format('DD/MM/YYYY');
    }

    if (!sale) return null;

    // ... (tus funciones handleGeneratePdf, handleShareWhatsApp)

    return (
        <div className="receipt-modal-overlay" onClick={onClose}>
            <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button no-print" onClick={onClose}>×</button>
                <div ref={receiptRef} className="receipt-container">
                    {/* El contenido del recibo (header, items, totales) se mantiene igual */}
                    <div className="receipt-header">{/* ... */}</div>
                    <div className="receipt-items">{/* ... */}</div>
                    <div className="receipt-totals">{/* ... */}</div>
                    {sale.payments && sale.payments.length > 0 && (<div className="receipt-payments">{/* ... */}</div>)}

                    {/* --- INICIO DE LA CORRECCIÓN CLAVE --- */}
                    {/* El pagaré y las leyendas ahora dependen de DOS condiciones: */}
                    {/* 1. Que la venta sea a crédito (sale.isCredit) */}
                    {/* 2. Que se haya pedido mostrar la información legal (showLegalInfo) */}
                    {sale.isCredit && showLegalInfo && (
                        <div className="credit-legal-section">
                            <div className="receipt-credit-warning">
                                <p><strong>Esta es una Venta a crédito. Usted No puede Vender o Empeñar este artículo hasta que esté completamente liquidado.</strong></p>
                            </div>
                            <div className="receipt-promissory-note">
                                <p><strong>DEBO Y PAGARÉ</strong> incondicionalmente...</p>
                                <div className="signature-line">
                                    <p>_________________________</p>
                                    <p>{sale.client?.name || 'Nombre del Cliente'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* --- FIN DE LA CORRECCIÓN CLAVE --- */}

                    <div className="receipt-footer"><p>¡Gracias por su compra!</p></div>
                </div>
                <div className="receipt-actions">{/* ... */}</div>
            </div>
        </div>
    );
}
export default ReceiptViewer;