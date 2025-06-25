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

// 1. Se reciben las nuevas propiedades: collectors, onSaleAssigned, authenticatedFetch
function SaleList({ sales, onDeleteSale, userRole, collectors, onSaleAssigned, authenticatedFetch }) { 
    
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);

    // 2. Nuevo estado para manejar la selección del gestor en cada fila
    const [assignmentSelection, setAssignmentSelection] = useState({});

    const handleSelectionChange = (saleId, collectorId) => {
        setAssignmentSelection(prev => ({
            ...prev,
            [saleId]: collectorId
        }));
    };

    // 3. Nueva función para manejar el clic del botón "Asignar"
    const handleAssignCollector = async (saleId) => {
        const collectorId = assignmentSelection[saleId];
        
        if (collectorId === undefined) {
            toast.warn("Por favor, selecciona un gestor de la lista.");
            return;
        }

        try {
            // Llama a la nueva ruta del backend que creamos
            const response = await authenticatedFetch(`${API_BASE_URL}/api/sales/${saleId}/assign`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    // Si se selecciona "Des-asignar", se envía null
                    collectorId: collectorId === "null" ? null : collectorId 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al asignar');
            }

            toast.success("Asignación actualizada con éxito.");
            onSaleAssigned(); // Llama a la función del padre (fetchSales) para refrescar toda la lista
        } catch (err) {
            toast.error(`Error al asignar: ${err.message}`);
        }
    };

    const hasPermission = (roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    };

    const handleOpenReceiptModal = (saleId) => {
        setSelectedSaleIdForReceipt(saleId);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setSelectedSaleIdForReceipt(null);
        setShowReceiptModal(false);
    };

    if (!sales || sales.length === 0) {
        return <p>No hay ventas registradas que coincidan con la búsqueda.</p>;
    }

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sale-table">
                <thead>
                    <tr>
                        <th>ID Venta</th>
                        <th>Cliente</th>
                        <th>Producto(s)</th>
                        <th>Monto Total</th>
                        <th>Tipo</th>
                        <th>Enganche</th>
                        <th>Saldo Pendiente</th>
                        <th>Pago Semanal</th>
                        <th>Pagos Restantes</th>
                        <th>Estado</th>
                        {/* 4. Nueva columna en la cabecera */}
                        <th>Asignado A</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => {
                        const clientName = (sale && sale.client && sale.client.name) ? `${sale.client.name} ${sale.client.lastName || ''}`.trim() : 'N/A';
                        const productListText = (sale && Array.isArray(sale.saleItems) && sale.saleItems.length > 0) ? sale.saleItems.map(item => `${item.quantity || '?'}x ${item.product ? item.product.name : 'Producto Eliminado'}`).join(', ') : 'Sin Productos';
                        const paymentsMade = (sale && Array.isArray(sale.payments)) ? sale.payments.length : 0;
                        const remainingPayments = (sale && sale.isCredit && typeof sale.numberOfPayments === 'number') ? sale.numberOfPayments - paymentsMade : 0;

                        return (
                            <tr key={sale.id}>
                                <td>{sale.id || 'N/A'}</td>
                                <td>{clientName}</td>
                                <td>{productListText}</td>
                                <td>${(sale.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td>{sale.isCredit ? 'Crédito' : 'Contado'}</td>
                                <td>${(sale.downPayment || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className={(sale.balanceDue || 0) > 0 ? 'highlight-balance' : ''}>
                                    ${(sale.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                                <td>{sale.isCredit ? `$${(sale.weeklyPaymentAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'N/A'}</td>
                                <td>{sale.isCredit ? (remainingPayments >= 0 ? remainingPayments : 'N/A') : 'N/A'}</td>
                                <td><span className={`status-badge status-${sale.status || 'unknown'}`}>{`${sale.status || 'Desconocido'}`.replace('_', ' ')}</span></td>
                                
                                {/* 5. Nueva celda con la interfaz de asignación */}
                                <td>
                                    {sale.isCredit && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) ? (
                                        <div className="assignment-cell">
                                            <span>{sale.assignedCollector ? sale.assignedCollector.username : 'Sin Asignar'}</span>
                                            <select
                                                value={assignmentSelection[sale.id] || ''}
                                                onChange={(e) => handleSelectionChange(sale.id, e.target.value)}
                                            >
                                                <option value="" disabled>Cambiar asignación...</option>
                                                {collectors.map(c => (
                                                    <option key={c.id} value={c.id}>{c.username}</option>
                                                ))}
                                                <option value="null">-- Des-asignar --</option>
                                            </select>
                                            <button onClick={() => handleAssignCollector(sale.id)}>Asignar</button>
                                        </div>
                                    ) : (
                                        sale.assignedCollector ? sale.assignedCollector.username : 'N/A'
                                    )}
                                </td>

                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => handleOpenReceiptModal(sale.id)}>Ver Recibo</button>
                                        {hasPermission('super_admin') && (
                                            <button className="delete-button" onClick={() => onDeleteSale(sale.id)}>Eliminar</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {showReceiptModal && (
                <ReceiptViewer saleId={selectedSaleIdForReceipt} onClose={handleCloseReceiptModal} />
            )}
        </div>
    );
}

export default SaleList;