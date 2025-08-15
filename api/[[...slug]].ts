import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes; route registration is synchronous even though function is marked async
// We don't need the returned HTTP server in serverless env
registerRoutes(app).catch((err) => {
  console.error("Failed to register routes in serverless function:", err);
});

export default serverless(app);


