import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  define: {
    __PROXY_PORT__: JSON.stringify(process.env.PROXY_PORT || '3002'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        admin: path.resolve(__dirname, "admin/index.html"),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['i18next', 'react-i18next'],
          supabase: ['@supabase/supabase-js'],
          zustand: ['zustand'],
          d3: ['d3-geo', 'd3-polygon'],
          lucide: ['lucide-react'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 200,
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'i18next', 'react-i18next'],
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT || 5173),
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    proxy: {
      '/proxy': {
        target: `http://localhost:${process.env.PROXY_PORT || '3002'}`,
        changeOrigin: true,
      },
      '/carcg-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/carcg-api/, ''),
      },
      '/plate-logo-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/plate-logo-api/, ''),
      },
    },
  },
})
