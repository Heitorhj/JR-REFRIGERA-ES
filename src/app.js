import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

import cidadeRoutes from "./routes/cidade.routes.js";
import servicoRoutes from "./routes/servico.routes.js";
import pedidoRoutes from "./routes/pedido.routes.js";
import adminRoutes from "./routes/admin.routes.js";

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
app.use("/api/cidades", cidadeRoutes);
app.use("/api/servicos", servicoRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api/admin", adminRoutes);

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