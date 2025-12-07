// server/static.ts
import path from "path";
import express from "express";

export function serveStatic(app: express.Express) {
  const clientDist = path.join(__dirname, "client_dist"); // hasil build Vite
  app.use(express.static(clientDist));

  // SPA catch-all: kembalikan index.html untuk route yang bukan /api
  app.get("/*", (req, res) => {
    // jangan override kalau endpoint API (opsional)
    if (req.path.startsWith("/api")) return res.status(404).send("Not found");
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
