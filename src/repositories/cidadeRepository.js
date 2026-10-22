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

const buscarPorId = async (id) => {
    return prisma.cidade.findUnique({
        where: {
            id
        }
    });
};

// Cadastrar uma cidade e associá-la a uma taxa de deslocamento existente
const cadastrarCidade = async ( nome, nivel, regiao ) => {
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
            taxaDeslocamento: {
                select: {
                    valor: true
                }
            }
        }
    });
};

const desativarCidade = async (id) => {
    return prisma.cidade.update({
        where: {
            id
        },
        data: {
            ativa: false
        }
    });
};

const reativarCidade = async (id) => {
    return prisma.cidade.update({
        where: {
            id
        },
        data: {
            ativa: true
        },
        include: {
            taxaDeslocamento: {
                select: {
                    valor: true
                }
            }
        }
    });
};

// Editar os dados de uma cidade
const editarCidade = async (id, dados) => {
    // Copia os dados já validados, filtrados e normalizados.
    const dadosAtualizacao = { ...dados };

    // Se o nível foi enviado, atualizamos o relacionamento
    // com a configuração de taxa de deslocamento existente.
    if (dadosAtualizacao.nivel !== undefined) {
        const nivel = dadosAtualizacao.nivel;

        // Remove o nível do objeto porque ele será atualizado
        // através do relacionamento Prisma (connect).
        delete dadosAtualizacao.nivel;

        dadosAtualizacao.taxaDeslocamento = {
            connect: {
                nivel
            }
        };
    }

    return prisma.cidade.update({
        where: {
            id
        },
        data: dadosAtualizacao,
        include: {
            taxaDeslocamento: {
                select: {
                    valor: true
                }
            }
        }
    });
};

export default {
    listarCidadesAtivas,
    buscarPorNome,
    buscarPorId,
    cadastrarCidade,
    desativarCidade,
    reativarCidade
};