# JR Refrigerações — backend

API do sistema de agendamento e gestão de atendimentos da JR Refrigerações.

**Tecnologias:** Node.js, Express, Prisma ORM, SQLite, JWT e bcrypt.

## Requisitos

- Node.js e npm.
- O frontend fica na pasta `../frontend`.

## Configuração e execução

No PowerShell, a partir da raiz do repositório:

```powershell
Set-Location backend
npm ci
Copy-Item .env.example .env
```

Edite `backend/.env` e configure ao menos `JWT_SECRET`, `ADMIN_EMAIL` e
`ADMIN_PASSWORD`. O arquivo de exemplo já define `DATABASE_URL` para um banco
SQLite local em `backend/data/jr-refrigeracoes.db`.

Gere o Prisma Client, aplique as migrações e crie os dados iniciais:

```powershell
npx prisma generate
npx prisma migrate dev
npm run seed
```

Inicie a API:

```powershell
npm run dev
```

A API ficará disponível em `http://localhost:3333`. Para iniciar o frontend,
abra outro terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

O frontend usa `http://localhost:5173`, configurado como origem permitida no
`.env.example` do backend.

## Testes

Com as dependências instaladas e o Prisma Client gerado, execute no diretório
`backend`:

```powershell
$env:JWT_SECRET = "chave-temporaria-com-mais-de-32-caracteres"
npm test
Remove-Item Env:JWT_SECRET
```

Os testes usam `node:test`. A chave temporária é necessária porque o módulo de
autenticação valida `JWT_SECRET` durante a inicialização.

## Estrutura

```text
backend/
  prisma/       schema, migrações e seed inicial
  src/
    routes/       definição das rotas HTTP
    validators/   validação e normalização dos dados
    controllers/  entrada e resposta HTTP
    services/     regras de negócio
    repositories/ acesso ao banco via Prisma
    middleware/   autenticação
    jobs/         expurgo periódico de pedidos
  tests/        testes automatizados
```

O fluxo principal segue `rotas → validadores → controllers → services →
repositories → Prisma/SQLite`.

## Rotas

### Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/servicos` | Lista serviços ativos |
| GET | `/api/cidades` | Lista cidades ativas e suas taxas |
| POST | `/api/pedidos` | Registra uma solicitação de atendimento |

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autentica o administrador e retorna um token |
| GET | `/api/auth/me` | Retorna o administrador autenticado |

As rotas administrativas exigem `Authorization: Bearer <token>`.

### Administração

| Método | Rota | Descrição |
|---|---|---|
| GET, POST | `/api/admin/servicos` | Lista todos os serviços e cadastra um serviço |
| PATCH | `/api/admin/servicos/:id` | Edita um serviço |
| PATCH | `/api/admin/servicos/:id/desativar` | Desativa um serviço |
| PATCH | `/api/admin/servicos/:id/reativar` | Reativa um serviço |
| GET, POST | `/api/admin/cidades` | Lista todas as cidades e cadastra uma cidade |
| PATCH | `/api/admin/cidades/:id` | Edita uma cidade |
| PATCH | `/api/admin/cidades/:id/desativar` | Desativa uma cidade |
| PATCH | `/api/admin/cidades/:id/reativar` | Reativa uma cidade |
| GET, POST | `/api/admin/taxas-deslocamento` | Lista e cadastra taxas por nível |
| PATCH | `/api/admin/taxas-deslocamento/:nivel` | Edita a taxa de um nível |
| GET | `/api/admin/pedidos` | Lista pedidos com paginação e filtros |
| GET | `/api/admin/pedidos/lixeira` | Lista pedidos descartados |
| GET | `/api/admin/pedidos/:id` | Consulta os detalhes de um pedido |
| POST | `/api/admin/pedidos/:id/reagendamentos` | Registra um reagendamento |
| POST | `/api/admin/pedidos/:id/cancelamento` | Cancela um pedido |
| POST | `/api/admin/pedidos/:id/conclusao` | Conclui um pedido |
| PATCH | `/api/admin/pedidos/:id/proposta` | Salva a proposta para o cliente |
| GET | `/api/admin/pedidos/:id/whatsapp` | Gera um link de mensagem para WhatsApp |
| POST | `/api/admin/pedidos/:id/proposta/envio` | Registra o envio manual da proposta |
| POST | `/api/admin/pedidos/:id/resposta` | Registra a resposta do cliente |

Os valores de taxas e propostas são armazenados em centavos. A rota de WhatsApp
prepara o link; o envio da mensagem é feito manualmente pelo administrador.

## Dados iniciais

`npm run seed` cadastra cidades, serviços e o administrador definidos em
`prisma/seed.js`. O seed pode ser executado novamente sem duplicar esses dados;
se a conta de administrador já existir, a senha não é substituída.

## Expurgo de pedidos

Pedidos cancelados ou recusados são marcados para descarte. Um job diário remove
os pedidos após o período definido por `RETENCAO_DIAS` (padrão: 7 dias) e remove
clientes que não tenham outros pedidos.
