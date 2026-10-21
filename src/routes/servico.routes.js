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

// Administrativas
adminServicoRoutes.post(
    "/",
    loginRequired,
    servicoValidator.ValidarCriarServico,
    servicoController.CriarServico
);

export {
    servicoRoutes,
    adminServicoRoutes
};