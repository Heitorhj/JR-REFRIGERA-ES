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

    if (senha.length < 8 || senha.length > 200) {
        return "A senha deve ter entre 8 e 200 caracteres.";
    }

    return null;
};

export default {
    validarEmail,
    validarSenha
};