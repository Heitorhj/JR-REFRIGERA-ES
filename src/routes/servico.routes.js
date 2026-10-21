import { Router } from "express";

import servicoController from "../controllers/servicoController.js";

const router = Router();

router.get(
    "/",
    servicoController.listar
);

export default router;