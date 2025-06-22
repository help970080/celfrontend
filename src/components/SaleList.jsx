import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import dayjs from 'dayjs';
// ... (otras importaciones)

function SaleList({ sales, onDeleteSale, userRole }) {
    // --- INICIO DE CORRECCIÓN ---
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleIdForReceipt, setSelectedSaleIdForReceipt] = useState(null);

    const handleOpenReceiptModal = (saleId) => {
        setSelectedSaleIdForReceipt(saleId);
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setSelectedSaleIdForReceipt(null);
        setShowReceiptModal(false);
    };
    // --- FIN DE CORRECCIÓN ---

    const hasPermission = (roles) => {
        if (!userRole) return false;
        // ... (resto de la función)
    };
    
    // ...

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sale-table">
                {/* ... (encabezados de la tabla) ... */}
                <tbody>
                    {sales.map(sale => {
                        // ... (cálculos de la fila)
                        return (
                            <tr key={sale.id}>
                                {/* ... (celdas de la tabla) ... */}
                                <td>
                                    <div className="action-buttons">
                                        {/* --- INICIO DE CORRECCIÓN --- */}
                                        <button onClick={() => handleOpenReceiptModal(sale.id)}>Ver Recibo</button>
                                        {/* --- FIN DE CORRECCIÓN --- */}
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

            {/* --- INICIO DE CORRECCIÓN --- */}
            {showReceiptModal && (
                <ReceiptViewer saleId={selectedSaleIdForReceipt} onClose={handleCloseReceiptModal} />
            )}
            {/* --- FIN DE CORRECCIÓN --- */}
        </div>
    );
}

export default SaleList;