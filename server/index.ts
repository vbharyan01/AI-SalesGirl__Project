import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import passport from "./google-auth";
import session from "express-session";
import MemoryStore from "memorystore";

const app = express();

// Export the app for Vercel
export { app };

// Get CORS origins from environment or use defaults
const getCorsOrigins = () => {
  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    return corsOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default origins based on environment
  if (process.env.NODE_ENV === 'production') {
    return ['https://your-domain.vercel.app']; // Update this with your actual domain
  }
  
  return ['http://localhost:5173', 'http://localhost:3000'];
};

const corsOrigins = getCorsOrigins();

// CORS middleware for development and production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (origin && corsOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // In development, allow localhost origins
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5173');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Fix for Cross-Origin-Opener-Policy - more permissive for development
  if (process.env.NODE_ENV === 'development') {
    res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  }
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new (MemoryStore(session))({
    ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // Only setup Vite in development
  if (process.env.NODE_ENV === 'development') {
    try {
      const { setupVite } = await import('./vite');
      await setupVite(app, server);
    } catch (error) {
      console.log("Vite not available in production");
    }
  }

  // Use a port that is not blocked by macOS system services.
  // Example: 5001, or any available port.
  const port = parseInt(process.env.PORT || '5001', 10);

  server.listen(port, () => {
    console.log(`[express] serving on port ${port}`);
    console.log(`[express] environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[express] CORS origins: ${corsOrigins.join(', ')}`);
  });
})();
