
const validarCadastro = (req, res, next) => {
    const { nivel, valor } = req.body ?? {};

    if (!Number.isInteger(nivel) || nivel < 0 || nivel > 4) {
        return res.status(400).json({
            mensagem: "O nível deve ser um número inteiro entre 0 e 4."
        });
    }

    if (!Number.isSafeInteger(valor) || valor < 0) {
        return res.status(400).json({
            mensagem: "O valor deve ser um número inteiro não negativo, em centavos."
        });
    }

    const VALOR_MINIMO_TAXA = 1500;

    if (valor !== 0 && valor < VALOR_MINIMO_TAXA) {
        return res.status(400).json({
            mensagem: "A taxa deve ser zero ou no mínimo R$ 15,00."
        });
    }

    req.body = {
        nivel,
        valor
    };

    return next();
};

// Validar a edição do valor de uma taxa de deslocamento
const validarEdicao = (req, res, next) => {
    const { valor } = req.body ?? {};
    const nivelParam = req.params.nivel;

    // Valida o nível recebido pela URL (0 a 4).
    // Number("") e Number(" ") retornam 0, então rejeitamos esses casos.
    if (
        typeof nivelParam !== "string" ||
        nivelParam.trim() === ""
    ) {
        return res.status(400).json({
            mensagem: "Nível inválido."
        });
    }

    const nivel = Number(nivelParam);

    if (
        !Number.isSafeInteger(nivel) ||
        nivel < 0 ||
        nivel > 4
    ) {
        return res.status(400).json({
            mensagem: "O nível deve ser um número inteiro entre 0 e 4."
        });
    }

    // Somente o campo valor pode ser enviado no body.
    const camposPermitidos = ["valor"];
    const camposRecebidos = Object.keys(req.body ?? {});

    const camposInvalidos = camposRecebidos.filter(
        (campo) => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            mensagem: `Campos não permitidos: ${camposInvalidos.join(", ")}.`
        });
    }

    // O valor é obrigatório na edição.
    if (valor === undefined) {
        return res.status(400).json({
            mensagem: "Informe o valor da taxa de deslocamento."
        });
    }

    // O valor deve ser um inteiro não negativo, em centavos.
    if (!Number.isSafeInteger(valor) || valor < 0) {
        return res.status(400).json({
            mensagem: "O valor deve ser um número inteiro não negativo, em centavos."
        });
    }

    const VALOR_MINIMO_TAXA = 1500;

    // Permite taxa gratuita, mas impede valores positivos abaixo do mínimo.
    if (valor !== 0 && valor < VALOR_MINIMO_TAXA) {
        return res.status(400).json({
            mensagem: "A taxa deve ser zero ou no mínimo R$ 15,00."
        });
    }

    // Dados validados e filtrados.
    // Apenas o valor é encaminhado para o Controller.
    req.body = { valor };

    return next();
};

export default {
    validarCadastro,
    validarEdicao
};