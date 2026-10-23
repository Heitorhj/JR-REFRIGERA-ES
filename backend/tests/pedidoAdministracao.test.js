import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import pedidoRepository from "../src/repositories/pedidoRepository.js";
import pedidoService from "../src/services/pedidoService.js";
import pedidoValidator from "../src/validators/pedidoValidator.js";
import prisma from "../src/db/prisma.js";

const originais = {
    buscarDadosParaReagendar: pedidoRepository.buscarDadosParaReagendar,
    reagendarPedido: pedidoRepository.reagendarPedido,
    transicionarPedidoAdministrativamente:
        pedidoRepository.transicionarPedidoAdministrativamente,
    transaction: prisma.$transaction
};

afterEach(() => {
    pedidoRepository.buscarDadosParaReagendar =
        originais.buscarDadosParaReagendar;
    pedidoRepository.reagendarPedido = originais.reagendarPedido;
    pedidoRepository.transicionarPedidoAdministrativamente =
        originais.transicionarPedidoAdministrativamente;
    prisma.$transaction = originais.transaction;
});

const dataFutura = () => {
    const data = new Date();
    data.setUTCDate(data.getUTCDate() + 40);
    return data.toISOString().slice(0, 10);
};

const validar = (metodo, req) => {
    let status;
    let corpo;
    let proximoChamado = false;
    const res = {
        status(codigo) {
            status = codigo;
            return this;
        },
        json(dados) {
            corpo = dados;
            return this;
        }
    };

    pedidoValidator[metodo](req, res, () => {
        proximoChamado = true;
    });

    return {
        status,
        corpo,
        proximoChamado,
        req
    };
};

test("valida reagendamento administrativo e normaliza os dados", () => {
    const novaData = dataFutura();
    const resultado = validar("validarReagendamento", {
        params: { id: "12" },
        body: {
            novaData,
            novoTurno: "TARDE",
            motivo: "  Indisponibilidade técnica  "
        }
    });

    assert.equal(resultado.proximoChamado, true);
    assert.equal(resultado.req.dados.id, 12);
    assert.deepEqual(resultado.req.dados.reagendamento, {
        novaData,
        novoTurno: "TARDE",
        motivo: "Indisponibilidade técnica"
    });
});

test("validator rejeita reagendamento malformado e campos extras", () => {
    const novaData = dataFutura();
    const semData = validar("validarReagendamento", {
        params: { id: "12" },
        body: { novoTurno: "MANHA" }
    });
    const campoExtra = validar("validarReagendamento", {
        params: { id: "12" },
        body: {
            novaData,
            novoTurno: "MANHA",
            status: "CONFIRMADO"
        }
    });

    assert.equal(semData.status, 400);
    assert.equal(campoExtra.status, 400);
});

test("reagendamento permitido exige atendimento confirmado e horário diferente", async () => {
    const atualizadoEm = new Date("2026-10-22T10:00:00.000Z");
    const dataAtual = dataFutura();
    const dataNova = new Date(`${dataAtual}T12:00:00.000Z`);
    dataNova.setUTCDate(dataNova.getUTCDate() + 1);
    const novaData = dataNova.toISOString().slice(0, 10);
    pedidoRepository.buscarDadosParaReagendar = async () => ({
        id: 12,
        status: "REAGENDADO_POR_JUNIOR",
        descartadoEm: null,
        dataPreferida: dataAtual,
        turnoPreferido: "MANHA",
        atualizadoEm,
        reagendamentos: [{
            novaData: dataAtual,
            novoTurno: "TARDE"
        }]
    });
    pedidoRepository.reagendarPedido = async (
        id,
        administradorId,
        dados,
        statusAtual,
        atualizadoEmPedido
    ) => [
        id,
        administradorId,
        dados,
        statusAtual,
        atualizadoEmPedido
    ];

    const resultado = await pedidoService.reagendarPedido(
        12,
        {
            novaData,
            novoTurno: "MANHA",
            motivo: null
        },
        5
    );

    assert.equal(resultado[0], 12);
    assert.equal(resultado[1], 5);
    assert.equal(resultado[3], "REAGENDADO_POR_JUNIOR");
    assert.equal(resultado[4], atualizadoEm);
});

test("não permite reagendar pedido cancelado ou repetir o horário atual", async () => {
    const dataAtual = dataFutura();
    pedidoRepository.buscarDadosParaReagendar = async () => ({
        id: 12,
        status: "CANCELADO",
        descartadoEm: null,
        dataPreferida: dataAtual,
        turnoPreferido: "MANHA",
        atualizadoEm: new Date(),
        reagendamentos: []
    });

    await assert.rejects(
        pedidoService.reagendarPedido(
            12,
            { novaData: dataAtual, novoTurno: "TARDE" },
            5
        ),
        (error) => error.statusCode === 409
    );

    pedidoRepository.buscarDadosParaReagendar = async () => ({
        id: 12,
        status: "CONFIRMADO",
        descartadoEm: null,
        dataPreferida: "2027-01-10",
        turnoPreferido: "MANHA",
        atualizadoEm: new Date(),
        reagendamentos: []
    });

    await assert.rejects(
        pedidoService.reagendarPedido(
            12,
            { novaData: "2027-01-10", novoTurno: "MANHA" },
            5
        ),
        (error) => error.statusCode === 400
    );
});

test("cancelamento e conclusão usam transições administrativas permitidas", async () => {
    let chamadaCancelamento;
    pedidoRepository.transicionarPedidoAdministrativamente =
        async (
            id,
            administradorId,
            statusPermitidos,
            statusNovo,
            observacao,
            descartar
        ) => {
            chamadaCancelamento = [
                id,
                administradorId,
                statusPermitidos,
                statusNovo,
                observacao,
                descartar
            ];
            return { status: statusNovo };
        };

    const cancelamento = await pedidoService.cancelarPedido(
        12,
        "Cliente desistiu",
        5
    );

    assert.deepEqual(cancelamento, { status: "CANCELADO" });
    assert.deepEqual(chamadaCancelamento[2], [
        "PENDENTE",
        "ACEITO_POR_JUNIOR",
        "AGUARDANDO_CLIENTE",
        "EM_NEGOCIACAO",
        "CONFIRMADO",
        "REAGENDADO",
        "REAGENDADO_POR_JUNIOR",
        "REAGENDADO_PELO_CLIENTE"
    ]);
    assert.equal(chamadaCancelamento[5], true);

    let chamadaConclusao;
    pedidoRepository.transicionarPedidoAdministrativamente =
        async (
            id,
            administradorId,
            statusPermitidos,
            statusNovo,
            observacao
        ) => {
            chamadaConclusao = [
                id,
                administradorId,
                statusPermitidos,
                statusNovo,
                observacao
            ];
            return { status: statusNovo };
        };

    await pedidoService.concluirPedido(12, 5);

    assert.deepEqual(chamadaConclusao[2], [
        "CONFIRMADO",
        "REAGENDADO",
        "REAGENDADO_POR_JUNIOR",
        "REAGENDADO_PELO_CLIENTE"
    ]);
    assert.equal(chamadaConclusao[3], "CONCLUIDO");
});

test("transição administrativa grava status e histórico na mesma transação", async () => {
    let opcoesAtualizacao;
    let dadosHistorico;
    let transacaoExecutada = false;
    const dataExpurgo = new Date("2026-10-23T12:00:00.000Z");

    prisma.$transaction = async (callback) => {
        transacaoExecutada = true;
        return callback({
            pedido: {
                async findUnique() {
                    return {
                        status: "CONFIRMADO",
                        descartadoEm: null
                    };
                },
                async updateMany(opcoes) {
                    opcoesAtualizacao = opcoes;
                    return { count: 1 };
                }
            },
            historicoStatus: {
                async create(opcoes) {
                    dadosHistorico = opcoes.data;
                    return {
                        criadoEm: dataExpurgo
                    };
                }
            }
        });
    };

    const resultado =
        await pedidoRepository.transicionarPedidoAdministrativamente(
            12,
            5,
            ["CONFIRMADO"],
            "CANCELADO",
            "Pedido cancelado.",
            true
        );

    assert.equal(transacaoExecutada, true);
    assert.equal(opcoesAtualizacao.where.status, "CONFIRMADO");
    assert.equal(opcoesAtualizacao.data.status, "CANCELADO");
    assert.ok(opcoesAtualizacao.data.descartadoEm instanceof Date);
    assert.equal(dadosHistorico.statusAnterior, "CONFIRMADO");
    assert.equal(dadosHistorico.statusNovo, "CANCELADO");
    assert.equal(dadosHistorico.administradorId, 5);
    assert.equal(resultado.registradoEm, dataExpurgo);
    assert.equal(resultado.descartadoEm, opcoesAtualizacao.data.descartadoEm);
});

test("reagendamento cria registro e histórico com controle de concorrência", async () => {
    const atualizadoEm = new Date("2026-10-22T10:00:00.000Z");
    let atualizacao;
    let reagendamentoCriado;
    let historicoCriado;
    prisma.$transaction = async (callback) => callback({
        pedido: {
            async updateMany(opcoes) {
                atualizacao = opcoes;
                return { count: 1 };
            }
        },
        reagendamento: {
            async create(opcoes) {
                reagendamentoCriado = opcoes.data;
                return {
                    id: 3,
                    novaData: opcoes.data.novaData,
                    novoTurno: opcoes.data.novoTurno,
                    motivo: opcoes.data.motivo,
                    aceito: opcoes.data.aceito,
                    criadoEm: atualizadoEm
                };
            }
        },
        historicoStatus: {
            async create(opcoes) {
                historicoCriado = opcoes.data;
            }
        }
    });

    const resultado = await pedidoRepository.reagendarPedido(
        12,
        5,
        {
            novaData: "2027-02-12",
            novoTurno: "TARDE",
            motivo: "Ajuste de agenda"
        },
        "CONFIRMADO",
        atualizadoEm
    );

    assert.equal(atualizacao.where.atualizadoEm, atualizadoEm);
    assert.equal(atualizacao.where.status, "CONFIRMADO");
    assert.equal(atualizacao.data.status, "REAGENDADO_POR_JUNIOR");
    assert.equal(reagendamentoCriado.aceito, true);
    assert.equal(historicoCriado.statusAnterior, "CONFIRMADO");
    assert.equal(historicoCriado.statusNovo, "REAGENDADO_POR_JUNIOR");
    assert.equal(historicoCriado.administradorId, 5);
    assert.equal(resultado.reagendamento.id, 3);
});

test("conflito concorrente não cria histórico administrativo", async () => {
    let historicoCriado = false;
    prisma.$transaction = async (callback) => callback({
        pedido: {
            async findUnique() {
                return {
                    status: "CONFIRMADO",
                    descartadoEm: null
                };
            },
            async updateMany() {
                return { count: 0 };
            }
        },
        historicoStatus: {
            async create() {
                historicoCriado = true;
            }
        }
    });

    await assert.rejects(
        pedidoRepository.transicionarPedidoAdministrativamente(
            12,
            5,
            ["CONFIRMADO"],
            "CONCLUIDO",
            "Atendimento concluído."
        ),
        (error) => error.statusCode === 409
    );

    assert.equal(historicoCriado, false);
});

test("conflito no reagendamento não cria registro nem histórico", async () => {
    let registroCriado = false;
    let historicoCriado = false;
    prisma.$transaction = async (callback) => callback({
        pedido: {
            async updateMany() {
                return { count: 0 };
            }
        },
        reagendamento: {
            async create() {
                registroCriado = true;
            }
        },
        historicoStatus: {
            async create() {
                historicoCriado = true;
            }
        }
    });

    await assert.rejects(
        pedidoRepository.reagendarPedido(
            12,
            5,
            {
                novaData: "2027-02-12",
                novoTurno: "TARDE",
                motivo: null
            },
            "CONFIRMADO",
            new Date()
        ),
        (error) => error.statusCode === 409
    );

    assert.equal(registroCriado, false);
    assert.equal(historicoCriado, false);
});
