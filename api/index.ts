import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes (ignore returned http server in serverless env)
await registerRoutes(app);

export default serverless(app);


