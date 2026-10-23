
import jwt from "jsonwebtoken";
import authConfig from "../config/auth.js";
import prisma from "../db/prisma.js";

const loginRequired = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      erro: "Token não informado."
    });
  }

  const [tipo, token, ...resto] = authorization.split(" ");

  if (tipo !== "Bearer" || !token || resto.length > 0) {
    return res.status(401).json({
      erro: "Formato do token inválido."
    });
  }

  let payload;

  try {
    payload = jwt.verify(token, authConfig.jwtSecret, {
      algorithms: ["HS256"]
    });
  } catch (error) {
    return res.status(401).json({
      erro: error.name === "TokenExpiredError"
        ? "Token expirado."
        : "Token inválido."
    });
  }

  const administradorId = Number(payload.sub);

  if (!Number.isSafeInteger(administradorId) || administradorId <= 0) {
    return res.status(401).json({
      erro: "Token inválido."
    });
  }

  try {
    const administrador = await prisma.administrador.findUnique({
      where: { id: administradorId },
      select: {
        id: true,
        nome: true,
        email: true
      }
    });

    if (!administrador) {
      return res.status(401).json({
        erro: "Administrador não encontrado."
      });
    }

    req.administrador = administrador;

    return next();
  } catch (error) {
    return next(error);
  }
};

export default loginRequired;
