import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// import DynamicChart from './charts/DynamicChart'; // <-- ELIMINADA LA IMPORTACIÓN

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ReportsDashboard({ authenticatedFetch }) {
    const [summary, setSummary] = useState(null);
    const [pendingCredits, setPendingCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [startDate, setStartDate] = useState(dayjs().tz(TIMEZONE).format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(dayjs().tz(TIMEZONE).format('YYYY-MM-DD'));
    const [dailySales, setDailySales] = useState([]);
    const [dailyPayments, setDailyPayments] = useState([]);
    const [loadingDaily, setLoadingDaily] = useState(false);
    const [errorDaily, setErrorDaily] = useState(null);

    const [accumulatedSales, setAccumulatedSales] = useState([]);
    const [accumulatedPayments, setAccumulatedPayments] = useState([]);
    const [accumulatedPeriod, setAccumulatedPeriod] = useState('day');
    const [loadingAccumulated, setLoadingAccumulated] = useState(false);
    const [errorAccumulated, setErrorAccumulated] = useState(null);
    const [accStartDate, setAccStartDate] = useState('');
    const [accEndDate, setAccEndDate] = useState('');

    const [clientStatusDashboard, setClientStatusDashboard] = useState(null);
    const [loadingClientStatus, setLoadingClientStatus] = useState(false);
    const [errorClientStatus, setErrorClientStatus] = useState(null);


    const fetchSummaryAndPendingCredits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const summaryResponse = await authenticatedFetch(`${API_BASE_URL}/api/reports/summary`);
            if (!summaryResponse.ok) {
                const errorData = await summaryResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${summaryResponse.status}`);
            }
            const summaryData = await summaryResponse.json();
            setSummary(summaryData);

            const pendingCreditsResponse = await authenticatedFetch(`${API_BASE_URL}/api/reports/pending-credits`);
            if (!pendingCreditsResponse.ok) {
                const errorData = await pendingCreditsResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${pendingCreditsResponse.status}`);
            }
            const pendingCreditsData = await pendingCreditsResponse.json();
            setPendingCredits(pendingCreditsData);

        } catch (err) {
            console.error("Error al cargar datos de resumen/pendientes:", err);
            setError(err.message || "No se pudieron cargar el resumen o los créditos pendientes.");
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    const fetchDailyReports = useCallback(async () => {
        setLoadingDaily(true);
        setErrorDaily(null);
        try {
            const salesUrl = `${API_BASE_URL}/api/reports/sales-by-date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            const paymentsUrl = `${API_BASE_URL}/api/reports/payments-by-date-range?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

            const salesResponse = await authenticatedFetch(salesUrl);
            if (!salesResponse.ok) {
                const errorData = await salesResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${salesResponse.status}`);
            }
            const salesData = await salesResponse.json();
            setDailySales(salesData);

            const paymentsResponse = await authenticatedFetch(paymentsUrl);
            if (!paymentsResponse.ok) {
                const errorData = await paymentsResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const paymentsData = await paymentsResponse.json();
            setDailyPayments(paymentsData);

        } catch (err) {
            console.error("Error al cargar reportes diarios:", err);
            setErrorDaily(err.message || "No se pudieron cargar los reportes diarios.");
        } finally {
            setLoadingDaily(false);
        }
    }, [authenticatedFetch, startDate, endDate]);

    const fetchAccumulatedReports = useCallback(async () => {
        setLoadingAccumulated(true);
        setErrorAccumulated(null);
        try {
            let salesUrl = `${API_BASE_URL}/api/reports/sales-accumulated?period=${encodeURIComponent(accumulatedPeriod)}`;
            let paymentsUrl = `${API_BASE_URL}/api/reports/payments-accumulated?period=${encodeURIComponent(accumulatedPeriod)}`;

            if (accStartDate && accEndDate) {
                salesUrl += `&startDate=${encodeURIComponent(accStartDate)}&endDate=${encodeURIComponent(accEndDate)}`;
                paymentsUrl += `&startDate=${encodeURIComponent(accStartDate)}&endDate=${encodeURIComponent(accEndDate)}`;
            }

            const salesAccResponse = await authenticatedFetch(salesUrl);
            if (!salesAccResponse.ok) {
                const errorData = await salesAccResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${salesAccResponse.status}`);
            }
            const salesAccData = await salesAccResponse.json();
            setAccumulatedSales(salesAccData);

            const paymentsAccResponse = await authenticatedFetch(paymentsUrl);
            if (!paymentsAccResponse.ok) {
                const errorData = await paymentsAccResponse.json();
                throw new Error(errorData.message || `Error HTTP: ${paymentsAccResponse.status}`);
            }
            const paymentsAccData = await paymentsAccResponse.json();
            setAccumulatedPayments(paymentsAccData);

        } catch (err) {
            console.error("Error al cargar reportes acumulados:", err);
            setErrorAccumulated(err.message || "No se pudieron cargar los reportes acumulados.");
        } finally {
            setLoadingAccumulated(false);
        }
    }, [authenticatedFetch, accumulatedPeriod, accStartDate, accEndDate]);


    const fetchClientStatusDashboard = useCallback(async () => {
        setLoadingClientStatus(true);
        setErrorClientStatus(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/reports/client-status-dashboard`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setClientStatusDashboard(data);
        } catch (err) {
            console.error("Error al cargar dashboard de clientes:", err);
            setErrorClientStatus(err.message || "No se pudo cargar el dashboard de clientes.");
        } finally {
            setLoadingClientStatus(false);
        }
    }, [authenticatedFetch]);


    useEffect(() => {
        fetchSummaryAndPendingCredits();
        fetchDailyReports();
        fetchClientStatusDashboard();
        fetchAccumulatedReports();
    }, [fetchSummaryAndPendingCredits, fetchDailyReports, fetchClientStatusDashboard, fetchAccumulatedReports]);

    const handleRangeDateChange = (e, type) => {
        if (type === 'start') {
            setStartDate(e.target.value);
        } else {
            setEndDate(e.target.value);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchDailyReports();
        }
    }, [startDate, endDate, fetchDailyReports]);


    const handleAccumulatedPeriodChange = (e) => {
        setAccumulatedPeriod(e.target.value);
    };
    const handleAccDateRangeChange = (e, type) => {
        if (type === 'start') {
            setAccStartDate(e.target.value);
        } else {
            setAccEndDate(e.target.value);
        }
    };
    useEffect(() => {
        fetchAccumulatedReports();
    }, [accumulatedPeriod, accStartDate, accEndDate, fetchAccumulatedReports]);


    if (loading) {
        return <p>Cargando reportes...</p>;
    }

    if (error) {
        return <p className="error-message">Error al cargar reportes: {error}</p>;
    }

    // --- ELIMINADAS LAS DEFINICIONES DE DATOS Y OPCIONES PARA GRÁFICOS ---
    // clientStatusChartData, clientStatusChartOptions, accumulatedSalesChartData,
    // accumulatedSalesChartOptions, accumulatedPaymentsChartData, accumulatedPaymentsChartOptions
    // Ya no se necesitan aquí al no renderizar los gráficos.

    return (
        <div className="reports-dashboard">
            <h2>Resumen Financiero</h2>
            {summary ? (
                <div className="summary-cards">
                    <div className="summary-card">
                        <h3>Saldo Pendiente Total</h3>
                        <p>${summary.totalBalanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Créditos Activos</h3>
                        <p>{summary.activeCreditSalesCount}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Pagos Recibidos Total</h3>
                        <p>${summary.totalPaymentsReceived.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Total Clientes</h3>
                        <p>{summary.totalClientsCount}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Total Ventas</h3>
                        <p>{summary.totalSalesCount}</p>
                    </div>
                </div>
            ) : (
                <p>No hay datos de resumen disponibles.</p>
            )}

            <h2 style={{ marginTop: '40px' }}>Estado de Clientes por Cobranza</h2>
            {loadingClientStatus ? (
                <p>Cargando estado de clientes...</p>
            ) : errorClientStatus ? (
                <p className="error-message">Error: {errorClientStatus}</p>
            ) : clientStatusDashboard ? (
                <>
                    {/* ELIMINADA LA RENDERIZACIÓN DEL GRÁFICO DE CLIENTES */}
                    <div className="client-status-cards">
                        <div className="status-card current">
                            <h3>Al Corriente</h3>
                            <p>{clientStatusDashboard.alCorriente}</p>
                        </div>
                        <div className="status-card due-soon">
                            <h3>Por Vencer</h3>
                            <p>{clientStatusDashboard.porVencer}</p>
                        </div>
                        <div className="status-card overdue">
                            <h3>Vencidos</h3>
                            <p>{clientStatusDashboard.vencidos}</p>
                        </div>
                        <div className="status-card paid-off">
                            <h3>Pagados</h3>
                            <p>{clientStatusDashboard.pagados}</p>
                        </div>
                         <div className="status-card active-total">
                            <h3>Total Créditos Activos</h3>
                            <p>{clientStatusDashboard.totalActivos}</p>
                        </div>
                    </div>
                </>
            ) : (
                <p>No hay datos de estado de clientes disponibles.</p>
            )}


            <h2 style={{ marginTop: '40px' }}>Reporte de Transacciones por Rango de Fechas</h2>
            <div className="daily-report-controls">
                <label htmlFor="startDate">Desde:</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => handleRangeDateChange(e, 'start')}
                    max={dayjs().tz(TIMEZONE).format('YYYY-MM-DD')}
                />
                <label htmlFor="endDate">Hasta:</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => handleRangeDateChange(e, 'end')}
                    max={dayjs().tz(TIMEZONE).format('YYYY-MM-DD')}
                />
                <button onClick={fetchDailyReports} className="refresh-button">Actualizar Rango</button>
            </div>

            {loadingDaily ? (
                <p>Cargando transacciones...</p>
            ) : errorDaily ? (
                <p className="error-message">Error: {errorDaily}</p>
            ) : (
                <div className="daily-reports-content">
                    <h3>Ventas del Rango {startDate} al {endDate}</h3>
                    {dailySales.length === 0 ? (
                        <p>No hay ventas registradas para este rango de fechas.</p>
                    ) : (
                        <table className="daily-table">
                            <thead>
                                <tr>
                                    <th>ID Venta</th>
                                    <th>Cliente</th>
                                    <th>Producto(s)</th>
                                    <th>Monto</th>
                                    <th>Tipo</th>
                                    <th>Fecha Venta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailySales.map(sale => {
                                    const clientName = sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A';
                                    const soldProductsDisplay = sale.saleItems && sale.saleItems.length > 0
                                        ? sale.saleItems.map(item =>
                                            item.product ? `${item.product.name} (x${item.quantity})` : `Producto ID ${item.productId}`
                                          ).join(', ')
                                        : 'N/A';
                                    return (
                                        <tr key={sale.id}>
                                            <td>{sale.id}</td>
                                            <td>{clientName}</td>
                                            <td>{soldProductsDisplay}</td>
                                            <td>${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td>{sale.isCredit ? 'Crédito' : 'Contado'}</td>
                                            <td>{dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    <h3 style={{ marginTop: '30px' }}>Pagos del Rango {startDate} al {endDate} (Cierre de Caja)</h3>
                    {dailyPayments.length === 0 ? (
                        <p>No hay pagos registrados para esta fecha.</p>
                    ) : (
                        <table className="daily-table">
                            <thead>
                                <tr>
                                    <th>ID Pago</th>
                                    <th>ID Venta</th>
                                    <th>Cliente</th>
                                    <th>Monto Pagado</th>
                                    <th>Método</th>
                                    <th>Notas</th>
                                    <th>Fecha Pago</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyPayments.map(payment => {
                                    const clientName = payment.sale && payment.sale.client ? `${payment.sale.client.name} ${payment.sale.client.lastName}` : 'N/A';
                                    return (
                                        <tr key={payment.id}>
                                            <td>{payment.id}</td>
                                            <td>{payment.sale ? payment.sale.id : 'N/A'}</td>
                                            <td>${payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                            <td>{payment.paymentMethod || 'N/A'}</td>
                                            <td>{payment.notes || 'N/A'}</td>
                                            <td>{dayjs(payment.paymentDate).tz(TIMEZONE).format('DD/MM/YYYY HH:mm')}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <h2 style={{ marginTop: '40px' }}>Ventas y Pagos Acumulados por Período</h2>
            <div className="accumulated-controls">
                <label htmlFor="accumulatedPeriod">Acumular por:</label>
                <select id="accumulatedPeriod" value={accumulatedPeriod} onChange={handleAccumulatedPeriodChange}>
                    <option value="day">Día</option>
                    <option value="week">Semana</option>
                    <option value="month">Mes</option>
                    <option value="year">Año</option>
                </select>
                <label htmlFor="accStartDate">Desde:</label>
                <input
                    type="date"
                    id="accStartDate"
                    value={accStartDate}
                    onChange={(e) => handleAccDateRangeChange(e, 'start')}
                />
                <label htmlFor="accEndDate">Hasta:</label>
                <input
                    type="date"
                    id="accEndDate"
                    value={accEndDate}
                    onChange={(e) => handleAccDateRangeChange(e, 'end')}
                />
                <button onClick={fetchAccumulatedReports} className="refresh-button">Actualizar Acumulados</button>
            </div>

            {loadingAccumulated ? (
                <p>Cargando reportes acumulados...</p>
            ) : errorAccumulated ? (
                <p className="error-message">Error: {errorAccumulated}</p>
            ) : (
                <div className="accumulated-reports-content">
                    {/* ELIMINADA LA RENDERIZACIÓN DEL GRÁFICO DE VENTAS ACUMULADAS */}
                    <h3>Ventas Acumuladas por {accumulatedPeriod === 'day' ? 'Día' : accumulatedPeriod === 'week' ? 'Semana' : accumulatedPeriod === 'month' ? 'Mes' : 'Año'}</h3>
                    {accumulatedSales.length === 0 ? (
                        <p>No hay ventas acumuladas para este período o rango.</p>
                    ) : (
                        <table className="daily-table">
                            <thead>
                                <tr>
                                    <th>Período</th>
                                    <th>Total Monto Vendido</th>
                                    <th># Ventas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accumulatedSales.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item[accumulatedPeriod]}</td>
                                        <td>${item.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td>{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {/* ELIMINADA LA RENDERIZACIÓN DEL GRÁFICO DE PAGOS ACUMULADOS */}
                    <h3 style={{ marginTop: '30px' }}>Pagos Acumulados por {accumulatedPeriod === 'day' ? 'Día' : accumulatedPeriod === 'week' ? 'Semana' : accumulatedPeriod === 'month' ? 'Mes' : 'Año'}</h3>
                    {accumulatedPayments.length === 0 ? (
                        <p>No hay pagos acumulados para este período o rango.</p>
                    ) : (
                        <table className="daily-table">
                            <thead>
                                <tr>
                                    <th>Período</th>
                                    <th>Total Monto Pagado</th>
                                    <th># Pagos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accumulatedPayments.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item[accumulatedPeriod]}</td>
                                        <td>${item.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td>{item.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}


            <h2 style={{ marginTop: '40px' }}>Créditos con Saldo Pendiente</h2>
            {pendingCredits.length === 0 ? (
                <p>No hay créditos pendientes de cobro.</p>
            ) : (
                <table className="pending-credits-table">
                    <thead>
                        <tr>
                            <th>ID Venta</th>
                            <th>Cliente</th>
                            <th>Producto(s)</th>
                            <th>Monto Original</th>
                            <th>Enganche</th>
                            <th>Saldo Actual</th>
                            <th>Pago Semanal</th>
                            <th>Pagos Realizados</th>
                            <th>Pagos Restantes</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingCredits.map(sale => {
                            const clientName = sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A';
                            const soldProductsDisplay = sale.saleItems && sale.saleItems.length > 0
                                ? sale.saleItems.map(item =>
                                    item.product ? `${item.product.name} (x${item.quantity})` : `Producto ID ${item.productId}`
                                  ).join(', ')
                                : 'N/A';
                            const paymentsMade = sale.payments ? sale.payments.length : 0;
                            const remainingPayments = sale.numberOfPayments ? sale.numberOfPayments - paymentsMade : 0;

                            return (
                                <tr key={sale.id}>
                                    <td>{sale.id}</td>
                                    <td>{clientName}</td>
                                    <td>{soldProductsDisplay}</td>
                                    <td>${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td>${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>
                                        ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td>{sale.isCredit ? `$${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'N/A'}</td>
                                    <td>{paymentsMade}</td>
                                    <td>{remainingPayments >= 0 ? remainingPayments : 'N/A'}</td>
                                    <td><span className={`status-badge status-${sale.status}`}>{sale.status.replace('_', ' ')}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ReportsDashboard;