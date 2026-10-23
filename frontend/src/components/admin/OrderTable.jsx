import { Link } from "react-router-dom";
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
        <span className="empty-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <rect width="64" height="64" rx="18" fill="#e7f3ee" />
            <circle cx="46" cy="16" r="5" fill="#e7a45a" />
            <path d="M16 32.5 32 20l16 12.5V46a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V32.5Z" fill="#126c62" />
          </svg>
        </span>
        {trash ? (
          <>
            <strong>A lixeira está em ordem</strong>
            <p>Pedidos cancelados ou recusados ficam aqui por alguns dias e depois saem sozinhos.</p>
          </>
        ) : (
          <>
            <strong>Por enquanto, está tudo tranquilo</strong>
            <p>Quando alguém pedir um orçamento no site, o pedido aparece aqui para você responder com calma.</p>
            <ol className="empty-steps">
              <li>O cliente envia a solicitação</li>
              <li>Você prepara a proposta</li>
              <li>A conversa segue pelo WhatsApp</li>
            </ol>
            <Link className="empty-link" to="/solicitar-orcamento">Ver o formulário do cliente</Link>
          </>
        )}
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
