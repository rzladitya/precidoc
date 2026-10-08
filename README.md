# Precidoc by Rainc — full source code

Source export of the latest deployed website, dated 8 October 2026.

The application uses React 19, TypeScript, Next.js, OpenNext for Cloudflare Workers, Neon Postgres, and Neon Auth. Deployment instructions are in [docs/DEPLOY.md](docs/DEPLOY.md).

## Included features

- English and Indonesian interface, plus light and graphite themes.
- Interactive product demo on the landing page.
- `/sample`: a basic workspace with a built-in example. Replace the example with one PDF, DOCX, TXT, or Markdown file. Trial limits: one active document, 5 MB, 20 PDF pages, and 100,000 extracted characters. Edit text, inspect chunks, review, and download Markdown.
- `/register`: Email/password sign-in through Neon Auth followed by Precidoc account registration.
- `/app`: server-protected full workspace. Limits: 10 documents per tab, 5 files per upload batch, 15 MB per file, 200 PDF pages, and 750,000 extracted characters per file. Metadata, chunk size, deduplication, and JSON/Markdown export controls are enabled.
- `/api/account`: validates registration and stores the account in Neon Postgres.
- Source references, manual edits, rule checks, and manual review before export.

Uploaded documents are processed in browser memory. Accounts persist, but uploaded documents and edits do not survive a reload or navigation away from the workspace. Download your result first. OCR, LLM processing, embeddings, and knowledge-base connectors are not implemented.

## Run locally

Use Node.js 24 and pnpm 11.25.0. Configure `DATABASE_URL`,
`NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET` securely in ignored
`.env.local`, then run:

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

The dev server uses port 3000. `/sample` works without login. Account registration
requires a verified Neon Auth session and an initialized Postgres account table.
See [deployment instructions](docs/DEPLOY.md) for Neon project configuration,
Cloudflare secrets, domain attachment, and Worker preview.

## Verify the code

Run these commands from the project root:

```sh
pnpm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
node tests/verify-account.cjs
node tests/verify-trial.cjs
pnpm build:worker
```

The document tests use real PDF/DOCX fixtures and cover extraction, trial boundaries, source edits, duplicate provenance, and export. Account tests use SQLite as a local adapter for parameterized SQL templates and simulate verified Neon sessions. Trial tests mount the actual React components with a simulated DOM and exercise their handlers. These tests do not perform a live Email/password authentication flow or replace a visual browser review.

The PDF.js worker, CMaps, standard fonts, and their bundled licenses are included under `public/`. Update those assets together when changing the PDF.js version.

## Project structure

| Path | Purpose |
| --- | --- |
| `app/` | Routes, API, page styles, and authentication helpers |
| `components/` | Landing demo, trial/full workspace, registration, and UI components |
| `lib/` | Document extraction, chunking, export, translation, and limits |
| `db/` | Account schema and prepared database queries |
| `drizzle/` | Account migration and schema metadata |
| `public/` | Static assets and browser PDF.js assets |
| `tests/` | Document, account, and trial verification |
| `build/`, `scripts/` | Runtime and build integrations |

## Hosting and authentication

Production target: Cloudflare Worker `precidoc`, custom domain
`precidoc.rainc.web.id`, Neon project `summer-heart-72880858`, branch `production`.
`neon.ts` declares Neon Auth. It must be linked and deployed using authorized Neon
access; the app also requires its account-table migration and Worker secrets.

Account APIs enforce session identity and reject cross-origin registration.
Sites identity headers and development ChatGPT sign-in are no longer used.
Uploaded documents remain in browser memory and are not saved in Postgres.
The retained Sites/Vinext integration files and D1 example/migration are from the
original source export; active scripts use Next.js/OpenNext and Neon.

## Export provenance

Application source comes from commit `7230e4e5c09128501d10965c11830f47620e1846`, the version deployed in this conversation. This export refreshes the README, omits the TypeScript build cache, and includes the account and trial verification scripts used during development. The current repository now includes the Neon database/authentication and Cloudflare OpenNext migration described above.
