// src/components/ClientDocuments.jsx - MODAL DE DOCUMENTOS Y VERIFICACIÓN FACIAL
// ⭐ MEJORADO: Compresión de imágenes + Cámara nativa en móvil

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import * as faceapi from 'face-api.js';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

// ⭐ FUNCIÓN DE COMPRESIÓN DE IMAGEN
const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensionar si es muy grande
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            console.log(`📦 Imagen comprimida: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB`);
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Error al comprimir'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

function ClientDocuments({ clientId, clientName, onClose, authenticatedFetch }) {
    const [documents, setDocuments] = useState({
        ineFrente: null,
        ineReverso: null,
        selfie: null,
        fotoEntrega: null,
        fotoEquipo: null
    });
    const [verification, setVerification] = useState({
        score: null,
        status: 'pendiente',
        verifiedAt: null
    });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState({});
    const [uploadProgress, setUploadProgress] = useState({});
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const selfieInputRef = useRef(null);

    // Detectar si es móvil
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Cargar modelos de face-api.js desde CDN
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                console.log('✅ Modelos de Face-API cargados desde CDN');
            } catch (error) {
                console.error('Error cargando modelos:', error);
                toast.warning('Verificación facial no disponible - reintenta en unos segundos');
            }
        };
        loadModels();
    }, []);

    // Cargar documentos existentes
    useEffect(() => {
        fetchDocuments();
    }, [clientId]);

    // Limpiar cámara al cerrar
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}/documents`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data.documents);
                setVerification(data.verification);
            }
        } catch (error) {
            console.error('Error al cargar documentos:', error);
        } finally {
            setLoading(false);
        }
    };

    // ⭐ SUBIDA CON COMPRESIÓN
    const handleFileUpload = async (docType, file) => {
        if (!file) return;

        setUploading(prev => ({ ...prev, [docType]: true }));
        setUploadProgress(prev => ({ ...prev, [docType]: 'Comprimiendo...' }));
        
        try {
            // Comprimir imagen antes de subir
            const compressedFile = await compressImage(file, 800, 0.7);
            
            setUploadProgress(prev => ({ ...prev, [docType]: 'Subiendo...' }));
            
            const formData = new FormData();
            formData.append('image', compressedFile);

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/documents/${docType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            const result = await response.json();
            setDocuments(prev => ({ ...prev, [docType]: result.url }));
            toast.success(`${getDocLabel(docType)} subido correctamente`);
        } catch (error) {
            toast.error(`Error al subir: ${error.message}`);
        } finally {
            setUploading(prev => ({ ...prev, [docType]: false }));
            setUploadProgress(prev => ({ ...prev, [docType]: null }));
        }
    };

    const getDocLabel = (docType) => {
        const labels = {
            ineFrente: 'INE Frente',
            ineReverso: 'INE Reverso',
            selfie: 'Selfie',
            fotoEntrega: 'Foto de Entrega',
            fotoEquipo: 'Foto del Equipo'
        };
        return labels[docType] || docType;
    };

    // ⭐ INICIAR CÁMARA MEJORADA
    const startCamera = async () => {
        setCameraError(null);
        
        // En móvil, usar input nativo como fallback
        if (isMobile) {
            // Intentar getUserMedia primero
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'user',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    } 
                });
                setCameraStream(stream);
                setShowCamera(true);
                
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }, 100);
            } catch (error) {
                console.log('getUserMedia falló, usando input nativo');
                // Fallback: abrir selector de cámara nativo
                if (selfieInputRef.current) {
                    selfieInputRef.current.click();
                }
            }
        } else {
            // En desktop, usar getUserMedia normal
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user', width: 640, height: 480 } 
                });
                setCameraStream(stream);
                setShowCamera(true);
                
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }, 100);
            } catch (error) {
                toast.error('No se pudo acceder a la cámara');
                setCameraError('No se pudo acceder a la cámara. Usa el botón "Subir desde galería".');
                console.error('Error de cámara:', error);
            }
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
        setCameraError(null);
    };

    // ⭐ CAPTURA CON COMPRESIÓN
    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Usar resolución reducida
        const targetWidth = 640;
        const targetHeight = 480;
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Dibujar con espejo
        context.translate(targetWidth, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, targetWidth, targetHeight);

        // Convertir a blob con compresión
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
                console.log(`📷 Selfie capturada: ${(blob.size / 1024).toFixed(0)}KB`);
                await handleFileUpload('selfie', file);
                stopCamera();
            }
        }, 'image/jpeg', 0.7); // Calidad 70%
    };

    // Verificación facial
    const verifyFace = async () => {
        if (!documents.ineFrente || !documents.selfie) {
            toast.warning('Necesitas subir el INE (frente) y la selfie primero');
            return;
        }

        if (!modelsLoaded) {
            toast.error('Los modelos de verificación no están cargados');
            return;
        }

        setVerifying(true);
        toast.info('Analizando rostros...');

        try {
            const ineImage = await faceapi.fetchImage(documents.ineFrente);
            const selfieImage = await faceapi.fetchImage(documents.selfie);

            const ineDetection = await faceapi
                .detectSingleFace(ineImage)
                .withFaceLandmarks()
                .withFaceDescriptor();

            const selfieDetection = await faceapi
                .detectSingleFace(selfieImage)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!ineDetection) {
                toast.error('No se detectó rostro en el INE');
                setVerifying(false);
                return;
            }

            if (!selfieDetection) {
                toast.error('No se detectó rostro en la selfie');
                setVerifying(false);
                return;
            }

            const distance = faceapi.euclideanDistance(
                ineDetection.descriptor,
                selfieDetection.descriptor
            );

            let similarity;
            if (distance <= 0.4) {
                similarity = 100;
            } else if (distance >= 1.0) {
                similarity = 0;
            } else {
                similarity = Math.max(0, (1 - (distance - 0.4) / 0.6) * 100);
            }
            const score = parseFloat(similarity.toFixed(1));

            const response = await authenticatedFetch(`${API_BASE_URL}/api/clients/${clientId}/verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ score })
            });

            if (response.ok) {
                const result = await response.json();
                setVerification({
                    score: result.score,
                    status: result.status,
                    verifiedAt: result.verifiedAt
                });

                if (score >= 50) {
                    toast.success(`✅ Verificación exitosa: ${score}% de coincidencia`);
                } else if (score >= 30) {
                    toast.warning(`⚠️ Coincidencia media: ${score}% - Requiere revisión manual`);
                } else {
                    toast.error(`❌ Coincidencia baja: ${score}% - Los rostros no coinciden`);
                }
            }

        } catch (error) {
            console.error('Error en verificación:', error);
            toast.error('Error al verificar rostros');
        } finally {
            setVerifying(false);
        }
    };

    const getStatusBadge = (status, score) => {
        const styles = {
            verificado: { bg: '#d4edda', color: '#155724', text: '✅ Verificado' },
            revision: { bg: '#fff3cd', color: '#856404', text: '⚠️ En Revisión' },
            rechazado: { bg: '#f8d7da', color: '#721c24', text: '❌ Rechazado' },
            pendiente: { bg: '#e2e3e5', color: '#383d41', text: '⏳ Pendiente' }
        };
        const style = styles[status] || styles.pendiente;
        
        return (
            <span style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '20px',
                backgroundColor: style.bg,
                color: style.color,
                fontWeight: '600',
                fontSize: '14px'
            }}>
                {style.text} {score ? `(${score}%)` : ''}
            </span>
        );
    };

    // ⭐ RENDER SLOT MEJORADO CON CAPTURE PARA MÓVIL
    const renderDocumentSlot = (docType, label, icon, useCamera = false) => (
        <div className="doc-slot" style={{
            border: '2px dashed #ddd',
            borderRadius: '12px',
            padding: '15px',
            textAlign: 'center',
            backgroundColor: documents[docType] ? '#f8fff8' : '#fafafa',
            borderColor: documents[docType] ? '#28a745' : '#ddd'
        }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontWeight: '600', marginBottom: '10px' }}>{label}</div>
            
            {documents[docType] ? (
                <div>
                    <img 
                        src={documents[docType]} 
                        alt={label}
                        style={{
                            width: '100%',
                            maxHeight: '150px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '10px'
                        }}
                    />
                    <button
                        onClick={() => window.open(documents[docType], '_blank')}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginRight: '5px'
                        }}
                    >
                        Ver completo
                    </button>
                </div>
            ) : (
                <p style={{ color: '#999', fontSize: '13px' }}>No subido</p>
            )}
            
            <div style={{ marginTop: '10px' }}>
                {/* ⭐ INPUT CON CAPTURE PARA CÁMARA NATIVA EN MÓVIL */}
                <input
                    type="file"
                    accept="image/*"
                    capture={useCamera ? "environment" : undefined}
                    id={`file-${docType}`}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                    disabled={uploading[docType]}
                />
                
                {/* Botón para tomar foto (abre cámara nativa en móvil) */}
                {isMobile && (
                    <>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            id={`camera-${docType}`}
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(docType, e.target.files[0])}
                            disabled={uploading[docType]}
                        />
                        <label
                            htmlFor={`camera-${docType}`}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: uploading[docType] ? '#ccc' : '#28a745',
                                color: 'white',
                                borderRadius: '6px',
                                cursor: uploading[docType] ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                display: 'inline-block',
                                marginRight: '5px',
                                marginBottom: '5px'
                            }}
                        >
                            📷 Tomar foto
                        </label>
                    </>
                )}
                
                {/* Botón para subir de galería */}
                <label
                    htmlFor={`file-${docType}`}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: uploading[docType] ? '#ccc' : '#6c757d',
                        color: 'white',
                        borderRadius: '6px',
                        cursor: uploading[docType] ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        display: 'inline-block'
                    }}
                >
                    {uploading[docType] 
                        ? (uploadProgress[docType] || 'Procesando...') 
                        : (documents[docType] ? '🔄 Cambiar' : '📁 Galería')}
                </label>
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'white',
                    zIndex: 10
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>📄 Documentos del Cliente</h2>
                        <p style={{ margin: '5px 0 0', color: '#666' }}>{clientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '28px',
                            cursor: 'pointer',
                            color: '#999'
                        }}
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        Cargando documentos...
                    </div>
                ) : (
                    <div style={{ padding: '20px' }}>
                        {/* Estado de verificación */}
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            padding: '15px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                        }}>
                            <div>
                                <strong>Estado de Verificación:</strong>
                                <span style={{ marginLeft: '10px' }}>
                                    {getStatusBadge(verification.status, verification.score)}
                                </span>
                            </div>
                            <button
                                onClick={verifyFace}
                                disabled={verifying || !documents.ineFrente || !documents.selfie}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: verifying ? '#ccc' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: verifying ? 'not-allowed' : 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {verifying ? '🔄 Verificando...' : '🔍 Verificar Identidad'}
                            </button>
                        </div>

                        {/* Sección INE */}
                        <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#333' }}>
                            🪪 Identificación Oficial (INE)
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px',
                            marginBottom: '25px'
                        }}>
                            {renderDocumentSlot('ineFrente', 'INE Frente', '🪪')}
                            {renderDocumentSlot('ineReverso', 'INE Reverso', '🔄')}
                        </div>

                        {/* Sección Selfie con cámara */}
                        <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#333' }}>
                            📸 Selfie para Verificación
                        </h3>
                        
                        {/* ⭐ INPUT OCULTO PARA SELFIE CON CÁMARA FRONTAL */}
                        <input
                            ref={selfieInputRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload('selfie', e.target.files[0])}
                        />
                        
                        {showCamera ? (
                            <div style={{
                                backgroundColor: '#000',
                                borderRadius: '12px',
                                padding: '15px',
                                textAlign: 'center',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    position: 'relative',
                                    display: 'inline-block',
                                    maxWidth: '400px',
                                    width: '100%'
                                }}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{
                                            width: '100%',
                                            borderRadius: '8px',
                                            transform: 'scaleX(-1)'
                                        }}
                                    />
                                    {/* SVG Overlay con óvalo */}
                                    <svg
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            pointerEvents: 'none'
                                        }}
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <mask id="faceMask">
                                                <rect x="0" y="0" width="100" height="100" fill="white" />
                                                <ellipse cx="50" cy="45" rx="28" ry="38" fill="black" />
                                            </mask>
                                        </defs>
                                        <rect 
                                            x="0" y="0" 
                                            width="100" height="100" 
                                            fill="rgba(0,0,0,0.6)" 
                                            mask="url(#faceMask)" 
                                        />
                                        <ellipse 
                                            cx="50" cy="45" 
                                            rx="28" ry="38" 
                                            fill="none" 
                                            stroke="#00ff00" 
                                            strokeWidth="0.8"
                                            strokeDasharray="3,2"
                                        />
                                    </svg>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '15px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        color: '#00ff00',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        👤 Centra tu rostro aquí
                                    </div>
                                </div>
                                <canvas ref={canvasRef} style={{ display: 'none' }} />
                                <div style={{ marginTop: '15px' }}>
                                    <button
                                        onClick={capturePhoto}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '25px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            marginRight: '10px'
                                        }}
                                    >
                                        📷 Capturar
                                    </button>
                                    <button
                                        onClick={stopCamera}
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '25px',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        ✕ Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '15px',
                                marginBottom: '25px'
                            }}>
                                {/* ⭐ BOTONES MEJORADOS PARA SELFIE */}
                                <div style={{
                                    border: '2px dashed #007bff',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    backgroundColor: '#f0f7ff'
                                }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📷</div>
                                    
                                    {cameraError && (
                                        <p style={{ color: '#dc3545', fontSize: '12px', marginBottom: '10px' }}>
                                            {cameraError}
                                        </p>
                                    )}
                                    
                                    {isMobile ? (
                                        <>
                                            {/* En móvil: botón que abre cámara nativa */}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="user"
                                                id="selfie-camera"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleFileUpload('selfie', e.target.files[0])}
                                                disabled={uploading.selfie}
                                            />
                                            <label
                                                htmlFor="selfie-camera"
                                                style={{
                                                    padding: '12px 25px',
                                                    backgroundColor: uploading.selfie ? '#ccc' : '#007bff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: uploading.selfie ? 'not-allowed' : 'pointer',
                                                    fontWeight: '600',
                                                    display: 'inline-block',
                                                    marginBottom: '10px'
                                                }}
                                            >
                                                {uploading.selfie ? (uploadProgress.selfie || 'Procesando...') : '📷 Tomar Selfie'}
                                            </label>
                                            <br />
                                            <button
                                                onClick={startCamera}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                🎥 Usar vista previa
                                            </button>
                                        </>
                                    ) : (
                                        /* En desktop: abrir cámara con preview */
                                        <button
                                            onClick={startCamera}
                                            style={{
                                                padding: '12px 25px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Abrir Cámara
                                        </button>
                                    )}
                                </div>
                                {renderDocumentSlot('selfie', 'Selfie', '🤳')}
                            </div>
                        )}

                        {/* Sección Entrega */}
                        <h3 style={{ marginTop: '20px', marginBottom: '15px', color: '#333' }}>
                            📦 Evidencia de Entrega
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            {renderDocumentSlot('fotoEntrega', 'Foto de Entrega', '🤝')}
                            {renderDocumentSlot('fotoEquipo', 'Foto del Equipo', '📱')}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.getElementById('modal-root')
    );
}

export default ClientDocuments;