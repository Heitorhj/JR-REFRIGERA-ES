import SelectField from "../SelectField.jsx";
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
      <div className="filter-select">
        <span>Filtrar</span>
        <SelectField
          id="filtro-status-campo"
          name="status"
          value={status}
          options={statusOptions.map(([value, label]) => ({ value, label }))}
          onChange={(event) => onStatusChange(event.target.value)}
        />
      </div>
      <button
        type="button"
        className={`trash-toggle${trash ? " is-active" : ""}`}
        aria-pressed={trash}
        onClick={() => onTrashChange(!trash)}
      >
        {trash ? "Voltar aos pedidos" : "Ver lixeira"}
      </button>
    </div>
  );
}

export default OrderFilters;
