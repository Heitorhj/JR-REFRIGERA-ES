
import commonValidator from "./commonValidator.js";
import formatarData from "../utils/formatarData.js";
import formatarTelefone from "../utils/formatarTelefone.js";
import filtrarParametrosListagemPedidos from "../utils/filtrarParametrosListagemPedidos.js";

// ==================================================
// 1. VALIDAR LISTAGEM DE PEDIDOS (ADMIN)
// ==================================================

const validarListagem = (req, res, next) => {
    // O utilitário valida os parâmetros permitidos e normaliza
    // página, limite e status antes de chegarem ao Controller.
    const filtros = filtrarParametrosListagemPedidos(req.query);

    if (!filtros) {
        return res.status(400).json({
            mensagem: "Parâmetros de listagem inválidos."
        });
    }

    // req.dados é uma propriedade personalizada da aplicação.
    // Caso ainda não exista, criamos um objeto vazio.
    // Isso preserva outros dados adicionados por middlewares.
    if (!req.dados) {
        req.dados = {};
    }

    // Entrega ao Controller os parâmetros já normalizados.
    // Exemplo:
    // req.dados.query = {
    //     page: 2,
    //     limit: 10,
    //     status: "PENDENTE"
    // };
    req.dados.query = filtros;

    // Encerra a validação e passa ao próximo middleware.
    return next();
};

const validarBuscaPorId = (req, res, next) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            mensagem: "ID inválido."
        });
    }

    // Convert the URL parameter to a number before passing it to the Controller.
    req.params.id = id;
    return next();
};

// ==================================================
// 2. VALIDAR CADASTRO DE PEDIDOS (PÚBLICO)
// ==================================================

const validarCadastroPedidos = (req, res, next) => {

    // Obtém os campos enviados pelo formulário do cliente.
    const {
        nome,
        whatsapp,
        cidadeId,
        servicoId,
        endereco,
        descricaoProblema,
        dataPreferida,
        turnoPreferido
    } = req.body ?? {};

    // 1. VALIDAR NOME
    // O commonValidator retorna uma mensagem de erro ou null.
    const erroNome = commonValidator.validarTextoObrigatorio(nome, "Nome");

    if (erroNome) {
        return res.status(400).json({ mensagem: erroNome });
    }

    if (nome.trim().length > 100) {
        return res.status(400).json({
            mensagem: "Nome deve ter no máximo 100 caracteres."
        });
    }

    // 2. VALIDAR WHATSAPP
    const erroWhatsapp = commonValidator.validarTextoObrigatorio(
        whatsapp,
        "WhatsApp"
    );

    if (erroWhatsapp) {
        return res.status(400).json({ mensagem: erroWhatsapp });
    }

    // O util remove a formatação e padroniza o número com DDI 55.
    // Retorna null caso o formato não seja aceito.
    const whatsappFinal = formatarTelefone(whatsapp);

    if (!whatsappFinal) {
        return res.status(400).json({
            mensagem: "Número de WhatsApp inválido."
        });
    }

    // 3. VALIDAR IDs
    // Os IDs devem ser números inteiros positivos.
    if (!Number.isSafeInteger(cidadeId) || cidadeId <= 0) {
        return res.status(400).json({
            mensagem: "ID da cidade inválido."
        });
    }

    if (!Number.isSafeInteger(servicoId) || servicoId <= 0) {
        return res.status(400).json({
            mensagem: "ID do serviço inválido."
        });
    }

    // 4. VALIDAR ENDEREÇO
    const erroEndereco = commonValidator.validarTextoObrigatorio(
        endereco,
        "Endereço"
    );

    if (erroEndereco) {
        return res.status(400).json({ mensagem: erroEndereco });
    }

    if (endereco.trim().length > 255) {
        return res.status(400).json({
            mensagem: "Endereço deve ter no máximo 255 caracteres."
        });
    }

    // 5. VALIDAR DESCRIÇÃO DO PROBLEMA
    const erroDescricao = commonValidator.validarTextoObrigatorio(
        descricaoProblema,
        "Descrição do problema"
    );

    if (erroDescricao) {
        return res.status(400).json({ mensagem: erroDescricao });
    }

    if (descricaoProblema.trim().length > 2000) {
        return res.status(400).json({
            mensagem: "Descrição deve ter no máximo 2000 caracteres."
        });
    }

    // 6. VALIDAR DATA PREFERIDA
    const erroData = commonValidator.validarTextoObrigatorio(
        dataPreferida,
        "Data preferida"
    );

    if (erroData) {
        return res.status(400).json({ mensagem: erroData });
    }

    // O util verifica o formato YYYY-MM-DD, a existência
    // da data e se ela não está no passado, considerando Recife.
    const dataNormalizada = formatarData(dataPreferida);

    if (!dataNormalizada) {
        return res.status(400).json({
            mensagem: "Data preferida inválida, inexistente ou no passado."
        });
    }

    // 7. VALIDAR TURNO
    // O turno deve corresponder ao enum Turno do Prisma.
    if (
        turnoPreferido !== "MANHA" &&
        turnoPreferido !== "TARDE"
    ) {
        return res.status(400).json({
            mensagem: "O turno deve ser MANHA ou TARDE."
        });
    }

    // 8. RECONSTRUIR REQ.BODY
    // Mantemos apenas campos autorizados, validados e normalizados.
    // Campos como status, valorPrevisto e taxas não podem ser
    // definidos pelo cliente durante a solicitação.
    req.body = {
        nome: nome.trim(),
        whatsapp: whatsappFinal,
        cidadeId,
        servicoId,
        endereco: endereco.trim(),
        descricaoProblema: descricaoProblema.trim(),
        dataPreferida: dataNormalizada,
        turnoPreferido
    };

    return next();
};

export default {
    validarListagem,
    validarBuscaPorId,
    validarCadastroPedidos
};
