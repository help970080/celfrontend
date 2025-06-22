import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import dayjs from 'dayjs';

function SaleList({ sales, onDeleteSale, userRole }) {
    const [selectedSale, setSelectedSale] = useState(null);
    const [isReceiptVisible, setIsReceiptVisible] = useState(false);

    const handleOpenReceiptModal = (sale) => {
        setSelectedSale(sale);
        setIsReceiptVisible(true);
    };

    const hasPermission = (roles) => { /* ... tu función de permiso ... */ };

    if (!sales || sales.length === 0) return <p>No hay ventas para mostrar.</p>;

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sales-table">
                <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Tipo</th><th>Total</th><th>Saldo</th><th>Acciones</th></tr></thead>
                <tbody>
                    {sales.map(sale => (
                        <tr key={sale.id}>
                            <td>{sale.id}</td>
                            <td>{sale.client ? `${sale.client.name} ${sale.client.lastName}` : 'Dato no disponible'}</td>
                            <td>{dayjs(sale.saleDate).format('DD/MM/YYYY')}</td>
                            <td>{sale.isCredit ? 'Crédito' : 'Contado'}</td>
                            <td>${(sale.totalAmount || 0).toLocaleString('es-MX')}</td>
                            <td className={sale.balanceDue > 0 ? 'highlight-balance' : ''}>{sale.isCredit ? `$${(sale.balanceDue || 0).toLocaleString('es-MX')}` : '---'}</td>
                            <td>
                                <button onClick={() => handleOpenReceiptModal(sale)}>Ver Recibo</button>
                                {hasPermission('super_admin') && <button className="delete-button" onClick={() => onDeleteSale(sale.id)}>Eliminar</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {isReceiptVisible && <ReceiptViewer sale={selectedSale} onClose={() => setIsReceiptVisible(false)} showLegalInfo={true} />}
        </div>
    );
}
export default SaleList;