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

export default {
    listarCidades
}