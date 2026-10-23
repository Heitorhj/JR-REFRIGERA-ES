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

adminServicoRoutes.get(
    "/",
    loginRequired,
    servicoController.listarTodos
);

adminServicoRoutes.post(
    "/",
    loginRequired,
    servicoValidator.ValidarCriarServico,
    servicoController.CriarServico
);

adminServicoRoutes.patch(
    "/:id",
    loginRequired,
    servicoValidator.ValidarEdicaoServico,
    servicoController.EditarServico
);

adminServicoRoutes.patch(
    "/:id/desativar",
    loginRequired,
    servicoValidator.ValidarDesativarServico,
    servicoController.DesativarServico
);

adminServicoRoutes.patch(
    "/:id/reativar",
    loginRequired,
    servicoValidator.ValidarDesativarServico,
    servicoController.ReativarServico
);

export {
    servicoRoutes,
    adminServicoRoutes
};