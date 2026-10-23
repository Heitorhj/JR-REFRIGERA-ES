import "../../styles/order-filters.css";

const statusOptions = [
  ["", "Todos os pedidos"],
  ["PENDENTE", "Novos pedidos"],
  ["ACEITO_POR_JUNIOR", "Proposta salva"],
  ["AGUARDANDO_CLIENTE", "Aguardando cliente"],
  ["EM_NEGOCIACAO", "Em negociação"],
  ["CONFIRMADO", "Confirmados"],
  ["REAGENDADO_POR_JUNIOR", "Reagendados por Júnior"],
  ["REAGENDADO_PELO_CLIENTE", "Reagendados pelo cliente"],
  ["CONCLUIDO", "Concluídos"],
  ["CANCELADO", "Cancelados"],
  ["RECUSADO", "Recusados"],
  ["REAGENDADO", "Reagendados (legado)"]
];

function OrderFilters({ status, trash, onStatusChange, onTrashChange }) {
  return (
    <div className="order-filters">
      <label className="filter-select">
        <span>Status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={`trash-toggle${trash ? " is-active" : ""}`}
        aria-pressed={trash}
        onClick={() => onTrashChange(!trash)}
      >
        <span aria-hidden="true">{trash ? "←" : "▱"}</span>
        {trash ? "Voltar aos pedidos" : "Ver lixeira"}
      </button>
    </div>
  );
}

export default OrderFilters;
