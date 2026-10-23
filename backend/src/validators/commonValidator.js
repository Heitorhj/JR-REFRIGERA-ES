import validator from "validator";

const validarEmail = (email) => {
    if (typeof email !== "string" || !email.trim()) {
        return "E-mail obrigatório.";
    }

    if (!validator.isEmail(email.trim())) {
        return "E-mail inválido.";
    }

    return null;
};

const validarSenha = (senha) => {
    if (typeof senha !== "string" || !senha) {
        return "Senha obrigatória.";
    }

    if (senha.length < 8 || senha.length > 12) {
        return "A senha deve ter entre 8 e 12 caracteres.";
    }

    return null;
};

const validarTextoObrigatorio = (valor, campo) => {
    if(typeof valor !== "string" || valor.trim() === "") {
        return `O campo ${campo} é obrigatório.`
    }

    return null;
}

const validarId = (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            mensagem: "ID inválido."
        });
    }

    return next();
};

export default {
    validarEmail,
    validarSenha,
    validarTextoObrigatorio,
    validarId
};