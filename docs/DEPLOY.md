# Precidoc: Neon + Cloudflare Workers

The app uses Next.js, OpenNext for Workers, Neon Postgres for account profiles,
and Neon Auth for Google/email sessions. Uploaded documents still stay in browser
memory; this change does not implement persistent document storage or billing.

## Prerequisites

- Node.js 24 and pnpm 11.25.0.
- Neon project `summer-heart-72880858`, branch `production`.
- Cloudflare account with the `rainc.web.id` zone.
- Neon Auth supported on this project's region, with no IP Allow or Private
  Networking restrictions. Verify these before applying `neon.ts`.
- Cloudflare API token with Workers Scripts Edit and the DNS/zone permissions
  required to attach the custom domain, limited to the intended account/zone.

Secrets belong in secure environment settings and ignored local files, never Git.
CLI access uses `NEON_API_KEY` and `CLOUDFLARE_API_TOKEN`. Set
`CLOUDFLARE_ACCOUNT_ID` to select the intended Cloudflare account.

## Neon setup

Authenticate with `neon login` in a terminal whose browser can reach its callback,
or supply `NEON_API_KEY` securely. From this checkout:

```sh
neon link --project-id summer-heart-72880858 --branch production -y
neon config plan
neon deploy
```

`neon.ts` declares `auth: true` because this app uses Neon Auth. `neon deploy`
configures Neon services and pulls local environment variables; it does not
publish the frontend or run the account-table migration.

Enable email verification and Google/email login on the production branch. Add
`https://precidoc.rainc.web.id` as a trusted Auth origin. Production Google login
needs a Google OAuth app configured in Neon; use the branch Auth callback URL.
Configure production SMTP for account verification and recovery emails.

Required application variables:

- `DATABASE_URL`: the project's pooled Postgres connection string.
- `DATABASE_URL_UNPOOLED`: direct connection string for schema tools (optional for
  the supplied idempotent table initializer).
- `NEON_AUTH_BASE_URL`: the production branch's managed Auth URL, including path.
- `NEON_AUTH_COOKIE_SECRET`: a stable random secret, at least 32 characters.
  Generate securely, e.g. `openssl rand -base64 32`, and retain it across deploys.

For Node development put application variables in ignored `.env.local`. For
Wrangler local preview put them in ignored `.dev.vars`. Do not commit either file.

```sh
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

The initializer creates `precidoc_accounts` if absent and preserves existing
rows. It does not copy accounts from a previous Cloudflare D1 deployment.
The old SQLite migration and `examples/d1` remain historical examples; do not
apply them to Postgres. New Drizzle migrations use `drizzle-postgres/`.

## Build, preview, deploy

```sh
pnpm test
node tests/verify-account.cjs
node tests/verify-trial.cjs
pnpm exec tsc --noEmit --incremental false
pnpm build:worker
pnpm preview:worker --port 8787
```

The account suite uses a local SQLite adapter for parameterized query templates
and simulated Neon sessions. It does not establish a live Neon connection.

Before deployment, upload `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and
`NEON_AUTH_COOKIE_SECRET` as Cloudflare Worker secrets using secure settings or
Wrangler's interactive `secret put`. Keep secret input out of shell arguments.

```sh
pnpm deploy:worker
```

`wrangler.jsonc` attaches `precidoc.rainc.web.id` as a custom domain to the
`precidoc` Worker. Inspect existing DNS and Workers routes before deployment;
ensure changing this hostname will not replace an unrelated service.
No R2 bucket or D1 database is required for the current account/document workflow.
Check current Cloudflare and Neon free-tier quotas before production launch.

Validate the deployed homepage and `/sample`, sign up, verify email, sign in,
create the Precidoc account, reload `/app`, and sign out. Confirm unauthenticated
account requests return 401 and forged Sites identity headers cannot grant access.
Live positive authentication/database checks require actual credentials.
