import cors from "cors";
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer, type Server as HttpServer } from "http";

// ====== LOG STARTUP INFO (AI, OpenRouter) ======
const openRouterKey = process.env.OPENROUTER_API_KEY;
const hasOpenRouterKey = openRouterKey && openRouterKey.trim().length > 20;

console.log("\n" + "=".repeat(60));
console.log("🚀 KULINA.AI Server Starting...");
console.log("=".repeat(60));
console.log("✅ AI Features: READY");
console.log("✅ AI Provider: OpenRouter");
console.log("✅ Model: amazon/nova-2-lite-v1:free");
if (hasOpenRouterKey) {
  console.log("✅ OpenRouter API Key: Loaded from .env file");
} else {
  console.log("✅ OpenRouter API Key: Using default (hardcoded fallback)");
}
console.log("=".repeat(60) + "\n");

// ====== SETUP EXPRESS + HTTP SERVER ======
const app = express();
const httpServer = createServer(app);

// ⬇⬇⬇ tambahin ini
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// JSON body parser + rawBody
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// ====== LOG HELPER ======
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// ====== MIDDLEWARE LOGGING UNTUK /api ======
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// ====== BOOTSTRAP ROUTES + DEV/PROD ======
(async () => {
  await registerRoutes(httpServer, app);

  // error handler global
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

    if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Port & host
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.platform === "win32" ? "localhost" : "0.0.0.0";

  httpServer.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
