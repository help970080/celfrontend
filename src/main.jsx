// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// --- INICIO: CÓDIGO AÑADIDO PARA GOOGLE ANALYTICS ---
import ReactGA from 'react-ga4';
// --- FIN: CÓDIGO AÑADIDO PARA GOOGLE ANALYTICS ---

import './index.css';
// La línea 'import ./thermal-print.css' ha sido eliminada.

import App from './App.jsx';


// --- INICIO: CÓDIGO AÑADIDO PARA GOOGLE ANALYTICS ---
// Se inicializa Google Analytics con tu ID antes de renderizar la aplicación
ReactGA.initialize("G-1PDWPTCGDV");
// --- FIN: CÓDIGO AÑADIDO PARA GOOGLE ANALYTICS ---


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);