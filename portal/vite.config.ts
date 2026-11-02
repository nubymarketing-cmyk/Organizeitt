import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // A página de demonstração (VITE_ROUTER=memory) vira um HTML único: sem divisão de código.
  const singleFile = loadEnv(mode, '.', 'VITE_').VITE_ROUTER === 'memory';
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: singleFile
          ? { inlineDynamicImports: true }
          : {
              // Bibliotecas em arquivos próprios: mudam pouco e ficam no cache do navegador.
              manualChunks: {
                react: ['react', 'react-dom', 'react-router-dom'],
                query: ['@tanstack/react-query'],
                supabase: ['@supabase/supabase-js'],
              },
            },
      },
    },
  };
});
