// src/components/SaleAdminPanel.jsx - VERSIÓN DE DIAGNÓSTICO FINAL
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

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [salesRes, clientsRes, productsRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/api/sales?limit=100`),
                authenticatedFetch(`${API_BASE_URL}/api/clients?limit=999`),
                authenticatedFetch(`${API_BASE_URL}/api/products?limit=999`)
            ]);

            if (!salesRes.ok) throw new Error(`Error al cargar ventas: ${salesRes.statusText}`);
            if (!clientsRes.ok) throw new Error('Error al cargar clientes');
            if (!productsRes.ok) throw new Error('Error al cargar productos');

            const salesData = await salesRes.json();
            const clientsData = await clientsRes.json();
            const productsData = await productsRes.json();
            
            // --- LÍNEA DE DIAGNÓSTICO ---
            // Esto nos mostrará en la consola del navegador los datos exactos que llegan del backend.
            console.log("DATOS CRUDOS DE VENTAS RECIBIDOS DEL BACKEND:", salesData.sales);
            // --- FIN DE LA LÍNEA DE DIAGNÓSTICO ---

            setSales(salesData.sales || []);
            setClients(clientsData.clients || []);
            setProducts(productsData.products || []);
            setError(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const hasPermission = (roles) => {
        if (!userRole) return false;
        return Array.isArray(roles) ? roles.includes(userRole) : userRole === roles;
    };

    return (
        <section className="sales-section">
            <h2>Gestión de Ventas y Cobranza</h2>
            {hasPermission(['super_admin', 'regular_admin', 'sales_admin']) && (
                <div className="form-wrapper">
                    <SaleForm
                        onSaleAdded={fetchData}
                        clients={clients}
                        products={products}
                        authenticatedFetch={authenticatedFetch}
                    />
                </div>
            )}
            <hr/>
            {loading ? <p>Cargando ventas...</p> : error ? <p className="error-message">Error: {error}</p> : (
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