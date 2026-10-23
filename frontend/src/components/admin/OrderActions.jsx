import { useState } from "react";
import { api } from "../../api/client.js";
import {
  cancelOrder,
  completeOrder,
  getWhatsAppLink,
  reportCustomerResponse,
  reportProposalSent,
  rescheduleOrder,
  saveProposal
} from "../../api/adminOrders.js";
import FeedbackMessage from "../FeedbackMessage.jsx";
import FormField from "../FormField.jsx";
import "../../styles/order-actions.css";

function OrderActions({ token, order, onUpdated }) {
  const [services, setServices] = useState([]);
  const [panel, setPanel] = useState("");
  const [proposal, setProposal] = useState({
    servicoId: String(order.servico.id),
    valorPrevisto: order.valorPrevisto ? String(order.valorPrevisto / 100) : "",
    taxaDeslocamentoFinal: String(
      (order.taxaDeslocamentoFinal ?? order.taxaDeslocamentoEstimada) / 100
    )
  });
  const [form, setForm] = useState({ novaData: "", novoTurno: "", motivo: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [minimumDate] = useState(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Recife" })
  );

  const run = async (operation) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      setPanel("");
      await onUpdated();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const prepareProposal = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/servicos");
      setServices(result.servicos);
      setPanel("proposal");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const openWhatsApp = async () => {
    const whatsappWindow = window.open("about:blank", "_blank");

    if (!whatsappWindow) {
      setError("Permita pop-ups para abrir a conversa no WhatsApp.");
      return;
    }

    whatsappWindow.opener = null;
    setBusy(true);
    setError("");
    try {
      const result = await getWhatsAppLink(token, order.id);
      whatsappWindow.location.href = result.url;
    } catch (requestError) {
      whatsappWindow.close();
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const submitProposal = (event) => {
    event.preventDefault();
    run(() => saveProposal(token, order.id, {
      servicoId: Number(proposal.servicoId),
      valorPrevisto: Math.round(Number(proposal.valorPrevisto) * 100),
      taxaDeslocamentoFinal: Math.round(Number(proposal.taxaDeslocamentoFinal) * 100)
    }));
  };

  const submitReschedule = (event) => {
    event.preventDefault();
    run(() => rescheduleOrder(token, order.id, form));
  };

  const submitCancel = (event) => {
    event.preventDefault();
    run(() => cancelOrder(token, order.id, form.motivo));
  };

  const actionButtons = [];

  if (["PENDENTE", "ACEITO_POR_JUNIOR"].includes(order.status)) {
    actionButtons.push(
      <button className="button button-primary" key="proposal" disabled={busy} onClick={prepareProposal}>
        {order.status === "PENDENTE" ? "Preparar proposta" : "Editar proposta"}
      </button>
    );
  }

  if (order.status === "ACEITO_POR_JUNIOR") {
    actionButtons.push(
      <button className="button button-whatsapp" key="whatsapp" disabled={busy} onClick={openWhatsApp}>
        Abrir WhatsApp
      </button>,
      <button className="button button-secondary" key="sent" disabled={busy} onClick={() => run(() => reportProposalSent(token, order.id))}>
        Marcar proposta como enviada
      </button>
    );
  }

  if (["AGUARDANDO_CLIENTE", "EM_NEGOCIACAO"].includes(order.status)) {
    actionButtons.push(
      <button className="button button-primary" key="accept" disabled={busy} onClick={() => run(() => reportCustomerResponse(token, order.id, "ACEITAR"))}>
        Registrar aceite
      </button>,
      order.status === "AGUARDANDO_CLIENTE" && (
        <button className="button button-secondary" key="negotiate" disabled={busy} onClick={() => run(() => reportCustomerResponse(token, order.id, "NEGOCIAR"))}>
          Registrar negociação
        </button>
      ),
      <button className="button button-danger" key="refuse" disabled={busy} onClick={() => run(() => reportCustomerResponse(token, order.id, "RECUSAR_PROPOSTA"))}>
        Registrar recusa
      </button>
    );
  }

  if (["CONFIRMADO", "REAGENDADO", "REAGENDADO_POR_JUNIOR", "REAGENDADO_PELO_CLIENTE"].includes(order.status)) {
    actionButtons.push(
      <button className="button button-primary" key="complete" disabled={busy} onClick={() => run(() => completeOrder(token, order.id))}>
        Concluir atendimento
      </button>,
      <button className="button button-secondary" key="reschedule" disabled={busy} onClick={() => setPanel("reschedule")}>
        Reagendar
      </button>
    );
  }

  if (!["CANCELADO", "RECUSADO", "CONCLUIDO"].includes(order.status)) {
    actionButtons.push(
      <button className="button button-danger" key="cancel" disabled={busy} onClick={() => setPanel("cancel")}>
        Cancelar pedido
      </button>
    );
  }

  return (
    <section className="order-actions">
      <h3>Ações do pedido</h3>
      <FeedbackMessage>{error}</FeedbackMessage>
      <div className="action-buttons">{actionButtons}</div>

      {panel === "proposal" && (
        <form className="action-form" onSubmit={submitProposal}>
          <h4>Proposta de orçamento</h4>
          <label className="form-field">
            <span>Serviço</span>
            <select value={proposal.servicoId} onChange={(event) => setProposal({ ...proposal, servicoId: event.target.value })} required>
              {services.map((service) => <option key={service.id} value={service.id}>{service.nome}</option>)}
            </select>
          </label>
          <FormField id="valorPrevisto" label="Valor do serviço (R$)" type="number" min="0.01" step="0.01" value={proposal.valorPrevisto} onChange={(event) => setProposal({ ...proposal, valorPrevisto: event.target.value })} required />
          <FormField id="taxaDeslocamentoFinal" label="Deslocamento (R$)" type="number" min="0" step="0.01" value={proposal.taxaDeslocamentoFinal} onChange={(event) => setProposal({ ...proposal, taxaDeslocamentoFinal: event.target.value })} required />
          <FormField id="reagendamentoData" label="Nova data (opcional)" type="date" value={form.novaData} onChange={(event) => setForm({ ...form, novaData: event.target.value })} />
          {form.novaData && (
            <>
              <label className="form-field"><span>Novo turno</span><select value={form.novoTurno} onChange={(event) => setForm({ ...form, novoTurno: event.target.value })} required><option value="">Escolha</option><option value="MANHA">Manhã</option><option value="TARDE">Tarde</option></select></label>
              <FormField id="reagendamentoMotivo" label="Motivo da nova data" value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} maxLength={500} />
            </>
          )}
          <div className="action-form-buttons">
            <button className="button button-primary" disabled={busy}>{busy ? "Salvando..." : "Salvar proposta"}</button>
            <button className="button button-quiet" type="button" onClick={() => setPanel("")}>Fechar</button>
          </div>
        </form>
      )}

      {panel === "reschedule" && (
        <form className="action-form" onSubmit={submitReschedule}>
          <h4>Reagendar atendimento</h4>
          <FormField id="novaData" label="Nova data" type="date" min={minimumDate} value={form.novaData} onChange={(event) => setForm({ ...form, novaData: event.target.value })} required />
          <label className="form-field"><span>Novo turno</span><select value={form.novoTurno} onChange={(event) => setForm({ ...form, novoTurno: event.target.value })} required><option value="">Escolha</option><option value="MANHA">Manhã</option><option value="TARDE">Tarde</option></select></label>
          <FormField id="motivoReagendamento" label="Motivo (opcional)" value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} maxLength={500} />
          <div className="action-form-buttons"><button className="button button-primary" disabled={busy}>Confirmar reagendamento</button><button className="button button-quiet" type="button" onClick={() => setPanel("")}>Fechar</button></div>
        </form>
      )}

      {panel === "cancel" && (
        <form className="action-form" onSubmit={submitCancel}>
          <h4>Cancelar pedido</h4>
          <FormField id="motivoCancelamento" label="Motivo (opcional)" value={form.motivo} onChange={(event) => setForm({ ...form, motivo: event.target.value })} maxLength={1000} />
          <p>O pedido cancelado será enviado para a lixeira.</p>
          <div className="action-form-buttons"><button className="button button-danger" disabled={busy}>Confirmar cancelamento</button><button className="button button-quiet" type="button" onClick={() => setPanel("")}>Voltar</button></div>
        </form>
      )}
    </section>
  );
}

export default OrderActions;
