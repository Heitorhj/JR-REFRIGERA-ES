
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
    criarPedido
};
