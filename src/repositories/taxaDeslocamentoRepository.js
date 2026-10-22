import prisma from "../db/prisma.js";

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
    buscarPorNivel,
    cadastrar
};