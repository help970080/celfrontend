import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleForm({ onSaleAdded, clients, products, collectors }) {
    const [clientId, setClientId] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isCredit, setIsCredit] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [assignedCollectorId, setAssignedCollectorId] = useState(''); // El valor inicial es ''
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // ... (otras funciones como resetForm, handleProductSelection, etc. sin cambios)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // ... (validaciones de cliente y productos) ...

        // El valor de assignedCollectorId será el ID numérico o null si está vacío
        const finalCollectorId = assignedCollectorId ? parseInt(assignedCollectorId, 10) : null;

        const saleData = {
            clientId: parseInt(clientId),
            saleItems: selectedProducts,
            isCredit,
            downPayment: isCredit ? parseFloat(downPayment || 0) : totalAmount,
            // ... (otros campos)
            assignedCollectorId: finalCollectorId // Se envía el valor corregido
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(saleData),
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.message || "Error al registrar");
            
            toast.success("¡Venta registrada con éxito!");
            onSaleAdded();
            resetForm();
        } catch (err) {
            setError(err.message);
            toast.error(`Error al registrar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // ... (cálculos y el resto del return del JSX)
    
    return (
        <div className="sale-form-container">
            {/* ... */}
            <form onSubmit={handleSubmit} className="sale-form">
                {/* ... */}
                {isCredit && (
                    <div className="credit-details">
                        {/* ... */}
                        <div className="form-group">
                            <label htmlFor="assignedCollector">Asignar a Gestor (Opcional):</label>
                            <select id="assignedCollector" value={assignedCollectorId} onChange={(e) => setAssignedCollectorId(e.target.value)}>
                                <option value="">Sin Asignar</option> {/* El valor de esta opción es '' */}
                                {collectors.map(collector => <option key={collector.id} value={collector.id}>{collector.username}</option>)}
                            </select>
                        </div>
                        {/* ... */}
                    </div>
                )}
                {/* ... */}
            </form>
        </div>
    );
}

export default SaleForm;