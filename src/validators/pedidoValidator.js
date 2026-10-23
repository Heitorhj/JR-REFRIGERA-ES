
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



const validarProposta = (req, res, next) => {

    // 1. VALIDAR ID DO PEDIDO
    // O ID chega pela URL como string.
    // Exemplo: PATCH /api/admin/pedidos/15/proposta

    const id = Number(req.params.id);

    // Verifica se o ID é um número inteiro seguro e positivo.
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            mensagem: "ID do pedido inválido."
        });
    }

    // 2. RECEBER OS CAMPOS DA PROPOSTA
    const {
        servicoId,
        valorPrevisto,
        taxaDeslocamentoFinal,
        reagendamento
    } = req.body ?? {};

    // Define os únicos campos que Júnior pode enviar.
    const camposPermitidos = [
        "servicoId",
        "valorPrevisto",
        "taxaDeslocamentoFinal",
        "reagendamento"
    ];

    // Verifica se foram enviados campos não permitidos.
    // Exemplo: clienteId, cidadeId, status ou taxaDeslocamentoEstimada.
    const camposInvalidos = Object.keys(req.body ?? {}).filter(
        campo => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            mensagem: `Campos não permitidos: ${camposInvalidos.join(", ")}.`
        });
    }

    // 3. VALIDAR SERVIÇO
    // Júnior pode corrigir o tipo de serviço selecionado pelo cliente.
    // O Service verificará se o serviço existe e está ativo.
    if (!Number.isSafeInteger(servicoId) || servicoId <= 0) {
        return res.status(400).json({
            mensagem: "ID do serviço inválido."
        });
    }

    // 4. VALIDAR VALOR PREVISTO
    // Todos os valores financeiros são enviados em centavos.
    // Exemplo: 20000 = R$ 200,00.
    if (
        !Number.isSafeInteger(valorPrevisto) ||
        valorPrevisto <= 0
    ) {
        return res.status(400).json({
            mensagem: "Valor previsto deve ser um inteiro positivo em centavos."
        });
    }

    // 5. VALIDAR TAXA DE DESLOCAMENTO FINAL
    // Verifica se o valor enviado é um inteiro não negativo
    // e está representado em centavos.
    //
    // A comparação com a taxa estimada original do pedido
    // será realizada no Service, pois depende de uma
    // informação que está armazenada no banco de dados.
    if (
        !Number.isSafeInteger(taxaDeslocamentoFinal) ||
        taxaDeslocamentoFinal < 0
    ) {
        return res.status(400).json({
            mensagem: "Taxa final deve ser um inteiro não negativo em centavos."
        });
    }

    // 6. PREPARAR DADOS DA PROPOSTA
    // Criamos somente os campos autorizados e validados.
    // O total estimado será calculado no Service somente
    // após verificar a taxa final em relação à taxa original.
    const propostaValidada = {
        servicoId,
        valorPrevisto,
        taxaDeslocamentoFinal
    };

    // 7. VALIDAR REAGENDAMENTO OPCIONAL
    // Se Júnior não propôs outra data, não precisamos validar
    // nem adicionar reagendamento à proposta.
    if (reagendamento !== undefined) {

        // Verifica se reagendamento é um objeto válido,
        // e não um array ou null.
        if (
            typeof reagendamento !== "object" ||
            reagendamento === null ||
            Array.isArray(reagendamento)
        ) {
            return res.status(400).json({
                mensagem: "Reagendamento inválido."
            });
        }

        const {
            novaData,
            novoTurno,
            motivo
        } = reagendamento;

        // Permite apenas os campos definidos no formulário.
        const camposReagendamento = [
            "novaData",
            "novoTurno",
            "motivo"
        ];

        const camposInvalidosReagendamento = Object.keys(reagendamento).filter(
            campo => !camposReagendamento.includes(campo)
        );

        if (camposInvalidosReagendamento.length > 0) {
            return res.status(400).json({
                mensagem: "Campos não permitidos no reagendamento."
            });
        }

        // 7.1. VALIDAR NOVA DATA
        // O commonValidator verifica se o texto é obrigatório.
        const erroData = commonValidator.validarTextoObrigatorio(
            novaData,
            "Nova data"
        );

        if (erroData) {
            return res.status(400).json({
                mensagem: erroData
            });
        }

        // O util verifica formato YYYY-MM-DD, existência da data
        // e se ela não está no passado, considerando Recife.
        const dataNormalizada = formatarData(novaData);

        if (!dataNormalizada) {
            return res.status(400).json({
                mensagem: "Nova data inválida, inexistente ou no passado."
            });
        }

        // 7.2. VALIDAR NOVO TURNO
        // Aceita somente os valores definidos no enum Turno.
        if (
            novoTurno !== "MANHA" &&
            novoTurno !== "TARDE"
        ) {
            return res.status(400).json({
                mensagem: "O novo turno deve ser MANHA ou TARDE."
            });
        }

        // 7.3. VALIDAR MOTIVO OPCIONAL
        // Se foi enviado, precisa ser uma string com até 500 caracteres.
        let motivoNormalizado = null;

        if (motivo !== undefined && motivo !== null) {
            if (typeof motivo !== "string") {
                return res.status(400).json({
                    mensagem: "Motivo do reagendamento inválido."
                });
            }

            motivoNormalizado = motivo.trim();

            if (motivoNormalizado.length > 500) {
                return res.status(400).json({
                    mensagem: "Motivo deve ter no máximo 500 caracteres."
                });
            }

            if (motivoNormalizado.length === 0) {
                motivoNormalizado = null;
            }
        }

        // Adiciona o reagendamento somente quando informado.
        // A data original do pedido será preservada no banco.
        propostaValidada.reagendamento = {
            novaData: dataNormalizada,
            novoTurno,
            motivo: motivoNormalizado
        };
    }

    // 8. ENTREGAR DADOS VALIDADOS AO CONTROLLER
    // Não utilizamos campos extras enviados na requisição.
    // O Service decidirá se o status atual permite salvar a proposta.
    if (!req.dados) {
        req.dados = {};
    }

    req.dados.id = id;
    req.dados.proposta = propostaValidada;

    return next();
};



export default {
    validarListagem,
    validarBuscaPorId,
    validarCadastroPedidos,
    validarProposta
};
