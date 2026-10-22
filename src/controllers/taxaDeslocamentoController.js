import taxaDeslocamentoService from "../services/taxaDeslocamentoService.js";

const cadastrar = async (req, res, next) => {
    try {
        const { nivel, valor } = req.body;

        const taxa = await taxaDeslocamentoService.cadastrar(
            nivel,
            valor
        );

        return res.status(201).json({
            mensagem: "Taxa de deslocamento cadastrada com sucesso.",
            taxa
        });

    } catch (error) {
        return next(error);
    }
};

export default {
    cadastrar
};