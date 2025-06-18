import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

function ProductForm({ onProductAdded, productToEdit, setProductToEdit }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrlsInput, setImageUrlsInput] = useState(''); 
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (productToEdit) {
            setName(productToEdit.name || '');
            setDescription(productToEdit.description || '');
            setPrice(productToEdit.price || '');
            setStock(productToEdit.stock || '');
            setImageUrlsInput(Array.isArray(productToEdit.imageUrls) ? productToEdit.imageUrls.join('\n') : (productToEdit.imageUrls || ''));
            setCategory(productToEdit.category || '');
            setBrand(productToEdit.brand || '');
        } else {
            resetForm();
        }
    }, [productToEdit]);

    const resetForm = () => {
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setImageUrlsInput('');
        setCategory('');
        setBrand('');
        setError(null);
        setSuccess(null);
        if (setProductToEdit) {
            setProductToEdit(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const parsedImageUrls = (imageUrlsInput)
                                    .split(/[\n,]/) 
                                    .map(url => url.trim()) 
                                    .filter(url => url !== ''); 

        const productData = {
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            imageUrls: parsedImageUrls, 
            category,
            brand,
        };

        const url = productToEdit
            ? `${API_BASE_URL}/api/products/${productToEdit.id}`
            : `${API_BASE_URL}/api/products`;
        const method = productToEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            setSuccess(productToEdit ? 'Producto actualizado con éxito!' : 'Producto agregado con éxito!');
            toast.success(productToEdit ? 'Producto actualizado!' : 'Producto agregado!');
            onProductAdded(result);
            resetForm();
        } catch (err) {
            console.error("Error al guardar producto:", err);
            setError(err.message || "Error al guardar el producto. Intenta de nuevo.");
            toast.error('Ocurrió un error al guardar el producto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-form-container">
            <h2>{productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit} className="product-form">
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <div className="form-group">
                    <label htmlFor="name">Nombre:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Descripción:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="price">Precio:</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        step="0.01"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="stock">Existencias:</label>
                    <input
                        type="number"
                        id="stock"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="imageUrls">URLs de Imágenes/Videos (una por línea o separadas por comas):</label>
                    <textarea
                        id="imageUrls"
                        value={imageUrlsInput}
                        onChange={(e) => setImageUrlsInput(e.target.value)}
                        placeholder="Pega las URLs de las imágenes o videos aquí, una por línea o separadas por comas. Ej:
https://example.com/img1.jpg
https://example.com/video.mp4
https://example.com/img2.png"
                        rows="4"
                    ></textarea>
                    <p className="hint-text">Cada URL en una nueva línea o separadas por comas.</p>
                </div>
                <div className="form-group">
                    <label htmlFor="category">Categoría:</label>
                    <input
                        type="text"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="brand">Marca:</label>
                    <input
                        type="text"
                        id="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Agregar Producto')}
                </button>
                {productToEdit && (
                    <button type="button" onClick={resetForm} disabled={loading} className="cancel-button">
                        Cancelar Edición
                    </button>
                )}
            </form>
        </div>
    );
}

export default ProductForm;