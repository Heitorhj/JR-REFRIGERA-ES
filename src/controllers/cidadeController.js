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

export default {
    listarCidades,
    cadastrarCidades,
    desativarCidade
}