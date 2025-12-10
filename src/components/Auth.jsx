import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function Auth({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [canRegister, setCanRegister] = useState(false);
    const [loadingRegistrationStatus, setLoadingRegistrationStatus] = useState(true);

    useEffect(() => {
        const checkRegistrationStatus = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/is-registration-allowed`);
                const data = await response.json();
                setCanRegister(data.isRegistrationAllowed);
                if (!data.isRegistrationAllowed) {
                    setIsRegistering(false);
                }
            } catch (err) {
                console.error("Error al verificar estado de registro:", err);
                toast.error("Error al verificar el estado de registro del administrador.");
                setCanRegister(false); 
            } finally {
                setLoadingRegistrationStatus(false);
            }
        };
        checkRegistrationStatus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const endpoint = isRegistering ? 'register' : 'login';
        const url = `${API_BASE_URL}/api/auth/${endpoint}`;

        if (isRegistering && !canRegister) {
            setError('El registro de nuevos administradores está deshabilitado. Por favor, inicia sesión.');
            toast.error('Registro no permitido.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error HTTP: ${response.status}`);
            }

            if (isRegistering) {
                setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
                toast.success('Registro exitoso! Por favor, inicia sesión.');
                setIsRegistering(false); 
                setUsername('');
                setPassword('');
                setCanRegister(false); 
                onLoginSuccess(data.token, data.username, data.role, data.tiendaId); 
            } else {
                setSuccess('Login exitoso.');
                toast.success(`Bienvenido, ${data.username}!`);
                onLoginSuccess(data.token, data.username, data.role, data.tiendaId); 
            }
        } catch (err) {
            console.error("Error de autenticación:", err);
            setError(err.message || "Ocurrió un error. Verifica tus credenciales.");
            toast.error('Error de autenticación. Verifica tus credenciales.');
        } finally {
            setLoading(false); 
        }
    };

    if (loadingRegistrationStatus) {
        return (
            <div className="auth-container">
                <p>Verificando estado del sistema...</p>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <h2>{isRegistering && canRegister ? 'Registrar Administrador' : 'Iniciar Sesión'}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group">
                    <label htmlFor="authUsername">Nombre de Usuario:</label>
                    <input
                        type="text"
                        id="authUsername"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="authPassword">Contraseña:</label>
                    <input
                        type="password"
                        id="authPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Cargando...' : (isRegistering && canRegister ? 'Registrar' : 'Iniciar Sesión')}
                </button>

                {canRegister ? (
                    <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        disabled={loading}
                        className="toggle-auth-mode-button"
                    >
                        {isRegistering ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate (Primer Administrador)'}
                    </button>
                ) : (
                    <p className="hint-text" style={{marginTop: '20px', color: '#dc3545'}}>
                        El registro de nuevos administradores está deshabilitado.
                    </p>
                )}
            </form>
        </div>
    );
}

export default Auth;