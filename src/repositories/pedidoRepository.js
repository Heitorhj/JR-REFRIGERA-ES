
import prisma from "../db/prisma.js";

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

export default {
    buscarCidadePorId,
    buscarServicoPorId,
    buscarPorId,
    listarPedidos,
    criarPedido
};
