// src/components/ClientPayments.jsx - CORREGIDO
import React, { useState, useEffect, useCallback } from 'react';
import ReceiptViewer from './ReceiptViewer';
// ... (otras importaciones)

function ClientPayments({ authenticatedFetch, userRole }) {
    const { clientId } = useParams();
    // ... (toda tu lógica de estado y fetch)
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);

    const handleOpenReceiptModal = (sale) => {
        setSelectedSaleForReceipt(sale);
        setShowReceiptModal(true);
    };

    // ... (resto de tu componente)

    return (
        <section className="client-payments-section">
            {/* ... toda tu vista de cobranza ... */}
            <div className="credit-sales-list">
                {sales.map(sale => (
                    <div key={sale.id} className="credit-sale-card">
                        {/* ... */}
                        <button onClick={() => handleOpenReceiptModal(sale)}>Ver Recibo</button>
                    </div>
                ))}
            </div>
            {/* ... */}
            
            {/* Al abrir el recibo desde aquí, NO pasamos 'showLegalInfo', por lo que será 'false' por defecto */}
            {showReceiptModal && selectedSaleForReceipt && (
                <ReceiptViewer 
                    sale={selectedSaleForReceipt} 
                    onClose={() => setShowReceiptModal(false)} 
                    // No pasamos showLegalInfo, por lo que usará el valor por defecto (false)
                />
            )}
        </section>
    );
}

export default ClientPayments;