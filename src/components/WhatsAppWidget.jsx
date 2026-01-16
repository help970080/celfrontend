// WhatsAppWidget.jsx - Widget llamativo para Celexpress
import { useState, useEffect } from 'react';

const WhatsAppWidget = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Mostrar tooltip después de 2 segundos
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const styles = `
    /* Contenedor principal */
    .wa-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Tooltip/Burbuja de mensaje */
    .wa-tooltip {
      position: absolute;
      bottom: 80px;
      right: 0;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 20px 20px 5px 20px;
      box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
      min-width: 280px;
      animation: wa-bounce 2s ease-in-out infinite, wa-glow 1.5s ease-in-out infinite alternate;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .wa-tooltip:hover {
      transform: scale(1.05);
    }

    .wa-tooltip-title {
      font-weight: 700;
      font-size: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .wa-tooltip-text {
      font-size: 13px;
      line-height: 1.5;
      opacity: 0.95;
    }

    .wa-tooltip-hint {
      font-size: 12px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.3);
      opacity: 0.9;
      background: rgba(0,0,0,0.15);
      margin-left: -20px;
      margin-right: -20px;
      margin-bottom: -15px;
      padding: 12px 20px;
      border-radius: 0 0 5px 20px;
    }

    .wa-tooltip-hint strong {
      color: #ffeb3b;
    }

    /* Flecha del tooltip */
    .wa-tooltip::after {
      content: '';
      position: absolute;
      bottom: -10px;
      right: 30px;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid #128C7E;
    }

    /* Botón de cerrar */
    .wa-close {
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      line-height: 1;
    }

    .wa-close:hover {
      opacity: 1;
    }

    /* Botón principal de WhatsApp */
    .wa-button {
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5);
      transition: all 0.3s ease;
      animation: wa-pulse 2s infinite;
      position: relative;
      text-decoration: none;
    }

    .wa-button:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 30px rgba(37, 211, 102, 0.6);
    }

    .wa-button svg {
      width: 35px;
      height: 35px;
      fill: white;
    }

    /* Badge de notificación */
    .wa-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ff4444;
      color: white;
      font-size: 12px;
      font-weight: bold;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: wa-shake 0.5s ease-in-out infinite;
      box-shadow: 0 2px 8px rgba(255, 68, 68, 0.5);
    }

    /* Animaciones */
    @keyframes wa-pulse {
      0%, 100% { box-shadow: 0 6px 20px rgba(37, 211, 102, 0.5); }
      50% { box-shadow: 0 6px 30px rgba(37, 211, 102, 0.8), 0 0 0 15px rgba(37, 211, 102, 0.1); }
    }

    @keyframes wa-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @keyframes wa-glow {
      from { box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4); }
      to { box-shadow: 0 8px 35px rgba(37, 211, 102, 0.7); }
    }

    @keyframes wa-shake {
      0%, 100% { transform: rotate(0); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .wa-tooltip {
        min-width: 260px;
        right: -10px;
        bottom: 75px;
        font-size: 12px;
      }
      
      .wa-button {
        width: 60px;
        height: 60px;
      }
      
      .wa-button svg {
        width: 32px;
        height: 32px;
      }

      .wa-widget-container {
        bottom: 15px;
        right: 15px;
      }
    }
  `;

  const handleOpenWhatsApp = () => {
    window.open('https://wa.me/14155238886?text=join%20found-expression', '_blank');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="wa-widget-container">
        {/* Tooltip/Burbuja */}
        {showTooltip && (
          <div className="wa-tooltip" onClick={handleOpenWhatsApp}>
            <button 
              className="wa-close" 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
            >
              ×
            </button>
            <div className="wa-tooltip-title">
              💬 ¡Chatea con nosotros!
            </div>
            <div className="wa-tooltip-text">
              📱 <strong>Celulares a crédito</strong> - 10% enganche, 17 semanas<br/>
              📦 <strong>Envíos a todo México</strong> - Cotiza al instante<br/>
              📞 <strong>Contacto:</strong> 56 6019 4420
            </div>
            <div className="wa-tooltip-hint">
              👆 Al entrar te aparecerá un mensaje, solo da <strong>ENTER</strong> para iniciar
            </div>
          </div>
        )}
        
        {/* Botón WhatsApp */}
        <a
          href="https://wa.me/14155238886?text=join%20found-expression"
          className="wa-button"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
        >
          <span className="wa-badge">1</span>
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>
    </>
  );
};

export default WhatsAppWidget;