import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (id.includes('/node_modules/recharts/') || id.includes('/node_modules/d3-')) return 'vendor-charts';
          if (id.includes('/node_modules/react-leaflet/') || id.includes('/node_modules/leaflet/')) return 'vendor-map';
          if (id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react/')) return 'vendor-react';
        },
      },
    },
  },
})
