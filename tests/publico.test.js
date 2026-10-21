const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarApi } = require('./helpers');
const { normalizarWhatsapp } = require('../src/utils/telefone');
const { dataValida } = require('../src/utils/datas');

function amanha() {
  const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function pedidoValido(extra = {}) {
  return {
    nome: 'Maria da Silva',
    whatsapp: '(81) 99999-1234',
    cidade_id: 2, // Olinda
    endereco: 'Casa Caiada, Rua das Flores 100',
    descricao_problema: 'Ar-condicionado pingando água dentro de casa.',
    servico_id: 3,
    data_preferida: amanha(),
    turno_preferido: 'MANHA',
    ...extra,
  };
}

describe('Utilitários', () => {
  test('normalizarWhatsapp', () => {
    assert.equal(normalizarWhatsapp('(81) 99999-1234'), '5581999991234');
    assert.equal(normalizarWhatsapp('+55 81 3333-1234'), '558133331234');
    assert.equal(normalizarWhatsapp('5581999991234'), '5581999991234');
    assert.equal(normalizarWhatsapp('12345'), null);
    assert.equal(normalizarWhatsapp('abc'), null);
  });

  test('dataValida recusa datas inexistentes', () => {
    assert.equal(dataValida('2026-02-30'), false);
    assert.equal(dataValida('2026-12-31'), true);
    assert.equal(dataValida('31/12/2026'), false);
  });
});

describe('Rotas públicas (RF01, RF02)', () => {
  let api;
  before(async () => {
    api = await iniciarApi();
  });
  after(() => api.fechar());

  test('lista os 4 serviços do catálogo', async () => {
    const r = await api.req('GET', '/api/servicos');
    assert.equal(r.status, 200);
    assert.equal(r.corpo.servicos.length, 4);
  });

  test('lista as 6 cidades com níveis e taxa estimada', async () => {
    const r = await api.req('GET', '/api/cidades');
    assert.equal(r.corpo.cidades.length, 6);
    const recife = r.corpo.cidades.find((c) => c.nome === 'Recife');
    assert.equal(recife.nivel, 0);
    assert.equal(recife.isento, true);
    const carpina = r.corpo.cidades.find((c) => c.nome === 'Carpina');
    assert.equal(carpina.nivel, 3);
    assert.equal(carpina.taxa_estimada, 90);
  });

  test('simulador de deslocamento por cidade', async () => {
    const r = await api.req('GET', '/api/deslocamento?cidade_id=2');
    assert.equal(r.status, 200);
    assert.equal(r.corpo.destino.nome, 'Olinda');
    assert.equal(r.corpo.destino.taxa_estimada, 30);

    assert.equal((await api.req('GET', '/api/deslocamento?cidade_id=999')).status, 404);
    assert.equal((await api.req('GET', '/api/deslocamento')).status, 400);
  });

  test('cliente cria pedido sem login: nasce PENDENTE com taxa estimada', async () => {
    const r = await api.req('POST', '/api/pedidos', { corpo: pedidoValido() });
    assert.equal(r.status, 201);
    assert.equal(r.corpo.pedido.status, 'PENDENTE');
    assert.equal(r.corpo.pedido.taxa_deslocamento_estimada, 30);

    const linha = api.db.prepare('SELECT * FROM pedidos WHERE id = ?').get(r.corpo.pedido.id);
    assert.equal(linha.taxa_deslocamento_estimada, 3000);
    const cliente = api.db.prepare('SELECT whatsapp FROM clientes WHERE id = ?').get(linha.cliente_id);
    assert.equal(cliente.whatsapp, '5581999991234');
    const hist = api.db
      .prepare('SELECT * FROM historico_status WHERE pedido_id = ?')
      .all(linha.id);
    assert.equal(hist.length, 1);
    assert.equal(hist[0].para_status, 'PENDENTE');
  });

  test('pedido em Recife tem taxa zero (isenção)', async () => {
    const r = await api.req('POST', '/api/pedidos', { corpo: pedidoValido({ cidade_id: 1 }) });
    assert.equal(r.status, 201);
    assert.equal(r.corpo.pedido.taxa_deslocamento_estimada, 0);
  });

  test('rejeita campos inválidos com detalhes', async () => {
    const r = await api.req('POST', '/api/pedidos', {
      corpo: pedidoValido({ whatsapp: '123', nome: '', turno_preferido: 'NOITE', data_preferida: '2020-01-01' }),
    });
    assert.equal(r.status, 400);
    const campos = r.corpo.erro.detalhes.map((d) => d.campo).sort();
    assert.deepEqual(campos, ['data_preferida', 'nome', 'turno_preferido', 'whatsapp']);
  });

  test('rejeita cidade e serviço inexistentes', async () => {
    const a = await api.req('POST', '/api/pedidos', { corpo: pedidoValido({ cidade_id: 999 }) });
    assert.equal(a.status, 422);
    assert.equal(a.corpo.erro.codigo, 'CIDADE_INVALIDA');
    const b = await api.req('POST', '/api/pedidos', { corpo: pedidoValido({ servico_id: 999 }) });
    assert.equal(b.status, 422);
    assert.equal(b.corpo.erro.codigo, 'SERVICO_INVALIDO');
  });

  test('não há listagem pública de pedidos', async () => {
    assert.equal((await api.req('GET', '/api/pedidos')).status, 404);
  });
});

describe('Limite de pedidos por IP', () => {
  let api;
  before(async () => {
    api = await iniciarApi({ rateLimit: { geralMax: 1000, loginMax: 100, pedidoMax: 2 } });
  });
  after(() => api.fechar());

  test('bloqueia spam no formulário público', async () => {
    const codigos = [];
    for (let i = 0; i < 3; i++) {
      codigos.push((await api.req('POST', '/api/pedidos', { corpo: pedidoValido() })).status);
    }
    assert.deepEqual(codigos, [201, 201, 429]);
  });
});
