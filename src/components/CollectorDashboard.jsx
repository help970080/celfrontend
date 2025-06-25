import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function CollectorDashboard({ authenticatedFetch }) {
    const [assignedSales, setAssignedSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignedSales = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Usamos la nueva ruta segura que creamos en el backend
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/my-assigned`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar las ventas asignadas.');
            }
            const data = await response.json();
            setAssignedSales(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchAssignedSales();
    }, [fetchAssignedSales]);

    if (loading) return <section className="collector-dashboard"><h2>Mis Cobranzas Asignadas</h2><p>Cargando...</p></section>;
    if (error) return <section className="collector-dashboard"><h2>Mis Cobranzas Asignadas</h2><p className="error-message">{error}</p></section>;

    return (
        <section className="collector-dashboard">
            <h2>Mis Cobranzas Asignadas</h2>
            <p>Aquí se muestran las ventas a crédito activas que debes gestionar.</p>
            
            {assignedSales.length === 0 ? (
                <p>¡Felicidades! No tienes ventas pendientes asignadas por el momento.</p>
            ) : (
                <div className="collection-list">
                    {assignedSales.map(sale => (
                        <div key={sale.id} className="collection-card">
                            <h4>Cliente: {sale.client?.name} {sale.client?.lastName}</h4>
                            <p><strong>Teléfono:</strong> {sale.client?.phone}</p>
                            <p><strong>Dirección:</strong> {sale.client?.address}, {sale.client?.city}</p>
                            <p><strong>Venta ID:</strong> {sale.id} - {dayjs(sale.saleDate).format('DD/MM/YYYY')}</p>
                            <p><strong>Productos:</strong> {(sale.saleItems || []).map(item => item.product?.name).join(', ')}</p>
                            <div className="collection-financials">
                                <p>Saldo Pendiente: <strong>${(sale.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                                <p>Pago Semanal: <strong>${(sale.weeklyPaymentAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></p>
                            </div>
                            <div className="collection-actions">
                                {/* Estos botones enlazarán a las herramientas que ya creamos */}
                                <Link to={`/admin/clients/payments/${sale.clientId}`} className="button-as-link">Registrar Pago / Ver Historial</Link>
                                <Link to={`/admin/clients/statement/${sale.clientId}`} className="button-as-link secondary">Estado de Cuenta</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default CollectorDashboard;