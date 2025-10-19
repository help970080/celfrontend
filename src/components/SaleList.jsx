// Archivo: src/components/SaleList.jsx

import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
const TIMEZONE = "America/Mexico_City";
const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleList({ sales, onDeleteSale, userRole, collectors, onSaleAssigned, authenticatedFetch }) { 
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);
    const [assigningId, setAssigningId] = useState(null);

    const handleAssignCollector = async (saleId, collectorId) => {
        if (collectorId === '') return;
        setAssigningId(saleId);
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/sales/${saleId}/assign`, {
                method: 'PUT',
                body: JSON.stringify({ collectorId: collectorId === "null" ? null : collectorId })
            });
            toast.success("Asignación actualizada con éxito.");
            onSaleAssigned();
        } catch (err) {
            toast.error(`Error al asignar: ${err.message}`);
        } finally {
            setAssigningId(null);
        }
    };

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const handleOpenReceiptModal = (saleId) => { 
        setSelectedSaleIdForReceipt(saleId); 
        setShowReceiptModal(true); 
    };
    
    const handleCloseReceiptModal = () => { 
        setSelectedSaleIdForReceipt(null); 
        setShowReceiptModal(false); 
    };

    // Helper para traducir la frecuencia
    const formatFrequency = (freq) => {
        const map = { 
            daily: 'Diario', 
            weekly: 'Semanal', 
            fortnightly: 'Quincenal', 
            monthly: 'Mensual' 
        };
        return map[freq] || freq;
    };

    if (!sales || sales.length === 0) {
        return (
            <div className="sale-list-container">
                <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No hay ventas registradas que coincidan con la búsqueda.
                </p>
            </div>
        );
    }

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            
            {/* ===== WRAPPER CON SCROLL HORIZONTAL ===== */}
            <div className="table-responsive">
                <table className="sale-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Producto(s)</th>
                            <th>Monto</th>
                            <th>Tipo</th>
                            <th>Enganche</th>
                            <th>Saldo</th>
                            <th>Plan de Pago</th>
                            <th>Pagos Rest.</th>
                            <th>Estado</th>
                            <th>Asignado A</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => {
                            const clientName = (sale?.client?.name) 
                                ? `${sale.client.name} ${sale.client.lastName || ''}`.trim() 
                                : 'N/A';
                            
                            const productListText = (sale?.saleItems?.length > 0) 
                                ? sale.saleItems.map(item => 
                                    `${item.quantity || '?'}x ${item.product?.name || 'Producto no encontrado'}`
                                  ).join(', ') 
                                : 'N/A';
                            
                            const paymentsMade = sale?.payments?.length || 0;
                            const remainingPayments = (sale?.isCredit && sale.numberOfPayments) 
                                ? sale.numberOfPayments - paymentsMade 
                                : 0;

                            return (
                                <tr key={sale.id}>
                                    <td>
                                        <button 
                                            className="id-link-button" 
                                            onClick={() => handleOpenReceiptModal(sale.id)}
                                        >
                                            {sale.id}
                                        </button>
                                    </td>
                                    
                                    <td>{clientName}</td>
                                    
                                    <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                                        {productListText}
                                    </td>
                                    
                                    <td>
                                        ${(sale.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    
                                    <td>
                                        <span className={`status-badge ${sale.isCredit ? 'status-pending_credit' : 'status-completed'}`}>
                                            {sale.isCredit ? 'Crédito' : 'Contado'}
                                        </span>
                                    </td>
                                    
                                    <td>
                                        ${(sale.downPayment || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    
                                    <td className={(sale.balanceDue || 0) > 0 ? 'highlight-balance' : ''}>
                                        ${(sale.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                    
                                    <td>
                                        {sale.isCredit 
                                            ? `$${(sale.weeklyPaymentAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${formatFrequency(sale.paymentFrequency)})` 
                                            : 'N/A'}
                                    </td>
                                    
                                    <td>
                                        {sale.isCredit ? (remainingPayments >= 0 ? remainingPayments : 'N/A') : 'N/A'}
                                    </td>
                                    
                                    <td>
                                        <span className={`status-badge status-${sale.status || 'unknown'}`}>
                                            {`${sale.status || 'Desconocido'}`.replace('_', ' ')}
                                        </span>
                                    </td>
                                    
                                    <td>
                                        {sale.isCredit && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) ? (
                                            <div className="assignment-cell">
                                                <span>{sale.assignedCollector?.username || 'Sin Asignar'}</span>
                                                <select 
                                                    defaultValue="" 
                                                    onChange={(e) => handleAssignCollector(sale.id, e.target.value)} 
                                                    disabled={assigningId === sale.id}
                                                >
                                                    <option value="" disabled>
                                                        {assigningId === sale.id ? 'Guardando...' : 'Cambiar...'}
                                                    </option>
                                                    {collectors.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.username}
                                                        </option>
                                                    ))}
                                                    <option value="null">-- Des-asignar --</option>
                                                </select>
                                            </div>
                                        ) : (
                                            sale.assignedCollector?.username || 'N/A'
                                        )}
                                    </td>
                                    
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => handleOpenReceiptModal(sale.id)}>
                                                Ver Recibo
                                            </button>
                                            {hasPermission('super_admin') && (
                                                <button 
                                                    className="delete-button" 
                                                    onClick={() => onDeleteSale(sale.id)}
                                                >
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* ===== FIN DEL WRAPPER ===== */}
            
            {showReceiptModal && (
                <ReceiptViewer 
                    saleId={selectedSaleIdForReceipt} 
                    onClose={handleCloseReceiptModal} 
                />
            )}
        </div>
    );
}

export default SaleList;