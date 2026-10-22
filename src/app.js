
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";


// Rotas de autenticação
import authRoutes from "./routes/auth.routes.js";

// Rotas de serviços
import {
    servicoRoutes,
    adminServicoRoutes
} from "./routes/servico.routes.js";

// Rotas de cidades
import {
    cidadeRoutes,
    adminCidadeRoutes
} from "./routes/cidades.routes.js";

// Rotas de taxas de deslocamento
import taxaDeslocamentoRoutes from "./routes/taxaDeslocamento.routes.js";

// Tratamento de erros
import errorHandler from "./errors/errorHandler.js";

const app = express();

// ========================================
// 1. MIDDLEWARES GLOBAIS
// ========================================

app.use(express.json());

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173"
}));

app.use(helmet());

// ========================================
// 2. ROTAS DE AUTENTICAÇÃO
// ========================================

app.use("/api/auth", authRoutes);

// ========================================
// 3. ROTAS PÚBLICAS
// ========================================

app.use("/api/servicos", servicoRoutes);
app.use("/api/cidades", cidadeRoutes);

// ========================================
// 4. ROTAS ADMINISTRATIVAS
// ========================================

app.use("/api/admin/servicos", adminServicoRoutes);
app.use("/api/admin/cidades", adminCidadeRoutes);
app.use("/api/admin/taxas-deslocamento", taxaDeslocamentoRoutes);

// ========================================
// 5. RATE LIMITING (PENDENTE)
// ========================================

// Será configurado antes do deploy.
// O limitador global deverá ser registrado
// antes das rotas que pretende proteger.

// ========================================
// 6. TRATAMENTO GLOBAL DE ERROS
// ========================================

app.use(errorHandler);

export default app;
