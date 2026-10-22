import { object } from "zod";
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

const validarEdicao = (req, res, next) => {
    const { nome, nivel, regiao } = req.body ?? {};

    // No PATCH, permitimos editar somente estes campos.
    const camposPermitidos = ["nome", "nivel", "regiao"];
    const camposRecebidos = Object.keys(req.body ?? {});

    // Identifica se foi enviado algum campo que não pode ser alterado.
    const camposInvalidos = camposRecebidos.filter(
        (campo) => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            mensagem: `Campos não permitidos para edição: ${camposInvalidos.join(", ")}.`
        });
    }

    // Pelo menos um campo precisa ser enviado para atualização.
    if (
        nome === undefined &&
        nivel === undefined &&
        regiao === undefined
    ) {
        return res.status(400).json({
            mensagem: "Informe pelo menos um campo para atualizar."
        });
    }

    // Validar nome somente se foi enviado.
    if (nome !== undefined) {
        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                mensagem: "Nome da cidade inválido."
            });
        }

        if (nome.trim().length > 50) {
            return res.status(400).json({
                mensagem: "Nome da cidade muito longo."
            });
        }
    }

    // Validar região somente se foi enviada.
    if (regiao !== undefined) {
        if (typeof regiao !== "string" || !regiao.trim()) {
            return res.status(400).json({
                mensagem: "Região inválida."
            });
        }

        if (regiao.trim().length > 100) {
            return res.status(400).json({
                mensagem: "Região muito longa."
            });
        }
    }

    // Validar nível somente se foi enviado.
    if (nivel !== undefined) {
        if (!Number.isInteger(nivel) || nivel < 0 || nivel > 4) {
            return res.status(400).json({
                mensagem: "O nível deve ser um número inteiro entre 0 e 4."
            });
        }
    }

    // Dados validados e normalizados.
    // Aqui reconstruímos o body somente com os campos enviados,
    // já validados e prontos para seguir para o controller/service.
    const bodyNormalizado = {};

    if (nome !== undefined) {
        bodyNormalizado.nome = nome.trim().toLowerCase();
    }

    if (regiao !== undefined) {
        bodyNormalizado.regiao = regiao.trim();
    }

    if (nivel !== undefined) {
        bodyNormalizado.nivel = nivel;
    }

    req.body = bodyNormalizado;

    return next();
};

export default {
    validarCadastroCidades,
    validarEdicao
};