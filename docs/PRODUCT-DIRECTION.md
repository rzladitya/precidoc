# Precidoc: document preparation for enterprise AI / RAG

Precidoc prepares enterprise documents before ingestion into an AI knowledge base. The current workflow is upload, analyze, optimize, export. User files are processed locally in the browser; users must export before closing the tab.

## Current MVP

Digital PDF, DOCX, TXT and Markdown extraction; source comparison and editing; title/version/category metadata; source-based chunking with configurable size; exact deduplication; user review; JSON and Markdown export with provenance and a preparation report. No external model or new AI subscription is required.

Knowledge Readiness Score uses versioned deterministic rules (`preparation-rules-v1`): extracted-text coverage 30%, metadata completeness 20%, distinct source text 15%, valid chunk references 20%, user review 15%. Empty sources or missing titles block exports regardless of score. Scores of 80+ become prepared only after review. Source duplicates still affect the score when merged into output. PDF table counts remain unknown, and empty PDF text only indicates a possible need for OCR, not a confirmed scanned document.

The score is not a measurement of retrieval performance, semantic correctness, security, or citation validity. JSON schema 1.1 adds `readiness`; existing document/chunk fields remain present. Markdown includes the score breakdown and limitations.

## Next stages, not currently available

1. OCR, table/layout recovery, document version relationships, PII detection and citation verification, with real fixtures and explicit confidence reporting.
2. Optional Claude-assisted classification, semantic chunk boundaries and metadata suggestions. Preserve original text and user review; model output must never become instructions to the application.
3. Design-partner pilots and measured retrieval evaluation before connectors, API automation or enterprise reporting. No pilot results or customer traction are claimed.

Prioritize document quality and traceability over adding many connectors. Register/login remains email and password with Neon Auth; email verification uses the configured Resend sender.
