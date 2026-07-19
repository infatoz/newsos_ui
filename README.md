# NewsPortal frontend (Next.js 16)

Headless news UI for the Enterprise News Manager + WPGraphQL stack.

## Prerequisites

- Node.js 22+
- WordPress with WPGraphQL + Enterprise News Manager (Laragon or Docker)
- GraphQL reachable at your `NEXT_PUBLIC_GRAPHQL_ENDPOINT`

## Get started

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Minimal `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost/graphql
NEXT_PUBLIC_SITE_NAME=NewsPortal
PREVIEW_SECRET=local-preview-secret
REVALIDATE_SECRET=local-revalidate-secret
```

Full variable reference: [../docs/ENVIRONMENT.md](../docs/ENVIRONMENT.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build (`output: "standalone"` for Docker) |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run codegen` | GraphQL Code Generator |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright e2e |

## Docker

```bash
docker compose up --build
# with Redis:
docker compose --profile cache up --build
```

See `Dockerfile`, `docker/nginx.conf`, and monorepo [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md).

## Project map

- `src/app` — App Router pages & API routes
- `src/graphql` — queries, mutations, fragments
- `src/services` — data fetching + ISR tags
- `src/seo` — metadata & JSON-LD
- `src/components` — atoms / molecules / organisms

Monorepo docs: [../docs/](../docs/) · Architecture: [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).
