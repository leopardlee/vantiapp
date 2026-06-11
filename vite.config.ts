import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
    },
    build: {
      chunkSizeWarningLimit: 1200,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'motion', 'zustand'],
            'vendor-maps': ['@vis.gl/react-google-maps', '@googlemaps/markerclusterer'],
            'vendor-ai-core': ['@xenova/transformers'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-viz': ['recharts', 'd3'],
            'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    base: './',
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: null,
    },
  };
});
