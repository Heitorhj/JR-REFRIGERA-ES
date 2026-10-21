import prisma from "../db/prisma.js";

const listarServicosAtivos = async () => {
    return prisma.servico.findMany({
        where: {
            ativo: true
        },
        select: {
            id: true,
            slug: true,
            nome: true,
            descricao: true
        },
        orderBy: {
            nome: "asc"
        }
    });
};

export default {
    listarServicosAtivos
};