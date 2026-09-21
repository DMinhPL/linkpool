# Linkwarden — Local Dev Onboarding

This guide gets a fresh clone of this monorepo running locally on your machine (web app + worker), using your own Postgres and Docker for Meilisearch.

## 1. Prerequisites

- Node.js (v20+ recommended; this repo builds/runs on v24 too)
- Yarn (managed via Corepack, project pins `yarn@4.12.0` — just run `corepack enable` if you don't already have it)
- Docker Desktop (for Meilisearch, and optionally Postgres)
- A PostgreSQL instance — either your own local install (e.g. via pgAdmin) or the one in `docker-compose.yml`

## 2. Clone & configure environment variables

```bash
git clone <repo-url>
cd linkwarden
cp .env.sample .env
```

Edit `.env` and fill in at minimum:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | `postgresql://<user>:<password>@<host>:5432/<database>` — point this at your own Postgres or the Dockerized one |
| `POSTGRES_PASSWORD` | Only needed if using the Docker Postgres from `docker-compose.yml` |
| `NEXTAUTH_SECRET` | Random secret, e.g. generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `MEILI_MASTER_KEY` | Random secret, same method as above |

If your `DATABASE_URL` points at a brand-new database, make sure that database already exists (create it manually — Prisma migrations create tables, not the database itself).

## 3. Start supporting services

Meilisearch always runs via Docker:

```bash
docker compose up -d meilisearch
```

If you're using the bundled Postgres instead of your own local instance:

```bash
docker compose up -d postgres
```
(Skip this if you're pointing `DATABASE_URL` at your own local Postgres — don't run both, they'll fight over port 5432.)

## 4. Install dependencies

```bash
yarn install
```

This also runs `postinstall`, which includes `patch-package` and the web app's own postinstall step.

> **Known gotcha:** the `prisma` package's postinstall step (which downloads the native query engine binary) can silently fail without failing the whole `yarn install`. If you later hit `PrismaClientInitializationError: Prisma Client could not locate the Query Engine`, force a rebuild with:
> ```bash
> yarn rebuild prisma
> yarn prisma:generate
> ```

> **Also watch for:** don't add `@prisma/client` or `prisma` as dependencies in the **root** `package.json` — the schema and the generated client belong to `packages/prisma` (currently pinned to `^6.10.1`). A stray root-level copy at a different version creates a second, ungenerated `@prisma/client` that `@auth/prisma-adapter` can accidentally resolve to instead, causing the same query-engine error.

## 5. Set up the database

```bash
yarn prisma:generate   # generates the Prisma client
yarn prisma:dev        # runs migrations against DATABASE_URL
```

## 6. Run the app

Native dev (hot reload, fastest iteration):

```bash
yarn concurrently:dev
```

This starts the Next.js web app and the background worker together. Web app is served at **http://localhost:3000**.

Individually, if you only need one:

```bash
yarn web:dev
yarn worker:dev
```

Alternatively, full Docker (closer to production, slower iteration):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## 7. First run

Open http://localhost:3000/login and create your first account — there's no seed data by default.

## Useful scripts reference

| Command | Purpose |
|---|---|
| `yarn concurrently:dev` | Run web + worker together, dev mode |
| `yarn web:dev` / `yarn worker:dev` | Run just one of them |
| `yarn prisma:generate` | Regenerate Prisma client after schema changes |
| `yarn prisma:dev` | Create/apply a new migration in dev |
| `yarn prisma:studio` | Open Prisma Studio to browse the DB |
| `yarn test` / `yarn coverage` | Run the Vitest test suite |
| `yarn format` | Run formatting across workspaces |
