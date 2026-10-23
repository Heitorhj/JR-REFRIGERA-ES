
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

const buscarPorId = async (id) => {
    return prisma.servico.findUnique({
        where: {
            id
        },
        select: {
            id: true
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

const DesativarServico = async (id) => {
    return prisma.servico.update({
        where: {
            id
        },
        data: {
            ativo: false
        }
    });
};

export default {
    listarAtivos,
    buscarPorSlug,
    buscarPorId,
    CriarServico,
    DesativarServico
};
