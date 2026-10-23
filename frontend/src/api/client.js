const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export async function api(path, options = {}) {
  const headers = {
    Accept: "application/json"
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Confira sua conexão e tente novamente.");
  }

  let payload = {};

  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error("A API retornou uma resposta inesperada.");
    }
  }

  if (!response.ok) {
    throw new Error(payload.mensagem ?? payload.erro ?? "Não foi possível concluir a operação.");
  }

  return payload;
}
