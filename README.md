# Sistema de Gerenciamento de Banco de Horas

Monorepo TypeScript com backend Express + Prisma + JWT (cookies HttpOnly) e frontend React + Vite + Tailwind.

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com) com projeto PostgreSQL

## Configuração

1. **Instalar dependências**

```bash
npm install
```

2. **Configurar variáveis de ambiente**

```bash
cp .env.example .env
```

Edite `.env` e preencha:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Supabase (**Connect → Direct → Session pooler**, porta 5432). Necessário em redes IPv4. |
| `JWT_ACCESS_SECRET` | Segredo para access token (mín. 32 caracteres) |
| `JWT_REFRESH_SECRET` | Segredo para refresh token (mín. 32 caracteres) |
| `ADMIN_EMAIL` | E-mail do administrador inicial |
| `ADMIN_PASSWORD` | Senha do administrador inicial |

3. **Migrar banco e seed**

```bash
npm run db:migrate
npm run db:seed
```

4. **Iniciar em desenvolvimento**

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia server + client em paralelo |
| `npm run dev:server` | Apenas backend |
| `npm run dev:client` | Apenas frontend |
| `npm run build` | Build de produção (server + client) |
| `npm run db:migrate` | Executa migrations Prisma |
| `npm run db:seed` | Cria usuário admin (idempotente) |

## Fluxo da aplicação

1. Admin faz login com credenciais do seed
2. Usuários se cadastram em `/register` (status PENDING)
3. Admin aprova usuários em **Gestão de Usuários**
4. Usuários criam lançamentos de horas (positivos ou negativos)
5. Admin aprova/rejeita lançamentos
6. Saldo = soma dos lançamentos **APPROVED**
7. Admin exporta CSV por usuário ou de todos

## Supabase DATABASE_URL

No painel Supabase: **Connect → Direct → Session pooler** (porta 5432)

> Se aparecer *"Not IPv4 compatible"*, **não use** o host `db.xxx.supabase.co`. Use o **Session pooler** — a conexão direct falha com erro `P1001` em redes IPv4 (comum no Windows).

Exemplo (projeto em `us-west-2` — confira o host exato em **Connect → Pooler settings**; pode ser `aws-0` ou `aws-1`):

```
DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-us-west-2.pooler.supabase.com:5432/postgres
```

- **Session pooler (5432):** migrations (`db:migrate`), seed e runtime em dev
- **Transaction pooler (6543):** não use para `prisma migrate dev`

O script `db:migrate` sincroniza o `.env` da raiz para `server/.env` automaticamente.

## Estrutura

```
├── server/          # Express API
├── client/          # React SPA
├── .env.example
└── package.json     # npm workspaces
```
