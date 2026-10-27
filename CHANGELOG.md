# Changelog

Alterações relevantes desta finalização do MVP. Não há histórico Git neste diretório; as datas de commit e autores não são inferidos.

## Não publicado — 2026-10-27

### Atualização de segurança Next.js

- Atualizados `next` e `eslint-config-next` de `16.4.0` para `16.4.1`, permanecendo na versão principal 16, conforme correção oficial para a vulnerabilidade GHSA-673q-mjm6-r5xr.
- Atualizada a dependência transitiva `zod` para `4.6.7` após o npm audit apontar a versão anterior vulnerável; nenhuma dependência direta foi removida.
- `npm audit` — 0 vulnerabilidades.
- Revalidação após a atualização: 8 testes backend aprovados; TypeScript, ESLint e build de produção aprovados.

### Adicionado

- Especificação de requisitos, arquitetura, modelo de dados, configuração local e plano de publicação em `spec.md`.
- Exemplos de variáveis de ambiente, regras de exclusão do Git e configuração de serviço Render em `/.env.example`, `/frontend/.env.example`, `/.gitignore` e `/render.yaml`.
- Schema SQL SQLite e migração incremental para notas e decisões de feedback em `/database`.
- Persistência de notas livres por hábito e registro de decisão do usuário sobre sugestões de ajuste.
- Diagnóstico local baseado em categorias explícitas; sugere hipótese cautelosa e não altera a estratégia sem decisão do usuário.
- Endpoint `/health` para verificação de disponibilidade.
- Suporte de conexão PostgreSQL via driver psycopg.

### Alterado

- Interface simplificada para mostrar hipóteses/sugestões locais e permitir aceitar, recusar ou modificar o ajuste.
- Conteúdo informativo revisado para evitar estatísticas ou garantias de eficácia sem suporte.
- Autenticação e configuração de CORS passaram a usar variáveis de ambiente; em produção, a chave JWT deve ter ao menos 32 caracteres.
- README atualizado com inicialização local e orientação de implantação.

### Verificação

- `python -m unittest test_flow -v` — 8 testes aprovados.
- `npx tsc --noEmit` — aprovado.
- `npm run lint` — aprovado.
- `npm run build` compilou o código, verificou tipos e gerou páginas, mas encerrou com bloqueio de segurança do próprio Next.js: a versão instalada `16.4.0` foi identificada como vulnerável. Não foi atualizada, pois a atualização exige decisão do proprietário do projeto.
- Publicação, criação de repositório remoto e convite a `rafaelpitwak` não realizados: não há remoto Git nem conexão/credenciais das contas de hospedagem disponíveis.
