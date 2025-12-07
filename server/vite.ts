import type { Express } from "express";
import type { Server } from "http";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

export async function setupVite(httpServer: Server, app: Express) {
  // root folder React client
  const root = path.resolve(__dirname, "..", "client");

  const vite = await createViteServer({
    root,
    appType: "custom",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(root, "src"),
        "@shared": path.resolve(__dirname, "..", "shared"),
      },
    },
    server: {
      middlewareMode: true,
      hmr: {
        server: httpServer,
        path: "/vite-hmr",
      },
    },
  });

  // inject Vite middleware
  app.use(vite.middlewares);

  // semua route non-/api diarahkan ke React index.html
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;

      const indexHtmlPath = path.resolve(root, "index.html");
      let template = await fs.promises.readFile(indexHtmlPath, "utf-8");

      // tambahin query random biar main.tsx ke-bust cache di dev
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
