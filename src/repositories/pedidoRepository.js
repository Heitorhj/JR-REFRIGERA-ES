
import prisma from "../db/prisma.js";
import AppError from "../errors/AppError.js";

// Busca uma cidade pelo ID informado.
// Também retorna o valor da taxa de deslocamento associada à cidade.
const buscarCidadePorId = async (id) => {
    return prisma.cidade.findUnique({
        where: { id },
        include: {
            taxaDeslocamento: {
                select: {
                    valor: true
                }
            }
        }
    });
};

// Busca o serviço solicitado pelo cliente.
const buscarServicoPorId = async (id) => {
    return prisma.servico.findUnique({
        where: { id }
    });
};

// Busca os dados necessários para o atendimento administrativo,
// selecionando campos específicos para não expor dados sensíveis.
const buscarPorId = async (id) => {
    return prisma.pedido.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            endereco: true,
            descricaoProblema: true,
            dataPreferida: true,
            turnoPreferido: true,
            valorPrevisto: true,
            taxaDeslocamentoEstimada: true,
            taxaDeslocamentoFinal: true,
            criadoEm: true,
            atualizadoEm: true,
            // Relation selects return only customer contact and service-area
            // details needed for support; they do not expose credentials.
            cliente: {
                select: {
                    nome: true,
                    whatsapp: true
                }
            },
            cidade: {
                select: {
                    nome: true,
                    regiao: true,
                    nivel: true
                }
            },
            servico: {
                select: {
                    nome: true,
                    descricao: true
                }
            },
            // Ascending timestamps show the status history in event order.
            // ID is a stable tie-breaker when two events share a timestamp.
            historicos: {
                orderBy: [
                    { criadoEm: "asc" },
                    { id: "asc" }
                ],
                select: {
                    criadoEm: true,
                    statusAnterior: true,
                    statusNovo: true,
                    observacao: true,
                    administrador: {
                        select: {
                            nome: true
                        }
                    }
                }
            },
            // Reagendamentos follow the same chronological ordering as history.
            reagendamentos: {
                orderBy: [
                    { criadoEm: "asc" },
                    { id: "asc" }
                ],
                select: {
                    novaData: true,
                    novoTurno: true,
                    motivo: true,
                    aceito: true,
                    criadoEm: true
                }
            }
        }
    });
};

// Lista os pedidos para o painel administrativo.
// Permite filtrar por status e navegar entre páginas.
const listarPedidos = async ({ page, limit, status }) => {

    // 1. PREPARAR OS FILTROS

    // Por padrão, buscamos somente pedidos não descartados.
    // O campo descartadoEm será preenchido quando um pedido
    // for enviado para a área de descarte.
    const where = {
        descartadoEm: null
    };

    // Se o administrador informou um status,
    // adicionamos esse filtro à consulta.
    // Exemplo: where.status = "PENDENTE".
    if (status !== undefined) {
        where.status = status;
    }

    // 2. CALCULAR A PAGINAÇÃO

    // page representa qual página desejamos visualizar.
    // limit representa quantos pedidos queremos por página.
    //
    // Exemplo: page = 2 e limit = 10.
    // skip = (2 - 1) * 10 = 10.
    //
    // O Prisma ignorará os primeiros 10 pedidos
    // da lista filtrada e ordenada.
    const skip = (page - 1) * limit;

    // 3. CONSULTAR PEDIDOS E QUANTIDADE TOTAL

    // Promise.all executa as duas consultas sem precisar
    // aguardar a primeira terminar para iniciar a segunda.
    //
    // findMany: busca os pedidos da página solicitada.
    // count: conta todos os pedidos que atendem aos filtros,
    // independentemente da página.
    //
    // O resultado é um array:
    // [listaDePedidos, quantidadeTotal].
    const [pedidos, total] = await Promise.all([

        prisma.pedido.findMany({
            where,

            // Ordena do pedido mais recente para o mais antigo.
            // O ID desempata pedidos com a mesma data de criação.
            orderBy: [
                { criadoEm: "desc" },
                { id: "desc" }
            ],

            // Quantos registros serão ignorados.
            skip,

            // Quantos registros, no máximo, serão retornados.
            take: limit,

            // Seleciona somente os campos necessários ao painel.
            select: {
                id: true,
                status: true,
                dataPreferida: true,
                turnoPreferido: true,
                taxaDeslocamentoEstimada: true,
                criadoEm: true,

                // Inclui nome e WhatsApp do cliente associado.
                cliente: {
                    select: {
                        nome: true,
                        whatsapp: true
                    }
                },

                // Inclui o nome da cidade.
                cidade: {
                    select: {
                        nome: true
                    }
                },

                // Inclui o nome do serviço solicitado.
                servico: {
                    select: {
                        nome: true
                    }
                }
            }
        }),

        // Conta todos os pedidos que atendem aos mesmos filtros.
        // Não utiliza skip nem take, pois precisamos do total
        // para calcular quantas páginas existem.
        prisma.pedido.count({
            where
        })
    ]);

    // Retorna os pedidos encontrados e o total.
    // O Service utilizará essas informações para
    // montar a resposta com os dados de paginação.
    return {
        pedidos,
        total
    };
};

// Cria um novo pedido, reutilizando o cliente caso já exista.
const criarPedido = async (dados) => {

    // Inicia uma transação do Prisma.
    // O tx é fornecido pelo Prisma e permite executar todas
    // as operações dentro da mesma transação.
    // Se alguma falhar, o banco desfaz as alterações realizadas.
    return await prisma.$transaction(async (tx) => {

        // 1. LOCALIZAR OU CRIAR CLIENTE

        // O upsert procura um cliente pelo WhatsApp (campo único).
        // Se existir, reutiliza seu registro sem alterar os dados.
        // Se não existir, cadastra um novo cliente.
        const cliente = await tx.cliente.upsert({
            where: {
                whatsapp: dados.whatsapp
            },
            update: {},
            create: {
                nome: dados.nome,
                whatsapp: dados.whatsapp
            }
        });

        // 2. CRIAR PEDIDO

        // Aguarda o cliente para utilizar seu ID na criação do pedido.
        // A taxa estimada é uma cópia do valor vigente no momento
        // da solicitação, não uma referência ao valor atual da taxa.
        const pedido = await tx.pedido.create({
            data: {
                clienteId: cliente.id,
                servicoId: dados.servicoId,
                cidadeId: dados.cidadeId,
                endereco: dados.endereco,
                descricaoProblema: dados.descricaoProblema,
                dataPreferida: dados.dataPreferida,
                turnoPreferido: dados.turnoPreferido,
                taxaDeslocamentoEstimada: dados.taxaDeslocamentoEstimada,
                status: "PENDENTE"
            },

            // Retorna somente os campos necessários para confirmar
            // a solicitação, sem expor dados pessoais do cliente.
            select: {
                id: true,
                status: true,
                dataPreferida: true,
                turnoPreferido: true,
                criadoEm: true
            }
        });

        // 3. REGISTRAR HISTÓRICO INICIAL

        // Registra a criação do pedido.
        // administradorId é null porque a solicitação é pública.
        // statusAnterior é null porque o pedido acabou de ser criado
        // e ainda não possuía um status anterior.
        await tx.historicoStatus.create({
            data: {
                pedidoId: pedido.id,
                administradorId: null,
                statusAnterior: null,
                statusNovo: "PENDENTE",
                observacao: "Solicitação criada pelo cliente."
            }
        });

        // Retorna o pedido criado.
        // Se todas as operações forem concluídas, a transação
        // será confirmada (COMMIT). Se alguma falhar, será
        // revertida (ROLLBACK), e o erro será propagado.
        return pedido;
    });
};


// ============================================================
// NOVOS MÉTODOS — PROPOSTA DE ORÇAMENTO
// ============================================================


// Busca somente os dados necessários para analisar uma proposta.
// O Service utilizará essas informações para verificar as regras
// de negócio antes de permitir que o orçamento seja salvo.
const buscarDadosParaProposta = async (id) => {

    return prisma.pedido.findUnique({
        where: { id },

        select: {
            // Identificação do pedido.
            id: true,

            // Verifica se o pedido ainda está PENDENTE.
            status: true,

            // Verifica se o pedido está na área de descarte.
            descartadoEm: true,

            // Taxa registrada quando o cliente criou o pedido.
            // A taxa final não poderá ser inferior a esse valor.
            taxaDeslocamentoEstimada: true,

            // Data e turno originalmente solicitados pelo cliente.
            // Serão utilizados para verificar se Júnior realmente
            // está propondo uma data ou um turno diferente.
            dataPreferida: true,
            turnoPreferido: true
        }
    });
};


// Busca um serviço pelo ID, mas somente se estiver ativo.
// Júnior poderá corrigir o serviço informado pelo cliente,
// desde que o novo serviço esteja disponível para atendimento.
const buscarServicoAtivoPorId = async (id) => {

    return prisma.servico.findFirst({
        where: {
            id,
            ativo: true
        },

        select: {
            id: true,
            nome: true,
            ativo: true
        }
    });
};

// Loads only saved proposal and recipient data needed to open WhatsApp.
const buscarDadosParaEnvioManualProposta = async (id) => {
    return prisma.pedido.findUnique({
        where: { id },
        select: {
            id: true,
            status: true,
            descartadoEm: true,
            dataPreferida: true,
            turnoPreferido: true,
            valorPrevisto: true,
            taxaDeslocamentoFinal: true,
            cliente: {
                select: {
                    nome: true,
                    whatsapp: true
                }
            },
            servico: {
                select: {
                    nome: true
                }
            },
            reagendamentos: {
                where: {
                    aceito: null
                },
                orderBy: [
                    { criadoEm: "desc" },
                    { id: "desc" }
                ],
                take: 1,
                select: {
                    novaData: true,
                    novoTurno: true
                }
            }
        }
    });
};

// Records the administrator's manual send confirmation atomically with
// the status change, allowing only the first transition from this status.
const registrarEnvioManualProposta = async (id, administradorId) => {
    return prisma.$transaction(async (tx) => {
        const resultado = await tx.pedido.updateMany({
            where: {
                id,
                status: "ACEITO_POR_JUNIOR",
                descartadoEm: null,
                valorPrevisto: {
                    not: null
                },
                taxaDeslocamentoFinal: {
                    not: null
                }
            },
            data: {
                status: "AGUARDANDO_CLIENTE"
            }
        });

        if (resultado.count !== 1) {
            throw new AppError(
                "O pedido mudou ou não está mais disponível para registrar o envio.",
                409
            );
        }

        const historico = await tx.historicoStatus.create({
            data: {
                pedidoId: id,
                administradorId,
                statusAnterior: "ACEITO_POR_JUNIOR",
                statusNovo: "AGUARDANDO_CLIENTE",
                observacao: "Envio da proposta informado manualmente pelo administrador."
            },
            select: {
                criadoEm: true
            }
        });

        return historico;
    });
};

// Saves the administrator-reported customer response and its status history
// together, only if the proposal is still waiting for the customer's response.
const registrarRespostaCliente = async (
    id,
    administradorId,
    acao,
    observacao,
    novoStatus
) => {
    return prisma.$transaction(async (tx) => {
        const resultado = await tx.pedido.updateMany({
            where: {
                id,
                status: "AGUARDANDO_CLIENTE",
                descartadoEm: null
            },
            data: {
                status: novoStatus
            }
        });

        if (resultado.count !== 1) {
            throw new AppError(
                "O pedido mudou ou não está mais aguardando resposta.",
                409
            );
        }

        // Only an explicit acceptance answers the proposed date. Negotiating
        // or cancelling the order must not be recorded as rejecting that date.
        if (acao === "ACEITAR") {
            await tx.reagendamento.updateMany({
                where: {
                    pedidoId: id,
                    aceito: null
                },
                data: {
                    aceito: true
                }
            });
        }

        let textoObservacao = `Resposta recebida e informada manualmente: ${acao}.`;

        if (observacao) {
            textoObservacao += ` ${observacao}`;
        }

        const historico = await tx.historicoStatus.create({
            data: {
                pedidoId: id,
                administradorId,
                statusAnterior: "AGUARDANDO_CLIENTE",
                statusNovo: novoStatus,
                observacao: textoObservacao
            },
            select: {
                criadoEm: true
            }
        });

        return {
            status: novoStatus,
            registradoEm: historico.criadoEm
        };
    });
};


// Salva a proposta de orçamento de um pedido pendente.
// Atualiza o serviço, o valor previsto e a taxa final.
//
// Se Júnior informar um reagendamento, também registra
// a nova data e o turno na tabela Reagendamento.
//
// Todas as operações são executadas em uma transação Prisma.
const salvarProposta = async (id, dados, administradorId) => {

    return await prisma.$transaction(async (tx) => {

        // 1. ATUALIZAR OS DADOS FINANCEIROS E O STATUS DO PEDIDO
        const pedidoAntesDaAtualizacao = await tx.pedido.findUnique({
            where: { id },
            select: {
                status: true
            }
        });

        // Atualizamos somente os campos permitidos.
        // A taxa de deslocamento original permanece inalterada.
        //
        // O Service já validou a taxa final e calculou o total.
        //
        // Permitimos salvar quando o pedido está PENDENTE
        // ou ACEITO_POR_JUNIOR (proposta salva, ainda não enviada).
        //
        // O updateMany verifica novamente essas condições
        // para evitar alterações indevidas no pedido.
        const resultado = await tx.pedido.updateMany({
            where: {
                id,
                status: {
                    in: ["PENDENTE", "ACEITO_POR_JUNIOR"]
                },
                descartadoEm: null
            },

            data: {
                servicoId: dados.servicoId,
                valorPrevisto: dados.valorPrevisto,
                taxaDeslocamentoFinal: dados.taxaDeslocamentoFinal,
                status: "ACEITO_POR_JUNIOR"
            }
        });

        // updateMany retorna a quantidade de registros atualizados.
        // Como estamos filtrando pelo ID, esperamos exatamente 1.
        //
        // Se nenhum pedido foi atualizado, interrompemos a transação.
        if (resultado.count !== 1) {
            throw new AppError(
                "O pedido não está mais disponível para salvar ou editar a proposta.",
                409
            );
        }

        // Registra a mudança de status na mesma transação do orçamento.
        // Edições posteriores de uma proposta já salva não geram
        // um histórico redundante do mesmo status.
        if (
            pedidoAntesDaAtualizacao.status !==
            "ACEITO_POR_JUNIOR"
        ) {
            await tx.historicoStatus.create({
                data: {
                    pedidoId: id,
                    administradorId,
                    statusAnterior: pedidoAntesDaAtualizacao.status,
                    statusNovo: "ACEITO_POR_JUNIOR",
                    observacao: "Proposta de orçamento salva."
                }
            });
        }

        // 2. VERIFICAR SE EXISTE UM RASCUNHO DE REAGENDAMENTO

        // Procuramos uma proposta de nova data ainda sem resposta.
        // Nesta rota, o pedido só pode estar em uma etapa
        // anterior ao envio da proposta pelo WhatsApp.
        //
        // O registro mais recente será utilizado para edição.
        const reagendamentoExistente =
            await tx.reagendamento.findFirst({
                where: {
                    pedidoId: id,
                    aceito: null
                },

                orderBy: [
                    { criadoEm: "desc" },
                    { id: "desc" }
                ],

                select: {
                    id: true
                }
            });

        // 3. REGISTRAR OU ATUALIZAR O REAGENDAMENTO OPCIONAL

        // Se Júnior informou uma nova data, salvamos a proposta.
        if (dados.reagendamento) {

            // Se já existe um rascunho, atualizamos o registro.
            if (reagendamentoExistente) {

                await tx.reagendamento.update({
                    where: {
                        id: reagendamentoExistente.id
                    },

                    data: {
                        novaData: dados.reagendamento.novaData,
                        novoTurno: dados.reagendamento.novoTurno,
                        motivo: dados.reagendamento.motivo
                    }
                });

            } else {

                // Se não existe rascunho, criamos um novo registro.
                // aceito = null indica ausência de resposta do cliente.
                await tx.reagendamento.create({
                    data: {
                        pedidoId: id,
                        novaData: dados.reagendamento.novaData,
                        novoTurno: dados.reagendamento.novoTurno,
                        motivo: dados.reagendamento.motivo,
                        aceito: null
                    }
                });
            }

        } else {

            // Se Júnior salvou o orçamento sem uma nova data,
            // removemos os rascunhos de reagendamento sem resposta.
            //
            // Isso vale para a proposta inicial, antes do envio.
            await tx.reagendamento.deleteMany({
                where: {
                    pedidoId: id,
                    aceito: null
                }
            });
        }

        // 4. BUSCAR OS DADOS ATUALIZADOS

        // Consultamos novamente o pedido para retornar
        // os dados finais do orçamento ao Service.
        const pedidoAtualizado = await tx.pedido.findUnique({
            where: { id },

            select: {
                id: true,
                status: true,
                servicoId: true,
                valorPrevisto: true,
                taxaDeslocamentoEstimada: true,
                taxaDeslocamentoFinal: true,
                dataPreferida: true,
                turnoPreferido: true,
                atualizadoEm: true,

                // Retorna a proposta de nova data, caso exista.
                reagendamentos: {
                    where: {
                        aceito: null
                    },

                    orderBy: [
                        { criadoEm: "desc" },
                        { id: "desc" }
                    ],

                    take: 1,

                    select: {
                        id: true,
                        novaData: true,
                        novoTurno: true,
                        motivo: true,
                        aceito: true
                    }
                }
            }
        });

        // 5. RETORNAR A PROPOSTA ATUALIZADA

        // O pedido agora estará ACEITO_POR_JUNIOR.
        // Isso significa que o orçamento foi salvo,
        // mas ainda não foi enviado pelo WhatsApp.
        //
        // O totalEstimado será acrescentado pelo Service.
        //
        // Se qualquer operação falhar, a transação será revertida.
        return pedidoAtualizado;
    });
};


export default {
    buscarCidadePorId,
    buscarServicoPorId,
    buscarPorId,
    listarPedidos,
    criarPedido,

    // Métodos utilizados na proposta de orçamento.
    buscarDadosParaProposta,
    buscarServicoAtivoPorId,
    buscarDadosParaEnvioManualProposta,
    registrarEnvioManualProposta,
    registrarRespostaCliente,
    salvarProposta
};
