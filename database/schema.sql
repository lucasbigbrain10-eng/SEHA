-- Schema SQLite do SEHA. Para criação inicial, o backend também executa
-- SQLAlchemy Base.metadata.create_all na inicialização.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR PRIMARY KEY NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_usuarios_email ON usuarios (email);

CREATE TABLE IF NOT EXISTS habitos (
    id VARCHAR PRIMARY KEY NOT NULL,
    usuario_id VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    objetivo TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'ativo',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contextos (
    id VARCHAR PRIMARY KEY NOT NULL,
    habito_id VARCHAR NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL,
    conteudo TEXT NOT NULL,
    origem VARCHAR(50) DEFAULT 'usuario',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estrategias (
    id VARCHAR PRIMARY KEY NOT NULL,
    habito_id VARCHAR NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    versao VARCHAR(20) DEFAULT 'v1.0',
    conteudo TEXT NOT NULL,
    fundamentacao TEXT,
    gatilho VARCHAR(200),
    custo_inicio VARCHAR(200),
    ambiente VARCHAR(200),
    status VARCHAR(50) DEFAULT 'ativa',
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR PRIMARY KEY NOT NULL,
    estrategia_id VARCHAR NOT NULL REFERENCES estrategias(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    resultado_percebido VARCHAR(50) NOT NULL,
    dificuldades TEXT,
    analise_ia TEXT,
    decisao_ia VARCHAR(50),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estados_conversa (
    habito_id VARCHAR PRIMARY KEY NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    etapa VARCHAR(30) NOT NULL DEFAULT 'periodo',
    status VARCHAR(20) NOT NULL DEFAULT 'ativa',
    respostas TEXT NOT NULL DEFAULT '{}',
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anotacoes_habito (
    habito_id VARCHAR PRIMARY KEY NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    gatilho TEXT NOT NULL DEFAULT '',
    custo_inicio TEXT NOT NULL DEFAULT '',
    ambiente TEXT NOT NULL DEFAULT '',
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decisoes_feedback (
    feedback_id VARCHAR PRIMARY KEY NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    decisao VARCHAR(20) NOT NULL CHECK (decisao IN ('aceitar', 'recusar', 'modificar')),
    ajuste_personalizado TEXT,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
