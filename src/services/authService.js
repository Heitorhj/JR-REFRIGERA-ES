
import bcrypt from "bcryptjs";
import gerarToken from "../config/jwt.js";
import authRepository from "../repositories/authRepository.js";
import AppError from "../errors/AppError.js";

const login = async (email, senha) => {
    const administrador = await authRepository.buscarPorEmail(email);

    if (!administrador) {
        throw new AppError("E-mail ou senha incorretos.", 401);
    }

    const senhaCorreta = await bcrypt.compare(
        senha,
        administrador.senhaHash
    );

    if (!senhaCorreta) {
        throw new AppError("E-mail ou senha incorretos.", 401);
    }

    const token = gerarToken(administrador);

    return {
        token,
        tipo: "Bearer",
        administrador: {
            id: administrador.id,
            nome: administrador.nome,
            email: administrador.email
        }
    };
};

export default {
    login
};
