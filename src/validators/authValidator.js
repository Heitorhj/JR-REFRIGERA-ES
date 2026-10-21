import commonValidator from "./commonValidator.js";

const validarLogin = (req, res, next) => {
    const {  email, senha } = req.body;

    // Validar email
    const erroEmail = commonValidator.validarEmail(email);

    if(erroEmail) {
        return res.status(400).json({
            mensagem: erroEmail
        });
    }

    // Validar senha
    const erroSenha = commonValidator.validarSenha(senha);

    if(erroSenha) {
        return res.status(400).json({
            mensagem: erroSenha
        });
    }

    req.body = {
        email: email.trim().toLowerCase(),
        senha
    }

    return next();
}

export default {
    validarLogin
}