const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { STATUS } = require('../services/estados');
const { TIPOS, gerarLink, tipoPadrao } = require('../services/whatsapp');
const { dataValida } = require('../utils/datas');

const TURNOS = ['MANHA', 'TARDE'];

const idSchema = z.object({ id: z.coerce.number().int().positive() });

const listaSchema = z.object({
  status: z.enum(STATUS).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

const reais = z.number().min(0, 'Valor não pode ser negativo.').max(1_000_000);
const dataSchema = z.string().refine(dataValida, 'Data inválida. Use AAAA-MM-DD.');

const valoresSchema = z
  .object({
    valor_previsto: reais.optional(),
    taxa_deslocamento_final: reais.optional(),
  })
  .refine((d) => d.valor_previsto !== undefined || d.taxa_deslocamento_final !== undefined, {
    message: 'Informe valor_previsto e/ou taxa_deslocamento_final.',
  });

const statusSchema = z.object({
  status: z.enum(STATUS, { error: `Status deve ser um de: ${STATUS.join(', ')}.` }),
  motivo: z.string().trim().max(300).optional(),
  valor_previsto: reais.optional(),
  taxa_deslocamento_final: reais.optional(),
  nova_data: dataSchema.optional(),
  novo_turno: z.enum(TURNOS).optional(),
});

const reagendarSchema = z.object({
  nova_data: dataSchema,
  novo_turno: z.enum(TURNOS, { error: 'Turno deve ser MANHA ou TARDE.' }),
  motivo: z.string().trim().max(300).optional(),
});

const whatsappSchema = z.object({ tipo: z.enum(TIPOS).optional() });

/** Rotas privadas do painel (/api/admin) — todas exigem JWT válido. */
function criarRotasAdmin({ servicoAdmin, autenticar }) {
  const router = Router();
  router.use(autenticar);

  router.get('/resumo', (_req, res) => res.json(servicoAdmin.resumo()));

  router.get('/pedidos', validate(listaSchema, 'query'), (req, res) => {
    res.json(servicoAdmin.listar(req.dados.query));
  });

  router.get('/pedidos/:id', validate(idSchema, 'params'), (req, res) => {
    const pedido = servicoAdmin.detalhar(req.dados.params.id);
    res.json({ pedido });
  });

  // RF07 / RF08
  router.patch(
    '/pedidos/:id/valores',
    validate(idSchema, 'params'),
    validate(valoresSchema),
    (req, res) => {
      const pedido = servicoAdmin.atualizarValores(req.dados.params.id, req.dados.body, req.usuario.id);
      res.json({ pedido });
    },
  );

  // RF09
  router.post(
    '/pedidos/:id/reagendar',
    validate(idSchema, 'params'),
    validate(reagendarSchema),
    (req, res) => {
      const pedido = servicoAdmin.mudarStatus(
        req.dados.params.id,
        { ...req.dados.body, status: 'REAGENDADO' },
        req.usuario.id,
      );
      res.json({ pedido });
    },
  );

  // RF10
  router.patch(
    '/pedidos/:id/status',
    validate(idSchema, 'params'),
    validate(statusSchema),
    (req, res) => {
      const pedido = servicoAdmin.mudarStatus(req.dados.params.id, req.dados.body, req.usuario.id);
      res.json({ pedido });
    },
  );

  // RF11 — link wa.me com mensagem pronta (tipo padrão depende do estado atual)
  router.get(
    '/pedidos/:id/whatsapp',
    validate(idSchema, 'params'),
    validate(whatsappSchema, 'query'),
    (req, res) => {
      const pedido = servicoAdmin.obterSerializado(req.dados.params.id);
      const tipo = req.dados.query.tipo || tipoPadrao(pedido.status);
      res.json({ pedido_id: pedido.id, status: pedido.status, ...gerarLink(pedido, tipo) });
    },
  );

  return router;
}

module.exports = { criarRotasAdmin };
