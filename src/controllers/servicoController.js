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

export default {
    listar,
    CriarServico
};