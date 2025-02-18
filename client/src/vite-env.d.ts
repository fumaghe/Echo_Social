/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    // Aggiungi qui eventuali altre variabili
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  