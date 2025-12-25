// ClientAdminPanel.jsx - VERSIÓN COMPLETA CON EXPORTAR GESTIONES

import React, { useState, useEffect, useCallback } from 'react';
import ClientForm from './ClientForm';
import ClientList from './ClientList';
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientAdminPanel({ authenticatedFetch, userRole, userTiendaId }) {
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [errorClients, setErrorClients] = useState(null);
    const [clientToEdit, setClientToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [showForm, setShowForm] = useState(false);
    
    const [riskFilter, setRiskFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const fetchClients = useCallback(async () => {
        setLoadingClients(true);
        setErrorClients(null);
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                page: currentPage,
                limit: itemsPerPage,
                sortBy: sortBy,
                sortOrder: sortOrder
            });
            
            if (riskFilter !== 'all') {
                params.append('riskLevel', riskFilter);
            }
            
            if (userRole !== 'super_admin' && userTiendaId) {
                params.append('tiendaId', userTiendaId);
            }
            
            const url = `${API_BASE_URL}/api/clients?${params.toString()}`;
            
            const response = await authenticatedFetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setClients(data.clients || []);
            setTotalPages(data.totalPages);
            setTotalItems(data.totalItems);
        } catch (err) {
            console.error("Error al obtener clientes:", err);
            setErrorClients(err.message || "No se pudieron cargar los clientes.");
            setClients([]);
        } finally {
            setLoadingClients(false);
        }
    }, [authenticatedFetch, searchTerm, currentPage, itemsPerPage, userRole, userTiendaId, riskFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);
    
    useEffect(() => {
        if (clientToEdit) {
            setShowForm(true);
        }
    }, [clientToEdit]);

    const handleFormSuccess = () => {
        fetchClients();
        setShowForm(false);
        setClientToEdit(null);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setClientToEdit(null);
    };

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción también puede afectar a las ventas asociadas.')) {
            return;
        }
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar cliente');
            toast.success('Cliente eliminado con éxito');
            fetchClients();
        } catch(err) {
            toast.error(err.message);
        }
    };

    const handleExportExcel = async () => {
        if (!hasPermission(['super_admin', 'regular_admin', 'sales_admin'])) {
            toast.error('No tienes permisos para exportar clientes.');
            return;
        }
        try {
            toast.info('Generando archivo Excel de clientes...');
            
            let exportUrl = `${API_BASE_URL}/api/clients/export-excel`;
            if (userRole !== 'super_admin' && userTiendaId) {
                exportUrl += `?tiendaId=${userTiendaId}`;
            }
            
            const response = await authenticatedFetch(exportUrl, { 
                method: 'GET', 
                headers: {} 
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'clientes_con_riesgo.xlsx'; 
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('✅ Archivo Excel de clientes exportado con éxito');
        } catch (err) {
            console.error("Error al exportar clientes a Excel:", err);
            toast.error(`Error al exportar clientes: ${err.message || "Error desconocido."}`);
        }
    };

    // ⭐ NUEVO: Exportar gestiones de cobranza
    const handleExportCollectionLogs = async () => {
        if (!hasPermission(['super_admin', 'regular_admin', 'sales_admin'])) {
            toast.error('No tienes permisos para exportar gestiones.');
            return;
        }
        
        try {
            toast.info('Generando archivo Excel de gestiones de cobranza...');
            
            const exportUrl = `${API_BASE_URL}/api/collections/export-excel`;
            
            const response = await authenticatedFetch(exportUrl, { 
                method: 'GET'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gestiones_cobranza_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('✅ Archivo Excel de gestiones exportado exitosamente');
        } catch (err) {
            console.error("Error al exportar gestiones:", err);
            toast.error(`Error al exportar gestiones: ${err.message || "Error desconocido."}`);
        }
    };

    const handleRiskFilterChange = (risk) => {
        setRiskFilter(risk);
        setCurrentPage(1);
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    };

    return (
        <section className="clients-section">
            <h2>Gestión de Clientes</h2>

            <div className="panel-actions" style={{ marginBottom: '20px' }}>
                <button onClick={() => { setShowForm(!showForm); if (showForm) setClientToEdit(null); }} className="action-button primary-button">
                    {showForm ? 'Ocultar Formulario' : '+ Agregar Nuevo Cliente'}
                </button>
            </div>

            {showForm && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <ClientForm
                    onClientAdded={handleFormSuccess}
                    clientToEdit={clientToEdit}
                    setClientToEdit={setClientToEdit}
                    onCancel={handleFormCancel}
                    authenticatedFetch={authenticatedFetch}
                />
            )}

            {/* Filtros de Riesgo */}
            <div className="risk-filters" style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: '600' }}>Filtrar por riesgo:</span>
                <button 
                    onClick={() => handleRiskFilterChange('all')}
                    style={{
                        padding: '8px 16px',
                        border: riskFilter === 'all' ? '2px solid var(--primary)' : '2px solid #ddd',
                        background: riskFilter === 'all' ? 'var(--primary)' : 'white',
                        color: riskFilter === 'all' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    📊 Todos ({totalItems})
                </button>
                <button 
                    onClick={() => handleRiskFilterChange('high')}
                    style={{
                        padding: '8px 16px',
                        border: riskFilter === 'high' ? '2px solid #dc3545' : '2px solid #ddd',
                        background: riskFilter === 'high' ? '#dc3545' : 'white',
                        color: riskFilter === 'high' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🔴 Riesgo Alto
                </button>
                <button 
                    onClick={() => handleRiskFilterChange('medium')}
                    style={{
                        padding: '8px 16px',
                        border: riskFilter === 'medium' ? '2px solid #ffc107' : '2px solid #ddd',
                        background: riskFilter === 'medium' ? '#ffc107' : 'white',
                        color: riskFilter === 'medium' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🟡 Riesgo Medio
                </button>
                <button 
                    onClick={() => handleRiskFilterChange('low')}
                    style={{
                        padding: '8px 16px',
                        border: riskFilter === 'low' ? '2px solid #28a745' : '2px solid #ddd',
                        background: riskFilter === 'low' ? '#28a745' : 'white',
                        color: riskFilter === 'low' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    🟢 Riesgo Bajo
                </button>
            </div>

            {/* Ordenamiento */}
            <div className="sort-controls" style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '20px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: '600' }}>Ordenar por:</span>
                <button 
                    onClick={() => handleSortChange('name')}
                    style={{
                        padding: '8px 16px',
                        border: '2px solid #ddd',
                        background: sortBy === 'name' ? 'var(--primary)' : 'white',
                        color: sortBy === 'name' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Nombre {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
                <button 
                    onClick={() => handleSortChange('balance')}
                    style={{
                        padding: '8px 16px',
                        border: '2px solid #ddd',
                        background: sortBy === 'balance' ? 'var(--danger)' : 'white',
                        color: sortBy === 'balance' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Adeudo {sortBy === 'balance' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
                <button 
                    onClick={() => handleSortChange('risk')}
                    style={{
                        padding: '8px 16px',
                        border: '2px solid #ddd',
                        background: sortBy === 'risk' ? 'var(--warning)' : 'white',
                        color: sortBy === 'risk' ? 'white' : '#333',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Nivel de Riesgo {sortBy === 'risk' && (sortOrder === 'asc' ? '▲' : '▼')}
                </button>
            </div>

            <div className="admin-controls">
                <div className="control-group">
                    <label htmlFor="searchClient">Buscar Cliente:</label>
                    <input 
                        type="text" 
                        id="searchClient" 
                        value={searchTerm} 
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        placeholder="Buscar por nombre, apellido, teléfono..."
                    />
                </div>
                <div className="control-group">
                    <label htmlFor="itemsPerPage">Ítems por página:</label>
                    <select 
                        id="itemsPerPage" 
                        value={itemsPerPage} 
                        onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
                {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                    <>
                        <div className="control-group">
                            <button onClick={handleExportExcel} className="action-button primary-button">
                                📊 Exportar Clientes
                            </button>
                        </div>
                        <div className="control-group">
                            <button onClick={handleExportCollectionLogs} className="action-button secondary-button" style={{
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                border: 'none',
                                padding: '0.6rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem'
                            }}>
                                📋 Exportar Gestiones
                            </button>
                        </div>
                    </>
                )}
            </div>

            {loadingClients ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner"></div>
                    <p>Cargando clientes...</p>
                </div>
            ) : errorClients ? (
                <p className="error-message">{errorClients}</p>
            ) : (
                <>
                    <ClientList
                        clients={clients}
                        onEditClient={setClientToEdit}
                        onDeleteClient={handleDeleteClient}
                        userRole={userRole}
                        authenticatedFetch={authenticatedFetch}
                    />
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                                ← Anterior
                            </button>
                            <span>Página {currentPage} de {totalPages} ({totalItems} ítems)</span>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                                Siguiente →
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

export default ClientAdminPanel;