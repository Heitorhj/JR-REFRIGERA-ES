const env = require('./config/env');
const { createDb } = require('./db/connection');
const { createApp } = require('./app');
const { expurgarDescartados, agendarExpurgo } = require('./jobs/expurgo');

const db = createDb(env.dbPath);
const app = createApp({ db, config: env });

// Limpa o que ficou vencido enquanto o servidor estava parado e agenda a rotina diária
expurgarDescartados(db, { retencaoDias: env.retencaoDias });
const tarefaExpurgo = agendarExpurgo(db, { retencaoDias: env.retencaoDias });

const server = app.listen(env.port, () => {
  console.log(`JR Refrigerações API rodando na porta ${env.port} (${env.nodeEnv})`);
});

function encerrar() {
  tarefaExpurgo.stop();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
