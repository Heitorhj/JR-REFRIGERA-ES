const env = require('./config/env');
const { createDb } = require('./db/connection');
const { createApp } = require('./app');

const db = createDb(env.dbPath);
const app = createApp({ db, config: env });

const server = app.listen(env.port, () => {
  console.log(`JR Refrigerações API rodando na porta ${env.port} (${env.nodeEnv})`);
});

function encerrar() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
