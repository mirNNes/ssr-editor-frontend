import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Production path for GitHub Pages and dev path for local.

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/ssr-editor-frontend/" : "/",

  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
}));
