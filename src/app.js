import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

// Middlewares globais
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));

app.use(helmet());

// ===================================
// ROTAS - Implementaremos depois
// ===================================

// app.use("/api/auth", authRoutes);
// app.use("/api/pedidos", pedidoRoutes);
// app.use("/api/servicos", servicoRoutes);
// app.use("/api/cidades", cidadeRoutes);
// app.use("/api/admin", adminRoutes);

// ===================================
// RATE LIMITING - Refatoraremos depois
// ===================================

// app.use("/api", limitadorGeral);

// ===================================
// TRATAMENTO DE ERROS - Depois
// ===================================

// app.use(naoEncontrado);
// app.use(tratadorDeErros);

export default app;