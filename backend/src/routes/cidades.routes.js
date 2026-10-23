import { Router } from "express";

import cidadeController from "../controllers/cidadeController.js";
import cidadeValidator from "../validators/cidadeValidator.js";
import commonValidator from "../validators/commonValidator.js";
import loginRequired from "../middleware/loginRequired.js";


const cidadeRoutes = Router();
const adminCidadeRoutes = Router();

//-----------------------
// Rotas públicas
//-----------------------

// Listar Cidades
cidadeRoutes.get(
    "/",
    cidadeController.listarCidades
);

//-----------------------
// Rotas administrativas
//-----------------------

adminCidadeRoutes.get(
    "/",
    loginRequired,
    cidadeController.listarTodasCidades
);

//Cadastrar cidadades
adminCidadeRoutes.post(
    "/",
    loginRequired,
    cidadeValidator.validarCadastroCidades,
    cidadeController.cadastrarCidades
);

// Desativar Cidades
adminCidadeRoutes.patch(
    "/:id/desativar",
    loginRequired,
    commonValidator.validarId,
    cidadeController.desativarCidade
);

// Reativar cidade
adminCidadeRoutes.patch(
    "/:id/reativar",
    loginRequired,
    commonValidator.validarId,
    cidadeController.reativarCidade
);

// Editar os dados de uma cidade
adminCidadeRoutes.patch(
    "/:id",
    loginRequired,
    commonValidator.validarId,
    cidadeValidator.validarEdicao,
    cidadeController.editarCidade
);

export  {
    cidadeRoutes,
    adminCidadeRoutes
};