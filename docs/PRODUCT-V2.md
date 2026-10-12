# Precidoc V2 — implemented capabilities and verification

Precidoc remains an early access document preparation product by RAinc. The
current release performs real browser parsing and deterministic review checks.
LLM assistance, OCR, cloud document storage, team sharing, persistent history,
embeddings and knowledge-base publishing remain planned or unavailable.

## Visitor and account workflows

The homepage states the document problem, preparation workflow and export result.
Its editable walkthrough starts from pre-parsed sample data and says so.
`/sample` constructs the predefined Markdown input and runs `parseFile`, followed
by the same findings, source review, chunking and export code as imported files.
Markdown fenced-code comments are not treated as headings, and code indentation/
horizontal whitespace are preserved. Exact deduplication keeps differently
indented sections separate.
No account is needed for that flow. Guest file replacement is limited to one
active document, 5 MB, 20 PDF pages and 100,000 extracted characters.

`/app` requires a verified Neon Auth identity and a Precidoc account. The
component is keyed by the server identity. Session checks, focus checks and
cross-tab sign-out messages clear local state after loss/change of identity;
temporary provider failures preserve local work. Free supports 10 documents,
five files per batch, 15 MB/file, 200 PDF pages and 750,000 characters/file, with
a 50 MB/2 million character total tab budget. Both modes have a 30-second parsing
deadline and edit limits. Original files are not modified.

Documents, edits and activity remain in tab memory. There is no saved cloud
history. Remove/clear controls release local preview URLs and metadata. Navigation
and reload warnings protect work that has not been exported. Pagehide, unmount,
sign-out and session isolation discard local state.

## Security and review boundaries

Validation checks extensions, supported MIME types, actual PDF/ZIP signatures,
empty files, bytes/pages/text length, and filename control characters. DOCX checks
central/local header consistency, encryption/macro/executable entries, member
counts and expansion limits. Streaming decompression verifies actual inflated
lengths, including forged size declarations, before Mammoth parses content.
This is not antivirus scanning. Browser DOCX parsing has external-file access
disabled. PDF previews render bounded canvas pixels, without embedded PDF scripts,
forms or links. Parsing can be cancelled or retried, and errors provide a next step.

Document content is treated as text, including preview and export. Legacy automatic
browser model-context tools were removed. No current workflow sends document
content to an LLM or stores it on a server. Security headers restrict content
origins, framing, objects and browser permissions. The baseline CSP allows Next.js
inline scripts/styles; it is not a strict nonce-based CSP or a security certification.
Fonts are served locally with their OFL licences. PDF table/layout reconstruction,
semantic quality, PII detection and retrieval accuracy are not assessed.

## Transparency and operations

`/product`, `/pricing`, `/support`, `/privacy`, `/terms` and `/changelog` describe
available features, actual limits, retention and third-party account/email handling.
Practical guides remain on `/blog`. Product pages and new controls support EN/ID.
Free has no price amount; Pro is unavailable and labelled planned.

Local activity records success/failure/cancellation and real processing time.
Optional statistics are off until explicit consent and respect DNT/GPC. Requests
omit authentication cookies and allow only event names and timing ranges. The
database stores daily aggregate counts, not document text/names, email, account IDs,
or journey identifiers. A salted IP hash limits abuse. Aggregate rows older than
90 days and rate-limit rows older than 24 hours are pruned on subsequent activity.

Apply the additive schema with `pnpm db:migrate`. Read aggregate counters with:

```sh
node --env-file-if-exists=.env.local scripts/show-usage.mjs
```

## Verification and practical limits

- Actual PDF, DOCX and Markdown fixtures: parsing, tables, sources, chunks,
  deduplication, review gating and exports.
- Hostile/malformed inputs: signatures/MIME, binary/spoofed text, archive expansion,
  forged sizes, active entries, cancellation and deadline handling.
- Account/session tests: verified identities, forged inputs, origin/body checks,
  account keys, unauthorised access and provider failures.
- Browser: 72 EN/ID views at 1440/390/320 px; accessibility and overflow checks;
  13 real sample/file/export/privacy flows.
- Full workspace: desktop/mobile browser controls with real DOCX/Markdown parsing,
  category/chunk/dedup settings, JSON export and source links. Authentication in
  this fixture is explicitly simulated; the temporary local route is removed.
- Signed auth email, newsletter and aggregate statistics tests use local provider
  adapters. They do not send email or prove a new live OTP exchange.

The live Neon migration and live unauthenticated Auth endpoint are verified
separately. Production uses the supported Webpack/OpenNext build. OpenNext still
reports Node middleware support as experimental; server page/account/session checks
also enforce verified identity. Do not describe this release as enterprise-ready.
