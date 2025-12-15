// hooks/useAnalytics.js
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000';

export const useAnalytics = (tiendaId) => {
  const [sessionId, setSessionId] = useState(null);
  const sessionStartTime = useRef(null);
  const lastActivityTime = useRef(Date.now());
  const countersRef = useRef({
    productsViewed: 0,
    searchesMade: 0,
    whatsappClicks: 0
  });

  // Detectar tipo de dispositivo
  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // Obtener o crear session ID
  useEffect(() => {
    let currentSessionId = sessionStorage.getItem('analytics_session_id');
    
    if (!currentSessionId) {
      currentSessionId = uuidv4();
      sessionStorage.setItem('analytics_session_id', currentSessionId);
    }

    setSessionId(currentSessionId);
    sessionStartTime.current = Date.now();

    // Iniciar sesión en backend
    const startSession = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/analytics/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            tiendaId: tiendaId || null,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            ipAddress: null // Se puede obtener en backend
          })
        });
      } catch (error) {
        console.error('Error al iniciar sesión de analytics:', error);
      }
    };

    startSession();

    // Actualizar actividad al mover mouse
    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('click', updateActivity);

    // Cerrar sesión al salir
    const endSession = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/analytics/session/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            productsViewed: countersRef.current.productsViewed,
            searchesMade: countersRef.current.searchesMade,
            whatsappClicks: countersRef.current.whatsappClicks
          })
        });
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    };

    // Guardar al salir de la página
    window.addEventListener('beforeunload', endSession);

    // Limpiar
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('beforeunload', endSession);
    };
  }, [tiendaId]);

  // ==========================================
  // FUNCIONES DE TRACKING
  // ==========================================

  const trackProductView = async (productId, viewSource = 'list') => {
    if (!sessionId) return;

    countersRef.current.productsViewed++;

    try {
      await fetch(`${API_BASE_URL}/api/analytics/product/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId,
          tiendaId,
          viewSource,
          timeSpent: Math.floor((Date.now() - lastActivityTime.current) / 1000)
        })
      });
    } catch (error) {
      console.error('Error al registrar vista de producto:', error);
    }
  };

  const trackSearch = async (searchTerm, resultsCount, filters = {}) => {
    if (!sessionId) return;

    countersRef.current.searchesMade++;

    try {
      await fetch(`${API_BASE_URL}/api/analytics/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          tiendaId,
          searchTerm,
          resultsCount,
          categoryFilter: filters.category || null,
          priceMin: filters.priceMin || null,
          priceMax: filters.priceMax || null,
          sortBy: filters.sortBy || null
        })
      });
    } catch (error) {
      console.error('Error al registrar búsqueda:', error);
    }
  };

  const trackWhatsAppClick = async (product) => {
    if (!sessionId) return;

    countersRef.current.whatsappClicks++;

    try {
      await fetch(`${API_BASE_URL}/api/analytics/whatsapp/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId: product.id,
          tiendaId,
          productName: product.nombre,
          productPrice: product.precio
        })
      });
    } catch (error) {
      console.error('Error al registrar click WhatsApp:', error);
    }
  };

  const trackEvent = async (eventType, eventData = {}) => {
    if (!sessionId) return;

    try {
      await fetch(`${API_BASE_URL}/api/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          tiendaId,
          eventType,
          eventData
        })
      });
    } catch (error) {
      console.error('Error al registrar evento:', error);
    }
  };

  // Calcular tiempo en sesión
  const getSessionDuration = () => {
    if (!sessionStartTime.current) return 0;
    return Math.floor((Date.now() - sessionStartTime.current) / 1000);
  };

  return {
    sessionId,
    trackProductView,
    trackSearch,
    trackWhatsAppClick,
    trackEvent,
    getSessionDuration,
    counters: countersRef.current
  };
};

export default useAnalytics;