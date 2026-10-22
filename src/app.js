import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  cidadeRoutes, 
  adminCidadeRoutes
} from "./routes/cidades.routes.js";
import authRoutes from "./routes/auth.routes.js";
import errorHandler from "./errors/errorHandler.js";
import taxaDeslocamentoRoutes from "./routes/taxaDeslocamento.routes.js";

import {
  servicoRoutes,
  adminServicoRoutes
} from "./routes/servico.routes.js";

const app = express();

// Middlewares globais
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));
app.use(helmet());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/servicos", servicoRoutes);
app.use("/api/admin/servicos", adminServicoRoutes);
app.use("/api/cidades", cidadeRoutes);
app.use("/api/admin/taxas-deslocamento", taxaDeslocamentoRoutes);

// RATE LIMITING - Refatoraremos depois
// app.use("/api", limitadorGeral);

// Tratamento de erros
// app.use(naoEncontrado);
// app.use(tratadorDeErros);
app.use(errorHandler);

export default app;