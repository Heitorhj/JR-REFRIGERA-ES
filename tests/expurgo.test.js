const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarApi } = require('./helpers');
const { expurgarDescartados } = require('../src/jobs/expurgo');

const DIA = 24 * 3600 * 1000;

describe('Expurgo de descartados (RF12)', () => {
  let api;
  before(async () => {
    api = await iniciarApi();
  });
  after(() => api.fechar());

  function criarPedido(whatsapp) {
    const amanha = new Date(Date.now() + 2 * DIA).toISOString().slice(0, 10);
    return api
      .req('POST', '/api/pedidos', {
        corpo: {
          nome: 'Cliente Teste',
          whatsapp,
          cidade_id: 1,
          endereco: 'Rua X, 1',
          descricao_problema: 'Não liga de jeito nenhum.',
          servico_id: 1,
          data_preferida: amanha,
          turno_preferido: 'MANHA',
        },
      })
      .then((r) => r.corpo.pedido.id);
  }

  function descartar(id, status, diasAtras) {
    const quando = new Date(Date.now() - diasAtras * DIA).toISOString();
    api.db.prepare('UPDATE pedidos SET status = ?, descartado_em = ? WHERE id = ?').run(status, quando, id);
  }

  test('remove só descartados com mais de 7 dias, junto com histórico e cliente órfão', async () => {
    const antigoRecusado = await criarPedido('81911110001');
    const antigoCancelado = await criarPedido('81911110002');
    const recente = await criarPedido('81911110003');
    const ativo = await criarPedido('81911110004');

    descartar(antigoRecusado, 'RECUSADO', 8);
    descartar(antigoCancelado, 'CANCELADO', 30);
    descartar(recente, 'CANCELADO', 6);

    const r = expurgarDescartados(api.db, { retencaoDias: 7 });
    assert.equal(r.pedidos, 2);
    assert.equal(r.clientes, 2);

    const restantes = api.db.prepare('SELECT id FROM pedidos ORDER BY id').all().map((p) => p.id);
    assert.deepEqual(restantes, [recente, ativo]);

    const hist = api.db.prepare('SELECT DISTINCT pedido_id FROM historico_status').all().map((h) => h.pedido_id);
    assert.ok(!hist.includes(antigoRecusado) && !hist.includes(antigoCancelado));

    const clientes = api.db.prepare('SELECT COUNT(*) AS n FROM clientes').get().n;
    assert.equal(clientes, 2);
  });

  test('é idempotente e nunca apaga pedidos ativos', async () => {
    const antes = api.db.prepare('SELECT COUNT(*) AS n FROM pedidos').get().n;
    const r = expurgarDescartados(api.db, { retencaoDias: 7 });
    assert.deepEqual(r, { pedidos: 0, clientes: 0 });
    assert.equal(api.db.prepare('SELECT COUNT(*) AS n FROM pedidos').get().n, antes);
  });

  test('respeita o prazo configurado', async () => {
    const id = await criarPedido('81911110005');
    descartar(id, 'RECUSADO', 3);
    const existe = () => Boolean(api.db.prepare('SELECT 1 FROM pedidos WHERE id = ?').get(id));

    expurgarDescartados(api.db, { retencaoDias: 7 });
    assert.equal(existe(), true, 'com 3 dias de descarte e prazo de 7, deve permanecer');

    expurgarDescartados(api.db, { retencaoDias: 2 });
    assert.equal(existe(), false, 'com prazo de 2 dias, deve ser removido');
  });

  test('o descarte pela API grava descartado_em e o expurgo respeita a data de entrada', async () => {
    const token = await api.loginAdmin();
    const id = await criarPedido('81911110006');
    await api.req('PATCH', `/api/admin/pedidos/${id}/status`, { token, corpo: { status: 'CANCELADO' } }).catch(() => {});
    // PENDENTE → CANCELADO não é permitido; recusa é o caminho válido
    const r = await api.req('PATCH', `/api/admin/pedidos/${id}/status`, { token, corpo: { status: 'RECUSADO' } });
    assert.equal(r.status, 200);
    assert.ok(r.corpo.pedido.descartado_em);
    assert.equal(expurgarDescartados(api.db, { retencaoDias: 7 }).pedidos, 0);
    assert.equal(
      expurgarDescartados(api.db, { retencaoDias: 7, agora: new Date(Date.now() + 8 * DIA) }).pedidos,
      1,
    );
  });
});
