require('dotenv').config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const DEFAULT_SECRET = 'troque-este-segredo-por-um-valor-longo-e-aleatorio';

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  isTest,
  port: int(process.env.PORT, 3333),
  dbPath: process.env.DB_PATH || './data/jr-refrigeracoes.db',
  jwtSecret: process.env.JWT_SECRET || DEFAULT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  adminEmail: (process.env.ADMIN_EMAIL || 'junior@jrrefrigeracoes.com').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  whatsappTecnico: (process.env.WHATSAPP_TECNICO || '').replace(/\D/g, ''),
  retencaoDias: int(process.env.RETENCAO_DIAS, 7),
  trustProxy: process.env.TRUST_PROXY === 'true',
  rateLimit: {
    geralMax: int(process.env.RATE_LIMIT_GERAL_MAX, 100),
    loginMax: int(process.env.RATE_LIMIT_LOGIN_MAX, 5),
    pedidoMax: int(process.env.RATE_LIMIT_PEDIDO_MAX, 10),
  },
};

// Em produção, recusa subir com segredo fraco/padrão.
if (isProduction && (env.jwtSecret === DEFAULT_SECRET || env.jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET precisa ser definido com no mínimo 32 caracteres em produção.');
}

module.exports = env;
