import authService from "../services/authService.js";

const login = async (req, res, next) => {
    try {
        const { email, senha } = req.body;

        const resultado = await authService.login(email, senha);

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token: resultado.token,
            usuario: resultado.administrador
        });
    } catch (e) {
        return next(e);
    }
}

export default {
    login
}