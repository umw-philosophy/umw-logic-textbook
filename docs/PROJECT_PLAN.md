# UMW Logic Textbook — Project Plan

**Living document.** Last updated: April 26, 2026.
This is the synthesized plan from the alignment interview held on April 26, 2026 between Dr. Michael Reno (PI) and Claude (Anthropic). It is editable as we discover issues during the Chapter 1 vertical slice and beyond. New decisions get logged in `DECISIONS.md`; this document is updated to reflect the current state of the plan.

---

## 1. Project Identity

We are building an open educational resource that replaces commercial intro-logic textbooks (Baronett, Hurley) at the University of Mary Washington and offers an adoptable resource for other Virginia institutions and beyond. The project comprises three deliverables:

1. **A free, openly-licensed textbook** authored in PreTeXt and published as accessible PDF (Phase 1) and accessible interactive HTML (Phase 2).
2. **Two web-based logic tools** — a natural deduction proof checker (already built; maintained going forward) and a truth-table checker (to be built fresh).
3. **A complete Canvas course shell** (modules, quizzes, seatwork) exportable as Canvas Course Export and Common Cartridge for adopters using other LMS platforms.

The anchoring course is **PHIL 151B Introductory Logic** at UMW. The book is a *superset* of the course — it includes optional chapters on predicate logic and a deeper treatment of conditional and indirect proof so that other instructors can adopt the book without being constrained to the UMW syllabus.

## 2. Audience and Pedagogical Stance

The book is pitched at undergraduate intro level: clear and precise, but not deep. It serves students for whom this is the only logic course they will ever take, and adopters teaching general-education logic that satisfies a quantitative-reasoning requirement.

The pedagogical philosophy treats **formal logic as the rigorous spine of argumentative thinking**. Informal logic, categorical logic with Venn diagrams, sentential logic with natural deduction, and statistical reasoning each get a unit, in that order. Hacking's *An Introduction to Probability and Inductive Logic* is a north star for ambition and rigor in the statistics unit, but the book remains intro-pitched throughout.

The cheating-and-AI stance is "I'm not a cop." The real assessment gate is the in-person paper exam, not technical lockdown. Quizzes and assignments are designed to make the path of least resistance the path of actual learning, not the path of outsourcing to a chatbot. AI use is allowed where assignments specify, must be cited, and is honor-code-governed.

## 3. Scope and Structure

The book is divided into four parts that align with the four exam blocks of the UMW course, plus an optional fifth part for adopters who teach predicate logic.

- **Part I — Arguments and Reasoning** (informal logic): what arguments are, deductive vs. inductive, validity and soundness, language and meaning, informal fallacies.
- **Part II — Categorical Logic** (Venn-first): categorical statements, the square of opposition, Venn diagrams for statements, categorical syllogisms via Venn diagrams, translating English into categorical form. Mood and Figure are de-emphasized; the Venn diagram method is treated as the primary tool for assessing validity. Only modern categorical logic is taught in the body of the text. Existential commitment is discussed. But, the Aristotelian categorical logic is placed in an appendix. 
- **Part III — Sentential Logic**: symbolizing sentences using Copi notation (⊃, ·, ∨, ≡, ∼), truth tables, natural deduction with the 8 implication rules and the 10 replacement rules, and conditional and indirect proof. CP and IP are taught but assessments are designed to be solvable using only the 18 rules.
- **Part IV — Inductive and Statistical Reasoning**: inductive reasoning, probability basics, descriptive statistics, statistical inference, and a closing chapter that draws on Hacking-flavored material to give students a richer appreciation of statistical reasoning than typical intro texts offer.
- **Part V — Predicate Logic** (optional adopter chapters): symbolization with quantifiers, the four standard quantifier rules, and (optionally) identity. PHIL 151B does not (currently) cover this material; adopters who want it can include it.

A target of approximately 17–18 chapters total. The exact chapter list will firm up after the Chapter 1 vertical slice.

## 4. Notation and Proof System

The book uses **Copi notation** throughout: `⊃` for the conditional, `·` for conjunction, `∨` for disjunction, `≡` for the biconditional, and `∼` for negation. This choice is both pedagogical (consistent with the Copi/Hurley/Baronett tradition the lead author has taught from for years) and a soft deterrent against students copy-pasting from external sources that use the modern `→`, `∧`, `∨`, `¬`, `↔` notation. The deterrent's effectiveness will decay as AI tools improve at Copi notation; the in-person exam remains the real assessment.

The natural deduction system has **18 inference rules** (taken from the lead author's existing `NaturalDeductionRules.pdf`):

- **8 implication rules**: Modus Ponens (MP), Modus Tollens (MT), Hypothetical Syllogism (HS), Disjunctive Syllogism (DS), Simplification (Simp), Conjunction (Conj), Addition (Add), Constructive Dilemma (CD).
- **10 replacement rules**: De Morgan (DM), Double Negation (DN), Commutation (Com), Association (Assoc), Distribution (Dist), Transposition (Trans), Material Implication (Impl), Material Equivalence (Equiv), Exportation (Exp), Tautology (Taut).

Conditional Proof (CP) and Indirect Proof (IP) are taught as techniques but exam problems are constructed to be solvable using only the 18 rules.

## 5. Source Format and Authoring Strategy

The book is authored in **PreTeXt**, a markup language designed specifically for OER STEM textbooks. PreTeXt was chosen because it compiles a single source to:

- Accessible PDF (Phase 1 deliverable)
- Accessible interactive HTML with MathJax (Phase 2)
- EPUB
- (Eventually) embeddable widgets

Writing in PreTeXt now means Phase 2 is a matter of *adding* features rather than rewriting in a different format. PreTeXt has institutional backing from the American Institute of Mathematics' Open Textbook Initiative.

All chapters are written fresh. Existing texts (Baronett, Hurley, Knachel, Hacking) serve as reference material to ensure logical correctness, but no copyrighted prose, examples, or exercises are reused. The lead author's own teaching materials — Spring 2026 seatwork, study guides, exams, summer notes, and forthcoming written notes — are the primary source material from which prose is drafted.

**Examples are stored in modular files** under `examples/` so that politically-current references can be swapped in a single file edit each election cycle, without re-authoring chapter prose. Example sets are versioned (e.g., "Spring 2026 examples," "Spring 2028 examples") so adopters can pin to a stable set.

## 6. Tools

### Proof Checker

The natural deduction proof checker already exists at `https://ivymoss.github.io/proofchecker/`, built by the lead author with Claude/Gemini assistance. The checker supports the 18 rules and CP/IP. Going forward:

- It is maintained directly in this monorepo at `proofchecker/`.
- It will be hosted at a stable custom domain (specifics TBD; candidates include `proofs.umwlogic.org`) plus a backup mirror, so the book can print a permanent URL.
- It requires an **accessibility audit and remediation pass** (keyboard-only operation, screen-reader announcements when proof state changes, focus management on add/remove line, semantic markup, no color-only feedback) before the Fall 2026 PDF prints its URL.
- A downloadable zip is provided as a fallback if hosting fails mid-semester.

### Truth Table Checker

To be built fresh. Specification:

- **Check-only.** Students input cell values; the tool grades them. The tool does not generate completed tables.
- **Three modes**: single-statement classification (tautology / self-contradiction / contingent), pair classification (logically equivalent / contradictory / consistent-but-not-equivalent / inconsistent-but-not-contradictory), and argument validity (any number of premises, validity tested by checking for rows where all premises are true and the conclusion is false).
- **Copi notation** with the same keyboard shortcuts as the proof checker (`->` for ⊃, `&` for ·, `v` for ∨, `<->` for ≡, `~` for ∼).
- **Auto-filled variable reference columns** in the standard binary-counting pattern (rightmost column alternates every row, next-left every two rows, next-left every four, next-left every eight). Capped at **4 variables / 16 rows**.
- **Two check modes, student-toggleable**: immediate feedback per cell (default for practice) and check-on-button (default for exam-prep mode).
- **No hint system** in v1 (would require pre-computed answers per problem).
- **Forced left-to-right, inside-out cell order** — students fill innermost subexpressions first.
- **Variables in order of first appearance** in the formula.
- **Phone-friendly** with a mobile load warning that recommends a laptop for this content.
- **Local save** via `localStorage` — refreshing the page does not lose work.
- **Screen-reader accessible** — proper `<table>` semantics, ARIA row and column indices, keyboard navigation, status announcements.
- **No persistence beyond local save in v1.** No share-across-users, no LTI, no backend.
- **Standalone page in Phase 1, embeddable iframe in Phase 2.**

Realistic engineering estimate: 1–2 focused weeks for the truth table checker plus 1–2 weeks for the proof checker accessibility remediation. Both well inside the May 2027 deadline.

### Canvas Modules

- **One module per book chapter** (~17 modules + optional Part V modules). Timing modulated manually by the instructor.
- **Built from scratch** alongside the book, with the lead author's existing emphasis-quizzes uploaded as primary source material rather than source of truth.
- **Quiz design uses Canvas's native question types**, not iframe embedding of the checkers. For truth tables, students enter the column of T/F values for a specified subexpression as a string (e.g., `TFTFTFTF`) into a fill-in-blank question with pattern matching. For natural deduction, students choose from candidate next lines (one valid use of a rule, others invalid uses) in multiple-choice questions. This keeps quizzes accessible, LMS-portable, and free of iframe headaches.
- **Exported in two formats**: Canvas Course Export (Canvas-native) and Common Cartridge (cross-LMS portable for Brightspace, Moodle, etc.).
- **Adaptable to fully-online sections**: the book and Canvas modules support both in-person and online delivery. For online sections, exams are still done on paper and uploaded as scans or photos.
- **Exams are not a grant deliverable.** They remain the lead author's IP. The grant covers the textbook, the truth table checker, and the Canvas module shell.
- **No instructional designer** required. The lead author has been authoring Canvas modules for years and owns this work.

## 7. Accessibility (Cross-Cutting Principle)

Accessibility is treated as a foundational requirement, not a Phase 2 polish. Concrete commitments:

- **Target standard**: WCAG 2.1 Level AA across the book HTML, the proof checker, the truth table checker, and Canvas modules.
- **Screen-reader testing as part of the Chapter 1 vertical slice**, so accessibility problems surface at the template stage, not at v1.
- **Keyboard-only operation** as a hard requirement for both tools.
- **No color-only feedback** anywhere — all status information must also be conveyed by text, icon, or screen-reader announcement.
- **Semantic markup** throughout PreTeXt (proper headings, lists, definitions, examples).
- **Alt-text discipline** on every figure; figures generated via PreTeXt's `<diagram>` element so alt-text is part of the figure source.
- **No chapter ships** until the rendered HTML and any associated tools have been tested with a real screen reader by a real user (or at minimum the lead author with VoiceOver / NVDA in the screen-reader's intended use mode).
- **Accessibility regression check** before every release.

The accessibility commitments are non-negotiable and apply to both Phase 1 and Phase 2 deliverables.

## 8. Repository, Versioning, and License

**Single monorepo** at GitHub: `umw-logic-textbook` (final org/name TBD). Public from day 1, with the understanding that drafts and in-progress work are visible.

**Commit access during development**: maintainers only (Reno, the named co-author, the librarian once on board, and a CS programmer when added). Issues and discussions are open. Pull requests from external contributors are not accepted until v1.0 ships, after which the contributor model opens up.

**Licenses**:

- **Book** (`book/`): CC BY-SA 4.0. *Risk*: VIVA Open Publishing may require CC BY 4.0 (without share-alike) for inclusion. To be confirmed before the November 2026 grant application. Fallback: switch to CC BY 4.0.
- **Tools** (`proofchecker/`, `truthtablechecker/`): MIT.

**Publishing path**: VIVA Open Publishing will host the canonical version of the book on their portal (OER Commons infrastructure). The GitHub monorepo is the source of truth and development hub; VIVA receives release tarballs.

**Versioning**: semantic versioning for the book (1.0.0 = first publishable release, 1.1.0 = chapter additions or significant improvements, 1.0.1 = errata patches). Tools versioned independently.

**Build reproducibility**: the PreTeXt version is pinned in the repo and a Dockerfile is included so anyone can rebuild the book in the same environment now and 10 years from now.

## 9. Team

- **Dr. Michael Reno** — PI, lead author, Canvas module developer, project manager.
- **UMW Philosophy colleague** — co-author, second pilot section instructor (named when she formally agrees to join the grant).
- **UMW librarian** — to be recruited (high-confidence; OER work counts toward librarian service load).
- **Talented UMW philosophy undergrads** — paid or for credit, primarily as cold-read pre-pilot reviewers and example-set contributors.
- **CS programmer** — Phase 2 hire for the interactive web book.
- **Drafting and editorial collaboration** — Claude (Anthropic), pulling from the lead author's primary source materials, drafting expository prose, and pushing back on design and pedagogical choices.

The grant requires at least 2–3 named team members at $5K + FICA each. The minimum-viable team of three (Reno + colleague + librarian) supports the $15K minimum award.

## 10. Funding

**Target**: VIVA Open Creation Grant, Fall 2026 application cycle.

- **Application deadline**: ~November 5, 2026 (assuming the prior cycle's calendar holds).
- **Award notification**: December 2026.
- **Initial payment**: ~March 2027.
- **Award range**: $15,000–$50,000. Targeting **$15,000 minimum** for the initial application; a follow-on Adopt or Course grant may be pursued in 2028 to fund Phase 2.
- **Required deliverables (per grant)**: textbook + accessibility statement + peer-review process + classroom pilot in a credit-bearing VA course + final report with assessment data.
- **Project window**: 2 years from award (~March 2027–March 2029).

The project proceeds whether or not the grant is awarded. The grant compensates work that would happen anyway.

## 11. Timeline

| Date | Milestone |
| --- | --- |
| **Apr–Aug 2026** | Chapter 1 vertical slice (Completed May 2026). Steady-state chapter drafting (Parts I–II). Recruit librarian. Begin grant application drafting. |
| **Sep–Nov 2026** | Drafting Parts III–IV. Submit grant application (~Nov 5). |
| **Dec 2026** | Grant notification. PDF v1 of textbook complete (independent of grant). |
| **Jan–May 2027** | Truth table checker built. Proof checker accessibility remediation. Canvas modules built alongside. |
| **Mar 2027** | Initial grant payment (if awarded). |
| **Summer 2027** | Pre-pilot in lead author's summer section of PHIL 151B. |
| **Fall 2027** | Official pilot: PHIL 151B at UMW (lead author's section + co-author's section). |
| **Fall 2027 onward** | Iteration based on pilot feedback. Optional additional adoptions. |
| **~Mar 2029** | Grant project completion. Final report submitted. |

The schedule is aggressive but achievable because the lead author has 10+ years of teaching materials that serve as primary source for chapter content, the proof checker already exists, and the truth-table checker is small enough to vibe-code with AI assistance.

## 12. Working Agreements

### Drafting workflow

- **Hybrid by section type**: Claude drafts expository prose and definitions; the lead author drafts examples and exercises. Trade for review.
- **Vertical slice first**: Chapter 1 is built end-to-end (PreTeXt source → rendered PDF + HTML → screen-reader pass → accompanying Canvas module) before moving to Chapter 2. This shakes out the toolchain and template.
- **Markdown drafts in chat → port to PreTeXt** for the first 2–3 chapters while we calibrate voice. Migrate to direct-to-PreTeXt once we are in rhythm.
- **Voice**: third-person impersonal for definitions, second-person for explanation. Tone in the Knachel family, less corny than Knachel but with occasional dad jokes welcome.
- **Examples — political content**: the lead author supplies many; Claude proposes some; partisan tone is acceptable. The lead author cuts what does not work.
- **Disagreements**: hashed out together until convergence. Claude pushes back when there is a real reason; the lead author has final say.
- **Co-author integration**: editor access on the GitHub repo. She edits drafts in-repo; the lead author carries her changes back into the conversation with Claude as needed.

### Cadence

- Initial sessions are conversational and chat-driven.
- Once we are past Chapter 3 or so, the cadence shifts to direct-to-PreTeXt with occasional chat sessions for harder structural questions.
- The lead author intends to write daily-to-near-daily during the Phase 1 push.

## 13. Chapter Template

Every chapter follows this structure:

1. **Chapter opener** — a single paragraph framing the chapter. No formal learning-outcomes box. No epigraph. Just: here's why this matters, here's what's coming.
2. **Sections** (3–6 per chapter). Each section contains:
   - Short prose intro in plain language.
   - Definitions in boxed callouts using PreTeXt's `<definition>` element.
   - Worked Examples in boxed callouts using PreTeXt's `<example>` element with accessible titles.
   - Practice Problems (2–4 per section) inline at end of section, with reveal-on-click solutions in HTML and selected solutions in a PDF appendix.
   - Cross-references to the proof checker / truth table checker where appropriate, using a standard "Try this in [tool]" callout.
3. **Chapter Summary** — boxed list of key concepts, optimized for fast lookup before exam.
4. **Key Terms** — alphabetized list of bolded terms with section pointers.
5. **End-of-Chapter Exercises** — larger problem set, organized by section, with mixed difficulty. Selected solutions in PDF appendix; full solutions in instructor's manual.
6. **Going Further (optional)** — pointer to deeper reading or extension topics, used selectively (especially in the statistics chapter).

### Conventions

- **Numbering**: PreTeXt's combined per-section numbering (Item 1.2.1 = chapter 1, section 2, item 1; type indicated by label). Lookup-friendly.
- **Definition and example labels**: use PreTeXt's auto-numbering; never hand-numbered.
- **Solutions split**: selected end-of-chapter solutions in PDF appendix; full solutions in instructor's manual that ships separately. Practice problems' solutions are inline / reveal-on-click in HTML.
- **Figures**: all generated via PreTeXt's `<diagram>` element with SVG output, so PDF and HTML get the same scalable graphic and alt-text is part of the source. This is especially important for the Venn diagrams in Part II.

## 14. Failure Mode Mitigations

Decisions made during the alignment interview about how we will plan for failure:

| Failure mode | Mitigation |
| --- | --- |
| Co-author drops out | Accepted risk. No designated backup. Solo continuation is acceptable. |
| Pedagogical errors in print | Smart-undergrad cold-read pre-pilot pass + public errata in repo + open issue tracker. The lead author may pay or offer credit to UMW philosophy undergrads for this work. |
| Stale political examples | All three mitigations: automated CI build pipeline (edit one example file → rebuild), versioned example sets (so adopters can pin), and a community-contributed example library that grows over time. |
| AI evolves past Copi notation as a deterrent | Accepted. The in-person exam is the real deterrent. Assignments should integrate "explain your proof" / "justify this step in your own words" question types that current AI is bad at. |
| Long-term maintenance after the lead author retires | Accepted. The book may freeze as a stable artifact rather than perpetual project. |
| Bad pilot feedback in Fall 2027 | Pre-pilot in Summer 2027 section gives an iteration cycle before the official pilot. |
| PreTeXt toolchain rot | Pin a known-good PreTeXt version in the repo. Include a Dockerfile so anyone can rebuild in the same environment indefinitely. |
| Mid-semester proof checker outage | Multi-domain hosting (e.g., GitHub Pages + Netlify mirror) plus a downloadable zip backup that students can run locally. |

## 15. Out of Scope (for now)

- Predicate logic in PHIL 151B (in the book as Part V, not in the course).
- Any persistence in the tools beyond `localStorage` (no server-side, no LTI sync, no cross-user sharing in Phase 1).
- Mobile-first design — mobile is supported as a degraded experience with a load warning, not an optimized target.
- An instructional designer on the team — the lead author owns Canvas module design.
- A new natural deduction proof checker — the existing one is reused, with accessibility remediation.

## 16. Open Items

These are smaller items intentionally deferred during the alignment interview. They will be resolved in the coming weeks and reflected back into this document.

- Confirm CC BY-SA acceptance by VIVA Open Publishing before the grant application.
- Concrete grant application drafting timeline and division of labor.
- Month-by-month project schedule, written after the Chapter 1 vertical slice yields real velocity data.
- Specifics of the online/hybrid teaching mode beyond "paper exams scanned and uploaded."
- Custom domain name for the proof checker and truth table checker.
- Final naming of the book, the project, and the GitHub organization.
- Whether the book absorbs the weekly writing assignments through richer end-of-chapter writing prompts, or whether the weekly writing track stays separate from the textbook. Decide after the Chapter 1 vertical slice gives us evidence about how end-of-chapter writing prompts feel in practice.
- HTML rendering of `<term>` elements: the LaTeX override in `book/xsl/custom-latex.xsl` strips the italic from terminology in the PDF; the HTML build needs an equivalent CSS override (target: `dfn.terminology { font-style: normal; }`). Defer to Phase 2 when the HTML theme work begins in earnest. Source still uses `<term>` for indexing/cross-referencing regardless.

## 17. Forward Dependencies (chapter-level)

Items planted in earlier chapters that *must* be paid off in later chapters. Add to this list whenever a chapter previews a topic it does not fully treat.

- **Chapter 1 §1.1** plants the explanation-vs-argument distinction with a one-line preview ("we'll come back to that resemblance later"). This requires a dedicated subsection in the later chapter on *recognizing arguments in the wild*. The subsection should make the contrast precise: an argument tries to get the audience to *accept* a claim by giving reasons for it; an explanation assumes the claim is already accepted and gives reasons *why it is true*. Same shape, different work.
- **Chapter 1 §1.1** previews *valid* and *sound* as labels, with a note that they apply to argument structure and not content. Definitions come in Chapter 2.
