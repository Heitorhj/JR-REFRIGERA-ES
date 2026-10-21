import jwt from "jsonwebtoken";
import authConfig from "./auth.js";

const gerarToken = (administrador) => {
  return jwt.sign(
    {},
    authConfig.jwtSecret,
    {
      subject: String(administrador.id),
      expiresIn: "8h",
      algorithm: "HS256"
    }
  );
};

export default gerarToken;