import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ["defaults", "not IE 11"],
      modernPolyfills: true
    })
  ],
  build: {
    target: "es2017"
  },
  server: {
    host: true,
    port: 5173
  }
});
