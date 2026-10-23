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
    "/lixeira",
    loginRequired,
    pedidoValidator.validarListagem,
    pedidoController.listarPedidosDescartados
);

adminPedidoRoutes.get(
    "/:id",
    loginRequired,
    pedidoValidator.validarBuscaPorId,
    pedidoController.buscarPorId
);

adminPedidoRoutes.post(
    "/:id/reagendamentos",
    loginRequired,
    pedidoValidator.validarReagendamento,
    pedidoController.reagendarPedido
);

adminPedidoRoutes.post(
    "/:id/cancelamento",
    loginRequired,
    pedidoValidator.validarCancelamento,
    pedidoController.cancelarPedido
);

adminPedidoRoutes.post(
    "/:id/conclusao",
    loginRequired,
    pedidoValidator.validarBuscaPorId,
    pedidoController.concluirPedido
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

adminPedidoRoutes.post(
    "/:id/resposta",
    loginRequired,
    pedidoValidator.validarRespostaCliente,
    pedidoController.registrarRespostaCliente
);

export { pedidoRoutes, adminPedidoRoutes };
