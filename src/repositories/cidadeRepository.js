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
            taxaDeslocamento: {
                select: {
                    valor: true
                }
            }
        },
        orderBy: {
            nome: "asc"
        }
    });
};

const buscarPorNome = async (nome) => {
    return prisma.cidade.findUnique({
        where: {
            nome: nome
        }
    });
}

// Cadastrar uma cidade e associá-la a uma taxa de deslocamento existente
const cadastrar = async ( nome, nivel, regiao ) => {
    return prisma.cidade.create({
        data: {
            nome: nome,
            regiao: regiao,

            // "taxaDeslocamento" é o relacionamento
            taxaDeslocamento: {
                // O connect procura um registro JÁ EXISTENTE
                // na tabela TaxaDeslocamento pelo campo único "nivel".
                connect: {
                    nivel: nivel
                }
            }

            // Como Cidade.nivel é a chave estrangeira,
            // o Prisma preenche esse campo automaticamente
            // com o nível da taxa encontrada.
        },

        // Retorna a cidade cadastrada junto com os
        // dados da taxa de deslocamento relacionada.
        include: {
            taxaDeslocamento: true
        }
    });
};

export default {
    listarCidadesAtivas,
    buscarPorNome,
    cadastrar
};