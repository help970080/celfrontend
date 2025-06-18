import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Estas dependencias no se necesitan para el modo actual sin PDF, pero las dejamos para evitar errores si se usaran
    include: [],
  },
});