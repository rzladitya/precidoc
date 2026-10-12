# Precidoc V2 improvement checklist — 12 October 2026

Production: https://precidoc.rainc.tech. Parent startup: RAinc.

## Verified fixes and limitations

| Item | Result | Evidence and remaining boundary |
| --- | --- | --- |
| 1. Domain migration | Implemented; parent link-back verification pending | Canonical and Open Graph URLs now cover public pages; private account pages use noindex. Existing internal routes and Auth callbacks use the current origin. The footer links to rainc.tech. Legacy Precidoc redirects preserve root/path/query encoding. The parent's existing Worker already redirects rainc.web.id to rainc.tech, but direct parent-page inspection was denied by the environment's destination policy. A rainc.tech allowlist addition is saved as a draft; no uninspected parent assets were rewritten. |
| 2. Contacts and sender | Updated; delivery acceptance verified | Support references use owner-confirmed admin@rainc.tech. Auth and newsletter sender use noreply@rainc.tech; saved Neon SMTP sender matches. Resend initially rejected the new sender with 403 because its key was scoped to rainc.web.id. After the owner changed the key scope, a real send from rainc.tech returned 200 with a message receipt. Provider acceptance is distinguished from inbox receipt. Legacy website domains remain attached for redirects. Historical audit reports retain their original addresses. |
| 3. Browser workflows | Document workflows verified; live Auth handed to owner | 72 EN/ID public views at 1440/390/320 px and 13 sample/file/export/privacy flows passed. Two full-workspace desktop/mobile views exercise real DOCX/Markdown parsing, findings, metadata, chunk settings and JSON exports with an explicitly simulated session endpoint. A real production registration reached the verification form. The owner chose manual verification, so a complete live verification/login/recovery/logout pass is not claimed. |
| 4. Local processing/privacy | Verified | Parsing, edits and previews remain in browser memory. A browser probe found no document text or filename in HTTP URLs/bodies, third-party requests or localStorage. Statistics default off; opt-in payload tests restrict fields to event/duration/consent. Refresh discards the user file. No document persistence, LLM calls or OCR were added. |
| 5. Practical examples | Implemented and tested | Homepage and Product have RAG, knowledge-base and extraction-review before/after tabs. They identify illustrative manual corrections, source references and missing metadata; they do not imply automatic table reconstruction or improved retrieval accuracy. EN/ID tab controls passed browser checks. |
| 6. Demo versus Free | Verified | Product/Pricing/Support describe limits and temporary retention. Demo: one active file, 5 MB, 20 PDF pages, 100,000 characters. Free adds multiple documents, editable metadata, chunk settings and JSON. Both discard local work on refresh/leaving/logout; neither adds cloud storage. |
| 7. Failures/retry/cancellation | Verified | Ten additional browser checks cover real corrupted/encrypted/image-only PDFs, oversized input, DOCX finding references, guide controls and privacy. In-flight cancellation cannot commit a delayed result. Existing transient-read retry tests and parser deadline tests passed. The actual encrypted and scan fixtures are committed. |
| 8. Language/SEO/mobile/performance | Verified within stated scope | EN/ID views passed axe WCAG 2 A/AA and 2.1 AA checks with no horizontal page overflow or JavaScript errors. Inactive example tabs received readable contrast. Canonicals/Open Graph and private noindex rules are implemented. Production uses the existing compact Webpack/OpenNext build and local fonts. No field Core Web Vitals or universal performance guarantee is claimed. Language changes keep source text intact; shared URLs still default to English server metadata. |
| 9. Visible controls/subscriptions/downloads | Verified within stated scope | Browser checks exercise sample controls, finding navigation, editing, approval invalidation and real Markdown/JSON downloads. A live mobile newsletter subscription was saved on Neon, its old-domain unsubscribe link was checked over HTTPS, and the confirmation button unsubscribed it. The reserved test fixture was deleted; no newsletter email was sent. Full live account controls remain owner-handled as noted above. |
| 10. Micro-interactions | Implemented and checked | Existing document mascot/progress behavior is preserved. Guide and example controls use restrained transitions and reduced-motion support. No simulated percentage or fake processing result was introduced. |
| 11. Onboarding/tutorial | Implemented and tested | An optional four-step guide opens findings, source editing and export preview. It never approves a document automatically. Dismiss/reopen preference stores only a boolean; Privacy describes this preference. Existing documents can be inspected without replacing them. |
| 12. Actual feedback | Channel prepared; research pending | Support offers a structured email prompt for use case, document type, friction and the highest-value Pro improvement. It clearly opens the user's mail app. No outreach, invented responses, fake votes or user-demand claims were published. Actual responses are needed before prioritising Pro. |

## Checks

Passed document/parser, file-safety, account/session, trial/Auth UI, newsletter,
usage privacy, signed Auth email, domain migration, TypeScript and scoped ESLint
checks. Account/Auth unit adapters are identified as simulated rather than live.
Browser artifacts are kept in ignored outputs/precidoc-checklist-2026-10-12.

The live browser harness relays real HTTPS responses through the managed proxy
with TLS verification enabled because Chromium's independent CA store does not
trust the environment's proxy certificate. It does not fabricate Auth responses
or relax certificate verification. Legacy redirect/token exchanges are checked
through validated HTTPS before opening the resulting canonical browser URL.

Live email tests require explicit activation and an owner-authorized mailbox.
Passwords and owner-supplied OTP/recovery inputs remain in ignored private test
state, never Git or reports. Do not restart them or send more test emails after
the owner's decision to handle verification manually.

LLM, OCR, cloud document storage, paid checkout and team collaboration remain
unavailable. Precidoc is early access, not a certified or enterprise-ready service.
