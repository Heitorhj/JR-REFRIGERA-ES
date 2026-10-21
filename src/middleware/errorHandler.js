const { AppError } = require('../utils/errors');

function naoEncontrado(_req, _res, next) {
  next(new AppError(404, 'ROTA_NAO_ENCONTRADA', 'Rota não encontrada.'));
}

// eslint-disable-next-line no-unused-vars
function tratadorDeErros(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      erro: { codigo: err.codigo, mensagem: err.message, detalhes: err.detalhes },
    });
  }

  // JSON malformado ou corpo grande demais (body-parser)
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ erro: { codigo: 'JSON_INVALIDO', mensagem: 'Corpo da requisição não é um JSON válido.' } });
  }
  if (err.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ erro: { codigo: 'CORPO_GRANDE', mensagem: 'Corpo da requisição muito grande.' } });
  }

  console.error(err);
  return res
    .status(500)
    .json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno do servidor.' } });
}

module.exports = { naoEncontrado, tratadorDeErros };
