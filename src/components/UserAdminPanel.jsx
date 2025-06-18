import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "America/Mexico_City";

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function UserAdminPanel({ authenticatedFetch, userRole }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userToEdit, setUserToEdit] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);
    const [formSuccess, setFormSuccess] = useState(null);

    const availableRoles = ['super_admin', 'regular_admin', 'sales_admin', 'inventory_admin', 'viewer_reports'];

    const hasPermission = useCallback((roles) => {
        if (!userRole) return false;
        if (Array.isArray(roles)) {
            return roles.includes(userRole);
        }
        return userRole === roles;
    }, [userRole]); 

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/users`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            console.error("Error al obtener usuarios:", err);
            setError(err.message || "No se pudieron cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]); 

    useEffect(() => {
        if (hasPermission('super_admin')) {
            fetchUsers();
        } else {
            setLoading(false);
            setError("Acceso denegado. Solo super administradores pueden gestionar usuarios.");
        }
    }, [fetchUsers, hasPermission]); 

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        setFormSuccess(null);

        if (!username || !role || (userToEdit === null && !password)) {
            setFormError('Nombre de usuario, rol y contraseña (para nuevo usuario) son obligatorios.');
            setFormLoading(false);
            return;
        }
        if (!availableRoles.includes(role)) {
            setFormError('El rol seleccionado no es válido.');
            setFormLoading(false);
            return;
        }

        const userData = { username, role };
        if (password) {
            userData.password = password;
        }

        const url = userToEdit ? `${API_BASE_URL}/api/users/${userToEdit.id}` : `${API_BASE_URL}/api/users`;
        const method = userToEdit ? 'PUT' : 'POST';

        try {
            const response = await authenticatedFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            setFormSuccess(userToEdit ? 'Usuario actualizado con éxito!' : 'Usuario creado con éxito!');
            toast.success(userToEdit ? 'Usuario actualizado!' : 'Usuario creado!');
            resetForm();
            fetchUsers();
        } catch (err) {
            console.error("Error al guardar usuario:", err);
            setFormError(err.message || "Error al guardar el usuario. Intenta de nuevo.");
            toast.error('Ocurrió un error al guardar el usuario.');
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setUsername('');
        setPassword('');
        setRole('');
        setUserToEdit(null);
        setShowForm(false);
        setFormError(null);
        setFormSuccess(null);
    };

    const handleEditClick = (user) => {
        setUserToEdit(user);
        setUsername(user.username);
        setRole(user.role);
        setPassword('');
        setShowForm(true);
        setFormError(null);
        setFormSuccess(null);
    };

    const currentLoggedInUserId = parseInt(localStorage.getItem('userId'), 10); 

    const handleDeleteUser = async (id, usernameToDelete) => {
        if (id === currentLoggedInUserId) { 
             toast.error('No puedes eliminar tu propia cuenta a través de esta interfaz.');
             return;
        }

        if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${usernameToDelete}"?`)) {
            return;
        }
        try {
            await authenticatedFetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
            toast.success('Usuario eliminado con éxito!');
            fetchUsers();
        } catch (err) {
            console.error("Error al eliminar usuario:", err);
            toast.error(`Error al eliminar el usuario: ${err.message || "Error desconocido."}`);
        }
    };

    if (!hasPermission('super_admin')) {
        return (
            <section className="user-admin-section">
                <h2>Gestión de Usuarios</h2>
                <p className="error-message">Acceso denegado. Solo los Super Administradores pueden gestionar usuarios.</p>
            </section>
        );
    }

    if (loading) {
        return (
            <section className="user-admin-section">
                <h2>Gestión de Usuarios</h2>
                <p>Cargando usuarios...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="user-admin-section">
                <h2>Gestión de Usuarios</h2>
                <p className="error-message">Error: {error}</p>
            </section>
        );
    }

    return (
        <section className="user-admin-section">
            <h2>Gestión de Usuarios</h2>

            <button onClick={() => setShowForm(!showForm)} className="action-button primary-button" style={{marginBottom: '20px'}}>
                {showForm ? 'Ocultar Formulario' : 'Agregar Nuevo Usuario'}
            </button>

            {showForm && (
                <div className="user-form-container">
                    <h3>{userToEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
                    <form onSubmit={handleFormSubmit} className="user-form">
                        {formError && <p className="error-message">{formError}</p>}
                        {formSuccess && <p className="success-message">{formSuccess}</p>}

                        <div className="form-group">
                            <label htmlFor="username">Nombre de Usuario:</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={userToEdit && userToEdit.role === 'super_admin'}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Contraseña {userToEdit ? '(dejar en blanco para no cambiar)' : '*'}:</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={userToEdit === null}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="role">Rol:</label>
                            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
                                <option value="">Selecciona un rol</option>
                                {availableRoles.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" disabled={formLoading}>
                            {formLoading ? 'Guardando...' : (userToEdit ? 'Actualizar Usuario' : 'Crear Usuario')}
                        </button>
                        {userToEdit && (
                            <button type="button" onClick={resetForm} disabled={formLoading} className="cancel-button">
                                Cancelar Edición
                            </button>
                        )}
                    </form>
                </div>
            )}

            <h3>Usuarios Existentes</h3>
            {users.length === 0 ? (
                <p>No hay usuarios registrados.</p>
            ) : (
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Creado</th>
                            <th>Actualizado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td><span className={`status-badge status-${user.role}`}>{user.role}</span></td>
                                <td>{moment(user.createdAt).tz("America/Mexico_City").format('DD/MM/YYYY')}</td>
                                <td>{moment(user.updatedAt).tz("America/Mexico_City").format('DD/MM/YYYY')}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button onClick={() => handleEditClick(user)}>Editar</button>
                                        {user.id !== currentLoggedInUserId && ( 
                                            <button className="delete-button" onClick={() => handleDeleteUser(user.id, user.username)}>Eliminar</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

export default UserAdminPanel;