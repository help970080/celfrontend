// src/components/SaleList.jsx - CORREGIDO
import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
// ... (otras importaciones)

function SaleList({ sales, onDeleteSale, userRole }) {
    const [selectedSale, setSelectedSale] = useState(null);
    const [isReceiptVisible, setIsReceiptVisible] = useState(false);

    const handleOpenReceiptModal = (sale) => {
        setSelectedSale(sale);
        setIsReceiptVisible(true);
    };

    // ... (tu tabla y lógica de lista)

    return (
        <div className="sale-list-container">
            {/* ... tu tabla de ventas ... */}
            <tbody>
                {sales.map(sale => (
                    <tr key={sale.id}>
                        {/* ... tus celdas de la tabla ... */}
                        <td>
                            <button onClick={() => handleOpenReceiptModal(sale)}>Ver Recibo</button>
                            {/* ... */}
                        </td>
                    </tr>
                ))}
            </tbody>
            {/* ... */}

            {/* Al abrir el recibo desde aquí, pasamos la nueva prop 'showLegalInfo={true}' */}
            {isReceiptVisible && (
                <ReceiptViewer
                    sale={selectedSale}
                    onClose={() => setIsReceiptVisible(false)}
                    showLegalInfo={true} 
                />
            )}
        </div>
    );
}

export default SaleList;