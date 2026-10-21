class AppError extends Error {
  constructor(status, codigo, mensagem, detalhes) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

const erros = {
  validacao: (detalhes) => new AppError(400, 'VALIDACAO', 'Dados inválidos.', detalhes),
  naoAutenticado: (msg = 'Token ausente ou inválido.') => new AppError(401, 'NAO_AUTENTICADO', msg),
  naoEncontrado: (msg = 'Recurso não encontrado.') => new AppError(404, 'NAO_ENCONTRADO', msg),
  conflito: (msg, codigo = 'CONFLITO') => new AppError(409, codigo, msg),
  regra: (msg, codigo = 'REGRA_DE_NEGOCIO') => new AppError(422, codigo, msg),
};

module.exports = { AppError, erros };
