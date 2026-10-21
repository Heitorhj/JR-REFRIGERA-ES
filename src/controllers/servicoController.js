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

export default {
    listar
};