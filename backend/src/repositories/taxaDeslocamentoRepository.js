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

// Editar o valor de uma taxa de deslocamento
const editarTaxa = async (nivel, valor) => {
    return prisma.taxaDeslocamento.update({
        where: {
            nivel: nivel
        },
        data: {
            valor: valor
        },
        select: {
            id: true,
            nivel: true,
            valor: true
        }
    });
};

export default {
    listarTaxas,
    buscarPorNivel,
    cadastrar,
    editarTaxa
};