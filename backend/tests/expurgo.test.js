import assert from "node:assert/strict";
import { test } from "node:test";
import { expurgarDescartados } from "../src/jobs/expurgo.js";

test("expurgo remove somente pedidos descartados vencidos e clientes órfãos", async () => {
    let filtroPedidos;
    let filtroClientes;
    let transacaoExecutada = false;
    const agora = new Date("2026-10-23T12:00:00.000Z");

    const prisma = {
        async $transaction(callback) {
            transacaoExecutada = true;

            return callback({
                pedido: {
                    async deleteMany(opcoes) {
                        filtroPedidos = opcoes.where;
                        return { count: 2 };
                    }
                },
                cliente: {
                    async deleteMany(opcoes) {
                        filtroClientes = opcoes.where;
                        return { count: 1 };
                    }
                }
            });
        }
    };

    const resultado = await expurgarDescartados(prisma, {
        retencaoDias: 7,
        agora
    });

    assert.equal(transacaoExecutada, true);
    assert.deepEqual(filtroPedidos.status.in, ["CANCELADO", "RECUSADO"]);
    assert.equal(filtroPedidos.descartadoEm.not, null);
    assert.equal(
        filtroPedidos.descartadoEm.lte.toISOString(),
        "2026-10-16T12:00:00.000Z"
    );
    assert.deepEqual(filtroClientes, {
        pedidos: {
            none: {}
        }
    });
    assert.deepEqual(resultado, {
        pedidos: 2,
        clientes: 1
    });
});

test("expurgo rejeita prazo de retenção inválido sem iniciar transação", async () => {
    let transacaoExecutada = false;
    const prisma = {
        async $transaction() {
            transacaoExecutada = true;
        }
    };

    await assert.rejects(
        expurgarDescartados(prisma, { retencaoDias: 0 }),
        /RETENCAO_DIAS/
    );
    assert.equal(transacaoExecutada, false);
});
