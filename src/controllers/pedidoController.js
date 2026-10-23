
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


const salvarProposta = async (req, res, next) => {
    try {
        // 1. RECEBER OS DADOS VALIDADOS

        // O Validator já verificou e converteu o ID do pedido
        // para um número inteiro positivo.
        const id = req.dados.id;

        // Contém somente os campos permitidos pelo Validator:
        // servicoId, valorPrevisto, taxaDeslocamentoFinal
        // e reagendamento (caso tenha sido informado).
        const dados = req.dados.proposta;

        // 2. CHAMAR O SERVICE

        // Envia o ID e os dados da proposta para o Service.
        // O Service verificará as regras de negócio,
        // calculará o total estimado e salvará a proposta.
        const proposta = await pedidoService.salvarProposta(
            id,
            dados,
            req.administrador.id
        );

        // 3. RETORNAR A RESPOSTA

        // Retorna HTTP 200 porque estamos atualizando
        // um pedido que já existe no banco de dados.
        return res.status(200).json({
            mensagem: "Proposta de orçamento salva com sucesso.",
            proposta
        });

    } catch (error) {
        // Encaminha os erros para o middleware global,
        // responsável por tratá-los e retornar a resposta adequada.
        return next(error);
    }
};


export default {
    listarPedidos,
    buscarPorId,
    cadastrarPedido,
    salvarProposta
};
