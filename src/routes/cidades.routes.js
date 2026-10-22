import { Router } from "express";

import cidadeController from "../controllers/cidadeController.js";
import loginRequired from "../middleware/loginRequired.js";

const cidadeRoutes = Router();
const adminCidadeRoutes = Router();

// ROtas públicas
cidadeRoutes.get(
    "/",
    cidadeController.listarCidades
);

export default {
    cidadeRoutes,
    adminCidadeRoutes
}