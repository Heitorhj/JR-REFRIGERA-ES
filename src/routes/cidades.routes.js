import { Router } from "express";

import cidadeController from "../controllers/cidadeController.js";
import cidadeValidator from "../validators/cidadeValidator.js";
import loginRequired from "../middleware/loginRequired.js";


const cidadeRoutes = Router();
const adminCidadeRoutes = Router();

// Rotas públicas
cidadeRoutes.get(
    "/",
    cidadeController.listarCidades
);

// Rotas administrativas
adminCidadeRoutes.post(
    "/",
    loginRequired,
    cidadeValidator.validarCadastroCidades,
    cidadeController.cadastrarCidades
);

adminCidadeRoutes.patch(
    "/:id/desativar",
    loginRequired,
    cidadeValidator.validarId,
    cidadeController.desativarCidade
);

export  {
    cidadeRoutes,
    adminCidadeRoutes
};