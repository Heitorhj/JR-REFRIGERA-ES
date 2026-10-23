import "../../styles/order-table.css";

const statusLabels = {
  PENDENTE: "Novo pedido",
  ACEITO_POR_JUNIOR: "Proposta salva",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  EM_NEGOCIACAO: "Em negociação",
  CONFIRMADO: "Confirmado",
  REAGENDADO_POR_JUNIOR: "Reagendado",
  REAGENDADO_PELO_CLIENTE: "Reagendado",
  REAGENDADO: "Reagendado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  RECUSADO: "Recusado"
};

const formatarData = (data) => {
  if (!data) return "—";
  const partes = data.split("-");
  if (partes.length !== 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

function OrderTable({ orders, selectedId, onSelect, loading, trash }) {
  if (loading) {
    return <div className="orders-empty">Carregando pedidos...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty">
        <span aria-hidden="true">◇</span>
        <strong>{trash ? "A lixeira está vazia" : "Nenhum pedido encontrado"}</strong>
        <small>{trash ? "Pedidos cancelados ou recusados aparecerão aqui." : "Tente alterar os filtros ou aguarde uma nova solicitação."}</small>
      </div>
    );
  }

  return (
    <div className="orders-list">
      {orders.map((order) => (
        <button
          className={`order-row${selectedId === order.id ? " is-selected" : ""}`}
          key={order.id}
          type="button"
          onClick={() => onSelect(order.id)}
        >
          <span className="order-main">
            <strong>{order.cliente.nome}</strong>
            <small>Pedido #{order.id} · {order.cidade.nome}</small>
          </span>
          <span className="order-service">{order.servico.nome}</span>
          <span className={`status-badge status-${order.status.toLowerCase()}`}>
            {statusLabels[order.status] ?? order.status}
          </span>
          <span className="order-date">{formatarData(order.dataPreferida)}</span>
          <span className="order-chevron" aria-hidden="true">›</span>
        </button>
      ))}
    </div>
  );
}

export default OrderTable;
