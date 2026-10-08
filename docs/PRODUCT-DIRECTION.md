# Precidoc: document preparation for enterprise AI / RAG

Precidoc prepares enterprise documents before ingestion into an AI knowledge base. The current workflow is upload, analyze, optimize, export. User files are processed locally in the browser; users must export before closing the tab.

## Current MVP

Digital PDF, DOCX, TXT and Markdown extraction; source comparison and editing; title/version/category metadata; source-based chunking with configurable size; exact deduplication; user review; JSON and Markdown export with provenance and a preparation report. No external model or new AI subscription is required.

Knowledge Readiness Score uses versioned deterministic rules (`preparation-rules-v2`): extracted-text coverage 30%, metadata completeness 20%, distinct source sections 15%, valid chunk references 20%, user review 15%. Empty sources or missing titles block exports regardless of score. Scores of 80+ become prepared only after review. PDF deduplication compares page text independently of generated page titles; other formats retain heading context. Duplicate checks and chunk merging use the same fingerprint, and merging preserves all source references. Source duplicates still affect the score when merged into output. PDF table counts remain unknown, and empty PDF text only indicates a possible need for OCR, not a confirmed scanned document.

The score is not a measurement of retrieval performance, semantic correctness, security, or citation validity. JSON schema 1.1 adds `readiness`; existing document/chunk fields remain present. Markdown includes the score breakdown and limitations.

## Next stages, not currently available

1. OCR, table/layout recovery, document version relationships, PII detection and citation verification, with real fixtures and explicit confidence reporting.
2. Optional Claude-assisted classification, semantic chunk boundaries and metadata suggestions. Preserve original text and user review; model output must never become instructions to the application.
3. Design-partner pilots and measured retrieval evaluation before connectors, API automation or enterprise reporting. No pilot results or customer traction are claimed.

Prioritize document quality and traceability over adding many connectors. Register/login remains email and password with Neon Auth; email verification uses the configured Resend sender.

## Implementation priorities

Repair the workflow before changing its presentation: public signup must be reachable, extraction counts must agree with exports, and edits must invalidate review approval. Language changes preserve user content and approval because changing interface copy does not alter the document.

Then make the next action visible: a compact readiness summary links to source review and export; the detailed breakdown explains weights and limitations. Keep the four workspace tabs on one row at small widths and constrain filenames without losing their full accessible text.

The hero demonstrates the actual preparation workflow with editable sample data. The document mascot supports upload, processing, review and prepared states. It does not claim to perform AI analysis. Respect reduced motion and keep the score and source references more prominent than decoration.
