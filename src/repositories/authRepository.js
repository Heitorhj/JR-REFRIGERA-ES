import prisma from "../db/prisma.js";

const buscarPorEmail = async (email) => {
    return await prisma.administrador.findUnique({
        where: {
            email: email
        }
    });
};

export default {
    buscarPorEmail
};