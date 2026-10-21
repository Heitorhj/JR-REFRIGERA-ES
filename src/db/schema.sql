-- JR Refrigerações — esquema do banco (SQLite)
-- Valores monetários em centavos (INTEGER). Datas em ISO 8601 (UTC) nos
-- campos *_em e AAAA-MM-DD nos campos de data de atendimento.

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  senha_hash  TEXT    NOT NULL,
  criado_em   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Cidades atendidas e seus níveis (0 = base, 1..3 = faixas de deslocamento)
CREATE TABLE IF NOT EXISTS cidades (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  nome                TEXT    NOT NULL UNIQUE,
  nivel               INTEGER NOT NULL CHECK (nivel BETWEEN 0 AND 3),
  regiao              TEXT    NOT NULL,
  taxa_deslocamento   INTEGER NOT NULL CHECK (taxa_deslocamento >= 0),
  ativa               INTEGER NOT NULL DEFAULT 1 CHECK (ativa IN (0, 1))
);

CREATE TABLE IF NOT EXISTS servicos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL UNIQUE,
  nome       TEXT NOT NULL,
  descricao  TEXT NOT NULL,
  ativo      INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1))
);

CREATE TABLE IF NOT EXISTS clientes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  whatsapp   TEXT NOT NULL,           -- somente dígitos, com DDI 55
  criado_em  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp ON clientes (whatsapp);

CREATE TABLE IF NOT EXISTS pedidos (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id                  INTEGER NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  servico_id                  INTEGER NOT NULL REFERENCES servicos (id),
  cidade_id                   INTEGER NOT NULL REFERENCES cidades (id),
  endereco                    TEXT    NOT NULL,   -- bairro / endereço
  descricao_problema          TEXT    NOT NULL,
  data_preferida              TEXT    NOT NULL,   -- AAAA-MM-DD
  turno_preferido             TEXT    NOT NULL CHECK (turno_preferido IN ('MANHA', 'TARDE')),
  status                      TEXT    NOT NULL DEFAULT 'PENDENTE'
    CHECK (status IN ('PENDENTE', 'ACEITO_POR_JUNIOR', 'REAGENDADO', 'CONFIRMADO', 'CANCELADO', 'RECUSADO')),
  valor_previsto              INTEGER CHECK (valor_previsto IS NULL OR valor_previsto >= 0),
  taxa_deslocamento_estimada  INTEGER NOT NULL,   -- calculada pelo sistema na criação
  taxa_deslocamento_final     INTEGER,            -- confirmada/ajustada pelo técnico
  nova_data                   TEXT,
  novo_turno                  TEXT CHECK (novo_turno IS NULL OR novo_turno IN ('MANHA', 'TARDE')),
  motivo                      TEXT,
  descartado_em               TEXT,               -- preenchido ao entrar em CANCELADO/RECUSADO
  criado_em                   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  atualizado_em               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_descartado ON pedidos (descartado_em);

-- Registro de tudo que aconteceu com cada solicitação
CREATE TABLE IF NOT EXISTS historico_status (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id   INTEGER NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
  de_status   TEXT,
  para_status TEXT NOT NULL,
  observacao  TEXT,
  usuario_id  INTEGER REFERENCES usuarios (id) ON DELETE SET NULL,
  criado_em   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_historico_pedido ON historico_status (pedido_id);
