import { Router } from "express";

import pedidoValidator from "../validators/pedidoValidator.js";
import pedidoController from "../controllers/pedidoController.js";
import loginRequired from "../middleware/loginRequired.js";

const pedidoRoutes = Router();
const adminPedidoRoutes = Router();

// ROTAS PÚBLICAS

// Cliente solicita um orçamento sem precisar de autenticação.
pedidoRoutes.post(
    "/",
    pedidoValidator.validarCadastroPedidos,
    pedidoController.cadastrarPedido
);

// ROTAS ADMINISTRATIVAS

adminPedidoRoutes.get(
    "/",
    loginRequired,
    pedidoValidator.validarListagem,
    pedidoController.listarPedidos
);

adminPedidoRoutes.get(
    "/:id",
    loginRequired,
    pedidoValidator.validarBuscaPorId,
    pedidoController.buscarPorId
);


adminPedidoRoutes.patch(
    "/:id/proposta",
    loginRequired,
    pedidoValidator.validarProposta,
    pedidoController.salvarProposta
);

export { pedidoRoutes, adminPedidoRoutes };