import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Force rollup to use the JS implementation instead of the native one
      treeshake: {
        moduleSideEffects: "no-external",
      },
      // Add this to ensure better compatibility
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
    // Additional build options for better compatibility
    target: "es2015",
    outDir: "dist",
    assetsDir: "assets",
    minify: "terser",
    sourcemap: false,
  },
  // Add a clear resolve configuration
  resolve: {
    extensions: [".mjs", ".js", ".jsx", ".ts", ".tsx", ".json"],
  },
});
