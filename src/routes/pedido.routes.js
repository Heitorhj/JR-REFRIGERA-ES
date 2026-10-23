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

// Opens a manually prepared message; generating this URL does not record sending.
adminPedidoRoutes.get(
    "/:id/whatsapp",
    loginRequired,
    pedidoValidator.validarBuscaPorId,
    pedidoController.gerarLinkWhatsappProposta
);

adminPedidoRoutes.patch(
    "/:id/proposta",
    loginRequired,
    pedidoValidator.validarProposta,
    pedidoController.salvarProposta
);

// Júnior calls this only after manually sending the message in WhatsApp.
adminPedidoRoutes.post(
    "/:id/proposta/envio",
    loginRequired,
    pedidoValidator.validarBuscaPorId,
    pedidoController.informarEnvioManualProposta
);

export { pedidoRoutes, adminPedidoRoutes };