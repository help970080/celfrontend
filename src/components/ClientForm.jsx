import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; 

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientForm({ onClientAdded, clientToEdit, setClientToEdit }) {
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [identificationId, setIdentificationId] = useState('');
    const [notes, setNotes] = useState('');
    // --- INICIO DE LA MODIFICACIÓN ---
    const [password, setPassword] = useState(''); // Estado para la nueva contraseña
    // --- FIN DE LA MODIFICACIÓN ---

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (clientToEdit) {
            setName(clientToEdit.name || '');
            setLastName(clientToEdit.lastName || '');
            setPhone(clientToEdit.phone || '');
            setEmail(clientToEdit.email || '');
            setAddress(clientToEdit.address || '');
            setCity(clientToEdit.city || '');
            setState(clientToEdit.state || '');
            setZipCode(clientToEdit.zipCode || '');
            setIdentificationId(clientToEdit.identificationId || '');
            setNotes(clientToEdit.notes || '');
            setPassword(''); // Limpiar campo de contraseña al editar
        } else {
            resetForm();
        }
    }, [clientToEdit]);

    const resetForm = () => {
        setName('');
        setLastName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setCity('');
        setState('');
        setZipCode('');
        setIdentificationId('');
        setNotes('');
        setPassword(''); // Asegurarse de limpiar también la contraseña
        setError(null);
        setSuccess(null);
        if (setClientToEdit) {
            setClientToEdit(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const clientData = {
            name, lastName, phone, address, city, state, zipCode,
            email: email === '' ? null : email,
            identificationId: identificationId === '' ? null : identificationId,
            notes: notes === '' ? null : notes,
        };

        // --- INICIO DE LA MODIFICACIÓN ---
        // Solo añadir la contraseña al objeto si el campo no está vacío
        if (password) {
            clientData.password = password;
        }
        // --- FIN DE LA MODIFICACIÓN ---

        const url = clientToEdit
            ? `${API_BASE_URL}/api/clients/${clientToEdit.id}`
            : `${API_BASE_URL}/api/clients`;
        const method = clientToEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { 
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(clientData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            setSuccess(clientToEdit ? 'Cliente actualizado con éxito!' : 'Cliente agregado con éxito!');
            toast.success(clientToEdit ? 'Cliente actualizado!' : 'Cliente agregado!'); 
            onClientAdded(result);
            resetForm();
        } catch (err) {
            console.error("Error al guardar cliente:", err);
            setError(err.message || "Error al guardar el cliente. Intenta de nuevo.");
            toast.error('Ocurrió un error al guardar el cliente.'); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="client-form-container">
            <h2>{clientToEdit ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h2>
            <form onSubmit={handleSubmit} className="client-form">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group">
                    <label htmlFor="clientName">Nombre:</label>
                    <input type="text" id="clientName" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                {/* ... (otros campos del formulario no cambian) ... */}
                <div className="form-group">
                    <label htmlFor="clientLastName">Apellido:</label>
                    <input type="text" id="clientLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="clientPhone">Teléfono:</label>
                    <input type="text" id="clientPhone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="clientEmail">Email:</label>
                    <input type="email" id="clientEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <div className="form-group">
                    <label htmlFor="clientPassword">Contraseña (Portal de Clientes):</label>
                    <input type="password" id="clientPassword" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={clientToEdit ? 'Dejar en blanco para no cambiar' : ''} />
                    {clientToEdit && <p className="hint-text">Si dejas este campo en blanco, la contraseña actual no se modificará.</p>}
                </div>
                {/* --- FIN DE LA MODIFICACIÓN --- */}

                <div className="form-group">
                    <label htmlFor="clientAddress">Dirección:</label>
                    <input type="text" id="clientAddress" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="clientCity">Ciudad:</label>
                    <input type="text" id="clientCity" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="clientState">Estado:</label>
                    <input type="text" id="clientState" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="clientZipCode">C.P.:</label>
                    <input type="text" id="clientZipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="clientIdentificationId">ID de Identificación:</label>
                    <input type="text" id="clientIdentificationId" value={identificationId} onChange={(e) => setIdentificationId(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="clientNotes">Notas:</label>
                    <textarea id="clientNotes" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (clientToEdit ? 'Actualizar Cliente' : 'Agregar Cliente')}
                </button>
                {clientToEdit && (
                    <button type="button" onClick={resetForm} disabled={loading} className="cancel-button">
                        Cancelar Edición
                    </button>
                )}
            </form>
        </div>
    );
}

export default ClientForm;