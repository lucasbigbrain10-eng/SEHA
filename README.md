# SEHA — executar localmente

O SEHA usa um backend FastAPI, um frontend Next.js e SQLite local. As sugestões de hábitos são calculadas por regras locais e não exigem chave de IA.

## Pré-requisitos

- Python 3.10 ou superior
- Node.js 20.9 ou superior

## Iniciar o backend

Abra um terminal PowerShell na pasta do projeto e execute:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

O backend ficará disponível em `http://localhost:8000`; a documentação interativa da API fica em `http://localhost:8000/docs`. O banco SQLite é criado em `backend/seha.db`.

Opcionalmente, copie o exemplo de ambiente para `backend/.env` (`Copy-Item ..\.env.example .env` dentro de `backend`). A aplicação local também inicia com os valores padrão e não precisa de uma chave externa de IA.

## Iniciar o frontend

Abra um segundo terminal PowerShell e execute:

```powershell
cd frontend
npm ci
npm run dev
```

Abra `http://localhost:3000` no navegador. O frontend usa `http://localhost:8000` como endereço padrão da API.

Para definir a URL manualmente, copie `frontend/.env.example` para `frontend/.env.local` antes de iniciar o Next.js.

## Verificações

Para rodar os testes locais do backend:

```powershell
cd backend
python -m unittest test_flow -v
```

Para verificar o frontend:

```powershell
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

## Banco e publicação

O banco usado pelo projeto e testado localmente é SQLite. O schema está em `database/schema.sql`; a atualização incremental está em `database/migrations/001_notes_and_feedback_decisions.sql`. O backend cria tabelas ausentes no startup. Para PostgreSQL gerenciado, configure `DATABASE_URL` com o driver `postgresql+psycopg` e `sslmode=require`.

`render.yaml` prepara o backend para Render. A publicação do frontend deve usar Vercel com a pasta `frontend` como diretório do projeto e `NEXT_PUBLIC_API_URL` apontando para a API HTTPS. O banco precisa ser PostgreSQL externo persistente; não use o SQLite local em serviço com filesystem efêmero.
