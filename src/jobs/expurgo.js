const cron = require('node-cron');
const { FUSO } = require('../utils/datas');

/**
 * RF12 — remove definitivamente pedidos CANCELADO/RECUSADO descartados há mais
 * de `retencaoDias` dias. O histórico sai junto (ON DELETE CASCADE) e clientes
 * que ficaram sem nenhum pedido também são apagados (minimização de dados).
 */
function expurgarDescartados(db, { retencaoDias, agora = new Date() }) {
  const limite = new Date(agora.getTime() - retencaoDias * 24 * 3600 * 1000).toISOString();

  return db.transaction(() => {
    const pedidos = db
      .prepare(
        `DELETE FROM pedidos
          WHERE status IN ('CANCELADO', 'RECUSADO')
            AND descartado_em IS NOT NULL
            AND descartado_em <= ?`,
      )
      .run(limite).changes;

    const clientes = db
      .prepare('DELETE FROM clientes WHERE id NOT IN (SELECT cliente_id FROM pedidos)')
      .run().changes;

    return { pedidos, clientes };
  })();
}

/** Agenda a execução diária às 03:00 (horário de Recife). */
function agendarExpurgo(db, { retencaoDias }, log = console) {
  const tarefa = cron.schedule(
    '0 3 * * *',
    () => {
      try {
        const r = expurgarDescartados(db, { retencaoDias });
        log.log(`[expurgo] ${r.pedidos} pedido(s) e ${r.clientes} cliente(s) removidos.`);
      } catch (err) {
        log.error('[expurgo] falhou:', err);
      }
    },
    { timezone: FUSO },
  );
  return tarefa;
}

module.exports = { expurgarDescartados, agendarExpurgo };
