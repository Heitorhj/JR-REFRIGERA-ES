import prisma from "../db/prisma.js";

const listarTaxas = async () => {
    return prisma.taxaDeslocamento.findMany({
        select: {
            id: true,
            nivel: true,
            valor: true
        },
        orderBy: {
            nivel: "asc"
        }
    });
};

const buscarPorNivel = async (nivel) => {
    return prisma.taxaDeslocamento.findUnique({
        where: {
            nivel
        }
    });
};

const cadastrar = async ( nivel, valor ) => {
    return prisma.taxaDeslocamento.create({
        data: {
            nivel: nivel,
            valor: valor
        }
    });
};

export default {
    listarTaxas,
    buscarPorNivel,
    cadastrar
};