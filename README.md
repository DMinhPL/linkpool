<div align="center">
  <h1>LinkPool</h1>
  <p>A self-hosted home for collecting, organizing, and preserving useful links.</p>

  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE.md)
  [![Built on Linkwarden](https://img.shields.io/badge/built%20on-Linkwarden-5b5bd6)](https://github.com/linkwarden/linkwarden)
</div>

## About

LinkPool is built on top of [Linkwarden](https://github.com/linkwarden/linkwarden), the open-source collaborative bookmark manager and web-archiving platform.

It provides a single place to save, search, organize, and revisit webpages while preserving copies of their content. LinkPool currently retains Linkwarden's workspace package names and core architecture so that upstream improvements can be adopted more easily.

> [!IMPORTANT]
> LinkPool is an independent project and is not affiliated with or endorsed by the Linkwarden project. For the original project, its hosted service, and upstream documentation, visit [linkwarden.app](https://linkwarden.app) and [docs.linkwarden.app](https://docs.linkwarden.app).

## Features

- Save and organize links with collections, subcollections, descriptions, and tags
- Preserve webpages as screenshots, PDFs, readable text, and single-file HTML
- Search, filter, and sort saved content
- Highlight and annotate archived articles
- Share collections and collaborate with other users
- Subscribe to RSS feeds
- Import files and bookmarks
- Use optional AI-assisted tagging
- Configure SSO and other authentication providers
- Run entirely on your own infrastructure

Most of these capabilities come from Linkwarden. LinkPool-specific behavior and changes will be documented here as the project evolves.

## Getting started

### Prerequisites

- Node.js 20 or newer
- [Corepack](https://nodejs.org/api/corepack.html) with Yarn 4
- Docker Desktop
- PostgreSQL, either local or containerized

### Local development

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/DMinhPL/linkpool.git
   cd linkpool
   ```

2. Create your local environment file:

   ```bash
   cp .env.sample .env
   ```

3. Set at least `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `MEILI_MASTER_KEY` in `.env`.

4. Start Meilisearch and, if needed, the bundled PostgreSQL service:

   ```bash
   docker compose up -d meilisearch
   docker compose up -d postgres
   ```

5. Install dependencies and prepare the database:

   ```bash
   corepack enable
   yarn install
   yarn prisma:generate
   yarn prisma:dev
   ```

6. Start the web application and background worker:

   ```bash
   yarn concurrently:dev
   ```

Open [http://localhost:3000](http://localhost:3000) and create your first account. See [ONBOARDING.md](./ONBOARDING.md) for detailed setup notes and troubleshooting.

### Docker

`docker-compose.yml` is the shared base for the web app, Redis, and Meilisearch. For the supported VPS deployment flow, use the GHCR instructions below.

**Development** — pulls the upstream image as-is:

```bash
docker compose up -d
```

To instead build and run this repository's local source (heavier — compiles the Rust `monolith` binary and installs headless Chromium):

```bash
yarn docker:build
# equivalent to: docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Production** — uses `.env.production` for both container env vars and `${...}` substitution in the compose files, and sets `restart: always`:

> [!NOTE]
> For VPS production deployments, use the GHCR workflow below. The command in this block is retained only for building or running a locally available image.

```bash
yarn docker:prod
# equivalent to: docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`.env.production` should never be committed — keep it local or deploy it out-of-band to the server.

### Recommended production deployment: GHCR + VPS

Build and publish the application image from your local machine, then have the VPS pull that image. The VPS does not need the repository source code or a Docker build toolchain.

#### 1. Build and push from your local machine

Create a GitHub personal access token with the `write:packages` permission, then authenticate Docker once:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u DMinhPL --password-stdin
```

Build and push both an immutable Git-based tag and `latest`:

```bash
IMAGE_TAG=$(git rev-parse --short HEAD)
docker build \
  -t ghcr.io/dminhpl/linkpool:$IMAGE_TAG \
  -t ghcr.io/dminhpl/linkpool:latest \
  .
docker push ghcr.io/dminhpl/linkpool:$IMAGE_TAG
docker push ghcr.io/dminhpl/linkpool:latest
```

#### 2. Configure the VPS

Copy `docker-compose.yml`, `docker-compose.prod.yml`, `deploy.sh`, and `.env.production` to the VPS. Configure at least:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://redis:6379
URL_PORT=3000
```

`redis` is the private Docker Compose service name. Do not publish port `6379` to the internet.

If the GHCR package is private, log Docker in on the VPS once with a token that has `read:packages`:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u DMinhPL --password-stdin
```

#### 3. Pull and run on the VPS

```bash
chmod +x deploy.sh
./deploy.sh
```

`deploy.sh` pulls `ghcr.io/dminhpl/linkpool:latest`, starts the web app, Redis-backed worker, Redis, and Meilisearch, then prints the service status. After publishing an updated local image, run `./deploy.sh` again on the VPS.

## Useful commands

| Command | Purpose |
| --- | --- |
| `yarn concurrently:dev` | Run the web app and worker in development mode |
| `yarn web:dev` | Run only the web app |
| `yarn worker:dev` | Run only the background worker |
| `yarn web:build` | Create a production web build |
| `yarn prisma:generate` | Generate the Prisma client |
| `yarn prisma:dev` | Apply or create development migrations |
| `yarn prisma:studio` | Browse the database with Prisma Studio |
| `yarn test` | Run the test suite |
| `yarn coverage` | Run tests with coverage |
| `yarn format` | Format all workspaces |

## Project structure

```text
apps/
  web/        Next.js web application
  worker/     Background processing and web preservation
  mobile/     Mobile application
  extension/  Browser extension
packages/
  prisma/     Database schema, migrations, and generated client
  router/     Shared application routes
  lib/        Shared business and infrastructure utilities
  types/      Shared TypeScript types
```

## Upstream

LinkPool owes its foundation to Linkwarden and its contributors. When reporting an issue or proposing a change, please first determine whether it is specific to LinkPool or also applies to upstream Linkwarden:

- LinkPool repository: [DMinhPL/linkpool](https://github.com/DMinhPL/linkpool)
- Linkwarden source: [linkwarden/linkwarden](https://github.com/linkwarden/linkwarden)
- Linkwarden documentation: [docs.linkwarden.app](https://docs.linkwarden.app)

Please keep the upstream attribution and license notices intact when redistributing this project.

## License

LinkPool is distributed under the [GNU Affero General Public License v3.0](./LICENSE.md), consistent with its Linkwarden foundation.
