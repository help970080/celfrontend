import React, { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

// Este es el componente que pasaremos a App.jsx para que tenga el token
const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return Promise.reject(new Error('No hay token de autenticación.'));
    }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la petición');
    }
    return response;
};


function ReceiptViewer({ saleId, onClose }) {
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const receiptRef = useRef();

    const appName = "CelExpress Pro Powered by Leonardo Luna";
    const businessInfo = {
        name: "Celexpress Tu Tienda de Celulares",
        address: "Morelos Sn.col.Centro Juchitepec,EdoMex",
        phone: "56 66548 9522",
        email: "contacto@tuempresa.com"
    };
    
    const fetchSaleData = useCallback(async () => {
        if (!saleId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await authenticatedFetch(`${import.meta.env.VITE_APP_API_BASE_URL}/api/sales/${saleId}`);
            const data = await response.json();
            setSale(data);
        } catch (err) {
            setError(err.message || 'No se pudo cargar el recibo.');
            toast.error('Error al cargar datos del recibo.');
        } finally {
            setLoading(false);
        }
    }, [saleId]);

    useEffect(() => {
        fetchSaleData();
    }, [fetchSaleData]);


    const handleGeneratePdf = async () => {
        if (!receiptRef.current) return toast.error("Error al capturar contenido del recibo.");
        toast.info("Generando PDF...");
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps= pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`recibo_venta_${sale.id}.pdf`);
            toast.success("Recibo PDF generado!");
        } catch (error) {
            toast.error("Error al generar PDF.");
        }
    };
    
    // Funciones de compartir (WhatsApp, SMS) y de imprimir ticket no cambian...
    const handleShareWhatsApp = () => {
        if (!sale?.client?.phone) return toast.error("Cliente sin teléfono registrado.");
        const message = `¡Hola ${sale.client.name}! Tu recibo de venta #${sale.id} de ${appName}. Monto Total: $${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Saldo Pendiente: $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
        window.open(`https://wa.me/${sale.client.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShareSMS = () => {
         if (!sale?.client?.phone) return toast.error("Cliente sin teléfono registrado.");
        const message = `Recibo venta #${sale.id} ${appName}. Total: $${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Saldo: $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
        window.open(`sms:${sale.client.phone}?body=${encodeURIComponent(message)}`, '_blank');
    };

    const handlePrintThermal = () => {
        toast.info("Preparando para imprimir...");
        window.print();
    };

    const renderContent = () => {
        if (loading) return <p>Cargando recibo...</p>;
        if (error) return <p className="error-message">{error}</p>;
        if (!sale) return <p>No se encontraron datos para este recibo.</p>;

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
                        <p><strong>Fecha:</strong> {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}</p>
                        <p><strong>Venta ID:</strong> {sale.id}</p>
                        <p><strong>Cliente:</strong> {sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A'}</p>
                        <hr />
                        <p><strong>Producto(s):</strong></p>
                        <ul className="receipt-product-list">
                            {sale.saleItems?.map((item, index) => (
                                <li key={item.id || index}>
                                    {item.product ? `${item.product.name} (x${item.quantity})` : `ID ${item.productId} (x${item.quantity})`}
                                </li>
                            ))}
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
                        ) : <p><strong>Tipo:</strong> Contado</p>}
                        <hr />
                        {sale.payments && sale.payments.length > 0 && (
                            <div className="payments-detail">
                                <h5>Pagos Realizados:</h5>
                                <ul>
                                    {sale.payments.map(p => (
                                        <li key={p.id}>{dayjs(p.paymentDate).tz(TIMEZONE).format('DD/MM/YYYY')} - ${p.amount.toLocaleString('es-MX')} ({p.paymentMethod})</li>
                                    ))}
                                </ul>
                                <hr />
                            </div>
                        )}
                        <p className="receipt-footer-text">¡Gracias por tu compra!</p>
                    </div>
                </div>
                <div className="receipt-actions no-print">
                    <button onClick={handleGeneratePdf}>Descargar PDF</button>
                    <button onClick={handlePrintThermal}>Imprimir Ticket</button>
                    <button onClick={handleShareWhatsApp}>Compartir WhatsApp</button>
                    <button onClick={handleShareSMS}>Compartir SMS</button>
                </div>
            </>
        );
    };

    return (
        <div className="receipt-modal-overlay no-print">
            <div className="receipt-modal-content">
                <button className="close-button" onClick={onClose}>&times;</button>
                <h3>Recibo de Venta #{saleId}</h3>
                {renderContent()}
            </div>
        </div>
    );
}
export default ReceiptViewer;