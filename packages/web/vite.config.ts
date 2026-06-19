import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy timeouts: region detail can take ~10s on first request (cold cache)
// because it composes 50+ DuckDB queries. Allow up to 60s.
const PROXY_TIMEOUT_MS = 60_000;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: PROXY_TIMEOUT_MS,
        proxyTimeout: PROXY_TIMEOUT_MS,
      },
      "/static": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: PROXY_TIMEOUT_MS,
        proxyTimeout: PROXY_TIMEOUT_MS,
      },
    },
  },
});
