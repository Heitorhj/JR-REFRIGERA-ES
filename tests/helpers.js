process.env.NODE_ENV = 'test';

const { createDb } = require('../src/db/connection');
const { createApp } = require('../src/app');
const { seed } = require('../src/db/seed');

const ADMIN = { email: 'junior@teste.com', senha: 'SenhaForte@123' };

function configPadrao(sobrescrever = {}) {
  return {
    jwtSecret: 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres',
    jwtExpiresIn: '1h',
    corsOrigin: ['http://localhost:5173'],
    trustProxy: false,
    whatsappTecnico: '5581999999999',
    retencaoDias: 7,
    rateLimit: { geralMax: 10000, loginMax: 10000, pedidoMax: 10000 },
    ...sobrescrever,
  };
}

/** Sobe a API em porta aleatória com banco em memória já semeado. */
async function iniciarApi(configExtra = {}) {
  const db = createDb(':memory:');
  seed(db, { adminEmail: ADMIN.email, adminPassword: ADMIN.senha });
  const config = configPadrao(configExtra);
  const app = createApp({ db, config });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  async function req(metodo, caminho, { corpo, token } = {}) {
    const headers = {};
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const resp = await fetch(base + caminho, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    let json = null;
    try {
      json = await resp.json();
    } catch {
      /* sem corpo */
    }
    return { status: resp.status, corpo: json, headers: resp.headers };
  }

  async function loginAdmin() {
    const r = await req('POST', '/api/auth/login', { corpo: ADMIN });
    return r.corpo.token;
  }

  return {
    db,
    config,
    req,
    loginAdmin,
    fechar: () =>
      new Promise((resolve) => {
        server.close(() => {
          db.close();
          resolve();
        });
      }),
  };
}

module.exports = { iniciarApi, ADMIN };
