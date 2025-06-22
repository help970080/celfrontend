import React, { useState } from 'react';
import ReceiptViewer from './ReceiptViewer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

// NOTA: El componente ahora es más interactivo. Muestra una tabla y un panel de detalles.
function SaleList({ sales, onDeleteSale, userRole }) {
    
    // Estado para manejar qué venta está seleccionada para la vista previa
    const [selectedSale, setSelectedSale] = useState(null); 
    
    // Estado para el modal del recibo imprimible (tu lógica original)
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    const handleOpenReceiptModal = (sale) => {
        setSelectedSale(sale); // Usamos el mismo estado para saber qué recibo abrir
        setShowReceiptModal(true);
    };

    const handleCloseReceiptModal = () => {
        setShowReceiptModal(false);
    };
    
    // --- Lógica para calcular la fecha de vencimiento del pagaré ---
    let dueDate = null;
    if (selectedSale && selectedSale.isCredit && selectedSale.numberOfPayments > 0) {
        dueDate = dayjs(selectedSale.saleDate).tz(TIMEZONE).add(selectedSale.numberOfPayments, 'weeks').format('DD/MM/YYYY');
    }

    if (!sales || sales.length === 0) {
        return <p>No hay ventas que coincidan con los criterios actuales.</p>;
    }

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sale-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Total</th>
                        <th>Saldo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => (
                        // Al hacer clic en una fila, se selecciona la venta para ver sus detalles
                        <tr key={sale.id} onClick={() => setSelectedSale(sale)} className={selectedSale?.id === sale.id ? 'selected' : ''}>
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
                                    {/* Detenemos la propagación para no seleccionar la fila al hacer clic en el botón */}
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenReceiptModal(sale); }}>Ver Recibo</button>
                                    {hasPermission('super_admin') && (
                                        <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDeleteSale(sale.id); }}>Eliminar</button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* --- INICIO DE LA NUEVA SECCIÓN: PANEL DE DETALLES --- */}
            {/* Este bloque solo aparece si hay una venta seleccionada */}
            {selectedSale && (
                <div className="sale-details-preview-card">
                    <h4>Detalle de Venta #{selectedSale.id}</h4>
                    <ul>
                        {selectedSale.saleItems?.map(item => (
                            <li key={item.id}>{item.quantity}x - {item.product?.name || 'Producto no encontrado'}</li>
                        ))}
                    </ul>

                    {/* Si la venta es a crédito, se muestran las leyendas y el pagaré */}
                    {selectedSale.isCredit && (
                        <div className="credit-info-details">
                            <div className="receipt-credit-warning">
                                <p><strong>Esta es una Venta a crédito. Usted No puede Vender o Empeñar este artículo hasta que esté completamente liquidado.</strong></p>
                            </div>

                            <div className="receipt-promissory-note">
                                <p>
                                    <strong>DEBO Y PAGARÉ</strong> incondicionalmente la cantidad de <strong>{`$${(selectedSale.totalAmount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`}</strong> a DANIEL GUERRERO BARRANCO en la ciudad de JUCHITEPEC DE MARIANO RIVAPALACIOS, ESTADO DE MÉXICO, el día <strong>{dueDate || '[Fecha no calculada]'}</strong>.
                                </p>
                                <p>
                                    De no pagar en la fecha estipulada, este pagaré generará un interés moratorio del 6% mensual sobre el saldo insoluto hasta su total liquidación.
                                </p>
                                <div className="signature-line">
                                    <p>_________________________</p>
                                    <p>{selectedSale.client?.name || 'Nombre del Cliente'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* --- FIN DEL PANEL DE DETALLES --- */}

            {/* El modal para el recibo imprimible sigue funcionando igual */}
            {showReceiptModal && (
                <ReceiptViewer sale={selectedSale} onClose={handleCloseReceiptModal} />
            )}
        </div>
    );
}

export default SaleList;