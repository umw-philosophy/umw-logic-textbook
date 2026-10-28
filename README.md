# UMW Logic Textbook (working title)

An open educational resource for introductory logic, replacing textbooks in the tradition of Copi at the University of Mary Washington and offering an adoptable resource for other Virginia institutions and beyond.

## Canonical local checkout

The canonical local project folder is `/Users/michaelreno/Projects/umw-logic-textbook`.
Its Git remote is `git@github.com:umw-philosophy/umw-logic-textbook.git`.
Run project work, Git commands, and builds from this checkout. Configure the
Codex project's primary folder and the agent harness working directory to use
this path; see `AGENTS.md` for agent instructions.

`/Users/michaelreno/Downloads/Documents/Logic Project` contains legacy course
materials and generated outputs. It is not the textbook development checkout.
Semester teaching folders are separate course resources.

## Live tools

All four tools run in the browser, with no login or install, and are published on GitHub Pages:

| Tool | What it does | Link |
| --- | --- | --- |
| Proof checker | Natural deduction in Copi notation: the 18 implication and replacement rules, plus conditional and indirect proof | [Open](https://umw-philosophy.github.io/umw-logic-textbook/proofchecker/Accessiblev1/) |
| Truth table checker | Single-statement classification, pair classification, and argument validity | [Open](https://umw-philosophy.github.io/umw-logic-textbook/truthtablechecker/) |
| Venn diagram checker | Venn diagrams for categorical propositions and syllogisms | [Open](https://umw-philosophy.github.io/umw-logic-textbook/vennchecker/index.html) |
| Reconstruction editor | Reconstructing arguments in standard form | [Open](https://umw-philosophy.github.io/umw-logic-textbook/reconstructioneditor/) |

The proof checker link points to the accessible build (`proofchecker/Accessiblev1/`). It replaces the original at `ivymoss.github.io/proofchecker`, which is no longer maintained.

## What's in this monorepo

- **`book/`**: PreTeXt source for the textbook itself. It compiles to accessible PDF, HTML, and EPUB. See `book/BUILD.md`.
- **`proofchecker/`**: The natural deduction proof checker. `Accessiblev1/` is the current, accessible build.
- **`truthtablechecker/`**: The truth table checker.
- **`vennchecker/`**: The Venn diagram checker.
- **`reconstructioneditor/`**: The argument reconstruction editor.
- **`canvas/`**: Canvas course modules and quiz banks, exported as Common Cartridge (`.imscc`) bundles for adopters, plus the scripts that build them.
- **`examples/`**: A modular, swappable example library (politically current arguments, fallacy specimens, etc.). It is versioned so adopters can pin to a stable example set.
- **`docs/`**: Project documentation, including `PROJECT_PLAN.md` (the comprehensive plan) and `DECISIONS.md` (the chronological decision log).

## Status

The full textbook is drafted and was piloted in Summer 2026. All four companion tools are live, including the accessible proof checker. Current work is revision from the pilot, accessibility review, and preparing the book for open publication.

## Authors

- Dr. Michael Reno (UMW Philosophy)
- Drafting and editorial collaboration: Claude (Anthropic)

## License

- **Book** (`book/`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). This is subject to confirmation against VIVA Open Publishing requirements and may switch to CC BY 4.0 if needed.
- **Tools** (`proofchecker/`, `truthtablechecker/`): MIT

## Funding

The first-round application to the [VIVA Open Creation Grant](https://vivalib.org/va/open/grants/course) was submitted in October 2026.

## Accessibility

WCAG 2.1 AA is a hard requirement, treated as a cross-cutting principle rather than Phase 2 polish. See `docs/PROJECT_PLAN.md` for the full accessibility commitments and review process.
