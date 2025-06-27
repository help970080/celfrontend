import React, { useState, useEffect, useCallback } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es'; // Importar el locale en español
import { toast } from 'react-toastify';

dayjs.locale('es'); // Usar español para los meses
Chart.register(...registerables);

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function VisualDashboard({ authenticatedFetch }) {
    const [salesData, setSalesData] = useState(null);
    const [topProductsData, setTopProductsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [salesRes, topProductsRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/dashboard/sales-over-time`),
                authenticatedFetch(`${API_BASE_URL}/api/dashboard/top-products`)
            ]);

            if (!salesRes.ok || !topProductsRes.ok) throw new Error('Error al cargar datos del dashboard.');

            const salesJson = await salesRes.json();
            setSalesData({
                labels: salesJson.map(item => dayjs(item.month).format('MMMM YYYY')),
                datasets: [{
                    label: 'Ventas Totales por Mes',
                    data: salesJson.map(item => item.totalSales),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            });

            const topProductsJson = await topProductsRes.json();
            setTopProductsData({
                labels: topProductsJson.map(item => item.productName),
                datasets: [{
                    label: 'Unidades Vendidas',
                    data: topProductsJson.map(item => item.totalSold),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                }]
            });

        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <p>Cargando gráficas...</p>;

    return (
        <section className="reports-section">
            <h2>Dashboard Visual</h2>
            <p>Análisis visual de las métricas clave del negocio.</p>
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>Ventas Mensuales</h3>
                    {salesData ? <Line data={salesData} /> : <p>No hay suficientes datos para mostrar.</p>}
                </div>
                <div className="chart-container">
                    <h3>Top 5 Productos Más Vendidos (Unidades)</h3>
                    {topProductsData ? <Pie data={topProductsData} /> : <p>No hay suficientes datos para mostrar.</p>}
                </div>
            </div>
        </section>
    );
}

export default VisualDashboard;