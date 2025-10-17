// Archivo: src/components/CollectionLogForm.jsx

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

// Opciones predefinidas para el resultado de la gestión
const logResults = [
    { value: 'PROMISE', label: 'Promesa de Pago' },
    { value: 'PAID', label: 'Pago Parcial/Total (Registrar en Cobranza)' },
    { value: 'CONTACT_SUCCESS', label: 'Contacto Exitoso (Sin Promesa)' },
    { value: 'NO_ANSWER', label: 'No Contesta / Buzón' },
    { value: 'WRONG_NUMBER', label: 'Número Equivocado' },
    { value: 'LOCATED', label: 'Ubicado / Contacto Físico' },
    { value: 'REFUSAL', label: 'Rechazo de Pago' },
];

function CollectionLogForm({ saleData, onClose, authenticatedFetch }) {
    // Obtenemos el ID del usuario logueado para registrar quién hizo la gestión
    const collectorId = parseInt(localStorage.getItem('userId'), 10);

    const [result, setResult] = useState(logResults[0].value);
    const [notes, setNotes] = useState('');
    const [nextActionDate, setNextActionDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!saleData || !saleData.sale?.id || !collectorId) {
            setError('Datos de venta o gestor faltantes.');
            setLoading(false);
            return;
        }

        const logData = {
            saleId: saleData.sale.id,
            collectorId: collectorId,
            result: result,
            notes: notes,
            nextActionDate: nextActionDate || null, // Se envía null si no hay fecha
        };

        // NOTA IMPORTANTE: Esta ruta POST /api/collections/log DEBE ser implementada en el backend.
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/collections/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            toast.success('Gestión de cobranza registrada con éxito.');
            onClose(); // Cierra el modal y recarga el panel de recordatorios
        } catch (err) {
            console.error("Error al registrar gestión:", err);
            setError(err.message || "Error al registrar la gestión. Asegúrate que la ruta POST del backend esté funcionando.");
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <button className="close-button" onClick={onClose}>&times;</button>
                <h3>Registrar Gestión de Cobranza</h3>
                
                <p><strong>Cliente:</strong> {saleData.client?.name} {saleData.client?.lastName}</p>
                <p><strong>Venta ID:</strong> #{saleData.sale?.id}</p>
                <p><strong>Saldo:</strong> ${Number(saleData.sale?.balanceDue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                
                <hr/>
                <form onSubmit={handleSubmit}>
                    {error && <p className="error-message">{error}</p>}

                    <div className="form-group">
                        <label htmlFor="result">Resultado de la Gestión:</label>
                        <select id="result" value={result} onChange={(e) => setResult(e.target.value)} required>
                            {logResults.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notas y Comentarios (Detalles de la conversación):</label>
                        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" required></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="nextActionDate">Fecha de Próximo Seguimiento (Opcional):</label>
                        <input 
                            type="date" 
                            id="nextActionDate" 
                            value={nextActionDate} 
                            onChange={(e) => setNextActionDate(e.target.value)} 
                            min={dayjs().format('YYYY-MM-DD')} // No permitir fechas pasadas
                        />
                    </div>

                    <button type="submit" disabled={loading || !result || !notes}>
                        {loading ? 'Guardando...' : 'Guardar Gestión'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CollectionLogForm;