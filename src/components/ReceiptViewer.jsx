import React, { useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './thermal-print.css'; // <-- 1. ASEGÚRATE DE IMPORTAR TU ARCHIVO CSS

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

function ReceiptViewer({ sale, onClose }) {
    // El ref ahora apuntará al nuevo contenedor del ticket
    const receiptRef = useRef();

    // La información de tu negocio se mantiene igual
    const businessInfo = {
        name: "Celexpress Tu Tienda de Celulares",
        address: "Morelos Sn.col.Centro Juchitepec,EdoMex",
        phone: "56 66548 9522",
    };

    if (!sale) {
        // El manejo de error se mantiene igual
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
    
    // Las funciones para PDF y compartir se mantienen, solo les añadiremos la clase 'no-print' a los botones
    const handleGeneratePdf = async () => {
        if (!receiptRef.current) return toast.error("Error al capturar contenido del recibo.");
        toast.info("Generando PDF...");
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', [80, 297]); // Ancho de 80mm
            const imgWidth = 74; // Ancho de la imagen en el PDF (80mm - 3mm margen izq - 3mm margen der)
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 3, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 3, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save(`recibo_${sale.id}.pdf`);
            toast.success("Recibo PDF generado!");
        } catch (error) {
            console.error("Error al generar PDF:", error);
            toast.error("Error al generar el PDF.");
        }
    };

    const handleShareWhatsApp = () => {
        const clientPhone = sale.client?.phone;
        if (!clientPhone) return toast.error("El cliente no tiene un teléfono registrado.");
        const message = `¡Hola ${sale.client.name}! Aquí está tu recibo #${sale.id} de ${businessInfo.name}. Total: $${sale.totalAmount.toFixed(2)}. Saldo: $${sale.balanceDue.toFixed(2)}. ¡Gracias!`;
        window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };
    
    // La función de SMS se mantiene igual
    const handleShareSMS = () => {
        // ... tu lógica de SMS aquí ...
    };

    return (
        <div className="receipt-modal-overlay" onClick={onClose}>
            <div className="receipt-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-button no-print" onClick={onClose}>×</button> {/* <-- Se añade no-print */}
                
                {/* 2. ESTRUCTURA HTML ADAPTADA AL CSS TÉRMICO */}
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
                                {sale.saleItems?.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.quantity}</td>
                                        <td>{item.product.name}</td>
                                        <td className="col-price">${item.price.toFixed(2)}</td>
                                        <td className="col-total">${(item.quantity * item.price).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="receipt-totals">
                        <div>
                            <span>Total:</span>
                            <strong>${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        {sale.isCredit && (
                            <>
                                <div>
                                    <span>Enganche:</span>
                                    <span>${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div>
                                    <span>Saldo Pendiente:</span>
                                    <span>${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {sale.payments && sale.payments.length > 0 && (
                         <div className="receipt-payments">
                            <h4 style={{textAlign: 'center', margin: '5px 0'}}>Pagos Realizados</h4>
                             {sale.payments.map(payment => (
                                 <div key={payment.id} style={{fontSize: '9pt'}}>
                                     {dayjs(payment.paymentDate).tz(TIMEZONE).format('DD/MM/YY HH:mm')} - ${payment.amount.toLocaleString('es-MX')} ({payment.paymentMethod})
                                 </div>
                             ))}
                         </div>
                    )}

                    <div className="receipt-footer">
                        <p>¡Gracias por tu compra!</p>
                    </div>
                </div>

                <div className="receipt-actions">
                    {/* 3. AÑADIMOS EL NUEVO BOTÓN PARA IMPRESORA TÉRMICA */}
                    <button onClick={() => window.print()} className="no-print">Imprimir Ticket</button>
                    <button onClick={handleGeneratePdf} className="no-print">Descargar PDF</button>
                    <button onClick={handleShareWhatsApp} className="no-print">WhatsApp</button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptViewer;