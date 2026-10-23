# JR Refrigerações — API

Back-end do sistema web de agendamento, validação de orçamentos e gestão de atendimentos da **JR Refrigerações** (projeto acadêmico — Uninassau, Ciência da Computação, disciplina *Maturidade em Desenvolvimento de Software*).

**Stack:** Node.js + Express · SQLite (better-sqlite3) · JWT + bcrypt · express-rate-limit · node-cron · zod

## Como rodar

```bash
npm install
cp .env.example .env     # ajuste JWT_SECRET e ADMIN_PASSWORD
npm run seed             # cria tabelas, cidades, serviços e o usuário admin
npm run dev              # http://localhost:3333
npm test                 # 42 testes (banco em memória)
```

## Estrutura

```
src/
  app.js            fábrica do Express (middlewares + rotas)
  server.js         sobe o servidor e agenda o expurgo
  config/env.js     variáveis de ambiente
  db/               schema.sql, conexão e seed
  middleware/       auth (JWT), rateLimiters, validate (zod), errorHandler
  routes/           auth, publico, admin
  services/         pedidos, admin, estados (máquina de estados), whatsapp
  jobs/expurgo.js   limpeza automática (RF12)
tests/              testes de integração com node:test
```

## Endpoints

Erros seguem `{ "erro": { "codigo", "mensagem", "detalhes?" } }`. Valores monetários em reais (number).

### Públicos (sem login)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/saude` | Health check |
| GET | `/api/servicos` | Catálogo de serviços |
| GET | `/api/cidades` | Cidades atendidas, nível e taxa estimada |
| GET | `/api/deslocamento?cidade_id=` | Simulador de deslocamento (origem: Recife) |
| POST | `/api/pedidos` | Solicita orçamento (RF01/RF02) |

`POST /api/pedidos`:

```json
{
  "nome": "Maria da Silva",
  "whatsapp": "(81) 99999-1234",
  "cidade_id": 2,
  "endereco": "Casa Caiada, Rua das Flores 100",
  "descricao_problema": "Ar-condicionado pingando água.",
  "servico_id": 3,
  "data_preferida": "2026-11-05",
  "turno_preferido": "MANHA"
}
```

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | `{ email, senha }` → `{ token, usuario }` (RF04) |
| GET | `/api/auth/me` | Usuário do token |

Rotas privadas exigem `Authorization: Bearer <token>` (RF05, RNF06).

### Painel administrativo (`/api/admin`, exige JWT)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/resumo` | Contagem de pedidos por estado |
| GET | `/pedidos?status=&pagina=&limite=` | Lista (oculta CANCELADO/RECUSADO se não filtrar) |
| GET | `/pedidos/:id` | Detalhe + histórico + transições permitidas |
| PATCH | `/pedidos/:id/valores` | `valor_previsto` e/ou `taxa_deslocamento_final` (RF07/RF08) |
| POST | `/pedidos/:id/reagendar` | `{ nova_data, novo_turno, motivo? }` (RF09) |
| PATCH | `/pedidos/:id/status` | `{ status, motivo? }` valida a máquina de estados (RF10) |
| GET | `/pedidos/:id/whatsapp?tipo=` | Mensagem pronta + link `wa.me` (RF11) |

Tipos de mensagem: `contato`, `proposta`, `reagendamento`, `confirmacao`, `cancelamento`, `recusa`. Sem `tipo`, usa o padrão do estado atual.

## Máquina de estados

```
PENDENTE ──► ACEITO_POR_JUNIOR ──► CONFIRMADO
   │               │                   │
   ├──► REAGENDADO ◄┴───────────────────┘   (REAGENDADO ──► CONFIRMADO)
   │
   └──► RECUSADO        ACEITO/REAGENDADO/CONFIRMADO ──► CANCELADO | RECUSADO
```

`CANCELADO` e `RECUSADO` são finais: não aceitam mais alterações e entram na área de descarte.

| De | Para |
|---|---|
| PENDENTE | ACEITO_POR_JUNIOR, REAGENDADO, RECUSADO |
| ACEITO_POR_JUNIOR | CONFIRMADO, REAGENDADO, CANCELADO, RECUSADO |
| REAGENDADO | CONFIRMADO, REAGENDADO, CANCELADO, RECUSADO |
| CONFIRMADO | REAGENDADO, CANCELADO, RECUSADO |

Para `ACEITO_POR_JUNIOR` e `CONFIRMADO` é obrigatório ter `valor_previsto`. Se a taxa não foi ajustada, a estimativa do sistema é adotada.

## Segurança

- Senhas com **bcrypt** (custo 12); login devolve a mesma resposta para e-mail inexistente e senha errada.
- **JWT** HS256 com expiração; o middleware valida assinatura, algoritmo, validade e existência do usuário.
- **Rate limiting**: geral (100/15 min), login (5 falhas/15 min) e formulário público (10/hora) — configuráveis no `.env`.
- `helmet`, CORS restrito ao front-end, limite de 10 kb no corpo, validação de entrada com zod e consultas SQL parametrizadas.
- Em produção o servidor se recusa a subir sem `JWT_SECRET` forte (32+ caracteres).

## Expurgo (RF12)

Pedidos `CANCELADO`/`RECUSADO` recebem `descartado_em`. O job (`node-cron`, 03:00 America/Recife, e uma varredura ao iniciar) apaga os que passaram de `RETENCAO_DIAS` (padrão 7), junto com histórico e clientes sem outros pedidos.

## Taxas de deslocamento (demonstração)

Definidas no seed por nível da cidade: Recife R$ 0 · Nível 1 R$ 30 · Nível 2 R$ 50 · Nível 3 R$ 90. São valores de exemplo; ajuste em `src/db/seed.js` (ou direto na tabela `cidades`) conforme a realidade do Júnior.
