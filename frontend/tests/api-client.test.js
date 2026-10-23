import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "vite";

let api;
let originalFetch;
let vite;

before(async () => {
  vite = await createServer({
    configFile: false,
    server: { middlewareMode: true }
  });
  ({ api } = await vite.ssrLoadModule("/src/api/client.js"));
  originalFetch = globalThis.fetch;
});

after(async () => {
  globalThis.fetch = originalFetch;
  await vite.close();
});

test("sends a JSON order request and returns the API response", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "http://localhost:3333/api/pedidos");
    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.deepEqual(JSON.parse(options.body), { nome: "Cliente" });

    return {
      ok: true,
      json: async () => ({ pedido: { id: 12 } })
    };
  };

  assert.deepEqual(await api("/api/pedidos", {
    method: "POST",
    body: { nome: "Cliente" }
  }), { pedido: { id: 12 } });
});

test("surfaces the API error message when creating an order fails", async () => {
  globalThis.fetch = async () => ({
    ok: false,
    json: async () => ({ mensagem: "Dados inválidos." })
  });

  await assert.rejects(
    api("/api/pedidos", { method: "POST", body: {} }),
    { message: "Dados inválidos." }
  );
});
