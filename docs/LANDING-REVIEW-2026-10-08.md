# Landing page review — 8 October 2026

The feature section repeated four identical icon/title/paragraph/badge/link cards, then repeated their descriptions in a workflow section. Abstract headings such as “Refine the context” offered little detail about the document work. The header's Product, Features and How it works links also described overlapping content.

The landing now shows a document example beside three specific actions:

- Compare source and extracted text.
- Inspect the generated chunks.
- Review the export and its metadata/source references.

The document panel uses the existing localized `Database-Recovery.md` sample. Its steps, table values, missing version and section/table counts come from that sample. It is labelled as an example. The repeated feature/workflow/provenance sections have been consolidated, and each action links to its corresponding sample-workspace tab. The existing `#fitur` and `#cara-kerja` anchors still resolve.

The header has a smaller brand lockup, navigation to the walkthrough, document review and FAQ, a direct sign-in link, a clear workspace action, and a compact EN/ID switch. The mobile header keeps language switching and sign-in visible.

Validation: production Worker build and TypeScript passed; ESLint reported zero errors on the changed components. Browser checks covered EN and ID at 1440, 1024, 768, 390 and 320 px, with no page-level overflow, browser runtime errors or automated WCAG A/AA violations. The review anchor, three workspace-tab links and header sign-in were exercised. The final document preview also preserves visible numbering and uses SVG navigation arrows to avoid font-dependent glyphs.

This change updates landing presentation and navigation. Conversion impact has not been measured. Review screenshots and browser evidence are saved in the ignored `outputs/precidoc-landing-review-2026-10-08` directory.
