const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { iniciarApi, ADMIN } = require('./helpers');

describe('Autenticação (RF04, RF05, RNF06)', () => {
  let api;
  before(async () => {
    api = await iniciarApi();
  });
  after(() => api.fechar());

  test('login com credenciais corretas devolve JWT', async () => {
    const r = await api.req('POST', '/api/auth/login', { corpo: ADMIN });
    assert.equal(r.status, 200);
    assert.ok(r.corpo.token);
    assert.equal(r.corpo.usuario.email, ADMIN.email);
    assert.equal(r.corpo.usuario.senha_hash, undefined);
  });

  test('senha errada e e-mail inexistente dão a mesma resposta 401', async () => {
    const a = await api.req('POST', '/api/auth/login', { corpo: { email: ADMIN.email, senha: 'errada' } });
    const b = await api.req('POST', '/api/auth/login', { corpo: { email: 'x@y.com', senha: 'errada' } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.deepEqual(a.corpo, b.corpo);
  });

  test('o hash da senha é bcrypt (não guarda senha em texto)', () => {
    const { senha_hash } = api.db.prepare('SELECT senha_hash FROM usuarios').get();
    assert.match(senha_hash, /^\$2[aby]\$12\$/);
    assert.notEqual(senha_hash, ADMIN.senha);
  });

  test('payload de login inválido retorna 400', async () => {
    const r = await api.req('POST', '/api/auth/login', { corpo: { email: 'nao-e-email' } });
    assert.equal(r.status, 400);
    assert.equal(r.corpo.erro.codigo, 'VALIDACAO');
  });

  test('rota protegida sem token retorna 401', async () => {
    const r = await api.req('GET', '/api/auth/me');
    assert.equal(r.status, 401);
  });

  test('rota protegida com token válido retorna o usuário', async () => {
    const token = await api.loginAdmin();
    const r = await api.req('GET', '/api/auth/me', { token });
    assert.equal(r.status, 200);
    assert.equal(r.corpo.usuario.email, ADMIN.email);
  });

  test('token com assinatura inválida é recusado', async () => {
    const falso = jwt.sign({ email: ADMIN.email }, 'outro-segredo', { subject: '1' });
    const r = await api.req('GET', '/api/auth/me', { token: falso });
    assert.equal(r.status, 401);
  });

  test('token expirado é recusado', async () => {
    const expirado = jwt.sign({ email: ADMIN.email }, api.config.jwtSecret, {
      subject: '1',
      expiresIn: -10,
    });
    const r = await api.req('GET', '/api/auth/me', { token: expirado });
    assert.equal(r.status, 401);
    assert.match(r.corpo.erro.mensagem, /expirado/i);
  });

  test('token com algoritmo "none" é recusado', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '1' })).toString('base64url');
    const r = await api.req('GET', '/api/auth/me', { token: `${header}.${payload}.` });
    assert.equal(r.status, 401);
  });
});

describe('Rate limiting (RF06, RNF07)', () => {
  let api;
  before(async () => {
    api = await iniciarApi({ rateLimit: { geralMax: 10000, loginMax: 3, pedidoMax: 10000 } });
  });
  after(() => api.fechar());

  test('login bloqueia após exceder tentativas falhas', async () => {
    const tentativa = () =>
      api.req('POST', '/api/auth/login', { corpo: { email: ADMIN.email, senha: 'errada' } });

    for (let i = 0; i < 3; i++) assert.equal((await tentativa()).status, 401);
    const bloqueada = await tentativa();
    assert.equal(bloqueada.status, 429);
    assert.equal(bloqueada.corpo.erro.codigo, 'MUITAS_REQUISICOES');
  });
});

describe('Rate limiting geral da API', () => {
  let api;
  before(async () => {
    api = await iniciarApi({ rateLimit: { geralMax: 3, loginMax: 100, pedidoMax: 100 } });
  });
  after(() => api.fechar());

  test('limita requisições gerais por IP', async () => {
    const codigos = [];
    for (let i = 0; i < 5; i++) codigos.push((await api.req('GET', '/api/rota-qualquer')).status);
    assert.deepEqual(codigos, [404, 404, 404, 429, 429]);
  });
});
