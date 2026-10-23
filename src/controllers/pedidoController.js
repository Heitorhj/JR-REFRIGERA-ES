
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

const listarPedidos = async (req, res, next) => {
    try {
        const resultado = await pedidoService.listarPedidos(req.dados.query);

        return res.status(200).json(resultado);
    } catch (error) {
        return next(error);
    }
};

const buscarPorId = async (req, res, next) => {
    try {
        const pedido = await pedidoService.buscarPorId(req.params.id);

        return res.status(200).json({ pedido });
    } catch (error) {
        return next(error);
    }
};

export default {
    listarPedidos,
    buscarPorId,
    cadastrarPedido
};
