const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarApi } = require('./helpers');
const { podeTransicionar, TRANSICOES, STATUS } = require('../src/services/estados');

function dataFutura(dias = 3) {
  return new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

const pedidoBase = () => ({
  nome: 'João Pereira',
  whatsapp: '81988887777',
  cidade_id: 4, // Camaragibe (taxa R$ 50)
  endereco: 'Centro, Rua A 10',
  descricao_problema: 'Split não gela mais.',
  servico_id: 3,
  data_preferida: dataFutura(2),
  turno_preferido: 'TARDE',
});

describe('Máquina de estados (unidade)', () => {
  test('estados finais não têm saída', () => {
    assert.deepEqual(TRANSICOES.CANCELADO, []);
    assert.deepEqual(TRANSICOES.RECUSADO, []);
  });
  test('PENDENTE não vai direto para CONFIRMADO', () => {
    assert.equal(podeTransicionar('PENDENTE', 'CONFIRMADO'), false);
  });
  test('todo estado referenciado existe', () => {
    for (const alvos of Object.values(TRANSICOES)) {
      alvos.forEach((a) => assert.ok(STATUS.includes(a)));
    }
  });
});

describe('Painel admin (RF03, RF07–RF11)', () => {
  let api;
  let token;
  before(async () => {
    api = await iniciarApi();
    token = await api.loginAdmin();
  });
  after(() => api.fechar());

  const novoPedido = async (extra = {}) => {
    const r = await api.req('POST', '/api/pedidos', { corpo: { ...pedidoBase(), ...extra } });
    assert.equal(r.status, 201);
    return r.corpo.pedido.id;
  };
  const admin = (metodo, caminho, corpo) => api.req(metodo, `/api/admin${caminho}`, { corpo, token });

  test('todas as rotas admin exigem token', async () => {
    const id = await novoPedido();
    for (const [m, c] of [
      ['GET', '/resumo'],
      ['GET', '/pedidos'],
      ['GET', `/pedidos/${id}`],
      ['PATCH', `/pedidos/${id}/status`],
      ['PATCH', `/pedidos/${id}/valores`],
      ['POST', `/pedidos/${id}/reagendar`],
      ['GET', `/pedidos/${id}/whatsapp`],
    ]) {
      const r = await api.req(m, `/api/admin${c}`, { corpo: m === 'GET' ? undefined : {} });
      assert.equal(r.status, 401, `${m} ${c}`);
    }
  });

  test('lista pedidos com paginação e filtro por status', async () => {
    await novoPedido();
    const r = await admin('GET', '/pedidos?limite=1');
    assert.equal(r.status, 200);
    assert.equal(r.corpo.pedidos.length, 1);
    assert.ok(r.corpo.paginacao.total >= 2);

    const f = await admin('GET', '/pedidos?status=PENDENTE');
    assert.ok(f.corpo.pedidos.every((p) => p.status === 'PENDENTE'));
    assert.equal((await admin('GET', '/pedidos?status=XYZ')).status, 400);
  });

  test('detalhe traz histórico e transições permitidas', async () => {
    const id = await novoPedido();
    const r = await admin('GET', `/pedidos/${id}`);
    assert.equal(r.status, 200);
    assert.deepEqual(r.corpo.pedido.transicoes_permitidas, TRANSICOES.PENDENTE);
    assert.equal(r.corpo.pedido.historico.length, 1);
    assert.equal((await admin('GET', '/pedidos/99999')).status, 404);
  });

  test('fluxo feliz: PENDENTE → ACEITO → CONFIRMADO com valores', async () => {
    const id = await novoPedido();

    // aceitar sem valor previsto é bloqueado
    const sem = await admin('PATCH', `/pedidos/${id}/status`, { status: 'ACEITO_POR_JUNIOR' });
    assert.equal(sem.status, 422);
    assert.equal(sem.corpo.erro.codigo, 'VALOR_OBRIGATORIO');

    const v = await admin('PATCH', `/pedidos/${id}/valores`, { valor_previsto: 250.5 });
    assert.equal(v.status, 200);
    assert.equal(v.corpo.pedido.valor_previsto, 250.5);

    const aceito = await admin('PATCH', `/pedidos/${id}/status`, { status: 'ACEITO_POR_JUNIOR' });
    assert.equal(aceito.status, 200);
    assert.equal(aceito.corpo.pedido.status, 'ACEITO_POR_JUNIOR');
    // taxa estimada adotada ao aceitar sem ajuste
    assert.equal(aceito.corpo.pedido.taxa_deslocamento_final, 50);

    const conf = await admin('PATCH', `/pedidos/${id}/status`, { status: 'CONFIRMADO' });
    assert.equal(conf.corpo.pedido.status, 'CONFIRMADO');

    const det = await admin('GET', `/pedidos/${id}`);
    const caminho = det.corpo.pedido.historico.map((h) => h.para_status);
    assert.deepEqual(caminho, ['PENDENTE', 'PENDENTE', 'ACEITO_POR_JUNIOR', 'CONFIRMADO']);
    assert.equal(det.corpo.pedido.historico.at(-1).usuario, 'Júnior');
  });

  test('técnico ajusta a taxa de deslocamento (RF08)', async () => {
    const id = await novoPedido();
    const r = await admin('PATCH', `/pedidos/${id}/valores`, {
      valor_previsto: 100,
      taxa_deslocamento_final: 65,
    });
    assert.equal(r.corpo.pedido.taxa_deslocamento_estimada, 50);
    assert.equal(r.corpo.pedido.taxa_deslocamento_final, 65);
  });

  test('valores inválidos são recusados', async () => {
    const id = await novoPedido();
    assert.equal((await admin('PATCH', `/pedidos/${id}/valores`, { valor_previsto: -5 })).status, 400);
    assert.equal((await admin('PATCH', `/pedidos/${id}/valores`, {})).status, 400);
    assert.equal((await admin('PATCH', `/pedidos/${id}/valores`, { valor_previsto: 'abc' })).status, 400);
  });

  test('transição inválida é bloqueada (PENDENTE → CONFIRMADO)', async () => {
    const id = await novoPedido();
    const r = await admin('PATCH', `/pedidos/${id}/status`, { status: 'CONFIRMADO' });
    assert.equal(r.status, 422);
    assert.equal(r.corpo.erro.codigo, 'TRANSICAO_INVALIDA');
  });

  test('reagendamento exige nova data/turno e guarda o par (RF09)', async () => {
    const id = await novoPedido();
    assert.equal((await admin('POST', `/pedidos/${id}/reagendar`, {})).status, 400);

    const passado = await admin('POST', `/pedidos/${id}/reagendar`, {
      nova_data: '2020-01-01',
      novo_turno: 'MANHA',
    });
    assert.equal(passado.status, 422);
    assert.equal(passado.corpo.erro.codigo, 'DATA_NO_PASSADO');

    const nova = dataFutura(5);
    const r = await admin('POST', `/pedidos/${id}/reagendar`, { nova_data: nova, novo_turno: 'MANHA' });
    assert.equal(r.status, 200);
    assert.equal(r.corpo.pedido.status, 'REAGENDADO');
    assert.equal(r.corpo.pedido.nova_data, nova);
    assert.deepEqual(r.corpo.pedido.agendamento, { data: nova, turno: 'MANHA' });
  });

  test('recusar e cancelar vão para a área de descarte e ficam travados (RF10)', async () => {
    const id = await novoPedido();
    const r = await admin('PATCH', `/pedidos/${id}/status`, {
      status: 'RECUSADO',
      motivo: 'Fora da agenda',
    });
    assert.equal(r.corpo.pedido.status, 'RECUSADO');
    assert.ok(r.corpo.pedido.descartado_em);
    assert.equal(r.corpo.pedido.motivo, 'Fora da agenda');

    const de = await admin('PATCH', `/pedidos/${id}/status`, { status: 'PENDENTE' });
    assert.equal(de.status, 422);
    const val = await admin('PATCH', `/pedidos/${id}/valores`, { valor_previsto: 10 });
    assert.equal(val.status, 422);
    assert.equal(val.corpo.erro.codigo, 'PEDIDO_ENCERRADO');

    // some da listagem padrão, mas aparece filtrando pelo status
    const lista = await admin('GET', '/pedidos?limite=100');
    assert.ok(!lista.corpo.pedidos.some((p) => p.id === id));
    const filtrada = await admin('GET', '/pedidos?status=RECUSADO');
    assert.ok(filtrada.corpo.pedidos.some((p) => p.id === id));
  });

  test('resumo conta pedidos por status', async () => {
    const r = await admin('GET', '/resumo');
    assert.equal(r.status, 200);
    assert.ok(r.corpo.por_status.PENDENTE >= 1);
    assert.equal(typeof r.corpo.por_status.CONFIRMADO, 'number');
  });
});

describe('Mensagens de WhatsApp (RF11)', () => {
  let api;
  let token;
  before(async () => {
    api = await iniciarApi();
    token = await api.loginAdmin();
  });
  after(() => api.fechar());

  const admin = (metodo, caminho, corpo) => api.req(metodo, `/api/admin${caminho}`, { corpo, token });

  test('proposta traz valores, taxa e total, e o link é wa.me do cliente', async () => {
    const c = await api.req('POST', '/api/pedidos', { corpo: pedidoBase() });
    const id = c.corpo.pedido.id;

    // sem valor previsto não gera proposta
    const sem = await admin('GET', `/pedidos/${id}/whatsapp?tipo=proposta`);
    assert.equal(sem.status, 422);

    await admin('PATCH', `/pedidos/${id}/valores`, { valor_previsto: 200 });
    await admin('PATCH', `/pedidos/${id}/status`, { status: 'ACEITO_POR_JUNIOR' });

    const r = await admin('GET', `/pedidos/${id}/whatsapp`);
    assert.equal(r.status, 200);
    assert.equal(r.corpo.tipo, 'proposta'); // padrão do estado ACEITO_POR_JUNIOR
    assert.match(r.corpo.mensagem, /Olá, João!/);
    assert.match(r.corpo.mensagem, /R\$\s?200,00/);
    assert.match(r.corpo.mensagem, /R\$\s?50,00/);
    assert.match(r.corpo.mensagem, /Total previsto: R\$\s?250,00/);
    assert.ok(r.corpo.url.startsWith('https://wa.me/5581988887777?text='));
    assert.equal(decodeURIComponent(r.corpo.url.split('?text=')[1]), r.corpo.mensagem);
  });

  test('mensagem de reagendamento cita a nova data', async () => {
    const c = await api.req('POST', '/api/pedidos', { corpo: pedidoBase() });
    const id = c.corpo.pedido.id;
    const nova = dataFutura(6);
    await admin('POST', `/pedidos/${id}/reagendar`, { nova_data: nova, novo_turno: 'MANHA' });
    const r = await admin('GET', `/pedidos/${id}/whatsapp`);
    assert.equal(r.corpo.tipo, 'reagendamento');
    const [a, m, d] = nova.split('-');
    assert.match(r.corpo.mensagem, new RegExp(`${d}/${m}/${a} \\(manhã\\)`));
  });

  test('tipo inválido retorna 400', async () => {
    const c = await api.req('POST', '/api/pedidos', { corpo: pedidoBase() });
    const r = await admin('GET', `/pedidos/${c.corpo.pedido.id}/whatsapp?tipo=xyz`);
    assert.equal(r.status, 400);
  });
});
