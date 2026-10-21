const rateLimit = require('express-rate-limit');

function limitador({ windowMs, limit, mensagem, ...extra }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { erro: { codigo: 'MUITAS_REQUISICOES', mensagem } },
    ...extra,
  });
}

/**
 * RF06 / RNF07 — limites de requisição.
 * - geral: toda a API
 * - login: contra força bruta (só conta tentativas que falharam)
 * - pedido: contra spam no formulário público de orçamento
 */
function criarLimitadores({ geralMax, loginMax, pedidoMax }) {
  return {
    geral: limitador({
      windowMs: 15 * 60 * 1000,
      limit: geralMax,
      mensagem: 'Muitas requisições. Tente novamente em alguns minutos.',
    }),
    login: limitador({
      windowMs: 15 * 60 * 1000,
      limit: loginMax,
      skipSuccessfulRequests: true,
      mensagem: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    }),
    pedido: limitador({
      windowMs: 60 * 60 * 1000,
      limit: pedidoMax,
      mensagem: 'Limite de solicitações atingido. Tente novamente mais tarde.',
    }),
  };
}

module.exports = { criarLimitadores };
