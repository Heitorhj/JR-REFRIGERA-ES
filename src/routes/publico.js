const { Router } = require('express');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { erros } = require('../utils/errors');
const { fromCents } = require('../utils/money');
const { normalizarWhatsapp } = require('../utils/telefone');
const { dataValida, hojeRecife } = require('../utils/datas');

const TURNOS = ['MANHA', 'TARDE'];

const pedidoSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(100),
  whatsapp: z
    .string()
    .transform((v, ctx) => {
      const n = normalizarWhatsapp(v);
      if (!n) ctx.addIssue({ code: 'custom', message: 'WhatsApp inválido. Use DDD + número.' });
      return n;
    }),
  cidade_id: z.number().int().positive(),
  endereco: z.string().trim().min(3, 'Informe o bairro/endereço.').max(200),
  descricao_problema: z.string().trim().min(5, 'Descreva o problema.').max(1000),
  servico_id: z.number().int().positive(),
  data_preferida: z
    .string()
    .refine(dataValida, 'Data inválida. Use AAAA-MM-DD.')
    .refine((d) => d >= hojeRecife(), 'A data não pode estar no passado.'),
  turno_preferido: z.enum(TURNOS, { error: 'Turno deve ser MANHA ou TARDE.' }),
});

const deslocamentoSchema = z.object({
  cidade_id: z.coerce.number().int().positive(),
});

function criarRotasPublicas({ db, servicoPedidos, limitadorPedido }) {
  const router = Router();

  const listarServicos = db.prepare(
    'SELECT id, slug, nome, descricao FROM servicos WHERE ativo = 1 ORDER BY id',
  );
  const listarCidades = db.prepare(
    `SELECT id, nome, nivel, regiao, taxa_deslocamento
       FROM cidades WHERE ativa = 1 ORDER BY nivel, nome`,
  );
  const buscarCidade = db.prepare(
    `SELECT id, nome, nivel, regiao, taxa_deslocamento
       FROM cidades WHERE id = ? AND ativa = 1`,
  );

  const formatarCidade = (c) => ({
    id: c.id,
    nome: c.nome,
    nivel: c.nivel,
    regiao: c.regiao,
    taxa_estimada: fromCents(c.taxa_deslocamento),
    isento: c.taxa_deslocamento === 0,
  });

  // Catálogo de serviços
  router.get('/servicos', (_req, res) => {
    res.json({ servicos: listarServicos.all() });
  });

  // Cidades atendidas e níveis (alimenta o select do formulário)
  router.get('/cidades', (_req, res) => {
    res.json({ sede: 'Recife', cidades: listarCidades.all().map(formatarCidade) });
  });

  // Simulador de deslocamento da landing page
  router.get('/deslocamento', validate(deslocamentoSchema, 'query'), (req, res) => {
    const cidade = buscarCidade.get(req.dados.query.cidade_id);
    if (!cidade) throw erros.naoEncontrado('Cidade fora da área de atendimento.');
    res.json({
      origem: 'Recife',
      destino: formatarCidade(cidade),
      observacao:
        'Valor estimado. O técnico confirma ou ajusta a taxa ao enviar a proposta pelo WhatsApp.',
    });
  });

  // RF01/RF02 — solicitação de orçamento, sem conta nem login
  router.post('/pedidos', limitadorPedido, validate(pedidoSchema), (req, res) => {
    const pedido = servicoPedidos.criar(req.dados.body);
    res.status(201).json({
      mensagem: 'Solicitação recebida! O técnico entrará em contato pelo WhatsApp.',
      pedido: {
        id: pedido.id,
        status: pedido.status,
        taxa_deslocamento_estimada: pedido.taxa_deslocamento_estimada,
      },
    });
  });

  return router;
}

module.exports = { criarRotasPublicas };
