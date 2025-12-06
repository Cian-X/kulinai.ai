// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    // hasil build akan masuk ke ../server/client_dist
    outDir: path.resolve(__dirname, "../server/client_dist"),
    emptyOutDir: true,
  },
});
