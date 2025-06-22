import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

function SaleList({ sales, onDeleteSale, userRole }) { 
    
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);

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
                {/* --- INICIO: CÓDIGO RESTAURADO --- */}
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
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => {
                        const clientName = sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A';
                        const productListText = sale.saleItems && sale.saleItems.length > 0
                            ? sale.saleItems.map(item => `${item.quantity}x ${item.product ? item.product.name : 'N/A'}`).join(', ')
                            : 'N/A';
                        const paymentsMade = sale.payments ? sale.payments.length : 0;
                        const remainingPayments = sale.isCredit && sale.numberOfPayments ? sale.numberOfPayments - paymentsMade : 0;

                        return (
                            <tr key={sale.id}>
                                <td>{sale.id}</td>
                                <td>{clientName}</td>
                                <td>{productListText}</td>
                                <td>${sale.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td>{sale.isCredit ? 'Crédito' : 'Contado'}</td>
                                <td>${sale.downPayment.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>
                                    ${sale.balanceDue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                                <td>{sale.isCredit ? `$${sale.weeklyPaymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'N/A'}</td>
                                <td>{sale.isCredit ? (remainingPayments >= 0 ? remainingPayments : 'N/A') : 'N/A'}</td>
                                <td><span className={`status-badge status-${sale.status}`}>{sale.status.replace('_', ' ')}</span></td>
                                {/* --- FIN: CÓDIGO RESTAURADO --- */}
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