import React, { useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

function ReceiptViewer({ sale, onClose }) {
    const receiptRef = useRef();

    const appName = "CelExpress Pro Powered by Leonardo Luna";
    const businessInfo = {
        name: "Celexpress Tu Tienda de Celulares",
        address: "Morelos Sn.col.Centro Juchitepec,EdoMex",
        phone: "56 66548 9522",
        email: "contacto@tuempresa.com"
    };

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

    const handleGeneratePdf = async () => {
        if (!receiptRef.current) {
            toast.error("No se pudo capturar el contenido del recibo.");
            return;
        }
        toast.info("Generando PDF del recibo...");
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`recibo_venta_${sale.id}.pdf`);
            toast.success("Recibo PDF generado con éxito!");
        } catch (error) {
            console.error("Error al generar PDF:", error);
            toast.error("Error al generar el recibo PDF.");
        }
    };

    const handleShareWhatsApp = () => {
        const clientName = sale.client ? sale.client.name : 'Estimado Cliente';
        const clientPhone = sale.client ? sale.client.phone : '';

        if (!clientPhone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }
        const message = `¡Hola ${clientName}! Aquí está tu recibo de venta #${sale.id} de ${appName}. Monto Total: $${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Saldo Pendiente: $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. ¡Gracias por tu compra!`;

        window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`, '_blank');
        toast.info("Se abrió WhatsApp con el mensaje. Envía el mensaje manualmente si es necesario.");
    };

    const handleShareSMS = () => {
        const clientPhone = sale.client ? sale.client.phone : '';
        if (!clientPhone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }
        const message = `Recibo venta #${sale.id} ${appName}. Total: $${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Saldo: $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;

        window.open(`sms:${clientPhone}?body=${encodeURIComponent(message)}`, '_blank');
        toast.info("Se abrió la aplicación de SMS. Envía el mensaje manualmente si es necesario.");
    };

    // --- FUNCIÓN PARA IMPRESIÓN TÉRMICA ---
    const handlePrintThermal = () => {
        toast.info("Preparando para imprimir en formato de ticket...");
        // El navegador usará los estilos de @media print de thermal-print.css
        window.print();
    };

    return (
        <div className="receipt-modal-overlay no-print"> {/* no-print para ocultar el overlay al imprimir */}
            <div className="receipt-modal-content">
                <button className="close-button" onClick={onClose}>×</button>
                <h3>Recibo de Venta #{sale.id}</h3>

                {/* --- CONTENEDOR DEL RECIBO QUE SE IMPRIMIRÁ --- */}
                <div ref={receiptRef} className="receipt-container"> {/* Clase para ser visible en la impresión */}
                    <div className="receipt-header">
                        <h2>{businessInfo.name}</h2>
                        <p>{businessInfo.address}</p>
                        <p>Tel: {businessInfo.phone}</p>
                        <hr />
                    </div>
                    <div className="receipt-details">
                        <p><strong>Fecha:</strong> {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}</p>
                        <p><strong>Venta ID:</strong> {sale.id}</p>
                        <p><strong>Cliente:</strong> {sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A'}</p>
                        <hr />
                        <p><strong>Producto(s):</strong></p>
                        <ul className="receipt-product-list">
                            {sale.saleItems && sale.saleItems.length > 0
                                ? sale.saleItems.map((item, index) => (
                                    <li key={item.id || index}>
                                        {item.product ? `${item.product.name} (x${item.quantity})` : `Producto ID ${item.productId} (x${item.quantity})`}
                                    </li>
                                ))
                                : <li>N/A</li>}
                        </ul>
                        <hr />
                        <p><strong>Monto Total:</strong> <h2>${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2></p>
                        {sale.isCredit ? (
                            <>
                                <p><strong>Tipo:</strong> Crédito</p>
                                <p><strong>Enganche:</strong> ${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p><strong>Saldo Pendiente:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p><strong>Pago Semanal:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            </>
                        ) : (
                            <p><strong>Tipo:</strong> Contado</p>
                        )}
                        <hr />
                        <p className="receipt-footer-text">¡Gracias por tu compra!</p>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button onClick={handleGeneratePdf}>Descargar PDF</button>
                    {/* --- BOTÓN AÑADIDO --- */}
                    <button onClick={handlePrintThermal}>Imprimir Ticket</button>
                    <button onClick={handleShareWhatsApp}>Compartir por WhatsApp</button>
                    <button onClick={handleShareSMS}>Enviar por SMS</button>
                </div>
            </div>
        </div>
    );
}
export default ReceiptViewer;