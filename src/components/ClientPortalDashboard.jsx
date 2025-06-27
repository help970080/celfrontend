import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientPortalDashboard() {
    const [clientData, setClientData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Creamos una función de fetch específica para el portal del cliente
    const clientAuthFetch = useCallback(async (url, options = {}) => {
        const token = localStorage.getItem('clientToken'); // Usa el token del cliente
        if (!token) {
            toast.error('Sesión no válida. Por favor, inicia sesión de nuevo.');
            // Aquí podrías implementar una redirección al login
            return Promise.reject(new Error('No autenticado como cliente.'));
        }
        const headers = { ...options.headers, 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
             // Manejar deslogueo si el token es inválido
        }
        if (!response.ok) throw new Error('Error al obtener los datos.');
        return response;
    }, []);

    useEffect(() => {
        const fetchMyData = async () => {
            setLoading(true);
            try {
                const response = await clientAuthFetch(`${API_BASE_URL}/api/portal/my-data`);
                const data = await response.json();
                setClientData(data);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMyData();
    }, [clientAuthFetch]);

    if (loading) return <p>Cargando tu información...</p>;
    if (!clientData) return <p>No se pudo cargar tu información. Intenta iniciar sesión de nuevo.</p>;

    const totalBalanceDue = clientData.sales.reduce((acc, sale) => acc + sale.balanceDue, 0);

    return (
        <section className="client-statement-container">
            <h2>Bienvenido a tu Portal, {clientData.name}</h2>
            <p>Aquí puedes consultar tus compras y estado de cuenta.</p>
            <hr />
            <h3>Resumen de Cuenta</h3>
            <div className="summary-cards">
                <div className="summary-card">
                    <h3>Saldo Pendiente Total</h3>
                    <p>${totalBalanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="summary-card">
                    <h3>Compras Realizadas</h3>
                    <p>{clientData.sales.length}</p>
                </div>
            </div>
            <hr />
            <h3>Historial de Compras</h3>
            {clientData.sales.length === 0 ? <p>Aún no has realizado ninguna compra.</p> :
                clientData.sales.map(sale => (
                    <div key={sale.id} className="sale-movement-card">
                        <h4>Compra #{sale.id} - {dayjs(sale.saleDate).format('DD/MM/YYYY')}</h4>
                        <p><strong>Total de la Compra:</strong> ${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        <p><strong>Tipo:</strong> {sale.isCredit ? `Crédito | Saldo Actual: $${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'Contado'}</p>
                        <p><strong>Productos:</strong> {(sale.saleItems || []).map(item => item.product?.name).join(', ') || 'N/A'}</p>
                        {sale.payments && sale.payments.length > 0 && (
                            <div className="payments-detail">
                                <h5>Tus Pagos Realizados:</h5>
                                <ul>
                                    {sale.payments.map(p => (
                                        <li key={p.id}>{dayjs(p.paymentDate).format('DD/MM/YYYY')} - ${p.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))
            }
        </section>
    );
}

export default ClientPortalDashboard;