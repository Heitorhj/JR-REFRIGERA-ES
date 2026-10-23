
import { StatusPedido } from "@prisma/client";
import commonValidator from "./commonValidator.js";
import formatarData from "../utils/formatarData.js";
import formatarTelefone from "../utils/formatarTelefone.js";

// ==================================================
// 1. VALIDAR LISTAGEM DE PEDIDOS (ADMIN)
// ==================================================

const validarListagem = (req, res, next) => {

    // Obtém os parâmetros enviados pela URL.
    // Exemplo: ?page=2&limit=10&status=PENDENTE
    // Os valores chegam como strings.
    const query = req.query ?? {};

    // Define quais parâmetros podem ser enviados.
    const parametrosPermitidos = ["page", "limit", "status"];

    // Object.keys transforma as propriedades da query em um array.
    // filter retorna apenas os parâmetros que NÃO estão na lista permitida.
    const parametrosInvalidos = Object.keys(query).filter(
        parametro => !parametrosPermitidos.includes(parametro)
    );

    // Se algum parâmetro desconhecido foi enviado, retorna erro.
    if (parametrosInvalidos.length > 0) {
        return res.status(400).json({
            mensagem: `Parâmetros não permitidos: ${parametrosInvalidos.join(", ")}.`
        });
    }

    // --------------------------------------------------
    // FUNÇÃO AUXILIAR: CONVERTER INTEIRO POSITIVO
    // --------------------------------------------------

    // Converte um parâmetro da URL, que chega como string,
    // para um número inteiro positivo.
    //
    // valor: valor recebido da URL. Exemplo: "2".
    // padrao: número usado quando o parâmetro não é enviado.
    // maximo: maior valor permitido (opcional).
    //
    // Retorna um número válido ou null se estiver incorreto.
    const converterInteiroPositivo = (valor, padrao, maximo) => {

        // Se o usuário não enviou esse parâmetro,
        // utilizamos o valor padrão definido na chamada.
        // Exemplo: page não enviado -> retorna 1.
        if (valor === undefined) {
            return padrao;
        }

        // Verifica três situações de erro:
        // 1. O valor não é uma string.
        // 2. A string está vazia.
        // 3. Algum caractere não está entre "0" e "9".
        //
        // O operador || significa OU:
        // basta uma condição ser verdadeira para retornar null.
        // O JavaScript para de avaliar assim que encontra true.
        if (
            typeof valor !== "string" ||
            valor.length === 0 ||
            ![...valor].every(caractere =>
                caractere >= "0" && caractere <= "9"
            )
        ) {
            return null;
        }

        // Converte a string para um número.
        // Exemplo: "2" -> 2.
        const numero = Number(valor);

        // Verifica se:
        // 1. O número é um inteiro seguro no JavaScript.
        // 2. O número é maior que zero.
        // 3. Não ultrapassa o máximo, caso exista.
        if (
            !Number.isSafeInteger(numero) ||
            numero <= 0 ||
            (maximo !== undefined && numero > maximo)
        ) {
            return null;
        }

        // Devolve o número convertido e validado.
        return numero;
    };

    // --------------------------------------------------
    // VALIDAR PAGE E LIMIT
    // --------------------------------------------------

    // page = página que o administrador deseja visualizar.
    // Se não for informada, utiliza a página 1.
    //
    // Exemplo: query.page = "2"
    // Resultado: page = 2 (number).
    const page = converterInteiroPositivo(query.page, 1);

    // limit = quantidade máxima de pedidos por página.
    // Se não for informado, utiliza 10.
    // O administrador poderá solicitar no máximo 50.
    //
    // Exemplo: query.limit = "20"
    // Resultado: limit = 20 (number).
    const limit = converterInteiroPositivo(query.limit, 10, 50);

    // Verifica se page e limit são válidos.
    //
    // Também verifica se a multiplicação está dentro
    // do intervalo seguro de inteiros do JavaScript.
    // Isso é importante porque o Repository calculará:
    // skip = (page - 1) * limit.
    //
    // Como utilizamos ||, basta UMA condição ser verdadeira
    // para que a paginação seja considerada inválida.
    if (
        page === null ||
        limit === null ||
        !Number.isSafeInteger(page * limit)
    ) {
        return res.status(400).json({
            mensagem: "Parâmetros de paginação inválidos."
        });
    }

    // --------------------------------------------------
    // VALIDAR FILTRO POR STATUS
    // --------------------------------------------------

    // O status é opcional.
    // Se não foi informado, todos os status poderão aparecer.
    //
    // Se foi informado, verifica:
    // 1. Se é uma string.
    // 2. Se corresponde a algum valor do enum StatusPedido.
    //
    // Object.values(StatusPedido) retorna os status permitidos.
    // includes verifica se o status enviado está nessa lista.
    if (
        query.status !== undefined &&
        (
            typeof query.status !== "string" ||
            !Object.values(StatusPedido).includes(query.status)
        )
    ) {
        return res.status(400).json({
            mensagem: "Status do pedido inválido."
        });
    }

    // --------------------------------------------------
    // PREPARAR OS PARÂMETROS PARA O CONTROLLER
    // --------------------------------------------------

    // Cria um objeto somente com a paginação validada.
    // Exemplo: { page: 2, limit: 10 }.
    const filtros = {
        page,
        limit
    };

    // Adiciona o status somente se o administrador o informou.
    // Assim, não precisamos utilizar spread nem operador ternário.
    if (query.status !== undefined) {
        filtros.status = query.status;
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
    validarCadastroPedidos
};
