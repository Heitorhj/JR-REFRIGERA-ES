const { erros } = require('../utils/errors');

/**
 * Valida req[source] com um schema zod e substitui pelo valor já tratado.
 * Em Express 5 req.query é somente leitura, então o resultado vai para req.dados.
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req[source]);
    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((i) => ({
        campo: i.path.join('.') || source,
        mensagem: i.message,
      }));
      return next(erros.validacao(detalhes));
    }
    req.dados = { ...(req.dados || {}), [source]: resultado.data };
    return next();
  };
}

module.exports = { validate };
