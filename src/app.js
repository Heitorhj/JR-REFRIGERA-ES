import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./errors/errorHandler.js";

const app = express();


import servicoRoutes from "./routes/servico.routes.js";
import authRoutes from "./routes/auth.routes.js";

// Middlewares globais
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));

app.use(helmet());

// ===================================
// ROTAS 
// ===================================

app.use("/api/auth", authRoutes);
app.use("/api/servicos", servicoRoutes);

// ===================================
// RATE LIMITING - Refatoraremos depois
// ===================================

// app.use("/api", limitadorGeral);

// ===================================
// TRATAMENTO DE ERROS - Depois
// ===================================

// app.use(naoEncontrado);
// app.use(tratadorDeErros);
app.use(errorHandler);

export default app;