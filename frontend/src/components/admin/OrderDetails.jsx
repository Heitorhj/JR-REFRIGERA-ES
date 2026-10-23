import "../../styles/order-details.css";
import OrderActions from "./OrderActions.jsx";

const formatCurrency = (centavos) => {
  if (!Number.isSafeInteger(centavos)) return "Não informado";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(centavos / 100);
};

const formatDate = (date) => {
  if (!date) return "—";
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatTimestamp = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
};

function OrderDetails({ order, loading, onClose, token, onUpdated }) {
  if (loading) {
    return (
      <aside className="order-details-panel">
        <div className="details-loading">Carregando detalhes do pedido...</div>
      </aside>
    );
  }

  if (!order) return null;

  const total = Number.isSafeInteger(order.valorPrevisto)
    && Number.isSafeInteger(order.taxaDeslocamentoFinal)
    ? order.valorPrevisto + order.taxaDeslocamentoFinal
    : null;

  return (
    <aside className="order-details-panel" aria-label={`Detalhes do pedido ${order.id}`}>
      <div className="details-heading">
        <div>
          <span className="eyebrow">Pedido #{order.id}</span>
          <h2>{order.cliente.nome}</h2>
          <p>{order.cliente.whatsapp}</p>
        </div>
        <button className="details-close" type="button" onClick={onClose} aria-label="Fechar detalhes">×</button>
      </div>

      <div className="details-section">
        <h3>Solicitação</h3>
        <dl className="details-grid">
          <div><dt>Serviço</dt><dd>{order.servico.nome}</dd></div>
          <div><dt>Cidade</dt><dd>{order.cidade.nome}</dd></div>
          <div className="details-wide"><dt>Endereço</dt><dd>{order.endereco}</dd></div>
          <div className="details-wide"><dt>Problema relatado</dt><dd>{order.descricaoProblema}</dd></div>
          <div><dt>Data solicitada</dt><dd>{formatDate(order.dataPreferida)}</dd></div>
          <div><dt>Turno</dt><dd>{order.turnoPreferido === "MANHA" ? "Manhã" : "Tarde"}</dd></div>
        </dl>
      </div>

      <OrderActions
        token={token}
        order={order}
        onUpdated={onUpdated}
      />

      <div className="details-section">
        <h3>Proposta</h3>
        <dl className="details-grid proposal-summary">
          <div><dt>Serviço</dt><dd>{formatCurrency(order.valorPrevisto)}</dd></div>
          <div><dt>Deslocamento</dt><dd>{formatCurrency(order.taxaDeslocamentoFinal ?? order.taxaDeslocamentoEstimada)}</dd></div>
          <div className="details-wide"><dt>Total estimado</dt><dd className="proposal-total">{formatCurrency(total)}</dd></div>
        </dl>
      </div>

      {order.reagendamentos.length > 0 && (
        <div className="details-section">
          <h3>Reagendamentos</h3>
          <ul className="details-timeline">
            {order.reagendamentos.map((item, index) => (
              <li key={`${item.criadoEm}-${index}`}>
                <strong>{formatDate(item.novaData)} · {item.novoTurno === "MANHA" ? "Manhã" : "Tarde"}</strong>
                <small>{item.motivo ?? "Sem observação"} · {item.aceito === true ? "Confirmado" : item.aceito === false ? "Recusado" : "Aguardando resposta"}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="details-section">
        <h3>Histórico</h3>
        <ul className="details-timeline">
          {order.historicos.map((item, index) => (
            <li key={`${item.criadoEm}-${index}`}>
              <strong>{item.statusNovo.replaceAll("_", " ")}</strong>
              <small>{formatTimestamp(item.criadoEm)} · {item.administrador?.nome ?? "Sistema"}</small>
              {item.observacao && <p>{item.observacao}</p>}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default OrderDetails;
