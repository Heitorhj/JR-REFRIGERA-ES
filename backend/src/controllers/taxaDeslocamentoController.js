import taxaDeslocamentoService from "../services/taxaDeslocamentoService.js";

const listarTaxas = async (req, res, next) => {
    try {
        const taxas = await taxaDeslocamentoService.listarTaxas();

        return res.status(200).json({
            mensagem: "Taxas de deslocamento listadas com sucesso.",
            taxas
        });
    } catch (error) {
        return next(error);
    }
};

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

// Editar o valor de uma taxa de deslocamento
const editarTaxa = async (req, res, next) => {
    try {
        // O Validator já validou o nível (0 a 4) e o valor em centavos.
        const nivel = Number(req.params.nivel);
        const { valor } = req.body;

        // Encaminha os dados para o Service aplicar as regras de negócio.
        const taxa = await taxaDeslocamentoService.editarTaxa(nivel, valor);

        return res.status(200).json({
            mensagem: "Taxa de deslocamento atualizada com sucesso.",
            taxa
        });

    } catch (error) {
        return next(error);
    }
};

export default {
    listarTaxas,
    cadastrar,
    editarTaxa
};