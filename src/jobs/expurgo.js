import cron from "node-cron";

const validarRetencao = (retencaoDias) => {
    if (!Number.isSafeInteger(retencaoDias) || retencaoDias <= 0) {
        throw new Error("RETENCAO_DIAS deve ser um número inteiro positivo.");
    }
};

const expurgarDescartados = async (
    prisma,
    { retencaoDias, agora = new Date() }
) => {
    validarRetencao(retencaoDias);

    if (!(agora instanceof Date) || Number.isNaN(agora.getTime())) {
        throw new Error("A data de referência do expurgo é inválida.");
    }

    const limite = new Date(
        agora.getTime() - retencaoDias * 24 * 60 * 60 * 1000
    );

    return prisma.$transaction(async (tx) => {
        const pedidosRemovidos = await tx.pedido.deleteMany({
            where: {
                status: {
                    in: ["CANCELADO", "RECUSADO"]
                },
                descartadoEm: {
                    not: null,
                    lte: limite
                }
            }
        });

        const clientesRemovidos = await tx.cliente.deleteMany({
            where: {
                pedidos: {
                    none: {}
                }
            }
        });

        return {
            pedidos: pedidosRemovidos.count,
            clientes: clientesRemovidos.count
        };
    });
};

const agendarExpurgo = (prisma, { retencaoDias }, log = console) => {
    validarRetencao(retencaoDias);

    return cron.schedule(
        "0 3 * * *",
        async () => {
            try {
                const resultado = await expurgarDescartados(prisma, {
                    retencaoDias
                });

                log.log(
                    `[expurgo] ${resultado.pedidos} pedido(s) e ${resultado.clientes} cliente(s) removidos.`
                );
            } catch (error) {
                log.error("[expurgo] falhou:", error);
            }
        },
        {
            timezone: "America/Recife"
        }
    );
};

export { agendarExpurgo, expurgarDescartados };
