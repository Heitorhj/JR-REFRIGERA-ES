import { api } from "./client.js";

export function listOrders(token, { status = "", page = 1, limit = 10, trash = false } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (status) query.set("status", status);

  const path = trash ? "/api/admin/pedidos/lixeira" : "/api/admin/pedidos";
  return api(`${path}?${query.toString()}`, { token });
}

export async function getOrder(token, id) {
  const result = await api(`/api/admin/pedidos/${id}`, { token });
  return result.pedido;
}

export function saveProposal(token, id, proposal) {
  return api(`/api/admin/pedidos/${id}/proposta`, {
    method: "PATCH",
    token,
    body: proposal
  });
}

export function getWhatsAppLink(token, id) {
  return api(`/api/admin/pedidos/${id}/whatsapp`, { token });
}

export function reportProposalSent(token, id) {
  return api(`/api/admin/pedidos/${id}/proposta/envio`, {
    method: "POST",
    token
  });
}

export function reportCustomerResponse(token, id, acao, observacao) {
  return api(`/api/admin/pedidos/${id}/resposta`, {
    method: "POST",
    token,
    body: { acao, observacao }
  });
}

export function cancelOrder(token, id, motivo) {
  return api(`/api/admin/pedidos/${id}/cancelamento`, {
    method: "POST",
    token,
    body: { motivo }
  });
}

export function completeOrder(token, id) {
  return api(`/api/admin/pedidos/${id}/conclusao`, {
    method: "POST",
    token
  });
}

export function rescheduleOrder(token, id, reagendamento) {
  return api(`/api/admin/pedidos/${id}/reagendamentos`, {
    method: "POST",
    token,
    body: reagendamento
  });
}
