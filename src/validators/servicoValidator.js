import commonValidator from "./commonValidator.js";

const ValidarCriarServico = (req, res, next) => {

    const { nome, slug, descricao } = req.body;

    const erroNome = commonValidator.validarTextoObrigatorio(nome, "Nome do Serviço");

    // Validar nome do serviço
    if(erroNome) {
        return res.status(400).json({
            mensagem: erroNome
        });
    }

    if (nome.trim().length > 100) {
        return res.status(400).json({
            mensagem: "Nome do serviço muito longo."
        });
    }

    // Validar slug do serviço
    const erroSlug = commonValidator.validarTextoObrigatorio(slug, "Slug");

    if(erroSlug) {
        return res.status(400).json( {
            mensagem: erroSlug
        });
    }

    if (slug.trim().length > 100) {
        return res.status(400).json({
            mensagem: "Slug do serviço muito longo."
        });
    }

    // Validar descrição do serviço
    const erroDescricao = commonValidator.validarTextoObrigatorio(descricao, "Descricao");

    if(erroDescricao) {
        return res.status(400).json({
            mensagem: "Descrição do serviço é obrigatória."
        });
    }

    if(descricao.trim().length > 500) {
        return res.status(400).json({
            mensagem: "Descrição muito longa."
        });
    }

    req.body = {
        nome: nome.trim(),
        slug: slug.trim().toLowerCase(),
        descricao: descricao.trim()
    }

    return next();

}

export default {
    ValidarCriarServico
}