import React, { useState, useEffect, useCallback, useRef } from 'react'; 
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs'; // <-- ¡CAMBIADO!
import utc from 'dayjs/plugin/utc'; // <-- ¡AGREGADO!
import timezone from 'dayjs/plugin/timezone'; // <-- ¡AGREGADO!
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas'; 
import jsPDF from 'jspdf'; 

dayjs.extend(utc); // <-- ¡AGREGADO!
dayjs.extend(timezone); // <-- ¡AGREGADO!

const TIMEZONE = "America/Mexico_City"; // <-- ¡AGREGADO!

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientStatementViewer({ authenticatedFetch }) {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [sales, setSales] = useState([]);
    const [totalClientBalanceDue, setTotalClientBalanceDue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const statementRef = useRef(); 

    const appName = "CelExpress Pro, Powered by Leonardo Luna";
    const businessInfo = {
        name: "Celexpress Tu Tienda de Celulares",
        address: "Morelos Sn.Col.Centro, Juchitepec,EdoMex",
        phone: "56 6548 9522",
        email: "contacto@tuempresa.com"
    };

    const fetchClientStatement = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-statement/${clientId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setClient(data.client);
            setSales(data.sales);
            setTotalClientBalanceDue(data.totalClientBalanceDue);
        } catch (err) {
            console.error("Error al obtener estado de cuenta:", err);
            setError(err.message || "No se pudo cargar el estado de cuenta.");
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch, clientId]);

    useEffect(() => {
        fetchClientStatement();
    }, [fetchClientStatement]);

    const handleGeneratePdf = async () => {
        if (!statementRef.current) {
            toast.error("No se pudo capturar el contenido del estado de cuenta.");
            return;
        }
        toast.info("Generando PDF del estado de cuenta...");
        try {
            const canvas = await html2canvas(statementRef.current, { scale: 2 }); 
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

            pdf.save(`estado_cuenta_${client.name.replace(/\s/g, '_')}_${client.lastName.replace(/\s/g, '_')}.pdf`);
            toast.success("Estado de cuenta PDF generado con éxito!");
        } catch (error) {
            console.error("Error al generar PDF del estado de cuenta:", error);
            toast.error("Error al generar el estado de cuenta PDF.");
        }
    };

    const handleShareWhatsApp = () => {
        const clientPhone = client ? client.phone : '';
        if (!clientPhone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }
        const message = `¡Hola ${client.name}! Aquí tienes tu estado de cuenta de ${appName}. Saldo pendiente total: $${totalClientBalanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
        window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`, '_blank');
        toast.info("Se abrió WhatsApp con el mensaje. Adapta el mensaje si es necesario.");
    };

    const handleShareSMS = () => {
        const clientPhone = client ? client.phone : '';
        if (!clientPhone) {
            toast.error("El cliente no tiene un número de teléfono registrado.");
            return;
        }
        const message = `Estado de cuenta ${appName}. Saldo pendiente: $${totalClientBalanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`;
        window.open(`sms:${clientPhone}?body=${encodeURIComponent(message)}`, '_blank');
        toast.info("Se abrió la aplicación de SMS. Adapta el mensaje si es necesario.");
    };

    if (loading) {
        return <p>Cargando estado de cuenta...</p>;
    }

    if (error) {
        return <p className="error-message">Error al cargar estado de cuenta: {error}</p>;
    }

    if (!client) {
        return <p>Cliente no encontrado o ID inválido.</p>;
    }

    return (
        <div className="client-statement-container">
            <h2>Estado de Cuenta Detallado de {client.name} {client.lastName}</h2>
            <div className="statement-actions">
                <button onClick={handleGeneratePdf}>Descargar Estado de Cuenta (PDF)</button> 
                <button onClick={handleShareWhatsApp}>Compartir por WhatsApp</button>
                <button onClick={handleShareSMS}>Compartir por SMS</button>
            </div>

            <div ref={statementRef} className="statement-body"> 
                <div className="statement-header">
                    <h2>{businessInfo.name} - Estado de Cuenta</h2>
                    <p>{businessInfo.address}</p>
                    <p>Tel: {businessInfo.phone} | Email: {businessInfo.email}</p>
                    <p>Fecha de Emisión: {dayjs().tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}</p> {/* <-- ¡CAMBIADO! */}
                    <hr />
                </div>
                <div className="statement-client-info">
                    <h3>Datos del Cliente</h3>
                    <p><strong>Nombre:</strong> {client.name} {client.lastName}</p>
                    <p><strong>Teléfono:</strong> {client.phone}</p>
                    <p><strong>Email:</strong> {client.email || 'N/A'}</p>
                    <p><strong>Dirección:</strong> {`${client.address}, ${client.city || 'N/A'}, ${client.state || 'N/A'}, ${client.zipCode || 'N/A'}`}</p>
                    <p><strong>ID Identificación:</strong> {client.identificationId || 'N/A'}</p>
                    <hr />
                </div>

                <h3>Resumen de Créditos Activos</h3>
                <div className="summary-cards">
                    <div className="summary-card">
                        <h3>Saldo Pendiente Total</h3>
                        <p>${totalClientBalanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Total Ventas (Este Cliente)</h3>
                        <p>{sales.length}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Total Pagos (Este Cliente)</h3>
                        <p>{sales.reduce((acc, sale) => acc + (sale.payments ? sale.payments.length : 0), 0)}</p>
                    </div>
                </div>
                <hr />

                <h3>Detalle de Ventas y Movimientos</h3>
                {sales.length === 0 ? (
                    <p>Este cliente no tiene ventas registradas.</p>
                ) : (
                    sales.map(sale => (
                        <div key={sale.id} className="sale-movement-card">
                            <h4>Venta #{sale.id} - {dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY')}</h4> {/* <-- ¡CAMBIADO! */}
                            <p><strong>Monto Venta:</strong> ${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Tipo:</strong> {sale.isCredit ? 'Crédito' : 'Contado'}</p>
                            <p><strong>Producto(s):</strong></p>
                            <ul className="statement-product-list"> 
                                {sale.saleItems && sale.saleItems.length > 0
                                    ? sale.saleItems.map((item, index) => (
                                        <li key={item.id || index}>
                                            {item.product ? `${item.product.name} (x${item.quantity})` : `Producto ID ${item.productId} (x${item.quantity})`}
                                        </li>
                                    ))
                                    : <li>N/A</li>}
                            </ul>
                            {sale.isCredit && (
                                <>
                                    <p><strong>Enganche:</strong> ${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Saldo Venta Actual:</strong> ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Pago Semanal:</strong> ${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({sale.numberOfPayments} pagos)</p>
                                    <p><strong>Tasa Interés:</strong> {sale.interestRate * 100}%</p>
                                </>
                            )}
                            {sale.payments && sale.payments.length > 0 && (
                                <div className="payments-detail">
                                    <h5>Historial de Pagos de esta Venta:</h5>
                                    <ul>
                                        {sale.payments.map(payment => (
                                            <li key={payment.id}>
                                                {dayjs(payment.paymentDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')} - ${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ({payment.paymentMethod}) - {payment.notes || ''} {/* <-- ¡CAMBIADO! */}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <hr />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ClientStatementViewer;