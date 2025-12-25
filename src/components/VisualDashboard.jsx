import React, { useState, useEffect, useCallback } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { toast } from 'react-toastify';

dayjs.locale('es');
Chart.register(...registerables);

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function VisualDashboard({ authenticatedFetch }) {
    const [salesData, setSalesData] = useState(null);
    const [topProductsData, setTopProductsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [salesRes, topProductsRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/dashboard/sales-over-time`),
                authenticatedFetch(`${API_BASE_URL}/api/dashboard/top-products`)
            ]);

            if (!salesRes.ok || !topProductsRes.ok) {
                throw new Error('Error al cargar datos del dashboard.');
            }

            const salesJson = await salesRes.json();
            
            // ⭐ CORRECCIÓN: Usar 'date' en lugar de 'month'
            if (salesJson && salesJson.length > 0) {
                setSalesData({
                    labels: salesJson.map(item => dayjs(item.date).format('DD MMM YYYY')),
                    datasets: [{
                        label: 'Ventas Totales por Día',
                        data: salesJson.map(item => parseFloat(item.totalSales) || 0),
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    }]
                });
            } else {
                setSalesData(null);
            }

            const topProductsJson = await topProductsRes.json();
            
            if (topProductsJson && topProductsJson.length > 0) {
                setTopProductsData({
                    labels: topProductsJson.map(item => item.productName),
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: topProductsJson.map(item => parseInt(item.totalSold) || 0),
                        backgroundColor: [
                            '#FF6384', 
                            '#36A2EB', 
                            '#FFCE56', 
                            '#4BC0C0', 
                            '#9966FF'
                        ],
                    }]
                });
            } else {
                setTopProductsData(null);
            }

        } catch (err) {
            console.error('Error al cargar dashboard:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <section className="reports-section">
                <h2>Dashboard Visual</h2>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner"></div>
                    <p>Cargando gráficas...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="reports-section">
                <h2>Dashboard Visual</h2>
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>❌ {error}</p>
                    <button onClick={fetchData} style={{ marginTop: '20px' }}>
                        Reintentar
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="reports-section">
            <h2>Dashboard Visual</h2>
            <p>Análisis visual de las métricas clave del negocio.</p>
            
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button onClick={fetchData} className="refresh-button">
                    🔄 Actualizar Datos
                </button>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <h3>Ventas por Día</h3>
                    {salesData ? (
                        <Line 
                            data={salesData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top'
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                return `Ventas: $${context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: function(value) {
                                                return '$' + value.toLocaleString('es-MX');
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            <p>📊 No hay ventas registradas aún.</p>
                            <p style={{ fontSize: '0.9em' }}>Las gráficas aparecerán cuando haya datos disponibles.</p>
                        </div>
                    )}
                </div>

                <div className="chart-container">
                    <h3>Top 5 Productos Más Vendidos</h3>
                    {topProductsData ? (
                        <Pie 
                            data={topProductsData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'bottom'
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function(context) {
                                                return `${context.label}: ${context.parsed} unidades`;
                                            }
                                        }
                                    }
                                }
                            }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            <p>📦 No hay productos vendidos aún.</p>
                            <p style={{ fontSize: '0.9em' }}>Las gráficas aparecerán cuando haya datos disponibles.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default VisualDashboard;