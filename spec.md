# Especificação do SEHA

**Estado da entrega:** MVP local funcional; publicação pública ainda não realizada. A versão atual usa SQLite local por padrão. Não há repositório Git remoto nem projeto Supabase configurado neste diretório.

## 1. Objetivo

O SEHA ajuda uma pessoa a registrar hábitos, organizar o contexto da rotina, experimentar passos práticos e acompanhar relatos de tentativa. As sugestões são determinísticas e executadas no backend; o sistema não usa uma API externa de IA nem interpreta texto livre de forma geral.

## 2. Público-alvo e usuários

- Pessoas que queiram registrar e acompanhar hábitos próprios.
- Cada pessoa cria conta com nome, e-mail e senha. Não existe papel de administrador nem conta de demonstração criada automaticamente.
- O backend identifica a pessoa por token Bearer e valida a propriedade do hábito nas operações de leitura, edição e exclusão.

## 3. Casos de uso e fluxo principal

1. Criar conta ou entrar.
2. Descrever um hábito ou objetivo; algumas expressões amplas acionam regras simples que propõem uma ação para o usuário revisar.
3. Responder às etapas guiadas sobre período, dificuldade e alternativa. A etapa de dificuldades permite várias seleções e “Outro” exige texto.
4. Gerar uma sugestão local e revisar a estratégia do hábito.
5. Preencher, editar e apagar, de modo independente, as notas Gatilho, Custo de início e Ambiente.
6. Registrar tentativas como funcionou, parcial ou não funcionou.
7. Ler a hipótese limitada que corresponde a categorias reconhecidas. Quando as informações não bastam, o sistema diz isso e não recomenda uma mudança automática.
8. Aceitar, recusar ou modificar uma sugestão de ajuste. A estratégia muda somente após uma decisão explícita e a mudança aparece no histórico.
9. Excluir um hábito e seus registros dependentes, sem afetar os outros hábitos.

## 4. Requisitos funcionais

- **RF01** Cadastro, login e consulta do usuário autenticado.
- **RF02** Criar e consultar hábitos do próprio usuário.
- **RF03** Registrar contexto por hábito usando perguntas locais e opções validadas.
- **RF04** Voltar etapas, corrigir respostas, pedir explicação, cancelar e retomar o fluxo guiado.
- **RF05** Gerar uma estratégia por regras locais explícitas.
- **RF06** Manter notas livres e multilinha por hábito nos campos `gatilho`, `custo_inicio` e `ambiente`.
- **RF07** Registrar feedback e uma hipótese de acordo com termos de dificuldade reconhecidos.
- **RF08** Exigir decisão do usuário antes de aplicar uma sugestão; aceitar, recusar e modificar ficam registrados.
- **RF09** Preservar a estratégia anterior no histórico quando um ajuste é aplicado.
- **RF10** Excluir o hábito e contexto, estado guiado, estratégias, feedbacks, decisões e notas dependentes.

## 5. Requisitos não funcionais e critérios de aceite

- O fluxo principal local funciona sem chave de IA.
- Senhas são armazenadas com bcrypt; tokens JWT usam uma chave configurável e a produção exige `SECRET_KEY` com pelo menos 32 caracteres.
- Consultas de dados usam SQLAlchemy e filtram pelo usuário/hábito proprietário.
- O CORS local permite apenas `localhost:3000` e `127.0.0.1:3000` por padrão. Em produção, `CORS_ORIGINS` deve conter apenas a origem HTTPS do frontend.
- SQLite ativa `PRAGMA foreign_keys=ON`; relacionamentos do ORM também excluem dependentes.
- Erros de gravação não são apresentados como sucesso. A interface só confirma após resposta bem-sucedida do backend.
- O layout mantém os cartões responsivos em desktop e telas menores.
- Não há afirmação de que uma regra local compreende linguagem natural nem garantia universal de eficácia.

## 6. Arquitetura e decisões técnicas

| Camada | Tecnologia e papel |
|---|---|
| Interface | Next.js App Router, React, TypeScript e Tailwind CSS. |
| API | FastAPI com autenticação Bearer JWT e regras determinísticas em `backend/app/habit_rules.py`. |
| Persistência | SQLAlchemy. SQLite é o padrão local; o driver `psycopg` permite URL PostgreSQL em serviço gerenciado. |
| IA externa | Não existe integração, cliente, variável ou chave necessária para o fluxo. |

O repositório não contém configuração, cliente, tabelas ou políticas do Supabase. É possível apontar SQLAlchemy a um PostgreSQL do Supabase usando a URL de conexão apropriada, mas esse projeto Supabase ainda precisa ser criado e configurado por seu proprietário. O backend é a camada de autorização; o navegador não se conecta diretamente ao banco.

## 7. Modelo de dados

| Tabela | Campos principais | Relações |
|---|---|---|
| `usuarios` | `id`, `nome`, `email`, `senha_hash`, `criado_em` | Um usuário tem vários hábitos. |
| `habitos` | `id`, `usuario_id`, `titulo`, `objetivo`, `status`, `criado_em` | Pertence a um usuário; agrega contexto, estratégia, estado guiado e uma anotação. |
| `contextos` | `id`, `habito_id`, `categoria`, `conteudo`, `origem`, `criado_em` | Pertence a um hábito. |
| `estrategias` | `id`, `habito_id`, `versao`, `conteudo`, `fundamentacao`, `gatilho`, `custo_inicio`, `ambiente`, `status`, `criado_em` | Pertence a um hábito; pode ter feedbacks. |
| `feedbacks` | `id`, `estrategia_id`, `descricao`, `resultado_percebido`, `dificuldades`, `analise_ia`, `decisao_ia`, `criado_em` | Pertence à estratégia. `analise_ia` e `decisao_ia` são nomes legados do schema, usados para saída de regra local; não significam chamada a IA. |
| `estados_conversa` | `habito_id`, `etapa`, `status`, `respostas`, `atualizado_em` | Estado único do fluxo guiado do hábito. |
| `anotacoes_habito` | `habito_id`, `gatilho`, `custo_inicio`, `ambiente`, `atualizado_em` | Uma linha por hábito; os campos podem ficar vazios. |
| `decisoes_feedback` | `feedback_id`, `decisao`, `ajuste_personalizado`, `criado_em` | Uma decisão por feedback; ação limitada a `aceitar`, `recusar` ou `modificar`. |

As chaves estrangeiras dependentes usam `ON DELETE CASCADE`. A rota de exclusão também valida o usuário proprietário antes de remover o hábito.

## 8. Banco, schema e migrações

- SGBD local: SQLite do Python instalado. O caminho padrão é `backend/seha.db`, relativo ao diretório corrente do backend.
- Schema de criação local: `database/schema.sql` (SQLite).
- Migração incremental: `database/migrations/001_notes_and_feedback_decisions.sql` cria as duas tabelas adicionadas e remove somente estados de conversa sem hábito correspondente.
- O backend executa `Base.metadata.create_all()` na inicialização e aplica a mesma limpeza segura de estados órfãos. `create_all` cria tabelas ausentes, mas não substitui um sistema de versionamento para alterações futuras de colunas.
- Não há dados iniciais obrigatórios nem conta de teste. A primeira pessoa cria a conta em `/cadastro`.
- Para SQLite já existente, inicialize o backend com a nova versão; as tabelas ausentes serão criadas sem apagar dados. A limpeza órfã afeta somente `estados_conversa` que não tenham `habitos.id` correspondente.
- Para PostgreSQL vazio, configure `DATABASE_URL` e inicialize o backend para criar as tabelas. A migração incremental pode ser aplicada ao banco legado. Não execute `database/schema.sql` de SQLite no PostgreSQL.

Criar o SQLite manualmente pela raiz do projeto:

```powershell
python -c "import sqlite3; db=sqlite3.connect('backend/seha.db'); db.executescript(open('database/schema.sql', encoding='utf-8').read()); db.close()"
```

## 9. Ambiente de instalação

Ambiente verificado nesta estação: Windows, Python 3.13.1, Node.js 22.22.0 e npm 10.9.4. O projeto declara compatibilidade com Python 3.10+ e Next.js exige Node.js 20.9+.

Dependências backend estão em `backend/requirements.txt`; frontend usa `frontend/package-lock.json`. Os comandos abaixo são para PowerShell e uma cópia local. Não há URL de clone a informar porque não existe repositório remoto configurado.

1. Instale Python 3.10+ e Node.js 20.9+.
2. Após o proprietário fornecer a URL real do GitHub, clone o repositório:

   ```powershell
   git clone <URL_REAL_DO_REPOSITORIO>
   cd SEHA
   ```

3. Instale e inicie o backend em um terminal:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   Copy-Item ..\.env.example .env
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
   ```

   A API fica em `http://localhost:8000`, documentação interativa em `http://localhost:8000/docs` e verificação de saúde em `http://localhost:8000/health`.

4. Em outro terminal, instale e inicie o frontend:

   ```powershell
   cd frontend
   npm ci
   Copy-Item .env.example .env.local
   npm run dev
   ```

5. Acesse `http://localhost:3000`, crie uma conta fictícia e siga o fluxo principal. O SQLite é criado no diretório `backend` quando o backend inicia. Não é preciso inserir credenciais pessoais nem uma chave de IA.

## 10. Variáveis de ambiente

O backend lê entradas simples `CHAVE=VALOR` de `backend/.env`; variáveis do processo têm precedência. Em serviços hospedados, configure-as no painel do provedor.

| Variável | Uso | Como obter/preencher | Serviço |
|---|---|---|---|
| `APP_ENV` | `development` local ou `production` hospedado. | Definida pelo responsável pelo deploy. | Backend |
| `SECRET_KEY` | Assina tokens JWT. Obrigatória em produção, mínimo 32 caracteres. | Gere um segredo novo no ambiente de produção, por exemplo com `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Nunca use o valor fictício do exemplo em produção. | Backend |
| `DATABASE_URL` | Conexão do banco. | Padrão local `sqlite:///./seha.db`; para PostgreSQL, obtenha uma connection string e use `postgresql+psycopg://...?...sslmode=require`. | Backend/banco |
| `CORS_ORIGINS` | Lista separada por vírgulas de origens frontend autorizadas. | Local: origens localhost do exemplo. Produção: URL HTTPS exata do frontend. | Backend |
| `NEXT_PUBLIC_API_URL` | URL base da API utilizada pelo browser. Não é secreta. | Local `http://localhost:8000`; produção: URL HTTPS pública do backend. | Frontend |

Não há chave de IA, chave Supabase frontend ou credencial real incluída nos exemplos. Nunca exponha `DATABASE_URL` ou `SECRET_KEY` com prefixo `NEXT_PUBLIC_`.

## 11. Roteiro de teste manual

1. Cadastre uma conta fictícia e saia/entre novamente.
2. Crie um hábito e complete o fluxo de período, dificuldades e alternativa.
3. Atualize a página do fluxo antes de terminar; o backend deve restaurar a etapa atual. Teste voltar, cancelar e retomar.
4. Gere a sugestão. Na tela do hábito, salve uma nota em cada cartão, atualize a página e confira a persistência; apague apenas uma delas e confira que as outras continuam.
5. Registre feedback positivo e confirme que a estratégia não muda sozinha.
6. Registre feedback parcial/negativo com uma categoria conhecida e verifique hipótese e sugestão; aceite, recuse e modifique em feedbacks separados.
7. Registre feedback sem detalhes ou com texto fora das categorias; deve indicar falta de informação e não propor um ajuste automático.
8. Crie dois hábitos e duas contas; confira que notas e operações só aparecem para o proprietário.
9. Exclua um hábito e confirme que os registros dependentes dele saíram e que o segundo hábito continua.

Testes automatizados backend: `cd backend; python -m unittest test_flow -v`. Frontend: `cd frontend; npx tsc --noEmit`, `npm run lint`, `npm run build`.

## 12. Diagnóstico local e limites

Regras de diagnóstico estão em `backend/app/habit_rules.py`. A regra classifica termos de esquecimento, tempo/agenda, energia/cansaço, distração/ambiente/material e início/motivação/complexidade. Essas correspondências produzem hipóteses em linguagem cautelosa e uma sugestão candidata. Texto que não corresponde a uma regra ou falta de detalhe resulta em “dados insuficientes”; nenhuma estratégia muda até o usuário escolher uma ação. A sugestão de feedback está disponível para aceitar/recusar/modificar uma vez por feedback. Ajustes manuais continuam disponíveis.

O classificador não compreende sinônimos arbitrários, não diagnostica condições clínicas e não mede eficácia. O campo de estratégia e a decisão devem ser avaliados pelo usuário.

## 13. Publicação gratuita preparada, mas não realizada

Configuração preparada: frontend Next.js em Vercel Hobby, backend FastAPI em Render Free e PostgreSQL do Supabase Free usando `DATABASE_URL`. Essa opção precisa ser confirmada pelo proprietário e exige contas, variáveis e um repositório remoto. A URL pública ainda não existe.

- Vercel Hobby é destinado a projetos pessoais/não comerciais e tem limites de uso. Ver [Hobby plan](https://vercel.com/docs/plans/hobby).
- Render Free suspende web services após 15 minutos sem tráfego e o primeiro acesso após suspensão pode levar cerca de um minuto. Seu filesystem é efêmero; por isso o SQLite local não é adequado para guardar dados publicados. Ver [Free Render services](https://render.com/docs/free).
- Supabase Free disponibiliza PostgreSQL com 500 MB no plano descrito pela documentação e pode pausar projetos com pouca atividade por uma semana. Ver [Supabase Free PostgreSQL](https://supabase.com/kb/faqs/platform/free-postgres-for-side-projects) e [pausa por inatividade](https://supabase.com/docs/guides/platform/free-project-pausing).

Etapas restantes: criar um repositório GitHub real; criar/configurar um projeto PostgreSQL Supabase; aplicar o schema pelo startup/migração; publicar API pelo blueprint `render.yaml`; setar segredo, URL PostgreSQL e CORS no Render; publicar `frontend` na Vercel com `NEXT_PUBLIC_API_URL`; atualizar ambos com as URLs HTTPS; testar cadastro, login, notas, feedback e exclusão pela URL pública. A publicação precisa aguardar a resolução do bloqueio de segurança do Next.js descrito no Changelog.

## 14. Segurança e revisão

- Senhas têm hash bcrypt e o token JWT tem validade configurada no backend.
- Produção recusa iniciar sem `SECRET_KEY` de ao menos 32 caracteres.
- API verifica proprietário nos endpoints do hábito; não há acesso direto ao banco no frontend.
- CORS não usa wildcard por padrão.
- ORM parametriza consultas; esquemas Pydantic validam entrada.
- Há cascatas no modelo; SQLite ativa suporte a foreign keys. A exclusão verifica propriedade antes de chamar `db.delete`.
- Sem projeto Supabase configurado, não há políticas RLS para afirmar ou auditar. Se o banco for configurado em Supabase, mantenha-o acessível somente pelo backend e nunca inclua credencial de banco no frontend.
- A pasta atual não contém `.git`; por isso não foi possível inspecionar histórico, verificar arquivos .env rastreados ou girar segredos de commits passados. `.gitignore` foi adicionado para impedir versionamento futuro de ambientes, banco SQLite e caches.
- A apostila/Anexo B não foi encontrado nos arquivos disponíveis; o checklist acima cobre verificações técnicas visíveis, mas a conferência do anexo acadêmico segue pendente.
- Não foi feita revisão humana formal das alterações de código nesta etapa.

## 15. Limitações conhecidas

- Não existe remoto Git, URL pública, publicação concluída ou convite confirmado ao usuário `rafaelpitwak`.
- O build Next.js compila o código, verifica TypeScript e gera páginas, mas termina com um bloqueio do próprio Next.js informando que a versão instalada `16.4.0` está afetada por uma vulnerabilidade conhecida. A atualização precisa ser aprovada e validada antes do deploy.
- A conta Supabase/Render/Vercel, URLs e connection string não foram fornecidas nesta pasta.
- O teste de instalação limpa não pode ser totalmente reproduzido sem clone remoto; foi verificado neste Windows com dependências já presentes. `npm ci`/instalação de requirements em ambiente novo ainda requerem acesso ao registry.
