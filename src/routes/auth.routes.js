const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { erros } = require('../utils/errors');

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido.')),
  senha: z.string().min(1, 'Senha obrigatória.').max(200),
});

// Hash fixo usado para manter o tempo de resposta parecido quando o e-mail não existe
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-igualar-tempo', 12);

function criarRotasAuth({ db, jwtSecret, jwtExpiresIn, limitadorLogin, autenticar }) {
  const router = Router();
  const buscarPorEmail = db.prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?');

  // RF04 — login com bcrypt + JWT
  router.post('/login', limitadorLogin, validate(loginSchema), async (req, res) => {
    const { email, senha } = req.dados.body;
    const usuario = buscarPorEmail.get(email);

    const confere = await bcrypt.compare(senha, usuario ? usuario.senha_hash : HASH_FALSO);
    if (!usuario || !confere) {
      throw erros.naoAutenticado('E-mail ou senha incorretos.');
    }

    const token = jwt.sign({ email: usuario.email }, jwtSecret, {
      algorithm: 'HS256',
      subject: String(usuario.id),
      expiresIn: jwtExpiresIn,
    });

    res.json({
      token,
      tipo: 'Bearer',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  });

  router.get('/me', autenticar, (req, res) => {
    res.json({ usuario: req.usuario });
  });

  return router;
}

module.exports = { criarRotasAuth };
