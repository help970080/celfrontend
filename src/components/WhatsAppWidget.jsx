// WhatsAppWidget.jsx
import { useEffect } from 'react';
import './WhatsAppWidget.css';

const WhatsAppWidget = () => {
  useEffect(() => {
    // Analytics opcional
    const handleClick = () => {
      console.log('WhatsApp widget clicked');
      // Aquí puedes agregar tracking si usas Google Analytics
    };

    const widget = document.querySelector('.whatsapp-float');
    if (widget) {
      widget.addEventListener('click', handleClick);
      return () => widget.removeEventListener('click', handleClick);
    }
  }, []);

  return (
    <a
      href="https://wa.me/14155238886?text=Hola"
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0c-8.837 0-16 7.163-16 16 0 2.825 0.737 5.607 2.137 8.048l-2.137 7.952 8.162-2.137c2.355 1.287 5.011 1.977 7.838 1.977 8.837 0 16-7.163 16-16s-7.163-16-16-16zM16 29.467c-2.482 0-4.908-0.646-7.07-1.87l-0.507-0.292-5.247 1.375 1.4-5.145-0.322-0.532c-1.355-2.244-2.071-4.836-2.071-7.503 0-7.72 6.28-14 14-14s14 6.28 14 14-6.28 14-14 14zM22.344 18.787c-0.397-0.199-2.348-1.158-2.713-1.291s-0.628-0.199-0.893 0.199c-0.265 0.397-1.026 1.291-1.258 1.557s-0.463 0.298-0.86 0.099c-0.398-0.199-1.679-0.619-3.197-1.973-1.182-1.054-1.98-2.357-2.211-2.754s-0.025-0.611 0.174-0.809c0.179-0.178 0.397-0.463 0.596-0.695s0.265-0.397 0.397-0.662c0.132-0.265 0.066-0.497-0.033-0.695s-0.893-2.151-1.224-2.945c-0.322-0.774-0.649-0.67-0.893-0.682-0.231-0.012-0.496-0.015-0.762-0.015s-0.695 0.099-1.060 0.497c-0.364 0.397-1.39 1.357-1.39 3.311s1.423 3.842 1.621 4.108c0.199 0.265 2.807 4.283 6.802 6.008 0.95 0.411 1.691 0.657 2.269 0.841 0.957 0.303 1.828 0.26 2.517 0.158 0.768-0.115 2.348-0.96 2.679-1.888s0.331-1.723 0.232-1.888c-0.099-0.166-0.364-0.265-0.762-0.463z" fill="currentColor"/>
      </svg>
    </a>
  );
};

export default WhatsAppWidget;