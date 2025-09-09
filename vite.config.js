import { defineConfig } from "vite"
export default defineConfig({
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 500, // mantém o alerta realista
    rollupOptions: {
      output: {
        manualChunks: {
          // Core OpenLayers
          ol: ['ol'],
          
          // Módulos relacionados ao OpenLayers
          'ol-style': ['ol/style'],
          'ol-layer': ['ol/layer'],
          'ol-source': ['ol/source'],
          
          // MapTiler e Geocoding
          // maptiler: [
          //   '@maptiler/sdk',
          //   '@maptiler/geocoding-control'
          // ],
          
          // Projeções
          proj: ['proj4'],
          
          // Bibliotecas de suporte
          utils: ['ol-mapbox-style']
        }
      },
    },
  },
})