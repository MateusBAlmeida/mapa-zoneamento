
export default {
  build: {
    sourcemap: true,
    build: {
    chunkSizeWarningLimit: 600 * 1024, // Set the limit to 1000 KiB (1 MB)
    rollupOptions: {
      output: {
        manualChunks: {
          ol: ['ol'],
          maptiler: ['@maptiler/sdk'],
          proj4: ['proj4'],
        }
      }
    }
  },
  }
}
