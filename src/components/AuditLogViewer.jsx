import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function AuditLogViewer({ authenticatedFetch }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/audit?page=${page}&limit=25`);
            if (!response.ok) throw new Error('No se pudieron cargar los logs de auditoría.');
            const data = await response.json();
            setLogs(data.logs);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, fetchLogs]);

    if (loading) return <p>Cargando registros de auditoría...</p>;

    return (
        <section className="user-admin-section">
            <h2>Registro de Auditoría del Sistema</h2>
            <p>Aquí se muestran las acciones importantes realizadas por los usuarios.</p>
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Fecha y Hora</th>
                        <th>Usuario</th>
                        <th>Acción</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id}>
                            <td>{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}</td>
                            <td>{log.username || 'N/A'}</td>
                            <td>{log.action}</td>
                            <td>{log.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {totalPages > 1 && (
                <div className="pagination-controls" style={{ marginTop: '20px' }}>
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Anterior</button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</button>
                </div>
            )}
        </section>
    );
}

export default AuditLogViewer;