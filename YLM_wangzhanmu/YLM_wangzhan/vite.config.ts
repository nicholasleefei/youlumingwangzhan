import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
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
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    })
  ],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'i18next', 'react-i18next'],
  },
  server: {
    host: '0.0.0.0',
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
})
