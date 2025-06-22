// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
// La línea 'import ./thermal-print.css' ha sido eliminada.

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);