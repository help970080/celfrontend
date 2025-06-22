// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Importación de los estilos
import './index.css'
import './thermal-print.css' // <--- LÍNEA AÑADIDA: Importa los estilos para la impresora

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)