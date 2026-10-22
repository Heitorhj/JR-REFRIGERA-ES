
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

    req.body = {
        nivel,
        valor
    };

    return next();
};

export default {
    validarCadastro
};