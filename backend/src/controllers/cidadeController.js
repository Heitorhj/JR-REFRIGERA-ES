import cidadeService from "../services/cidadeService.js";

const listarCidades = async (req, res, next) => {
    try {
        const cidades = await cidadeService.listarCidades();

        return res.status(200).json({
            mensagem: "Cidades listadas com sucesso.",
            cidades 
        })
    } catch(e) {
        return next(e);
    }
};

const listarTodasCidades = async (req, res, next) => {
    try {
        const cidades = await cidadeService.listarTodasCidades();

        return res.status(200).json({
            mensagem: "Cidades administrativas listadas com sucesso.",
            cidades
        });
    } catch (error) {
        return next(error);
    }
};

const cadastrarCidades = async (req, res, next) => {
    try {
        const { nome, nivel, regiao } = req.body;

        const cidade = await cidadeService.cadastrarCidade(
            nome,
            nivel,
            regiao
        );

        return res.status(201).json({
            mensagem: "Cidade cadastrada com sucesso.",
            cidade
        });

    } catch (error) {
        return next(error);
    }
};

const desativarCidade = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const cidade = await cidadeService.desativarCidade(id);

        return res.status(200).json({
            mensagem: "Cidade desativada com sucesso.",
            cidade
        });
    } catch (error) {
        return next(error);
    }
};

const reativarCidade = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const cidade = await cidadeService.reativarCidade(id);

        return res.status(200).json({
            mensagem: "Cidade reativada com sucesso.",
            cidade
        });
    } catch (error) {
        return next(error);
    }
};

// Editar os dados de uma cidade
const editarCidade = async (req, res, next) => {
    try {
        // O commonValidator já validou o ID.
        const id = Number(req.params.id);

        // O cidadeValidator já validou e normalizou os campos enviados.
        const dados = req.body;

        // Encaminha a edição para o Service, responsável pelas regras de negócio.
        const cidade = await cidadeService.editarCidade(id, dados);

        return res.status(200).json({
            mensagem: "Cidade atualizada com sucesso.",
            cidade
        });

    } catch (error) {
        return next(error);
    }
};

export default {
    listarCidades,
    listarTodasCidades,
    cadastrarCidades,
    desativarCidade,
    reativarCidade,
    editarCidade
}