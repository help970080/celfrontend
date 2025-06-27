import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ClientLogin({ onClientLoginSuccess }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/client-auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Error de autenticación');
            }

            // Llamar a la función del App para guardar el estado del cliente
            onClientLoginSuccess(data.token, data.name);
            toast.success(`¡Bienvenido de nuevo, ${data.name}!`);
            navigate('/portal/dashboard'); // Redirigir al dashboard del cliente
        } catch (err) {
            toast.error(err.message || 'Credenciales incorrectas o portal no activado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-container" style={{maxWidth: '400px'}}>
            <h2>Portal de Clientes</h2>
            <p style={{textAlign: 'center', color: '#666', marginTop: '-15px', marginBottom: '25px'}}>Inicia sesión para ver tus compras y saldos.</p>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="clientPhone">Número de Teléfono:</label>
                    <input type="tel" id="clientPhone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="Tu número de teléfono registrado" />
                </div>
                <div className="form-group">
                    <label htmlFor="clientPassword">Contraseña:</label>
                    <input type="password" id="clientPassword" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Tu contraseña" />
                </div>
                <button type="submit" disabled={loading} style={{backgroundColor: '#17a2b8'}}>
                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
            </form>
        </section>
    );
}

export default ClientLogin;