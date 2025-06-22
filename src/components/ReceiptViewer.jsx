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

    const businessInfo = {
        name: "Celexpress Tu Tienda de Celulares",
        address: "Morelos Sn.col.Centro Juchitepec,EdoMex",
        phone: "56 66548 9522",
    };

    let dueDate = null;
    if (sale && sale.isCredit && sale.numberOfPayments > 0) {
        dueDate = dayjs(sale.saleDate).tz(TIMEZONE).add(sale.numberOfPayments, 'weeks').format('DD/MM/YYYY');
    }

    if (!sale) {
        return (
            <div className="receipt-modal-overlay">
                <div className="receipt-modal-content">
                    <button className="close-button" onClick={onClose}>×</button>
                    <h3>Error en Recibo</h3>
                    <p>No se seleccionó ninguna venta válida para generar el recibo.</p>
                </div>
            </div>
        );
    }
    
    const handleGeneratePdf = async () => { /* ... tu lógica de PDF ... */ };
    const handleShareWhatsApp = () => { /* ... tu lógica de WhatsApp ... */ };
    
    return (
        <div className="receipt-modal-overlay" onClick={onClose}>
            <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button no-print" onClick={onClose}>×</button>
                
                <div ref={receiptRef} className="receipt-container">
                    <div className="receipt-header">
                        <h1>{businessInfo.name}</h1>
                        <p>{businessInfo.address}</p>
                        <p>Tel: {businessInfo.phone}</p>
                        <hr style={{borderTop: '1px dashed black'}} />
                        <p>Fecha: {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}</p>
                        <p>Recibo No: {sale.id}</p>
                        <p>Cliente: {sale.client ? sale.client.name : 'Venta de Mostrador'}</p>
                    </div>

                    <div className="receipt-items">
                        <table style={{width: '100%'}}>
                            <thead>
                                <tr>
                                    <th className="col-qty">Cant.</th>
                                    <th>Producto</th>
                                    <th className="col-price">Precio</th>
                                    <th className="col-total">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.saleItems?.map(item => {
                                    // --- INICIO DE LA CORRECCIÓN ---
                                    // Hacemos el cálculo más robusto y legible aquí
                                    const itemPrice = item.price || 0;
                                    const lineTotal = (item.quantity || 1) * itemPrice;

                                    return (
                                        <tr key={item.id}>
                                            <td>{item.quantity || 1}</td>
                                            <td>{item.product?.name || 'Producto no disponible'}</td>
                                            <td className="col-price">
                                                {itemPrice > 0 ? `$${itemPrice.toFixed(2)}` : ''}
                                            </td>
                                            <td className="col-total">
                                                {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : ''}
                                            </td>
                                        </tr>
                                    );
                                    // --- FIN DE LA CORRECCIÓN ---
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="receipt-totals">
                        <div>
                            <span>Total:</span>
                            <strong>${(sale.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        {sale.isCredit && (
                            <>
                                <div>
                                    <span>Enganche:</span>
                                    <span>${(sale.downPayment || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div>
                                    <span>Saldo Pendiente:</span>
                                    <span>${(sale.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {sale.payments && sale.payments.length > 0 && (
                         <div className="receipt-payments">
                            <h4 style={{textAlign: 'center', margin: '5px 0'}}>Pagos Realizados</h4>
                             {sale.payments.map(payment => (
                                 <div key={payment.id} style={{fontSize: '9pt'}}>
                                     {dayjs(payment.paymentDate).tz(TIMEZONE).format('DD/MM/YY HH:mm')} - ${(payment.amount || 0).toLocaleString('es-MX')} ({payment.paymentMethod})
                                 </div>
                             ))}
                         </div>
                    )}

                    {sale.isCredit && (
                        <div className="receipt-credit-warning" style={{ marginTop: '15px', border: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '8pt' }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                Esta es una Venta a crédito. Usted No puede Vender o Empeñar este artículo hasta que esté completamente liquidado.
                            </p>
                        </div>
                    )}

                    {sale.isCredit && (
                        <div className="receipt-promissory-note" style={{ marginTop: '15px', fontSize: '9pt' }}>
                            <p style={{ textAlign: 'justify', margin: '5px 0' }}>
                                <strong>DEBO Y PAGARÉ</strong> incondicionalmente la cantidad de <strong>{`$${(sale.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`}</strong> a DANIEL GUERRERO BARRANCO en la ciudad de JUCHITEPEC DE MARIANO RIVAPALACIOS, ESTADO DE MÉXICO, el día <strong>{dueDate || '[Fecha no calculada]'}</strong>.
                            </p>
                            <p style={{ textAlign: 'justify', margin: '5px 0' }}>
                                De no pagar en la fecha estipulada, este pagaré generará un interés moratorio del 6% mensual sobre el saldo insoluto hasta su total liquidación.
                            </p>
                            <div className="signature-line" style={{ marginTop: '30px', textAlign: 'center' }}>
                                <p style={{ margin: '0' }}>_________________________</p>
                                <p style={{ margin: '2px 0' }}>{sale.client?.name || 'Nombre del Cliente'}</p>
                            </div>
                        </div>
                    )}

                    <div className="receipt-footer">
                        <p>¡Gracias por su compra!</p>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button onClick={() => window.print()} className="no-print">Imprimir Ticket</button>
                    <button onClick={handleGeneratePdf} className="no-print">Descargar PDF</button>
                    <button onClick={handleShareWhatsApp} className="no-print">WhatsApp</button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptViewer;