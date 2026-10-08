# PreciDoc by Rainc — full source code

Source export of the latest deployed website, dated 8 October 2026.

The application uses React 19, TypeScript, Vinext/Vite, Cloudflare Workers, and Cloudflare D1. Vinext provides the Next.js App Router APIs used by the source. This project is configured for the Cloudflare runtime.

## Included features

- English and Indonesian interface, plus light and graphite themes.
- Interactive product demo on the landing page.
- `/sample`: a basic workspace with a built-in example. Replace the example with one PDF, DOCX, TXT, or Markdown file. Trial limits: one active document, 5 MB, 20 PDF pages, and 100,000 extracted characters. Edit text, inspect chunks, review, and download Markdown.
- `/register`: ChatGPT identity sign-in followed by PreciDoc account registration.
- `/app`: server-protected full workspace. Limits: 10 documents per tab, 5 files per upload batch, 15 MB per file, 200 PDF pages, and 750,000 extracted characters per file. Metadata, chunk size, deduplication, and JSON/Markdown export controls are enabled.
- `/api/account`: validates registration and stores the account in D1.
- Source references, manual edits, rule checks, and manual review before export.

Uploaded documents are processed in browser memory. Accounts persist, but uploaded documents and edits do not survive a reload or navigation away from the workspace. Download your result first. OCR, LLM processing, embeddings, and knowledge-base connectors are not implemented.

## Run locally

Use Node.js 24 or newer and pnpm 11.25.0, as declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm exec wrangler d1 execute site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_thin_excalibur.sql
pnpm dev
```

Open `http://localhost:5173`, using the actual port printed by the server if it differs. Open `/sample` to try the one-document workspace. The SQL command initializes the local account table; it does not write to the deployed database.

The local development server emulates ChatGPT sign-in on loopback addresses. Choosing **Continue with ChatGPT** signs in as the development identity `seedy@sites.test`, then allows you to register locally. This is a development-only identity, not a real ChatGPT OAuth session. Use `localhost` or `127.0.0.1`; the local sign-in middleware rejects non-loopback hosts.

The archive does not contain `node_modules`, generated build output, local database contents, environment credentials, or Git history. Install the dependencies before running it. The original checkout's managed execution profile is intentionally excluded; a fresh extraction uses the portable development profile.

## Verify the code

Run these commands from the project root:

```sh
pnpm test
node node_modules/typescript/bin/tsc --noEmit --incremental false
node tests/verify-account.cjs
node tests/verify-trial.cjs
pnpm build
```

The document tests use real PDF/DOCX fixtures and cover extraction, trial boundaries, source edits, duplicate provenance, and export. Account tests use SQLite with simulated trusted identity headers. Trial tests mount the actual React components with a simulated DOM and exercise their handlers. These tests do not perform a live ChatGPT OAuth flow or replace a visual browser review.

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

The deployed version runs on Sites, which supplies production ChatGPT sign-in, sign-out, and verified identity headers. `app/chatgpt-auth.ts` trusts those platform-provided headers, and `db/index.ts` expects the Cloudflare D1 binding `DB`.

For a deployment outside Sites, including `precidoc.rainc.web.id`, configure a real D1 database and apply the migration. You must also provide a production authentication integration and replace the Sites identity helper accordingly. Do not expose an external deployment that accepts user-supplied `oai-authenticated-user-*` headers as verified identity. The loopback sign-in emulation is only for local development.

`.openai/hosting.json` retains the existing Sites project identifier. The generated Worker configuration uses a local placeholder database ID; configure your own production binding rather than deploying that placeholder. Setting a domain alone does not transfer Sites authentication or database bindings.

## Export provenance

Application source comes from commit `7230e4e5c09128501d10965c11830f47620e1846`, the version deployed in this conversation. This export refreshes the README, omits the TypeScript build cache, and includes the account and trial verification scripts used during development. Application code and dependency lockfile are unchanged.
