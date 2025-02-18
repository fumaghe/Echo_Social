// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // base: '/Echo_Social/',  // <--- aggiunto
  plugins: [react()],
  server: {
    port: 5173
  }
});
