# Decision Log

A chronological record of project decisions, the alternatives considered, and the rationale. New decisions are appended; old decisions are not rewritten — if we change our minds, the new decision references and supersedes the old one. This preserves the audit trail for the grant report and for future maintainers.

Each decision is dated, numbered, and tagged with the section of `PROJECT_PLAN.md` it belongs to.

---

## D-001 — Build a new OER textbook rather than continuing with Baronett or adopting Knachel wholesale

**Date**: 2026-04-26
**Plan section**: 1, 2
**Decision**: Build a new openly-licensed textbook, not adopt an existing OER (Knachel) wholesale and not continue with Baronett.
**Alternatives considered**:
- (a) Continue using Baronett's *Logic*, 5th ed. — rejected: commercial pricing, repeated edition churn with little change, paywalled tools.
- (b) Adopt Knachel's *Fundamental Methods of Logic* wholesale — rejected: contains errors (notably in the probability section the lead author already uses), and structural choices that diverge from how the lead author teaches.
- (c) Adapt Knachel under his CC license, fixing errors and reorganizing — rejected in favor of writing fresh.
- (d) Write a new book — **chosen**.
**Rationale**: A new book lets the project optimize for the lead author's pedagogical preferences (notation, Venn-only categorical, four-section structure tied to UMW's quantitative-reasoning gen-ed requirement) and produces a deliverable that can grow into an integrated platform with the proof checker, truth table checker, and Canvas modules.

---

## D-002 — Stay close to the existing PHIL 151B four-section structure

**Date**: 2026-04-26
**Plan section**: 3
**Decision**: The book mirrors the lead author's current course structure: informal logic → categorical logic → sentential logic + natural deduction → statistical reasoning. Optional Part V on predicate logic for adopters.
**Alternatives considered**:
- A radically reorganized book that, for instance, leads with sentential logic for symbolic-first instruction.
- A book that follows Knachel's organization.
**Rationale**: The structure has been refined over a decade of teaching; redesigning it would multiply work without serving the lead author's primary use case.

---

## D-003 — Use Copi notation throughout

**Date**: 2026-04-26
**Plan section**: 4
**Decision**: Use Copi notation (`⊃`, `·`, `∨`, `≡`, `∼`) in all materials.
**Alternatives considered**:
- Modern notation (`→`, `∧`, `∨`, `¬`, `↔`).
- Both, with reader/student choice.
**Rationale**: Pedagogical preference (consistent with the Copi/Hurley/Baronett tradition the lead author teaches in), the co-author's compatible Hurley background, and a deliberate (if decaying) friction against students copy-pasting from external sources that use modern notation. Accepted that the deterrent will weaken as AI tools improve at Copi notation; the in-person exam remains the real assessment.

---

## D-004 — 18-rule natural deduction system, with CP and IP taught but not assessed

**Date**: 2026-04-26
**Plan section**: 4
**Decision**: The 8 implication rules and 10 replacement rules from the lead author's existing rules sheet form the core natural deduction system. Conditional and indirect proof are taught as techniques, but assessments are constructed to be solvable using only the 18 rules.
**Alternatives considered**: A larger or smaller rule set; including CP and IP as assessable techniques.
**Rationale**: This matches the lead author's existing course design; the proof checker already supports this set; most other Copi-tradition books use a similar set.

---

## D-005 — Phased delivery: PDF-first, interactive web later

**Date**: 2026-04-26
**Plan section**: 5
**Decision**: Phase 1 ships an accessible PDF textbook with linked external tools by Fall 2026. Phase 2 evolves to an accessible interactive HTML version with embedded tools as hosting and a programmer become available.
**Alternatives considered**:
- Build the interactive web version from day one.
- Stay PDF-only forever.
**Rationale**: Avoids over-engineering before classroom testing; aligns with grant accessibility commitments (PDF accessibility standards are well-understood); keeps Phase 1 deliverable scoped to what one author + one collaborator can ship in a year.

---

## D-006 — Author in PreTeXt

**Date**: 2026-04-26
**Plan section**: 5
**Decision**: PreTeXt is the source format. Single source compiles to accessible PDF, accessible HTML, and EPUB.
**Alternatives considered**:
- LaTeX (great PDFs, painful HTML, weak accessibility for symbolic content).
- Markdown / MyST / Quarto / Jupyter Book (good for prose, less mature for math-heavy textbook structure).
- Custom static-site setup.
**Rationale**: PreTeXt was designed specifically for OER STEM textbooks. It handles the PDF + HTML + accessibility requirements without us reinventing them; AIM institutional backing reduces toolchain-rot risk; phase-2 interactivity (embedded widgets, MathJax) is supported.

---

## D-007 — Examples are isolated from chapter prose for swappability

**Date**: 2026-04-26
**Plan section**: 5
**Decision**: Politically-current examples live in modular files under `examples/`, referenced from chapters via PreTeXt `xinclude`. Example sets are versioned so adopters can pin to a stable set.
**Alternatives considered**: Inline examples in chapter source, hand-edited each cycle.
**Rationale**: The lead author updates examples frequently to track current events. Architecture-level support for cheap swapping prevents the bottleneck where re-publishing the whole book to update one example becomes a chore that gets skipped.

---

## D-008 — Targeting the VIVA Open Creation Grant, Fall 2026 cycle

**Date**: 2026-04-26
**Plan section**: 10
**Decision**: Apply for the VIVA Open Creation Grant in the November 2026 application cycle. Target the $15,000 minimum award. The project proceeds whether or not the grant is awarded.
**Alternatives considered**: Larger grants ($25K–$50K range) requiring larger teams and broader scope; non-VIVA funding paths.
**Rationale**: The minimum grant fits a 3-person team (PI, co-author, librarian) and matches a Phase 1 scope that is achievable on the agreed timeline. A larger Adopt or Course grant can be pursued in 2028 to fund Phase 2.

---

## D-009 — Team minimum: PI + co-author + librarian

**Date**: 2026-04-26
**Plan section**: 9
**Decision**: Initial grant team is the lead author, the UMW philosophy colleague who teaches logic, and a UMW librarian (to be recruited). A CS programmer joins for Phase 2.
**Alternatives considered**:
- Solo PI (rejected: grant requires a team).
- A larger team including an instructional designer (rejected: lead author owns Canvas module design and does not need ID support).
- Adding a CS faculty / programmer at the start (deferred to Phase 2).
**Rationale**: Minimum viable team for the grant; the lead author's Canvas expertise removes the ID need; vibe-coded tools with AI assistance reduce the need for a programmer in Phase 1.

---

## D-010 — Aggressive timeline, grant-independent

**Date**: 2026-04-26
**Plan section**: 11
**Decision**: PDF v1 done by Fall 2026; truth table checker + Canvas modules + proof checker accessibility by May 2027; pre-pilot in Summer 2027; official pilot in Fall 2027. Independent of grant funding.
**Alternatives considered**: A grant-gated timeline that waits for funding before starting.
**Rationale**: The lead author intends to do the work regardless. Treating the timeline as grant-independent removes the grant from the critical path and lets the application reflect work-in-progress evidence.

---

## D-011 — Write fresh, treating the lead author's materials as primary source

**Date**: 2026-04-26
**Plan section**: 5, 12
**Decision**: All chapters are written fresh. No copyrighted content (Baronett, Hurley, Hacking) is reused. Knachel is reference, not source. The lead author's seatwork, study guides, exams, summer notes, and forthcoming written notes are the primary source from which prose is drafted.
**Alternatives considered**: Adapt Knachel under his CC license for some sections.
**Rationale**: A wholly original book has a clean licensing story (no inherited license obligations beyond our own choice), unambiguous voice, and lets the book serve as both a textbook and an artifact of the lead author's pedagogical voice. The lead author's existing teaching materials provide enough scaffolding to make "write fresh" achievable on the timeline.

---

## D-012 — Proof checker reused, accessibility remediated

**Date**: 2026-04-26
**Plan section**: 6
**Decision**: The existing `ivymoss/proofchecker` (lead author's own) is moved into the monorepo and maintained directly. It receives an accessibility audit and remediation pass before the Fall 2026 PDF prints its URL. Custom domain plus backup mirror for hosting stability.
**Alternatives considered**:
- Keep linking to the github.io URL as-is — rejected: vulnerable to single-point-of-failure hosting and lacks accessibility.
- Build a new checker from scratch — rejected: too much work for a tool that already meets functional requirements.
**Rationale**: The lead author already owns the IP; the rule set already matches; accessibility remediation is much smaller than rebuilding.

---

## D-013 — Truth table checker spec

**Date**: 2026-04-26
**Plan section**: 6
**Decision**: Build new. Check-only. Three modes (single, pair, argument). Copi notation. Auto-filled binary-counting reference columns. 4-variable cap. Toggleable check-now / check-on-button. No hints in v1. Forced left-to-right inside-out cell order. Variables in order of first appearance. Phone-friendly with mobile warning. Local save via `localStorage`. Screen-reader accessible. Standalone in Phase 1, embeddable in Phase 2.
**Alternatives considered**:
- Generation mode (tool produces filled tables) — rejected: lower pedagogical value than check-only.
- Hint system — rejected: too high-overhead without per-problem pre-computed answers.
- Full LTI integration with Canvas — deferred to Phase 2.
**Rationale**: Specification optimized for pedagogical value, accessibility, and minimal v1 scope. Realistic effort estimate: 1–2 weeks engineering with AI assistance.

---

## D-014 — Canvas modules use native question types, not embedded checkers

**Date**: 2026-04-26
**Plan section**: 6
**Decision**: Quizzes use Canvas's native question types (fill-in-blank with pattern matching for truth-value columns; multiple choice for "which next line of this proof is a legitimate use of the rules?"). The checkers are practice tools; assessment happens in Canvas natively.
**Alternatives considered**:
- Embed the checkers via iframe in Canvas quizzes (rejected: iframe accessibility is harder, port-out to other LMS platforms is fragile).
- Use a separate LTI-integrated assessment tool (deferred to Phase 2).
**Rationale**: Native Canvas question types are accessible by default, portable across LMS platforms via Common Cartridge, and easy to author. Cleanly separates "tools for practice" from "infrastructure for assessment."

---

## D-015 — One Canvas module per book chapter

**Date**: 2026-04-26
**Plan section**: 6
**Decision**: Canvas modules are organized one per chapter (~17 modules + optional Part V). Timing modulated manually by the instructor.
**Alternatives considered**: One module per week; one per unit.
**Rationale**: Tightest text↔module coupling; easiest navigation for students; avoids straddling chapters across week boundaries.

---

## D-016 — Single monorepo, public from day 1

**Date**: 2026-04-26
**Plan section**: 8
**Decision**: One GitHub repository containing book, both tools, Canvas exports, examples, and docs. Public from day 1.
**Alternatives considered**:
- Multiple repositories with independent versioning.
- Private during development, opened at v1.0.
**Rationale**: Monorepo simplifies coordination and CI; public-from-day-1 invites OER community involvement and signals openness to grant reviewers; commit access remains restricted to maintainers until v1.0 to keep quality control.

---

## D-017 — Licenses: CC BY-SA 4.0 for the book, MIT for the tools

**Date**: 2026-04-26
**Plan section**: 8
**Decision**: The book is licensed CC BY-SA 4.0. Tools are licensed MIT.
**Alternatives considered**:
- CC BY 4.0 for the book (rejected for now in favor of share-alike protection).
- CC BY-NC (rejected: not accepted by most OER programs).
**Rationale**: Share-alike protects against derivatives being locked down. **Risk**: VIVA Open Publishing may require CC BY (without share-alike); to be confirmed before the November 2026 application. Fallback: switch to CC BY 4.0.

---

## D-018 — VIVA Open Publishing as the official publishing path

**Date**: 2026-04-26
**Plan section**: 8
**Decision**: VIVA Open Publishing hosts the canonical version of the book (OER Commons infrastructure). The GitHub monorepo is the source of truth; VIVA receives release tarballs.
**Alternatives considered**: Self-publishing only; using the OpenStax pipeline (not currently accepting outside submissions for new works).
**Rationale**: Required by the grant. Provides discovery, accessibility review, and adoption-tracking infrastructure that we would otherwise have to build.

---

## D-019 — Contributor model: closed during development, open after v1.0

**Date**: 2026-04-26
**Plan section**: 8
**Decision**: Until v1.0 ships, only named maintainers commit. After v1.0, external issues and PRs are accepted with maintainer review.
**Alternatives considered**: Fully open contributor model from the start.
**Rationale**: Keeps quality control during the high-velocity authoring phase; opens up sustainability pathways once the artifact is stable.

---

## D-020 — Failure mode mitigations

**Date**: 2026-04-26
**Plan section**: 14
**Decision**: See `PROJECT_PLAN.md` §14 for the full table. Notable choices:
- Co-author dropout: accepted risk, no backup.
- Pedagogical errors: undergrad cold-read pre-pilot + public errata + open issue tracker.
- Stale political examples: all three mitigations (CI build, versioned examples, community library).
- AI evolves past Copi: in-person exam is real assessment, integrate "explain your proof" question types.
- Long-term maintenance: book may freeze post-Reno, that is acceptable.
- Bad pilot feedback: Summer 2027 pre-pilot in lead author's summer section.
- PreTeXt toolchain rot: pin version + Dockerfile.
- Proof checker outage: multi-domain hosting + downloadable zip backup.
**Rationale**: Each chosen mitigation is the lowest-cost option that makes the failure mode survivable rather than catastrophic.

---

## D-021 — Drafting workflow: hybrid by section type

**Date**: 2026-04-26
**Plan section**: 12
**Decision**: Claude drafts expository prose and definitions; the lead author drafts examples and exercises. Trade for review. Markdown drafts in chat for the first 2–3 chapters, then migrate to direct-to-PreTeXt.
**Alternatives considered**:
- Lead author drafts everything; Claude edits.
- Claude drafts everything; lead author edits.
**Rationale**: Plays to both collaborators' strengths. Lead author has 10+ years of pedagogically-tested examples and exercises; Claude is decent at clear expository prose.

---

## D-022 — Vertical slice on Chapter 1 before steady-state authoring

**Date**: 2026-04-26
**Plan section**: 12
**Decision**: Chapter 1 is built end-to-end (PreTeXt source → rendered PDF + HTML → screen-reader accessibility pass → accompanying Canvas module) before any other chapter is started. The Chapter 1 vertical slice shakes out the toolchain, the chapter template, the voice, and the workflow.
**Alternatives considered**: Draft all chapters in parallel; outline-first across all chapters.
**Rationale**: Standard practice for high-uncertainty projects. Surfaces template and tool issues at the cheapest possible moment.

---

## D-023 — Chapter template

**Date**: 2026-04-26
**Plan section**: 13
**Decision**: Each chapter has chapter opener (no formal learning-outcomes), 3–6 sections (intro, definitions in boxed callouts, worked examples in boxed callouts, practice problems with reveal-on-click solutions, cross-references to tools), chapter summary, key terms, end-of-chapter exercises (mixed difficulty, organized by section), optional "Going Further." PreTeXt combined per-section numbering. Selected solutions in PDF appendix; full solutions in instructor's manual. Figures via PreTeXt's `<diagram>` element with SVG output.
**Alternatives considered**: Multiple options listed in the alignment interview.
**Rationale**: Optimized for the lookup-friendly use case (students do not read books cover-to-cover) while preserving the option for students who do want to read it as a book.

---

## D-024 — Accessibility as a cross-cutting principle

**Date**: 2026-04-26
**Plan section**: 7
**Decision**: WCAG 2.1 AA target across book HTML, both tools, and Canvas modules. Hard requirements include keyboard-only operation, screen-reader testing as part of the Chapter 1 vertical slice, semantic markup, no color-only feedback, alt-text on every figure. No chapter ships without screen-reader verification.
**Alternatives considered**: Accessibility as a Phase 2 polish.
**Rationale**: Required by the grant. Required by the project's values. Cheaper to bake in at the template stage than to retrofit later.

---

## D-025 — Automated Markdown-to-PreTeXt translation for End-of-Chapter materials

**Date**: 2026-05-02
**Plan section**: 12
**Decision**: Use a custom Python script to translate Markdown drafts of exercises, solutions, and chapter summaries directly into PreTeXt XML, rather than hand-authoring them.
**Alternatives considered**: Hand-coding all XML; writing a generic Pandoc filter.
**Rationale**: Hand-coding `<exercises>`, `<solution>`, and complex numbered blocks in PreTeXt is tedious, error-prone, and hinders pedagogical review. Drafting in Markdown allows the lead author to easily balance and review exercise sets. The custom Python script guarantees PreTeXt schema compliance (e.g., proper element ordering, automatic `<blockquote/>` wrapping for standard form, and filtering out instructor notes).

---

*End of decision log as of project alignment, April 26, 2026. New decisions appended below.*
