const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { createDb } = require('./connection');
const { toCents } = require('../utils/money');

const BCRYPT_ROUNDS = 12;

// Níveis de atendimento definidos no escopo (valores de taxa são exemplos de demonstração).
const CIDADES = [
  { nome: 'Recife', nivel: 0, regiao: 'Base principal', taxa: 0 },
  { nome: 'Olinda', nivel: 1, regiao: 'Região Metropolitana - Nível 1', taxa: 30 },
  { nome: 'Jaboatão dos Guararapes', nivel: 1, regiao: 'Região Metropolitana - Nível 1', taxa: 30 },
  { nome: 'Camaragibe', nivel: 2, regiao: 'Região Metropolitana - Nível 2', taxa: 50 },
  { nome: 'São Lourenço da Mata', nivel: 2, regiao: 'Região Metropolitana - Nível 2', taxa: 50 },
  { nome: 'Carpina', nivel: 3, regiao: 'Zona da Mata / Entorno - Nível 3', taxa: 90 },
];

const SERVICOS = [
  {
    slug: 'instalacao-split',
    nome: 'Instalação de Ar-Condicionado Split',
    descricao: 'Montagem, tubulação, vácuo e carga.',
  },
  {
    slug: 'higienizacao-preventiva',
    nome: 'Higienização Profissional e Manutenção Preventiva',
    descricao: 'Limpeza profunda e sanitização.',
  },
  {
    slug: 'corretiva-carga-gas',
    nome: 'Manutenção Corretiva e Carga de Gás',
    descricao: 'Diagnóstico de vazamento e recarga de fluido.',
  },
  {
    slug: 'refrigeracao-comercial',
    nome: 'Refrigeração Comercial e Balcões',
    descricao: 'Atendimento para geladeiras comerciais, expositores e câmaras frias.',
  },
];

function seed(db, { adminEmail, adminPassword } = {}) {
  const insertCidade = db.prepare(
    `INSERT INTO cidades (nome, nivel, regiao, taxa_deslocamento) VALUES (?, ?, ?, ?)
     ON CONFLICT(nome) DO NOTHING`,
  );
  const insertServico = db.prepare(
    `INSERT INTO servicos (slug, nome, descricao) VALUES (?, ?, ?)
     ON CONFLICT(slug) DO NOTHING`,
  );

  db.transaction(() => {
    CIDADES.forEach((c) => insertCidade.run(c.nome, c.nivel, c.regiao, toCents(c.taxa)));
    SERVICOS.forEach((s) => insertServico.run(s.slug, s.nome, s.descricao));
  })();

  if (adminEmail && adminPassword) {
    const existe = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(adminEmail);
    if (!existe) {
      const hash = bcrypt.hashSync(adminPassword, BCRYPT_ROUNDS);
      db.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)').run(
        'Júnior',
        adminEmail,
        hash,
      );
      return { adminCriado: true };
    }
  }
  return { adminCriado: false };
}

module.exports = { seed, CIDADES, SERVICOS, BCRYPT_ROUNDS };

if (require.main === module) {
  if (!env.adminPassword || env.adminPassword.length < 8) {
    console.error('Defina ADMIN_PASSWORD (mínimo 8 caracteres) no .env antes de rodar o seed.');
    process.exit(1);
  }
  const db = createDb(env.dbPath);
  const { adminCriado } = seed(db, {
    adminEmail: env.adminEmail,
    adminPassword: env.adminPassword,
  });
  console.log('Cidades e serviços garantidos.');
  console.log(
    adminCriado
      ? `Administrador criado: ${env.adminEmail}`
      : `Administrador ${env.adminEmail} já existe (senha mantida).`,
  );
  db.close();
}
