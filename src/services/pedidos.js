const { fromCents } = require('../utils/money');
const { erros } = require('../utils/errors');

const SELECT_PEDIDO = `
  SELECT p.*,
         cl.nome      AS cliente_nome,
         cl.whatsapp  AS cliente_whatsapp,
         s.nome       AS servico_nome,
         ci.nome      AS cidade_nome,
         ci.nivel     AS cidade_nivel
    FROM pedidos p
    JOIN clientes cl ON cl.id = p.cliente_id
    JOIN servicos s  ON s.id  = p.servico_id
    JOIN cidades ci  ON ci.id = p.cidade_id
`;

/** Converte a linha do banco (centavos) para o formato da API (reais). */
function serializarPedido(row) {
  if (!row) return null;
  const taxaFinal = row.taxa_deslocamento_final;
  return {
    id: row.id,
    status: row.status,
    cliente: { nome: row.cliente_nome, whatsapp: row.cliente_whatsapp },
    servico: { id: row.servico_id, nome: row.servico_nome },
    cidade: { id: row.cidade_id, nome: row.cidade_nome, nivel: row.cidade_nivel },
    endereco: row.endereco,
    descricao_problema: row.descricao_problema,
    data_preferida: row.data_preferida,
    turno_preferido: row.turno_preferido,
    valor_previsto: fromCents(row.valor_previsto),
    taxa_deslocamento_estimada: fromCents(row.taxa_deslocamento_estimada),
    taxa_deslocamento_final: fromCents(taxaFinal),
    nova_data: row.nova_data,
    novo_turno: row.novo_turno,
    agendamento: {
      data: row.nova_data || row.data_preferida,
      turno: row.novo_turno || row.turno_preferido,
    },
    motivo: row.motivo,
    descartado_em: row.descartado_em,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

function criarServicoPedidos(db) {
  const buscarServico = db.prepare('SELECT id FROM servicos WHERE id = ? AND ativo = 1');
  const buscarCidade = db.prepare(
    'SELECT id, taxa_deslocamento FROM cidades WHERE id = ? AND ativa = 1',
  );
  const inserirCliente = db.prepare('INSERT INTO clientes (nome, whatsapp) VALUES (?, ?)');
  const inserirPedido = db.prepare(
    `INSERT INTO pedidos
       (cliente_id, servico_id, cidade_id, endereco, descricao_problema,
        data_preferida, turno_preferido, taxa_deslocamento_estimada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const inserirHistorico = db.prepare(
    `INSERT INTO historico_status (pedido_id, de_status, para_status, observacao)
     VALUES (?, NULL, 'PENDENTE', 'Solicitação enviada pelo cliente.')`,
  );
  const buscarPorId = db.prepare(`${SELECT_PEDIDO} WHERE p.id = ?`);

  /** RF01/RF02 — cria o pedido no estado inicial PENDENTE, sem login. */
  const criar = db.transaction((dados) => {
    const servico = buscarServico.get(dados.servico_id);
    if (!servico) throw erros.regra('Serviço inexistente ou indisponível.', 'SERVICO_INVALIDO');

    const cidade = buscarCidade.get(dados.cidade_id);
    if (!cidade) throw erros.regra('Cidade fora da área de atendimento.', 'CIDADE_INVALIDA');

    const { lastInsertRowid: clienteId } = inserirCliente.run(dados.nome, dados.whatsapp);
    const { lastInsertRowid: pedidoId } = inserirPedido.run(
      clienteId,
      dados.servico_id,
      dados.cidade_id,
      dados.endereco,
      dados.descricao_problema,
      dados.data_preferida,
      dados.turno_preferido,
      cidade.taxa_deslocamento,
    );
    inserirHistorico.run(pedidoId);
    return serializarPedido(buscarPorId.get(pedidoId));
  });

  return {
    criar,
    buscarPorId: (id) => buscarPorId.get(id),
    SELECT_PEDIDO,
  };
}

module.exports = { criarServicoPedidos, serializarPedido, SELECT_PEDIDO };
