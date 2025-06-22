// src/components/SaleAdminPanel.jsx - VERSIÓN CORREGIDA CON FORMULARIO RESTAURADO
import React, { useState, useEffect, useCallback } from 'react';
import SaleForm from './SaleForm';
import SaleList from './SaleList';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function SaleAdminPanel({ authenticatedFetch, onDeleteSale, userRole }) {
    const [sales, setSales] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lógica para obtener todos los datos necesarios
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [salesRes, clientsRes, productsRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/sales?limit=999`), // Ajusta según necesites paginación
                authenticatedFetch(`${API_BASE_URL}/api/clients?limit=999`),
                authenticatedFetch(`${API_BASE_URL}/api/products?limit=999`)
            ]);

            if (!salesRes.ok) throw new Error('Error al cargar ventas');
            if (!clientsRes.ok) throw new Error('Error al cargar clientes');
            if (!productsRes.ok) throw new Error('Error al cargar productos');

            const salesData = await salesRes.json();
            const clientsData = await clientsRes.json();
            const productsData = await productsRes.json();

            setSales(salesData.sales || []);
            setClients(clientsData.clients || []);
            setProducts(productsData.products || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    // Función para saber si el usuario tiene permiso
    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>
            
            {/* 1. EL FORMULARIO DE CAPTURA VUELVE A ESTAR AQUÍ */}
            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <div className="form-wrapper">
                    <SaleForm
                        onSaleAdded={fetchData} // Llama a fetchData para recargar todo
                        clients={clients}
                        products={products}
                        authenticatedFetch={authenticatedFetch}
                    />
                </div>
            )}

            {loading ? (<p>Cargando...</p>) : error ? (<p className="error-message">Error: {error}</p>) : (
                <SaleList
                    sales={sales}
                    onDeleteSale={onDeleteSale}
                    userRole={userRole}
                />
            )}
        </section>
    );
}

export default SaleAdminPanel;