// ============================================
// REEMPLAZA LA COLUMNA DE ACCIONES COMPLETA EN SaleList.jsx
// Busca: <td> que contiene los botones "Ver Recibo" y "Eliminar"
// ============================================

<td style={{ 
    position: 'relative', 
    zIndex: 100,
    minWidth: '200px'
}}>
    <div 
        className="action-buttons" 
        style={{ 
            display: 'flex', 
            gap: '8px', 
            flexDirection: 'column',
            minWidth: '150px',
            position: 'relative',
            zIndex: 100,
            pointerEvents: 'auto'
        }}
    >
        <button 
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 Click en Ver Recibo - ID:', sale.id);
                handleOpenReceiptModal(sale.id);
            }}
            style={{
                padding: '6px 12px',
                cursor: 'pointer',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: '600',
                position: 'relative',
                zIndex: 101,
                pointerEvents: 'auto'
            }}
        >
            Ver Recibo
        </button>
        
        {hasPermission('super_admin') && (
            <button 
                className="delete-button" 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 ¡¡¡CLICK EN ELIMINAR DETECTADO!!!');
                    console.log('🔴 ID de venta a eliminar:', sale.id);
                    console.log('🔴 Tipo de onDeleteSale:', typeof onDeleteSale);
                    console.log('🔴 onDeleteSale existe?', !!onDeleteSale);
                    
                    if (typeof onDeleteSale === 'function') {
                        onDeleteSale(sale.id);
                    } else {
                        console.error('❌ onDeleteSale NO es una función!');
                        alert('Error: La función de eliminar no está disponible.');
                    }
                }}
                style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    position: 'relative',
                    zIndex: 102,
                    pointerEvents: 'auto'
                }}
                onMouseOver={(e) => {
                    console.log('🟡 Mouse sobre botón Eliminar');
                    e.currentTarget.style.backgroundColor = '#c82333';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                }}
            >
                Eliminar
            </button>
        )}
    </div>
</td>