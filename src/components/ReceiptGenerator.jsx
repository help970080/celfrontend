import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment-timezone'; 
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ReceiptGenerator({ sale, onClose }) {
    const receiptRef = useRef(); 
    const appName = "CelExpress Pro Powered by Leonardo Luna"; 
    const businessInfo = {
        name: "Celexpress Tu Tienda de Celulares", 
        address: "Morelos Sn. Col. Centro, Juchitepec.EdoMex", 
        phone: "56 6548 9522", 
        email: "contacto@tuempresa.com" 
    };

    if (!sale) {
        return <div className="receipt-container">No se seleccionó ninguna venta para generar recibo.</div>;
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
        const clientPhone = sale.client ? sale.client.phone : '';
        if (!clientPhone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }
        const message = `¡Hola ${sale.client.name}! Tu recibo de venta #${sale.id} de ${appName} está listo. Puedes descargarlo o solicitarlo. Monto: $${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`, '_blank');
        toast.info("Se abrió WhatsApp con el mensaje. Envía el recibo PDF manualmente.");
    };

    const handleShareSMS = () => {
        const clientPhone = sale.client ? sale.client.phone : '';
        if (!clientPhone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }
        const message = `Recibo de venta #${sale.id} de ${appName}. Monto: $${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Saldo: $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
        window.open(`sms:${clientPhone}?body=${encodeURIComponent(message)}`, '_blank');
        toast.info("Se abrió la aplicación de SMS. Envía el mensaje manualmente.");
    };

    return (
        <div className="receipt-modal-overlay">
            <div className="receipt-modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>
                <h3>Recibo de Venta #{sale.id}</h3>

                <div ref={receiptRef} className="receipt-body">
                    <div className="receipt-header">
                        <h2>{businessInfo.name}</h2>
                        <p>{businessInfo.address}</p>
                        <p>Tel: {businessInfo.phone} | Email: {businessInfo.email}</p>
                        <hr />
                    </div>
                    <div className="receipt-details">
                        <p><strong>Fecha:</strong> {moment(sale.saleDate).tz("America/Mexico_City").format('DD/MM/YYYY HH:mm')}</p>
                        <p><strong>Venta ID:</strong> {sale.id}</p>
                        <p><strong>Atendido por:</strong> Administrador</p>
                        <hr />
                        <p><strong>Producto:</strong> {sale.product ? sale.product.name : 'N/A'}</p>
                        <p><strong>Descripción:</strong> {sale.product ? sale.product.description : 'N/A'}</p>
                        <p><strong>Precio Producto:</strong> ${sale.product ? sale.product.price.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : 'N/A'}</p>
                        <hr />
                        <p><strong>Monto Total de Venta:</strong> <h2>${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h2></p>
                        {sale.isCredit ? (
                            <>
                                <p><strong>Tipo de Venta:</strong> Crédito</p>
                                <p><strong>Enganche:</strong> ${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p><strong>Saldo Pendiente:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                <p><strong>Pago Semanal:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({sale.numberOfPayments} pagos)</p>
                                <p><strong>Tasa Interés Anual:</strong> {sale.interestRate * 100}%</p>
                                {sale.payments && sale.payments.length > 0 && (
                                    <>
                                        <h4>Pagos Realizados:</h4>
                                        <ul>
                                            {sale.payments.map(payment => (
                                                <li key={payment.id}>
                                                    {moment(payment.paymentDate).tz("America/Mexico_City").format('DD/MM/YYYY')} - ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({payment.paymentMethod})
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </>
                        ) : (
                            <p><strong>Tipo de Venta:</strong> Contado</p>
                        )}
                        <hr />
                        <p className="receipt-footer-text">¡Gracias por tu compra!</p>
                        <p className="receipt-footer-text">Ponte en contacto para cualquier duda.</p>
                    </div>
                </div>

                <div className="receipt-actions">
                    <button onClick={handleGeneratePdf}>Descargar Recibo (PDF)</button>
                    <button onClick={handleShareWhatsApp}>Enviar por WhatsApp</button>
                    <button onClick={handleShareSMS}>Enviar por SMS</button>
                </div>
            </div>
        </div>
    );
}

export default ReceiptGenerator;