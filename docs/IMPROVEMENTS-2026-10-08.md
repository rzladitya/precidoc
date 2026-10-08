# Precidoc improvements — 8 October 2026

The preparation workflow now has reachable signup, matching duplicate diagnostics and chunk output, accurate Markdown table counts, stable localized page titles, and clearer responsive layouts. The hero, workspace summary and document mascot present the same preparation capabilities that users can actually exercise.

## Why this order

1. **Correct results and complete journeys.** An attractive score cannot compensate for mismatched duplicate counts, inaccessible signup, or lost edits. Source comparison, review approval and exported provenance form the product's evidence.
2. **Readable layout and next actions.** Keep the four workspace views visible on mobile, constrain filenames, and make the summary point directly to source review and export. Detailed score weights and limitations remain available on demand.
3. **A convincing demonstration.** The hero explains the document-to-knowledge use case, while the editable walkthrough demonstrates extraction, analysis, preparation and export using actual sample state. Its score is computed from that state.
4. **Character and feedback.** The document mascot accompanies upload, processing, review and prepared states. Motion respects the user's reduced-motion preference. Decoration remains secondary to document evidence.

## Findings addressed

| ID | Problem | Result and evidence |
| --- | --- | --- |
| F01 | `/register` redirected unauthenticated visitors to login. | Signup is public; the protected workspace still redirects unauthenticated visitors. Local browser and live HTTP checks passed. |
| F02 | PDF duplicate detection and chunk merging disagreed. | Identical page text produces one chunk with references to both pages. Turning off dedup restores two chunks. Other formats retain heading context. A shared fingerprint drives findings, readiness and merging. |
| F03 | Auth illustration clipping and footer overlap on mobile. | The artwork remains within its panel at 1440, 768, 390 and 320 px; the mobile chunk card clears the footer by 16 px. |
| F04 | Incorrect or overwritten route and localized titles. | Shared title copy supplies Next metadata and localized browser state. Tested direct navigation, language persistence after reload, and sign-in/signup mode changes. Exactly one title appears on the tested routes. |
| F05 | Insufficient contrast in secondary labels and badges. | Secondary ink and relevant selectors corrected. Automated accessibility scans found no violations in the 28 tested route/viewport combinations. |
| F06 | Scrollable source/code previews lacked keyboard focus. | Relevant previews accept focus and show a visible focus outline. Demo export and workspace scans passed. |
| F07 | Multiple Markdown tables in one section counted as one. | Real two-table upload reports two tables; editing it down to one updates the count. Regression fixtures cover optional pipes, alignment and fenced code. |
| F08 | Switching demo language silently replaced edits and approval. | Language changes preserve document data and approval. Explicit sample reset loads a fresh localized example. Changing text or chunk settings still revokes approval. |
| F09 | Raw auth errors and generated labels were inconsistent across languages. | Known auth codes map to EN/ID messages; generated PDF labels and Markdown readiness descriptions are localized. User document text is preserved. |
| F10 | Logout lacked the shared account design. | Logout uses the same branded shell and reminds users to export their tab's work before leaving. |
| F11 | Workspace tabs wrapped into a 3+1 arrangement on mobile. | All four views remain on a single row at 320 and 390 px. |
| F12 | Long filenames created excessively tall document cards. | Filename text is clamped to two lines; the complete name remains in the accessible button text and title. Mobile cards remain 134 px high. |
| G01/G04 | No password recovery, password visibility control or OTP resend cooldown. | Recovery request and reset screens added, show/hide password added, OTP resend has a 30-second cooldown. UI cases cover request failure, missing token, password mismatch and reset success. Live reset request returned HTTP 200. |
| G02 | Trial score encouraged metadata work while those controls were locked. | Score details explain that metadata and chunk controls require signup, and describe the review/Markdown workflow available in the trial. |

## Validation

The existing document, trial/registration and account security checks passed, together with new deduplication, table-counting and recovery regressions:

```sh
pnpm test
node tests/verify-trial.cjs
node tests/verify-account.cjs
pnpm build:worker
```

The production build and TypeScript validation passed. ESLint reported zero errors on the changed application modules; two navigation warnings remain on deliberate full navigations after account creation and logout, which refresh server session state.

Browser checks covered seven public pages at widths of 1440, 768, 390 and 320 px, plus source/chunk/export interactions, expanded readiness details and the landing demo. The tested views had no page-level overflow, runtime page errors, or automated WCAG A/AA violations. Automated scans do not constitute an accessibility certification.

Real PDF and DOCX extraction, original PDF viewing, invalid-file handling, blank-PDF export blocking, review-gated Markdown/JSON downloads, source-preserving deduplication and approval invalidation passed. Full-workspace file tests ran in an isolated UI fixture using the real component, without creating production document records.

At `https://precidoc.rainc.web.id`, the test account successfully signed in, established a verified session, opened the workspace, signed out, and then had no active session. Public pages and the mascot asset returned HTTP 200 with correct server-rendered titles. `GET /api/account` returns 405 by design; that endpoint accepts POST.

The deployed Cloudflare Worker version is `c98c7a0e-826a-4d8a-97aa-4d8e59302cce`.

## Practical limits

- A fresh signup and real OTP inbox delivery were not repeated for this change; the existing verified test account exercised live sign-in/session/logout, while signup/OTP/error/cooldown changes were tested with mocked responses.
- The live password-reset request was accepted. Receipt of that email and changing a password through the real email link have not been verified; the reset submission was tested with mocked responses.
- Files remain in the current browser tab's memory. Reloading or closing the tab clears document work; exporting is still required.
- OCR, PDF table/layout recovery, LLM analysis, embeddings, PII detection, retrieval evaluation and knowledge-base connectors remain outside the current implementation.
- Readiness measures preparation checks, not the accuracy of future AI answers. No conversion uplift or customer results are claimed without measurements.

The review artifacts contain screenshots, browser results, safe live HTTP results and example exports under the checkout's ignored `outputs/precidoc-improvements-2026-10-08` directory. They contain no application credentials, auth cookies or reset tokens.
