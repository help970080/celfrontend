// Archivo: src/components/ReportsDashboard.jsx (Versión con API_BASE_URL corregido)

import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

// --- LÍNEA FALTANTE QUE CAUSA EL ERROR, AHORA AÑADIDA ---
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ReportsDashboard({ authenticatedFetch }) {
    // Estados para cada sección para carga individual
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);
    const [errorSummary, setErrorSummary] = useState(null);

    const [clientStatus, setClientStatus] = useState(null);
    const [loadingClientStatus, setLoadingClientStatus] = useState(true);
    const [errorClientStatus, setErrorClientStatus] = useState(null);
    
    const [pendingCredits, setPendingCredits] = useState(null);
    const [loadingPendingCredits, setLoadingPendingCredits] = useState(false);
    const [errorPendingCredits, setErrorPendingCredits] = useState(null);

    // (Puedes añadir estados de carga y error para los otros reportes si lo deseas)

    // --- Funciones de Fetch ---
    const fetchSummary = useCallback(async () => {
        setLoadingSummary(true);
        setErrorSummary(null);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/reports/summary`);
            if (!res.ok) throw new Error('No se pudo cargar el resumen.');
            setSummary(await res.json());
        } catch (err) { 
            setErrorSummary(err.message);
        } finally { 
            setLoadingSummary(false); 
        }
    }, [authenticatedFetch]);

    const fetchClientStatusDashboard = useCallback(async () => {
        setLoadingClientStatus(true);
        setErrorClientStatus(null);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-status-dashboard`);
            if (!res.ok) throw new Error('No se pudo cargar el estado de clientes.');
            setClientStatus(await res.json());
        } catch (err) { 
            setErrorClientStatus(err.message);
        } finally { 
            setLoadingClientStatus(false); 
        }
    }, [authenticatedFetch]);

    const fetchPendingCredits = useCallback(async () => {
        setLoadingPendingCredits(true);
        setErrorPendingCredits(null);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/reports/pending-credits`);
            if (!res.ok) throw new Error('No se pudieron cargar los créditos pendientes.');
            setPendingCredits(await res.json());
        } catch (err) { 
            setErrorPendingCredits(err.message);
        } finally { 
            setLoadingPendingCredits(false); 
        }
    }, [authenticatedFetch]);
    
    // --- Carga inicial solo de los datos principales ---
    useEffect(() => {
        fetchSummary();
        fetchClientStatusDashboard();
    }, [fetchSummary, fetchClientStatusDashboard]);


    if (loadingSummary || loadingClientStatus) {
        return <p>Cargando reportes...</p>;
    }

    return (
        <div className="reports-dashboard">
            <h2>Resumen Financiero</h2>
            {errorSummary ? <p className="error-message">{errorSummary}</p> : summary ? (
                <div className="summary-cards">
                    {/* ... JSX de tarjetas de resumen ... */}
                </div>
            ) : <p>No hay datos de resumen.</p>}

            <h2 style={{ marginTop: '40px' }}>Estado de Clientes por Cobranza</h2>
            {errorClientStatus ? <p className="error-message">{errorClientStatus}</p> : clientStatus ? (
                <div className="client-status-cards">
                    {/* ... JSX de tarjetas de estado de clientes ... */}
                </div>
            ) : <p>No hay datos de estado de clientes.</p>}

            <h2 style={{ marginTop: '40px' }}>Créditos con Saldo Pendiente</h2>
            <div className="panel-actions" style={{marginBottom: '20px'}}>
                 <button onClick={fetchPendingCredits} disabled={loadingPendingCredits} className="action-button primary-button">
                    {loadingPendingCredits ? 'Cargando...' : 'Mostrar/Actualizar Créditos Pendientes'}
                </button>
            </div>
           
            {loadingPendingCredits && <p>Cargando créditos...</p>}
            {errorPendingCredits && <p className="error-message">{errorPendingCredits}</p>}
            
            {pendingCredits && (
                pendingCredits.length === 0 ? <p>No hay créditos pendientes de cobro.</p> : (
                    <table className="pending-credits-table">
                        <thead>
                            <tr>
                                <th>ID Venta</th>
                                <th>Cliente</th>
                                <th>Producto(s)</th>
                                <th>Saldo Actual</th>
                                <th>Pagos Realizados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingCredits.map(sale => {
                                const paymentsMade = sale.paymentsCount ? parseInt(sale.paymentsCount, 10) : 0;
                                return (
                                    <tr key={sale.id}>
                                        <td>{sale.id}</td>
                                        <td>{sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A'}</td>
                                        <td>{(sale.saleItems || []).map(item => item.product?.name).join(', ')}</td>
                                        <td className="highlight-balance">${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td>{paymentsMade}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )
            )}

            {/* Aquí irían las otras secciones de reportes (Cierre de caja, etc.) con sus propios botones de "Generar" */}
        </div>
    );
}

export default ReportsDashboard;