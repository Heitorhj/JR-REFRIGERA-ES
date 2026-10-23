import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import pedidoRepository from "../src/repositories/pedidoRepository.js";
import pedidoService from "../src/services/pedidoService.js";
import loginRequired from "../src/middleware/loginRequired.js";
import pedidoValidator from "../src/validators/pedidoValidator.js";
import prisma from "../src/db/prisma.js";

const originais = {
    buscarDadosParaEnvioManualProposta:
        pedidoRepository.buscarDadosParaEnvioManualProposta,
    registrarEnvioManualProposta:
        pedidoRepository.registrarEnvioManualProposta,
    registrarRespostaCliente:
        pedidoRepository.registrarRespostaCliente,
    transaction: prisma.$transaction
};

afterEach(() => {
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        originais.buscarDadosParaEnvioManualProposta;
    pedidoRepository.registrarEnvioManualProposta =
        originais.registrarEnvioManualProposta;
    pedidoRepository.registrarRespostaCliente =
        originais.registrarRespostaCliente;
    prisma.$transaction = originais.transaction;
});

const criarPedidoProposta = (sobrescritos = {}) => {
    const pedido = {
        id: 17,
        status: "ACEITO_POR_JUNIOR",
        descartadoEm: null,
        dataPreferida: "2026-11-05",
        turnoPreferido: "MANHA",
        valorPrevisto: 12500,
        taxaDeslocamentoFinal: 3000,
        cliente: {
            nome: "Maria Silva",
            whatsapp: "5581999999999"
        },
        servico: {
            nome: "Manutenção de ar-condicionado"
        },
        reagendamentos: []
    };

    return Object.assign(pedido, sobrescritos);
};

test("gera link pré-preenchido sem registrar envio", async () => {
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        async () => criarPedidoProposta();

    const resultado = await pedidoService.gerarLinkWhatsappProposta(17);
    const url = new URL(resultado.url);

    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/5581999999999");
    assert.ok(url.searchParams.get("text").includes("155,00"));
    assert.equal(resultado.envioConfirmado, false);
});

test("mensagem mostra a data original quando há sugestão de reagendamento", async () => {
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        async () => criarPedidoProposta({
            reagendamentos: [
                {
                    novaData: "2026-11-07",
                    novoTurno: "TARDE"
                }
            ]
        });

    const resultado = await pedidoService.gerarLinkWhatsappProposta(17);

    assert.ok(resultado.mensagem.includes("Solicitado originalmente: 05/11/2026 (manhã)"));
    assert.ok(resultado.mensagem.includes("Data proposta: 07/11/2026 (tarde)"));
    assert.ok(resultado.mensagem.includes("alterar o dia ou turno"));
});

test("recusa gerar link para status diferente de proposta salva", async () => {
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        async () => criarPedidoProposta({ status: "PENDENTE" });

    await assert.rejects(
        pedidoService.gerarLinkWhatsappProposta(17),
        (error) => error.statusCode === 409
    );
});

test("recusa pedidos inexistentes, descartados ou com proposta incompleta", async () => {
    const casos = [
        {
            pedido: null,
            status: 404
        },
        {
            pedido: criarPedidoProposta({ descartadoEm: new Date() }),
            status: 409
        },
        {
            pedido: criarPedidoProposta({ status: "PENDENTE" }),
            status: 409
        },
        {
            pedido: criarPedidoProposta({ status: "AGUARDANDO_CLIENTE" }),
            status: 409
        },
        {
            pedido: criarPedidoProposta({ status: "CONFIRMADO" }),
            status: 409
        },
        {
            pedido: criarPedidoProposta({ valorPrevisto: null }),
            status: 409
        }
    ];
    let registrosSolicitados = 0;

    for (const caso of casos) {
        pedidoRepository.buscarDadosParaEnvioManualProposta =
            async () => caso.pedido;
        pedidoRepository.registrarEnvioManualProposta = async () => {
            registrosSolicitados += 1;
        };

        await assert.rejects(
            pedidoService.informarEnvioManualProposta(17, 5),
            (error) => error.statusCode === caso.status
        );
    }

    assert.equal(registrosSolicitados, 0);
});

test("registra confirmação manual sem afirmar entrega", async () => {
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        async () => criarPedidoProposta();
    pedidoRepository.registrarEnvioManualProposta = async (id, administradorId) => {
        assert.equal(id, 17);
        assert.equal(administradorId, 5);
        return { criadoEm: new Date("2026-10-23T03:00:00.000Z") };
    };

    const resultado = await pedidoService.informarEnvioManualProposta(17, 5);

    assert.equal(resultado.status, "AGUARDANDO_CLIENTE");
    assert.equal(resultado.envioInformadoManualmente, true);
    assert.equal(resultado.entregaConfirmadaPeloWhatsApp, false);
});

test("não permite registrar o envio novamente após a transição", async () => {
    let statusPedido = "ACEITO_POR_JUNIOR";
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        async () => criarPedidoProposta({ status: statusPedido });
    pedidoRepository.registrarEnvioManualProposta = async () => {
        statusPedido = "AGUARDANDO_CLIENTE";
        return { criadoEm: new Date() };
    };

    await pedidoService.informarEnvioManualProposta(17, 5);

    await assert.rejects(
        pedidoService.informarEnvioManualProposta(17, 5),
        (error) => error.statusCode === 409
    );
});

test("middleware bloqueia usuário sem autenticação", async () => {
    const req = { headers: {} };
    const res = {
        status(code) {
            this.code = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
    let nextChamado = false;

    await loginRequired(req, res, () => {
        nextChamado = true;
    });

    assert.equal(res.code, 401);
    assert.equal(nextChamado, false);
});

test("validator aceita ações de resposta e rejeita campos inválidos", () => {
    const req = {
        params: { id: "17" },
        body: {
            acao: "NEGOCIAR",
            observacao: "Cliente quer avaliar outra data."
        }
    };
    let continuou = false;

    pedidoValidator.validarRespostaCliente(
        req,
        {
            status(code) {
                this.codigo = code;
                return this;
            },
            json(body) {
                this.corpo = body;
            }
        },
        () => {
            continuou = true;
        }
    );

    assert.equal(continuou, true);
    assert.equal(req.dados.id, 17);
    assert.equal(req.dados.resposta.acao, "NEGOCIAR");

    const reqInvalida = {
        params: { id: "17" },
        body: { acao: "ACEITAR", status: "CONFIRMADO" }
    };
    const resInvalida = {
        status(code) {
            this.codigo = code;
            return this;
        },
        json(body) {
            this.corpo = body;
        }
    };

    pedidoValidator.validarRespostaCliente(reqInvalida, resInvalida, () => {
        assert.fail("Não deve aceitar campos extras.");
    });

    assert.equal(resInvalida.codigo, 400);
});

test("resposta aceita confirma; negociar e cancelar mudam para status adequados", async () => {
    const pedidos = [
        {
            acao: "ACEITAR",
            status: "CONFIRMADO"
        },
        {
            acao: "NEGOCIAR",
            status: "EM_NEGOCIACAO"
        },
        {
            acao: "CANCELAR",
            status: "CANCELADO"
        }
    ];

    for (const caso of pedidos) {
        pedidoRepository.buscarDadosParaEnvioManualProposta =
            async () => criarPedidoProposta({ status: "AGUARDANDO_CLIENTE" });
        pedidoRepository.registrarRespostaCliente =
            async (id, administradorId, acao, observacao, novoStatus) => {
                assert.equal(id, 17);
                assert.equal(administradorId, 5);
                assert.equal(acao, caso.acao);
                assert.equal(observacao, "Resposta confirmada por telefone.");
                assert.equal(novoStatus, caso.status);
                return { status: novoStatus };
            };

        const resultado = await pedidoService.registrarRespostaCliente(
            17,
            {
                acao: caso.acao,
                observacao: "Resposta confirmada por telefone."
            },
            5
        );

        assert.equal(resultado.status, caso.status);
    }
});

test("não registra resposta se pedido ainda não aguarda cliente", async () => {
    pedidoRepository.buscarDadosParaEnvioManualProposta =
        async () => criarPedidoProposta({ status: "ACEITO_POR_JUNIOR" });

    await assert.rejects(
        pedidoService.registrarRespostaCliente(17, { acao: "ACEITAR" }, 5),
        (error) => error.statusCode === 409
    );
});

test("resposta cliente atualiza estado, reage ao rascunho enviado e grava histórico atomicamente", async () => {
    let dadosAtualizacao;
    let reagendamentoAtualizado;
    let historico;
    prisma.$transaction = (operacao) => operacao({
        pedido: {
            async updateMany({ where, data }) {
                assert.equal(where.id, 17);
                assert.equal(where.status, "AGUARDANDO_CLIENTE");
                dadosAtualizacao = data;
                return { count: 1 };
            }
        },
        reagendamento: {
            async updateMany({ where, data }) {
                reagendamentoAtualizado = { where, data };
                return { count: 1 };
            }
        },
        historicoStatus: {
            async create({ data }) {
                historico = data;
                return { criadoEm: new Date("2026-10-23T03:00:00.000Z") };
            }
        }
    });

    const resultado = await pedidoRepository.registrarRespostaCliente(
        17,
        5,
        "ACEITAR",
        "Cliente aceitou a proposta.",
        "CONFIRMADO"
    );

    assert.equal(dadosAtualizacao.status, "CONFIRMADO");
    assert.equal(Object.hasOwn(dadosAtualizacao, "descartadoEm"), false);
    assert.equal(reagendamentoAtualizado.where.pedidoId, 17);
    assert.equal(reagendamentoAtualizado.data.aceito, true);
    assert.equal(historico.administradorId, 5);
    assert.equal(historico.statusAnterior, "AGUARDANDO_CLIENTE");
    assert.equal(historico.statusNovo, "CONFIRMADO");
    assert.equal(resultado.status, "CONFIRMADO");
});

test("negociação e cancelamento não classificam a data proposta como recusada", async () => {
    for (const caso of [
        { acao: "NEGOCIAR", status: "EM_NEGOCIACAO" },
        { acao: "CANCELAR", status: "CANCELADO" }
    ]) {
        let dadosAtualizacao;
        let reagendamentoAlterado = false;
        prisma.$transaction = (operacao) => operacao({
            pedido: {
                async updateMany({ data }) {
                    dadosAtualizacao = data;
                    return { count: 1 };
                }
            },
            reagendamento: {
                async updateMany() {
                    reagendamentoAlterado = true;
                    return { count: 1 };
                }
            },
            historicoStatus: {
                async create() {
                    return { criadoEm: new Date("2026-10-23T03:00:00.000Z") };
                }
            }
        });

        await pedidoRepository.registrarRespostaCliente(
            17,
            5,
            caso.acao,
            undefined,
            caso.status
        );

        assert.deepEqual(dadosAtualizacao, { status: caso.status });
        assert.equal(reagendamentoAlterado, false);
    }
});

test("transição atualiza status e grava administrador e horário na transação", async () => {
    let dadosHistorico;
    prisma.$transaction = (operacao) => operacao({
        pedido: {
            async updateMany({ where, data }) {
                assert.equal(where.id, 17);
                assert.equal(where.status, "ACEITO_POR_JUNIOR");
                assert.equal(where.descartadoEm, null);
                assert.equal(where.valorPrevisto.not, null);
                assert.equal(where.taxaDeslocamentoFinal.not, null);
                assert.equal(data.status, "AGUARDANDO_CLIENTE");
                return { count: 1 };
            }
        },
        historicoStatus: {
            async create({ data, select }) {
                dadosHistorico = data;
                assert.deepEqual(select, { criadoEm: true });
                return { criadoEm: new Date("2026-10-23T03:00:00.000Z") };
            }
        }
    });

    const registro = await pedidoRepository.registrarEnvioManualProposta(17, 5);

    assert.equal(registro.criadoEm.toISOString(), "2026-10-23T03:00:00.000Z");
    assert.equal(dadosHistorico.administradorId, 5);
    assert.equal(dadosHistorico.statusAnterior, "ACEITO_POR_JUNIOR");
    assert.equal(dadosHistorico.statusNovo, "AGUARDANDO_CLIENTE");
});

test("não cria histórico quando a transição concorrente já ocorreu", async () => {
    let historicoCriado = false;
    prisma.$transaction = (operacao) => operacao({
        pedido: {
            async updateMany({ where }) {
                assert.equal(where.status, "ACEITO_POR_JUNIOR");
                assert.equal(where.descartadoEm, null);
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
        pedidoRepository.registrarEnvioManualProposta(17, 5),
        (error) => error.statusCode === 409
    );
    assert.equal(historicoCriado, false);
    assert.equal(historicoCriado, false);
});
