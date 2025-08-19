import express from "express";
import { registerRoutes } from "../server/routes";
import passport from "../server/google-auth";
import session from "express-session";
import MemoryStore from "memorystore";

const app = express();

// CORS middleware for production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all origins for now (you can restrict this later)
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
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
  secret: process.env.VERCEL_SESSION_SECRET || process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new (MemoryStore(session))({
    ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
  }),
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Register all API routes
(async () => {
  try {
    await registerRoutes(app);
    
    // Error handling middleware
    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", err);
      res.status(status).json({ message });
    });

    console.log("API routes registered successfully");
  } catch (error) {
    console.error("Failed to register routes:", error);
  }
})();

// Export for Vercel
export default app;
