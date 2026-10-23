
import pedidoRepository from "../repositories/pedidoRepository.js";
import AppError from "../errors/AppError.js";

class PedidoService {
    async buscarPorId(id) {
        const pedido = await pedidoRepository.buscarPorId(id);

        if (!pedido) {
            throw new AppError("Pedido não encontrado.", 404);
        }

        return pedido;
    }

    async listarPedidos(filtros, descartados = false) {
        const resultado = await pedidoRepository.listarPedidos(filtros, descartados);

        return {
            pedidos: resultado.pedidos,
            paginacao: {
                paginaAtual: filtros.page,
                limite: filtros.limit,
                total: resultado.total,
                totalPaginas: Math.ceil(resultado.total / filtros.limit)
            }
        };
    }

    async listarPedidosDescartados(filtros) {
        return this.listarPedidos(filtros, true);
    }

    async reagendarPedido(id, dados, administradorId) {
        const pedido = await pedidoRepository.buscarDadosParaReagendar(id);

        if (!pedido) {
            throw new AppError("Pedido não encontrado.", 404);
        }

        if (pedido.descartadoEm !== null) {
            throw new AppError("Não é possível reagendar um pedido descartado.", 409);
        }

        const statusPermitidos = [
            "CONFIRMADO",
            "REAGENDADO",
            "REAGENDADO_POR_JUNIOR",
            "REAGENDADO_PELO_CLIENTE"
        ];

        if (!statusPermitidos.includes(pedido.status)) {
            throw new AppError(
                "Somente atendimentos confirmados podem ser reagendados.",
                409
            );
        }

        let dataAtual = pedido.dataPreferida;
        let turnoAtual = pedido.turnoPreferido;

        if (pedido.reagendamentos.length > 0) {
            dataAtual = pedido.reagendamentos[0].novaData;
            turnoAtual = pedido.reagendamentos[0].novoTurno;
        }

        if (
            dados.novaData === dataAtual &&
            dados.novoTurno === turnoAtual
        ) {
            throw new AppError(
                "A nova data e o turno devem alterar o agendamento atual.",
                400
            );
        }

        return pedidoRepository.reagendarPedido(
            id,
            administradorId,
            dados,
            pedido.status,
            pedido.atualizadoEm
        );
    }

    async cancelarPedido(id, motivo, administradorId) {
        let observacao = "Pedido cancelado pelo administrador.";

        if (motivo) {
            observacao += ` Motivo: ${motivo}`;
        }

        return pedidoRepository.transicionarPedidoAdministrativamente(
            id,
            administradorId,
            [
                "PENDENTE",
                "ACEITO_POR_JUNIOR",
                "AGUARDANDO_CLIENTE",
                "EM_NEGOCIACAO",
                "CONFIRMADO",
                "REAGENDADO",
                "REAGENDADO_POR_JUNIOR",
                "REAGENDADO_PELO_CLIENTE"
            ],
            "CANCELADO",
            observacao,
            true
        );
    }

    async concluirPedido(id, administradorId) {
        return pedidoRepository.transicionarPedidoAdministrativamente(
            id,
            administradorId,
            [
                "CONFIRMADO",
                "REAGENDADO",
                "REAGENDADO_POR_JUNIOR",
                "REAGENDADO_PELO_CLIENTE"
            ],
            "CONCLUIDO",
            "Atendimento concluído pelo administrador."
        );
    }

    async gerarLinkWhatsappProposta(id) {
        const pedido = await pedidoRepository.buscarDadosParaEnvioManualProposta(id);

        if (!pedido) {
            throw new AppError("Pedido não encontrado.", 404);
        }

        if (pedido.descartadoEm !== null) {
            throw new AppError("Não é possível enviar proposta de pedido descartado.", 409);
        }

        if (pedido.status !== "ACEITO_POR_JUNIOR") {
            throw new AppError("Salve a proposta antes de abrir o WhatsApp para enviá-la.", 409);
        }

        if (
            !Number.isSafeInteger(pedido.valorPrevisto) ||
            pedido.valorPrevisto <= 0 ||
            !Number.isSafeInteger(pedido.taxaDeslocamentoFinal) ||
            pedido.taxaDeslocamentoFinal < 0
        ) {
            throw new AppError("A proposta está incompleta e não pode ser enviada.", 409);
        }

        // WhatsApp click-to-chat accepts digits only in its phone path.
        let telefone = "";
        for (const caractere of pedido.cliente.whatsapp) {
            if (caractere >= "0" && caractere <= "9") {
                telefone += caractere;
            }
        }

        if (
            !telefone.startsWith("55") ||
            (telefone.length !== 12 && telefone.length !== 13)
        ) {
            throw new AppError("O WhatsApp cadastrado para o cliente é inválido.", 409);
        }

        const nomeCliente = pedido.cliente.nome.trim().split(" ")[0];
        const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
        const total = pedido.valorPrevisto + pedido.taxaDeslocamentoFinal;

        if (!Number.isSafeInteger(total)) {
            throw new AppError("O total da proposta é inválido.", 409);
        }

        const data = pedido.dataPreferida.split("-");

        const dataFormatada = `${data[2]}/${data[1]}/${data[0]}`;
        let mensagem = `Olá, ${nomeCliente}! Aqui é o Júnior da JR Refrigerações.\n`;
        mensagem += `Preparei a proposta para o serviço de ${pedido.servico.nome}:\n`;
        mensagem += `• Serviço: ${formatadorMoeda.format(pedido.valorPrevisto / 100)}\n`;
        mensagem += `• Deslocamento: ${formatadorMoeda.format(pedido.taxaDeslocamentoFinal / 100)}\n`;
        mensagem += `• Total: ${formatadorMoeda.format(total / 100)}\n`;

        if (pedido.reagendamentos.length > 0) {
            const reagendamento = pedido.reagendamentos[0];
            const dataReagendada = reagendamento.novaData.split("-");
            let turnoReagendado = "tarde";

            if (reagendamento.novoTurno === "MANHA") {
                turnoReagendado = "manhã";
            }

            let turnoOriginal = "tarde";

            if (pedido.turnoPreferido === "MANHA") {
                turnoOriginal = "manhã";
            }

            const dataOriginalIgual = reagendamento.novaData === pedido.dataPreferida;
            const turnoOriginalIgual = reagendamento.novoTurno === pedido.turnoPreferido;

            if (!dataOriginalIgual || !turnoOriginalIgual) {
                mensagem += `• Solicitado originalmente: ${dataFormatada} (${turnoOriginal})\n`;
                mensagem += "• A proposta sugere alterar o dia ou turno do atendimento.\n";
            }

            mensagem += `• Data proposta: ${dataReagendada[2]}/${dataReagendada[1]}/${dataReagendada[0]} (${turnoReagendado})\n`;
        } else {
            let turnoSolicitado = "tarde";

            if (pedido.turnoPreferido === "MANHA") {
                turnoSolicitado = "manhã";
            }

            mensagem += `• Data solicitada: ${dataFormatada} (${turnoSolicitado})\n`;
        }

        mensagem += "\nPor favor, confirme se aceita o valor e a data proposta. Se precisar negociar, responda a esta mensagem.";

        return {
            url: `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`,
            mensagem,
            envioConfirmado: false
        };
    }

    async informarEnvioManualProposta(id, administradorId) {
        const pedido = await pedidoRepository.buscarDadosParaEnvioManualProposta(id);

        if (!pedido) {
            throw new AppError("Pedido não encontrado.", 404);
        }

        if (pedido.descartadoEm !== null) {
            throw new AppError("Não é possível registrar envio de pedido descartado.", 409);
        }

        if (pedido.status !== "ACEITO_POR_JUNIOR") {
            throw new AppError("Somente uma proposta salva pode ser marcada como enviada.", 409);
        }

        if (
            !Number.isSafeInteger(pedido.valorPrevisto) ||
            pedido.valorPrevisto <= 0 ||
            !Number.isSafeInteger(pedido.taxaDeslocamentoFinal) ||
            pedido.taxaDeslocamentoFinal < 0
        ) {
            throw new AppError("A proposta está incompleta e não pode ser marcada como enviada.", 409);
        }

        const registro = await pedidoRepository.registrarEnvioManualProposta(
            id,
            administradorId
        );

        return {
            status: "AGUARDANDO_CLIENTE",
            envioInformadoManualmente: true,
            entregaConfirmadaPeloWhatsApp: false,
            registradoEm: registro.criadoEm
        };
    }

    async registrarRespostaCliente(id, resposta, administradorId) {
        const pedido = await pedidoRepository.buscarDadosParaEnvioManualProposta(id);

        if (!pedido) {
            throw new AppError("Pedido não encontrado.", 404);
        }

        if (pedido.descartadoEm !== null) {
            throw new AppError("Não é possível registrar resposta de pedido descartado.", 409);
        }

        const statusAguardandoResposta = pedido.status === "AGUARDANDO_CLIENTE";
        const statusEmNegociacao = pedido.status === "EM_NEGOCIACAO";

        if (!statusAguardandoResposta && !statusEmNegociacao) {
            throw new AppError("A resposta só pode ser registrada após informar o envio da proposta.", 409);
        }

        let novoStatus = "";

        if (resposta.acao === "ACEITAR") {
            if (
                !Number.isSafeInteger(pedido.valorPrevisto) ||
                pedido.valorPrevisto <= 0 ||
                !Number.isSafeInteger(pedido.taxaDeslocamentoFinal) ||
                pedido.taxaDeslocamentoFinal < 0
            ) {
                throw new AppError("A proposta está incompleta e não pode ser confirmada.", 409);
            }

            novoStatus = "CONFIRMADO";
        } else if (resposta.acao === "NEGOCIAR") {
            if (!statusAguardandoResposta) {
                throw new AppError("O pedido já está em negociação.", 409);
            }

            novoStatus = "EM_NEGOCIACAO";
        } else if (
            resposta.acao === "RECUSAR_PROPOSTA" ||
            resposta.acao === "CANCELAR"
        ) {
            novoStatus = "CANCELADO";
        } else {
            throw new AppError("Ação de resposta inválida.", 400);
        }

        return pedidoRepository.registrarRespostaCliente(
            id,
            administradorId,
            resposta.acao,
            resposta.observacao,
            pedido.status,
            novoStatus
        );
    }

    async cadastrarPedido(dados) {
        const {
            nome,
            whatsapp,
            cidadeId,
            servicoId,
            endereco,
            descricaoProblema,
            dataPreferida,
            turnoPreferido
        } = dados;

        // 1. Verifica se a cidade existe e está ativa.
        // Também consulta o valor vigente da taxa de deslocamento.
        const cidade = await pedidoRepository.buscarCidadePorId(cidadeId);

        if (!cidade || !cidade.ativa) {
            throw new AppError("Cidade não encontrada ou inativa.", 400);
        }

        // 2. Verifica se o serviço existe e está ativo.
        const servico = await pedidoRepository.buscarServicoPorId(servicoId);

        if (!servico || !servico.ativo) {
            throw new AppError("Serviço não encontrado ou inativo.", 400);
        }

        // 3. Obtém o valor da taxa associada ao nível da cidade.
        // Esse valor será registrado no pedido e não será alterado
        // quando a taxa vigente for atualizada futuramente.
        const taxaDeslocamentoEstimada = cidade.taxaDeslocamento.valor;

        // 4. Prepara os dados para criar o pedido.
        // O cliente será localizado ou criado pelo Repository,
        // utilizando o WhatsApp normalizado como identificador.
        const dadosPedido = {
            nome,
            whatsapp,
            cidadeId,
            servicoId,
            endereco,
            descricaoProblema,
            dataPreferida,
            turnoPreferido,
            taxaDeslocamentoEstimada,
            status: "PENDENTE"
        };

        // 5. Cria o pedido e registra seu primeiro histórico.
        // O Repository fará essas operações dentro de uma transação,
        // evitando registros incompletos se ocorrer alguma falha.
        const pedido = await pedidoRepository.criarPedido(dadosPedido);

        return pedido;
    }


async salvarProposta(id, dados, administradorId) {

    // =========================================================
    // 1. BUSCAR O PEDIDO
    // =========================================================
    // Consultamos os dados originais do pedido para verificar:
    // - Se ele existe;
    // - Seu status atual;
    // - Se foi descartado;
    // - A taxa de deslocamento estimada;
    // - A data e o turno solicitados pelo cliente.

    const pedido = await pedidoRepository.buscarDadosParaProposta(id);

    if (!pedido) {
        throw new AppError("Pedido não encontrado.", 404);
    }


    // =========================================================
    // 2. VERIFICAR SE O PEDIDO FOI DESCARTADO
    // =========================================================
    // Pedidos enviados para a lixeira não podem receber
    // propostas nem ter seus orçamentos modificados.

    if (pedido.descartadoEm !== null) {
        throw new AppError(
            "Não é possível orçar um pedido descartado.",
            400
        );
    }


    // =========================================================
    // 3. VERIFICAR O STATUS DO PEDIDO
    // =========================================================
    // Agora permitimos salvar propostas em duas situações:
    //
    // PENDENTE:
    // O cliente solicitou o atendimento, mas Júnior ainda
    // não preparou o orçamento.
    //
    // ACEITO_POR_JUNIOR:
    // Júnior já salvou o orçamento, mas ainda não enviou
    // a proposta ao cliente.
    //
    // Nesse segundo caso, permitimos corrigir os valores,
    // o serviço ou a proposta de reagendamento.
    //
    // Após o envio, o pedido ficará AGUARDANDO_CLIENTE.
    // A partir desse momento, esta rota não poderá mais
    // modificar a proposta inicial.

    const statusPermitidos = [
        "PENDENTE",
        "ACEITO_POR_JUNIOR"
    ];

    if (!statusPermitidos.includes(pedido.status)) {
        throw new AppError(
            "Não é possível salvar ou editar uma proposta neste status.",
            409
        );
    }


    // =========================================================
    // 4. VERIFICAR O SERVIÇO SELECIONADO
    // =========================================================
    // Júnior pode corrigir o serviço escolhido pelo cliente.
    //
    // Porém, o serviço selecionado precisa existir
    // e estar ativo no sistema.

    const servico = await pedidoRepository.buscarServicoAtivoPorId(
        dados.servicoId
    );

    if (!servico) {
        throw new AppError(
            "Serviço não encontrado ou inativo.",
            404
        );
    }


    // =========================================================
    // 5. VALIDAR A TAXA DE DESLOCAMENTO FINAL
    // =========================================================
    // A taxa final nunca poderá ser menor que a taxa
    // estimada registrada na criação do pedido.
    //
    // Exemplo:
    // Taxa estimada: R$ 50,00 (5000 centavos)
    // Taxa final:    R$ 40,00 (4000 centavos)
    //
    // Resultado: operação rejeitada.
    //
    // Essa regra também será aplicada durante a edição
    // de um orçamento ainda não enviado.

    if (
        dados.taxaDeslocamentoFinal <
        pedido.taxaDeslocamentoEstimada
    ) {
        throw new AppError(
            "A taxa de deslocamento final não pode ser menor que a taxa estimada.",
            400
        );
    }


    // =========================================================
    // 6. CALCULAR O TOTAL ESTIMADO
    // =========================================================
    // O Validator já garantiu que os valores recebidos
    // são inteiros válidos e estão em centavos.
    //
    // O total é a soma do valor do serviço com a taxa
    // de deslocamento final.

    const totalEstimado =
        dados.valorPrevisto + dados.taxaDeslocamentoFinal;

    // Verificamos se o resultado continua sendo
    // um número inteiro seguro no JavaScript.

    if (!Number.isSafeInteger(totalEstimado)) {
        throw new AppError(
            "Total estimado inválido.",
            400
        );
    }


    // =========================================================
    // 7. PREPARAR OS DADOS DA PROPOSTA
    // =========================================================
    // O valorPrevisto representa o custo do serviço.
    // A taxaDeslocamentoFinal representa o deslocamento.
    //
    // O totalEstimado é calculado pelo Service e não
    // será armazenado como campo separado no banco.
    //
    // Ao salvar, o pedido deverá ficar com o status
    // ACEITO_POR_JUNIOR, independentemente de ser
    // a primeira proposta ou uma edição.

    const proposta = {
        servicoId: dados.servicoId,
        valorPrevisto: dados.valorPrevisto,
        taxaDeslocamentoFinal: dados.taxaDeslocamentoFinal,
        status: "ACEITO_POR_JUNIOR"
    };


    // =========================================================
    // 8. VERIFICAR SE EXISTE PROPOSTA DE REAGENDAMENTO
    // =========================================================
    // O reagendamento é opcional.
    //
    // Se Júnior não informar uma nova data ou turno,
    // utilizaremos os dados originalmente solicitados.
    //
    // Se ele informar outra data ou turno, registraremos
    // essa informação junto ao orçamento.
    //
    // IMPORTANTE:
    // Propor uma nova data no orçamento inicial NÃO
    // significa que o atendimento já foi reagendado.
    //
    // O pedido continuará ACEITO_POR_JUNIOR até
    // que Júnior registre o envio da proposta.

    if (dados.reagendamento) {

        const { novaData, novoTurno, motivo } =
            dados.reagendamento;

        // A nova proposta precisa modificar pelo menos
        // a data ou o turno originalmente solicitado.

        if (
            novaData === pedido.dataPreferida &&
            novoTurno === pedido.turnoPreferido
        ) {
            throw new AppError(
                "A nova data e o turno não podem ser iguais aos solicitados originalmente.",
                400
            );
        }

        // Preparamos os dados do reagendamento.
        //
        // Não modificamos a data original do pedido,
        // preservando o que o cliente solicitou.

        proposta.reagendamento = {
            novaData,
            novoTurno,
            motivo
        };
    }


    // =========================================================
    // 9. SALVAR A PROPOSTA
    // =========================================================
    // O Repository será responsável por:
    //
    // 1. Atualizar os dados do orçamento;
    // 2. Alterar o status para ACEITO_POR_JUNIOR;
    // 3. Criar, atualizar ou remover o rascunho de
    //    reagendamento, conforme os dados recebidos;
    // 4. Executar essas operações dentro de uma
    //    transação Prisma.
    //
    // A atualização deverá ser permitida apenas enquanto
    // o pedido estiver PENDENTE ou ACEITO_POR_JUNIOR.
    //
    // Essa condição também precisa ser verificada pelo
    // Repository para proteger contra alterações
    // concorrentes no banco de dados.

    const pedidoAtualizado = await pedidoRepository.salvarProposta(
        id,
        proposta,
        administradorId
    );


    // =========================================================
    // 10. RETORNAR O RESULTADO
    // =========================================================
    // O Repository retornará os dados atualizados.
    //
    // O status esperado será ACEITO_POR_JUNIOR.
    //
    // Isso significa que o orçamento foi salvo,
    // mas NÃO que foi enviado ao cliente.
    //
    // O envio pelo WhatsApp será registrado
    // posteriormente por outra rota.
    //
    // Retornamos também o total calculado pelo Service.

    return {
        ...pedidoAtualizado,
        totalEstimado
    };
}

}



export default new PedidoService();
