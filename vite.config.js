import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"
import compression from "vite-plugin-compression2"

export default defineConfig({
  base: './', // Garante que os assets sejam carregados corretamente em produção
  build: {
    chunkSizeWarningLimit: 500, // mantém o alerta realista
    rollupOptions: {
      output: {
        manualChunks(id) {
          // separa OpenLayers em um chunk próprio
          if (id.includes("node_modules/ol")) {
            return "openlayers"
          }
          // separa libs externas em outro chunk
          if (id.includes("node_modules")) {
            return "vendor"
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['ol', 'proj4', '@maptiler/sdk', '@maptiler/geocoding-control']
  },
  plugins: [
    // abre relatório do bundle após o build
    visualizer({
      filename: "stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
    // gera arquivos .br (brotli) para reduzir tamanho transferido
    // compression({
    //   algorithm: "brotliCompress",
    //   ext: ".br",
    //   deleteOriginFile: false,
    // }),
  ],
})
