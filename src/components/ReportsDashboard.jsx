// Archivo: src/components/ReportsDashboard.jsx (Versión Final con Carga Bajo Demanda)

import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
// ... (otras importaciones no cambian)

function ReportsDashboard({ authenticatedFetch }) {
    // --- ESTADOS PARA CADA SECCIÓN ---
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

    const [clientStatus, setClientStatus] = useState(null);
    const [loadingClientStatus, setLoadingClientStatus] = useState(true);

    const [pendingCredits, setPendingCredits] = useState(null); // Inicia como null para saber si ya se cargó
    const [loadingPendingCredits, setLoadingPendingCredits] = useState(false);

    // ... (El resto de los estados para otros reportes no cambian)

    // --- FUNCIONES DE FETCH SEPARADAS ---

    const fetchSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/reports/summary`);
            if (!res.ok) throw new Error('Error al cargar resumen');
            setSummary(await res.json());
        } catch (err) { console.error(err); } 
        finally { setLoadingSummary(false); }
    }, [authenticatedFetch]);

    const fetchClientStatusDashboard = useCallback(async () => {
        setLoadingClientStatus(true);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-status-dashboard`);
            if (!res.ok) throw new Error('Error al cargar estado de clientes');
            setClientStatus(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoadingClientStatus(false); }
    }, [authenticatedFetch]);

    const fetchPendingCredits = useCallback(async () => {
        setLoadingPendingCredits(true);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/reports/pending-credits`);
            if (!res.ok) throw new Error('Error al cargar créditos pendientes');
            setPendingCredits(await res.json());
        } catch (err) { console.error(err); }
        finally { setLoadingPendingCredits(false); }
    }, [authenticatedFetch]);

    // ... (El resto de las funciones de fetch para otros reportes no cambian)


    // --- EFECTO DE CARGA INICIAL (SOLO LO ESENCIAL) ---
    useEffect(() => {
        fetchSummary();
        fetchClientStatusDashboard();
        // Ya no se llaman todos los demás fetchers aquí
    }, [fetchSummary, fetchClientStatusDashboard]);


    if (loadingSummary || loadingClientStatus) {
        return <p>Cargando reportes...</p>;
    }

    return (
        <div className="reports-dashboard">
            <h2>Resumen Financiero</h2>
            {summary ? ( <div className="summary-cards">{/* ...jsx de las tarjetas de resumen... */}</div> ) : <p>No se pudo cargar el resumen.</p>}

            <h2 style={{ marginTop: '40px' }}>Estado de Clientes por Cobranza</h2>
            {clientStatus ? ( <div className="client-status-cards">{/* ...jsx de las tarjetas de estado... */}</div> ) : <p>No se pudo cargar el estado de clientes.</p>}

            {/* --- SECCIÓN DE CRÉDITOS PENDIENTES CON CARGA BAJO DEMANDA --- */}
            <h2 style={{ marginTop: '40px' }}>Créditos con Saldo Pendiente</h2>
            <div className="panel-actions" style={{marginBottom: '20px'}}>
                 <button onClick={fetchPendingCredits} disabled={loadingPendingCredits} className="action-button primary-button">
                    {loadingPendingCredits ? 'Cargando...' : 'Mostrar/Actualizar Créditos Pendientes'}
                </button>
            </div>
           
            {loadingPendingCredits && <p>Cargando créditos...</p>}
            
            {pendingCredits && (
                pendingCredits.length === 0 ? <p>No hay créditos pendientes de cobro.</p> : (
                    <table className="pending-credits-table">
                        {/* ... jsx de la tabla de créditos pendientes ... */}
                    </table>
                )
            )}

            {/* ... (El resto de las secciones de reportes seguirían un patrón similar con botones para generar) ... */}
        </div>
    );
}

export default ReportsDashboard;