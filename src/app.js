const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { criarLimitadores } = require('./middleware/rateLimiters');
const { criarAuthMiddleware } = require('./middleware/auth');
const { naoEncontrado, tratadorDeErros } = require('./middleware/errorHandler');
const { criarRotasAuth } = require('./routes/auth');

/**
 * Fábrica da aplicação Express. Recebe o banco e a configuração para
 * facilitar os testes (banco em memória, limites customizados).
 */
function createApp({ db, config }) {
  const app = express();

  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10kb' }));

  const limitadores = criarLimitadores(config.rateLimit);
  const autenticar = criarAuthMiddleware({ db, jwtSecret: config.jwtSecret });

  app.get('/api/saude', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api', limitadores.geral);

  app.use(
    '/api/auth',
    criarRotasAuth({
      db,
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn,
      limitadorLogin: limitadores.login,
      autenticar,
    }),
  );

  app.use(naoEncontrado);
  app.use(tratadorDeErros);

  return app;
}

module.exports = { createApp };
