import servicoService from "../services/servicoService.js";

const listar = async (req, res, next) => {
    try {
        const servicos = await servicoService.listar();

        return res.status(200).json({
            mensagem: "Serviços listados com sucesso.",
            servicos
        });
    } catch (error) {
        return next(error);
    }
};

const listarTodos = async (req, res, next) => {
    try {
        const servicos = await servicoService.listarTodos();

        return res.status(200).json({
            mensagem: "Serviços listados com sucesso.",
            servicos
        });
    } catch (error) {
        return next(error);
    }
};

const CriarServico = async (req, res, next) => {
    try {
        const { nome, slug, descricao } = req.body;

        const servico = await servicoService.criar(
            nome,
            slug,
            descricao
        );

        return res.status(201).json({
            mensagem: "Serviço cadastrado com sucesso.",
            servico
        });
    } catch (error) {
        return next(error);
    }
};

const DesativarServico = async (req, res, next) => {
    try {
        const id = req.params.id;

        await servicoService.DesativarServico(id);

        return res.status(200).json({
            mensagem: "Serviço desativado com sucesso."
        });
    } catch (error) {
        return next(error);
    }
};

const ReativarServico = async (req, res, next) => {
    try {
        const id = req.params.id;

        const servico = await servicoService.ReativarServico(id);

        return res.status(200).json({
            mensagem: "Serviço reativado com sucesso.",
            servico
        });
    } catch (error) {
        return next(error);
    }
};

const EditarServico = async (req, res, next) => {
    try {
        const id = req.params.id;
        const servico = await servicoService.EditarServico(id, req.body);

        return res.status(200).json({
            mensagem: "Serviço atualizado com sucesso.",
            servico
        });
    } catch (error) {
        return next(error);
    }
};

export default {
    listar,
    listarTodos,
    CriarServico,
    DesativarServico,
    ReativarServico,
    EditarServico
};