
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
            descricao: true,
            ativo: true
        },
        orderBy: {
            nome: "asc"
        }
    });
};

const listarTodos = async () => {
    return prisma.servico.findMany({
        select: {
            id: true,
            slug: true,
            nome: true,
            descricao: true,
            ativo: true
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

const ReativarServico = async (id) => {
    return prisma.servico.update({
        where: {
            id
        },
        data: {
            ativo: true
        }
    });
};

const EditarServico = async (id, dados) => {
    return prisma.servico.update({
        where: {
            id
        },
        data: dados
    });
};

export default {
    listarAtivos,
    listarTodos,
    buscarPorSlug,
    buscarPorId,
    CriarServico,
    DesativarServico,
    ReativarServico,
    EditarServico
};
