import { Router } from "express";

import loginRequired from "../middleware/loginRequired.js";
import taxaDeslocamentoValidator from "../validators/taxaDeslocamentoValidator.js";
import taxaDeslocamentoController from "../controllers/taxaDeslocamentoController.js";

const router = Router();

router.get(
    "/",
    loginRequired,
    taxaDeslocamentoController.listarTaxas
);

router.post(
    "/",
    loginRequired,
    taxaDeslocamentoValidator.validarCadastro,
    taxaDeslocamentoController.cadastrar
);

router.patch(
    "/:nivel",
    loginRequired,
    taxaDeslocamentoValidator.validarEdicao,
    taxaDeslocamentoController.editarTaxa
);

export default router;