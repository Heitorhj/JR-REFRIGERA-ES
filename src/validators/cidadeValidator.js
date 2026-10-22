import commonValidator from "./commonValidator.js";

const validarCadastroCidades = (req, res, next) => {

    const { nome, nivel, regiao } = req.body ?? {};

    //Validar nome
    const erroNome = commonValidator.validarTextoObrigatorio(nome, "Nome");

    if(erroNome) {
       return res.status(400).json({
        mensagem: erroNome
       }); 
    }

    if(nome.trim().length > 60) {
        return res.status(400).json({
            mensagem: "Nome da cidade muito longo."
        });
    }

    // Validar nível
    if (!Number.isInteger(nivel) || nivel < 0 || nivel > 4) {
        return res.status(400).json({
            mensagem: "O nível deve ser um número inteiro entre 0 e 4."
        });
    }

    // Validar região
    if (typeof regiao !== "string" || !regiao.trim()) {
        return res.status(400).json({
            mensagem: "Região é obrigatória."
        });
    }

    if (regiao.trim().length > 100) {
        return res.status(400).json({
            mensagem: "Região muito longa."
        });
    }

    // Dados validados e normalizados
    req.body = {
        nome: nome.trim().toLowerCase(),
        nivel,
        regiao: regiao.trim()
    };

    return next();
}

export default {
    validarCadastroCidades,
}