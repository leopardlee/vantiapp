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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('motion') || id.includes('zustand')) {
                return 'vendor-core'; // Priority high for interactivity
              }
              if (id.includes('@vis.gl') || id.includes('@googlemaps')) {
                return 'vendor-maps';
              }
              if (id.includes('@xenova')) {
                return 'vendor-ai-core'; // Heavy, and non-essential for initial shell
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('d3') || id.includes('recharts')) {
                return 'vendor-viz';
              }
              return 'vendor-misc';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    base: '/',
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: null,
    },
  };
});
