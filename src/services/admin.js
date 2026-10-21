const { toCents } = require('../utils/money');
const { erros } = require('../utils/errors');
const { hojeRecife } = require('../utils/datas');
const { serializarPedido, SELECT_PEDIDO } = require('./pedidos');
const { STATUS, TERMINAIS, TRANSICOES, podeTransicionar, ehTerminal } = require('./estados');

function criarServicoAdmin(db) {
  const buscarPorId = db.prepare(`${SELECT_PEDIDO} WHERE p.id = ?`);
  const buscarHistorico = db.prepare(
    `SELECT h.id, h.de_status, h.para_status, h.observacao, h.criado_em, u.nome AS usuario
       FROM historico_status h
       LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.pedido_id = ?
      ORDER BY h.id`,
  );
  const inserirHistorico = db.prepare(
    `INSERT INTO historico_status (pedido_id, de_status, para_status, observacao, usuario_id)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const contarPorStatus = db.prepare('SELECT status, COUNT(*) AS total FROM pedidos GROUP BY status');

  const obter = (id) => {
    const row = buscarPorId.get(id);
    if (!row) throw erros.naoEncontrado('Pedido não encontrado.');
    return row;
  };

  /** Lista pedidos. Sem filtro, oculta os que estão na área de descarte. */
  function listar({ status, pagina, limite }) {
    const where = status ? 'WHERE p.status = ?' : `WHERE p.status NOT IN (${TERMINAIS.map(() => '?').join(',')})`;
    const params = status ? [status] : TERMINAIS;

    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM pedidos p ${where}`).get(...params);
    const linhas = db
      .prepare(`${SELECT_PEDIDO} ${where} ORDER BY p.id DESC LIMIT ? OFFSET ?`)
      .all(...params, limite, (pagina - 1) * limite);

    return {
      pedidos: linhas.map(serializarPedido),
      paginacao: { pagina, limite, total, paginas: Math.max(1, Math.ceil(total / limite)) },
    };
  }

  function detalhar(id) {
    const pedido = serializarPedido(obter(id));
    return { ...pedido, transicoes_permitidas: TRANSICOES[pedido.status], historico: buscarHistorico.all(id) };
  }

  function resumo() {
    const contagem = Object.fromEntries(STATUS.map((s) => [s, 0]));
    contarPorStatus.all().forEach((r) => {
      contagem[r.status] = r.total;
    });
    return { por_status: contagem };
  }

  /** RF07/RF08 — define valor previsto e/ou confirma/ajusta a taxa de deslocamento. */
  const atualizarValores = db.transaction((id, dados, usuarioId) => {
    const atual = obter(id);
    if (ehTerminal(atual.status)) {
      throw erros.regra('Pedidos cancelados ou recusados não podem ser alterados.', 'PEDIDO_ENCERRADO');
    }

    const valor = dados.valor_previsto !== undefined ? toCents(dados.valor_previsto) : atual.valor_previsto;
    const taxa =
      dados.taxa_deslocamento_final !== undefined
        ? toCents(dados.taxa_deslocamento_final)
        : atual.taxa_deslocamento_final;

    db.prepare(
      `UPDATE pedidos SET valor_previsto = ?, taxa_deslocamento_final = ?,
              atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`,
    ).run(valor, taxa, id);

    const partes = [];
    if (dados.valor_previsto !== undefined) partes.push(`valor previsto = ${dados.valor_previsto}`);
    if (dados.taxa_deslocamento_final !== undefined) partes.push(`taxa de deslocamento = ${dados.taxa_deslocamento_final}`);
    inserirHistorico.run(id, atual.status, atual.status, `Valores atualizados: ${partes.join('; ')}.`, usuarioId);

    return serializarPedido(obter(id));
  });

  /** RF09/RF10 — altera o estado seguindo a máquina de estados. */
  const mudarStatus = db.transaction((id, entrada, usuarioId) => {
    const atual = obter(id);
    const para = entrada.status;

    if (!podeTransicionar(atual.status, para)) {
      const permitidas = TRANSICOES[atual.status];
      throw erros.regra(
        permitidas.length
          ? `Transição ${atual.status} → ${para} não permitida. Permitidas: ${permitidas.join(', ')}.`
          : `Pedido ${atual.status} é final e não pode mais mudar de estado.`,
        'TRANSICAO_INVALIDA',
      );
    }

    const valor = entrada.valor_previsto !== undefined ? toCents(entrada.valor_previsto) : atual.valor_previsto;
    let taxa =
      entrada.taxa_deslocamento_final !== undefined
        ? toCents(entrada.taxa_deslocamento_final)
        : atual.taxa_deslocamento_final;
    let novaData = atual.nova_data;
    let novoTurno = atual.novo_turno;

    if (para === 'REAGENDADO') {
      if (!entrada.nova_data || !entrada.novo_turno) {
        throw erros.regra('Informe nova_data e novo_turno para reagendar.', 'REAGENDAMENTO_INCOMPLETO');
      }
      if (entrada.nova_data < hojeRecife()) {
        throw erros.regra('A nova data não pode estar no passado.', 'DATA_NO_PASSADO');
      }
      novaData = entrada.nova_data;
      novoTurno = entrada.novo_turno;
    }

    if (para === 'ACEITO_POR_JUNIOR' || para === 'CONFIRMADO') {
      if (valor === null) {
        throw erros.regra('Defina o valor previsto antes de aceitar/confirmar o pedido.', 'VALOR_OBRIGATORIO');
      }
      // "Confirmar" a taxa sem ajuste = adotar a estimativa do sistema
      if (taxa === null) taxa = atual.taxa_deslocamento_estimada;
    }

    const motivo = entrada.motivo ?? atual.motivo;
    const descartadoEm = ehTerminal(para) ? new Date().toISOString() : null;

    db.prepare(
      `UPDATE pedidos
          SET status = ?, valor_previsto = ?, taxa_deslocamento_final = ?,
              nova_data = ?, novo_turno = ?, motivo = ?, descartado_em = ?,
              atualizado_em = strftime('%Y-%m-%dT%H:%M:%fZ','now')
        WHERE id = ?`,
    ).run(para, valor, taxa, novaData, novoTurno, motivo, descartadoEm, id);

    inserirHistorico.run(id, atual.status, para, entrada.motivo ?? null, usuarioId);
    return serializarPedido(obter(id));
  });

  return { listar, detalhar, resumo, atualizarValores, mudarStatus, obterSerializado: (id) => serializarPedido(obter(id)) };
}

module.exports = { criarServicoAdmin };
