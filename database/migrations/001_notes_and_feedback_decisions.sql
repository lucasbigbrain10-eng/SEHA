-- Migração incremental e não destrutiva. Compatível com SQLite e PostgreSQL.
-- Execute uma única vez em bancos criados antes da versão local de anotações.
CREATE TABLE IF NOT EXISTS anotacoes_habito (
    habito_id VARCHAR PRIMARY KEY NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    gatilho TEXT NOT NULL DEFAULT '',
    custo_inicio TEXT NOT NULL DEFAULT '',
    ambiente TEXT NOT NULL DEFAULT '',
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decisoes_feedback (
    feedback_id VARCHAR PRIMARY KEY NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
    decisao VARCHAR(20) NOT NULL CHECK (decisao IN ('aceitar', 'recusar', 'modificar')),
    ajuste_personalizado TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Remove apenas estados de sessão sem hábito correspondente; nenhuma outra tabela
-- ou conteúdo de usuário é afetado. O backend também aplica esta limpeza no startup.
DELETE FROM estados_conversa
WHERE NOT EXISTS (SELECT 1 FROM habitos WHERE habitos.id = estados_conversa.habito_id);
