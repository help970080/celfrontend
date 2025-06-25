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
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // 1. Nuevo estado para saber qué fila se está guardando
    const [assigningId, setAssigningId] = useState(null);

    // 2. La función ahora se activa con el cambio del select
    const handleAssignCollector = async (saleId, collectorId) => {
        if (collectorId === '') return; // No hacer nada si se selecciona la opción por defecto

        setAssigningId(saleId); // Bloquear el select de esta fila mientras se guarda

        try {
            await authenticatedFetch(`${API_BASE_URL}/api/sales/${saleId}/assign`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    collectorId: collectorId === "null" ? null : collectorId 
                })
            });
            toast.success("Asignación actualizada con éxito.");
            onSaleAssigned(); // Refresca toda la lista para mostrar el cambio
        } catch (err) {
            toast.error(`Error al asignar: ${err.message}`);
        } finally {
            setAssigningId(null); // Desbloquear el select al terminar
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---

    const hasPermission = (roles) => { /* ... tu código ... */ };
    const handleOpenReceiptModal = (saleId) => { /* ... tu código ... */ };
    const handleCloseReceiptModal = () => { /* ... tu código ... */ };

    if (!sales || sales.length === 0) {
        return <p>No hay ventas registradas.</p>;
    }

    return (
        <div className="sale-list-container">
            <h2>Ventas Registradas</h2>
            <table className="sale-table">
                <thead>
                    <tr>
                        {/* ... tus encabezados de tabla ... */}
                        <th>Asignado A</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map(sale => {
                        // ... tu lógica para clientName, etc.
                        return (
                            <tr key={sale.id}>
                                {/* ... tus celdas de datos ... */}
                                <td>
                                    {sale.isCredit && hasPermission(['super_admin', 'regular_admin', 'sales_admin']) ? (
                                        <div className="assignment-cell">
                                            <span>{sale.assignedCollector?.username || 'Sin Asignar'}</span>
                                            
                                            {/* --- INICIO DE LA MODIFICACIÓN --- */}
                                            {/* 3. El select ahora llama directamente a la función de asignación */}
                                            <select
                                                defaultValue=""
                                                onChange={(e) => handleAssignCollector(sale.id, e.target.value)}
                                                disabled={assigningId === sale.id} // Se deshabilita mientras guarda
                                            >
                                                <option value="" disabled>
                                                    {assigningId === sale.id ? 'Guardando...' : 'Cambiar...'}
                                                </option>
                                                {collectors.map(c => (
                                                    <option key={c.id} value={c.id}>{c.username}</option>
                                                ))}
                                                <option value="null">-- Des-asignar --</option>
                                            </select>
                                            {/* 4. El botón de "Asignar" ha sido eliminado */}
                                            {/* --- FIN DE LA MODIFICACIÓN --- */}

                                        </div>
                                    ) : (
                                        sale.assignedCollector?.username || 'N/A'
                                    )}
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