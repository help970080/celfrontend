import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
// ... (tus imports de dayjs)

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientPayments({ authenticatedFetch, userRole }) { 
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [riskAnalysis, setRiskAnalysis] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);

    const fetchClientData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Se piden todos los datos en paralelo para mayor eficiencia
            const [clientRes, statementRes, riskRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}`),
                authenticatedFetch(`${API_BASE_URL}/api/reports/client-statement/${clientId}`),
                // --- INICIO DE LA CORRECCIÓN ---
                // Se ha corregido la URL para incluir "/reports/"
                authenticatedFetch(`${API_BASE_URL}/api/reports/client-risk/${clientId}`)
                // --- FIN DE LA CORRECCIÓN ---
            ]);

            if (!clientRes.ok) throw new Error('Error al cargar datos del cliente.');
            if (!statementRes.ok) throw new Error('Error al cargar estado de cuenta.');
            if (!riskRes.ok) throw new Error('Error al cargar análisis de riesgo.');
            
            setClient(await clientRes.json());
            const statementData = await statementRes.json();
            setSales(statementData.sales.filter(sale => sale.isCredit));
            setRiskAnalysis(await riskRes.json());

        } catch (err) {
            setError(err.message || "No se pudieron cargar los datos.");
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId, authenticatedFetch]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    // ... (El resto de tus funciones como handleOpenPaymentForm, etc., no necesitan cambios)

    return (
        <section className="client-payments-section">
            {/* ... (El resto del JSX para mostrar la información no necesita cambios) ... */}
        </section>
    );
}

export default ClientPayments;