import { Router } from "express";

import servicoController from "../controllers/servicoController.js";
import servicoValidator from "../validators/servicoValidator.js";
import loginRequired from "../middleware/loginRequired.js";

const servicoRoutes = Router();
const adminServicoRoutes = Router();

// Públicas
servicoRoutes.get(
    "/",
    servicoController.listar
);

// Cadastrar serviço — administrador
adminServicoRoutes.post(
    "/",
    loginRequired,
    servicoValidator.ValidarCriarServico,
    servicoController.CriarServico
);

// Desativar serviço — administrador
adminServicoRoutes.patch(
    "/:id/desativar",
    loginRequired,
    servicoValidator.ValidarDesativarServico,
    servicoController.DesativarServico
);

export {
    servicoRoutes,
    adminServicoRoutes
};