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
    const [assignmentSelection, setAssignmentSelection] = useState({});

    const handleSelectionChange = (saleId, collectorId) => {
        setAssignmentSelection(prev => ({ ...prev, [saleId]: collectorId }));
    };

    const handleAssignCollector = async (saleId) => {
        const collectorId = assignmentSelection[saleId];
        if (collectorId === undefined) {
            toast.warn("Por favor, selecciona un gestor de la lista.");
            return;
        }
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/sales/${saleId}/assign`, {
                method: 'PUT',
                body: JSON.stringify({ collectorId: collectorId === "null" ? null : collectorId })
            });
            toast.success("Asignación actualizada con éxito.");
            onSaleAssigned(); // Refresca la lista de ventas
        } catch (err) {
            toast.error(`Error al asignar: ${err.message}`);
        }
    };

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const handleOpenReceiptModal = (saleId) => { setSelectedSaleIdForReceipt(saleId); setShowReceiptModal(true); };
    const handleCloseReceiptModal = () => { setSelectedSaleIdForReceipt(null); setShowReceiptModal(false); };

    if (!sales || sales.length === 0) {
        return <p>No hay ventas registradas que coincidan con la búsqueda.</p>;
    }

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sale-table">
                <thead>
                    <tr>
                        <th>ID Venta</th><th>Cliente</th><th>Producto(s)</th><th>Monto</th><th>Tipo</th><th>Enganche</th><th>Saldo</th><th>Pago Sem.</th><th>Pagos Rest.</th><th>Estado</th><th>Asignado A</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => {
                        const clientName = (sale?.client?.name) ? `${sale.client.name} ${sale.client.lastName || ''}`.trim() : 'N/A';
                        const productListText = (sale?.saleItems?.length > 0) ? sale.saleItems.map(item => `${item.quantity || '?'}x ${item.product?.name || 'Producto Eliminado'}`).join(', ') : 'Sin Productos';
                        const paymentsMade = sale?.payments?.length || 0;
                        const remainingPayments = (sale?.isCredit && sale.numberOfPayments) ? sale.numberOfPayments - paymentsMade : 0;

                        return (
                            <tr key={sale.id}>
                                <td>{sale.id}</td><td>{clientName}</td><td>{productListText}</td><td>${(sale.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td><td>{sale.isCredit ? 'Crédito' : 'Contado'}</td><td>${(sale.downPayment || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td><td className={(sale.balanceDue || 0) > 0 ? 'highlight-balance' : ''}>${(sale.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td><td>{sale.isCredit ? `$${(sale.weeklyPaymentAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'N/A'}</td><td>{sale.isCredit ? (remainingPayments >= 0 ? remainingPayments : 'N/A') : 'N/A'}</td><td><span className={`status-badge status-${sale.status || 'unknown'}`}>{`${sale.status || 'Desconocido'}`.replace('_', ' ')}</span></td>
                                <td>
                                    {sale.isCredit && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) ? (
                                        <div className="assignment-cell">
                                            <span>{sale.assignedCollector?.username || 'Sin Asignar'}</span>
                                            <select value={assignmentSelection[sale.id] || ''} onChange={(e) => handleSelectionChange(sale.id, e.target.value)}>
                                                <option value="" disabled>Cambiar...</option>
                                                {collectors.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                                                <option value="null">-- Des-asignar --</option>
                                            </select>
                                            <button onClick={() => handleAssignCollector(sale.id)}>Asignar</button>
                                        </div>
                                    ) : (sale.assignedCollector?.username || 'N/A')}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => handleOpenReceiptModal(sale.id)}>Ver Recibo</button>
                                        {hasPermission('super_admin') && <button className="delete-button" onClick={() => onDeleteSale(sale.id)}>Eliminar</button>}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {showReceiptModal && <ReceiptViewer saleId={selectedSaleIdForReceipt} onClose={handleCloseReceiptModal} />}
        </div>
    );
}
export default SaleList;