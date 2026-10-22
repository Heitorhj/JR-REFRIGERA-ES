import prisma from "../db/prisma.js";

const listarCidadesAtivas = async () => {
    return prisma.cidade.findMany({
        where: {
            ativa: true
        },
        select: {
            id: true,
            nome: true,
            nivel: true,
            regiao: true,
            taxaDeslocamento: true
        },
        orderBy: {
            nome: "asc"
        }
    });
};

export default {
    listarCidadesAtivas
};