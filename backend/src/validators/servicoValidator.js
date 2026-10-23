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

const ValidarDesativarServico = (req, res, next) => {
    const servicoId = Number(req.params.id);

    if (!Number.isSafeInteger(servicoId) || servicoId <= 0) {
        return res.status(400).json({
            mensagem: "ID do serviço inválido."
        });
    }

    req.params.id = servicoId;

    return next();
};

const ValidarEdicaoServico = (req, res, next) => {
    const { nome, slug, descricao } = req.body ?? {};
    const camposPermitidos = ["nome", "slug", "descricao"];
    const camposRecebidos = Object.keys(req.body ?? {});
    const camposInvalidos = camposRecebidos.filter(
        (campo) => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            mensagem: `Campos não permitidos para edição: ${camposInvalidos.join(", ")}.`
        });
    }

    if (nome === undefined && slug === undefined && descricao === undefined) {
        return res.status(400).json({
            mensagem: "Informe pelo menos um campo para atualizar."
        });
    }

    const dadosNormalizados = {};

    if (nome !== undefined) {
        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({ mensagem: "Nome do serviço inválido." });
        }
        if (nome.trim().length > 100) {
            return res.status(400).json({ mensagem: "Nome do serviço muito longo." });
        }
        dadosNormalizados.nome = nome.trim();
    }

    if (slug !== undefined) {
        if (typeof slug !== "string" || !slug.trim()) {
            return res.status(400).json({ mensagem: "Slug inválido." });
        }
        if (slug.trim().length > 100) {
            return res.status(400).json({ mensagem: "Slug muito longo." });
        }
        dadosNormalizados.slug = slug.trim().toLowerCase();
    }

    if (descricao !== undefined) {
        if (typeof descricao !== "string" || !descricao.trim()) {
            return res.status(400).json({ mensagem: "Descrição do serviço inválida." });
        }
        if (descricao.trim().length > 500) {
            return res.status(400).json({ mensagem: "Descrição do serviço muito longa." });
        }
        dadosNormalizados.descricao = descricao.trim();
    }

    req.body = dadosNormalizados;
    return next();
};

export default {
    ValidarCriarServico,
    ValidarDesativarServico,
    ValidarEdicaoServico
}