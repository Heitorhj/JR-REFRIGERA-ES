
import pedidoService from "../services/pedidoService.js";

const cadastrarPedido = async (req, res, next) => {
    try {
        // Os dados chegam validados e normalizados pelo pedidoValidator.
        const dados = req.body;

        // Envia os dados para o Service, responsável pelas
        // regras de negócio e pela criação do pedido.
        const pedido = await pedidoService.cadastrarPedido(dados);

        // Retorna HTTP 201 (Created), indicando que
        // a solicitação foi cadastrada com sucesso.
        return res.status(201).json({
            mensagem: "Solicitação de orçamento cadastrada com sucesso.",
            pedido
        });

    } catch (error) {
        // Encaminha o erro para o middleware global de tratamento.
        return next(error);
    }
};

export default {
    cadastrarPedido
};
