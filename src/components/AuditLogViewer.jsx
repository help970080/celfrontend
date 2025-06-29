// Archivo: src/components/AuditLogViewer.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function AuditLogViewer({ authenticatedFetch }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // --- INICIO DE LA MODIFICACIÓN ---
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        userId: 'all'
    });

    // Cargar la lista de usuarios para el filtro
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/users`);
                if (!response.ok) throw new Error('No se pudieron cargar los usuarios para el filtro.');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                toast.error(err.message);
            }
        };
        fetchUsers();
    }, [authenticatedFetch]);

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        // Construir la URL con los filtros
        const queryParams = new URLSearchParams({
            page,
            limit: 25,
            ...filters
        });
        
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/audit?${queryParams.toString()}`);
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
    }, [authenticatedFetch, filters]); // Se añade 'filters' a las dependencias

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, fetchLogs]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        setCurrentPage(1); // Resetear a la primera página al aplicar filtros
        fetchLogs(1);
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', userId: 'all' });
        // Disparar la carga de logs con los filtros limpios
        // Esto requiere que fetchLogs sea llamado de nuevo. Lo hacemos a través del useEffect
        // Para forzarlo, podemos hacer un truco o simplemente llamar a la función.
        setCurrentPage(1);
        // Llamada directa es más simple aquí
        const queryParams = new URLSearchParams({ page: 1, limit: 25 });
        authenticatedFetch(`${API_BASE_URL}/api/audit?${queryParams.toString()}`)
            .then(res => res.json())
            .then(data => {
                setLogs(data.logs);
                setCurrentPage(data.currentPage);
                setTotalPages(data.totalPages);
            });
    };
    // --- FIN DE LA MODIFICACIÓN ---

    if (loading) return <p>Cargando registros de auditoría...</p>;

    return (
        <section className="user-admin-section">
            <h2>Registro de Auditoría del Sistema</h2>
            <p>Aquí se muestran las acciones importantes realizadas por los usuarios.</p>

            {/* --- INICIO DE LA MODIFICACIÓN: CONTROLES DE FILTRO --- */}
            <div className="admin-controls" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h4>Filtrar Registros</h4>
                <div className="control-group">
                    <label>Desde:</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className="control-group">
                    <label>Hasta:</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </div>
                <div className="control-group">
                    <label>Usuario:</label>
                    <select name="userId" value={filters.userId} onChange={handleFilterChange}>
                        <option value="all">Todos los usuarios</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
                <div className="control-group">
                    <button onClick={applyFilters} className="action-button primary-button">Filtrar</button>
                    <button onClick={clearFilters} className="action-button" style={{marginLeft: '10px'}}>Limpiar</button>
                </div>
            </div>
            {/* --- FIN DE LA MODIFICACIÓN --- */}

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
                    {logs.length > 0 ? logs.map(log => (
                        <tr key={log.id}>
                            <td>{dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}</td>
                            <td>{log.username || 'N/A'}</td>
                            <td>{log.action}</td>
                            <td>{log.details}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="4">No hay registros que coincidan con los filtros.</td>
                        </tr>
                    )}
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