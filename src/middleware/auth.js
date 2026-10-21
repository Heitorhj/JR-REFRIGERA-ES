const jwt = require('jsonwebtoken');
const { erros } = require('../utils/errors');

/**
 * Middleware de proteção das rotas administrativas (RF05 / RNF06).
 * Exige "Authorization: Bearer <jwt>", verifica assinatura (HS256) e validade,
 * e confirma que o usuário do token ainda existe.
 */
function criarAuthMiddleware({ db, jwtSecret }) {
  const buscarUsuario = db.prepare('SELECT id, nome, email FROM usuarios WHERE id = ?');

  return function autenticar(req, _res, next) {
    const header = req.headers.authorization || '';
    const [esquema, token] = header.split(' ');

    if (esquema !== 'Bearer' || !token) {
      return next(erros.naoAutenticado());
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expirado.' : 'Token ausente ou inválido.';
      return next(erros.naoAutenticado(msg));
    }

    const usuario = buscarUsuario.get(Number(payload.sub));
    if (!usuario) return next(erros.naoAutenticado());

    req.usuario = usuario;
    return next();
  };
}

module.exports = { criarAuthMiddleware };
