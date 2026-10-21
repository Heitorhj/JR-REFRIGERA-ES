
import prisma from "../db/prisma.js";

const listarAtivos = async () => {
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

const buscarPorSlug = async (slug) => {
    return prisma.servico.findUnique({
        where: {
            slug
        }
    });
};

const CriarServico = async (nome, slug, descricao) => {
    return prisma.servico.create({
        data: {
            nome,
            slug,
            descricao
        }
    });
};

export default {
    listarAtivos,
    buscarPorSlug,
    CriarServico
};
