// src/components/SaleList.jsx - VERSIÓN SIMPLIFICADA Y CORRECTA
import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

function SaleList({ sales, onDeleteSale, userRole }) {
    const [selectedSale, setSelectedSale] = useState(null);
    const [isReceiptVisible, setIsReceiptVisible] = useState(false);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const handleOpenReceiptModal = (sale) => {
        setSelectedSale(sale);
        setIsReceiptVisible(true);
    };

    if (!sales || sales.length === 0) {
        return <p style={{textAlign: 'center', margin: '20px'}}>No hay ventas que coincidan con los criterios actuales.</p>;
    }

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sales-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Total</th>
                        <th>Saldo Pendiente</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale.id}>
                            <td>{sale.id}</td>
                            <td>{sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'N/A'}</td>
                            <td>{dayjs(sale.saleDate).tz(TIMEZONE).format('DD/MM/YYYY')}</td>
                            <td>{sale.isCredit ? 'Crédito' : 'Contado'}</td>
                            <td>${(sale.totalAmount || 0).toLocaleString('es-MX')}</td>
                            <td className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>
                                {sale.isCredit ? `$${(sale.balanceDue || 0).toLocaleString('es-MX')}` : '---'}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button onClick={() => handleOpenReceiptModal(sale)}>Ver Recibo</button>
                                    {hasPermission('super_admin') && (
                                        <button className="delete-button" onClick={() => onDeleteSale(sale.id)}>Eliminar</button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* El modal se abre cuando isReceiptVisible es true */}
            {isReceiptVisible && (
                <ReceiptViewer
                    sale={selectedSale}
                    onClose={() => setIsReceiptVisible(false)}
                />
            )}
        </div>
    );
}

export default SaleList;