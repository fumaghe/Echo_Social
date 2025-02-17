import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Se usi lucide-react e non hai i tipi, crea un file global.d.ts con `declare module 'lucide-react';`
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
