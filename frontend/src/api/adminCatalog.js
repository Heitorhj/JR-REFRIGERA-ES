import { api } from "./client.js";

export function listServices(token) {
  return api("/api/admin/servicos", { token });
}

export function createService(token, payload) {
  return api("/api/admin/servicos", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateService(token, id, payload) {
  return api(`/api/admin/servicos/${id}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export function deactivateService(token, id) {
  return api(`/api/admin/servicos/${id}/desativar`, {
    method: "PATCH",
    token
  });
}

export function reactivateService(token, id) {
  return api(`/api/admin/servicos/${id}/reativar`, {
    method: "PATCH",
    token
  });
}

export function listCities(token) {
  return api("/api/admin/cidades", { token });
}

export function createCity(token, payload) {
  return api("/api/admin/cidades", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateCity(token, id, payload) {
  return api(`/api/admin/cidades/${id}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export function deactivateCity(token, id) {
  return api(`/api/admin/cidades/${id}/desativar`, {
    method: "PATCH",
    token
  });
}

export function reactivateCity(token, id) {
  return api(`/api/admin/cidades/${id}/reativar`, {
    method: "PATCH",
    token
  });
}

export function listFees(token) {
  return api("/api/admin/taxas-deslocamento", { token });
}

export function createFee(token, payload) {
  return api("/api/admin/taxas-deslocamento", {
    method: "POST",
    token,
    body: payload
  });
}

export function updateFee(token, nivel, payload) {
  return api(`/api/admin/taxas-deslocamento/${nivel}`, {
    method: "PATCH",
    token,
    body: payload
  });
}
