# UMW Logic Textbook (working title)

An open educational resource for introductory logic, replacing commercial textbooks at the University of Mary Washington and offering an adoptable resource for other Virginia institutions and beyond.

## What's in this monorepo

- **`book/`** — PreTeXt source for the textbook itself. Compiles to accessible PDF, HTML, and EPUB.
- **`proofchecker/`** — Natural deduction proof checker (Copi-notation, 18 implication + replacement rules, plus conditional and indirect proof). Originally built at `ivymoss/proofchecker`; maintained here going forward.
- **`truthtablechecker/`** — Truth-table check tool (single-statement classification, pair classification, argument validity). Built fresh.
- **`canvas/`** — Canvas course modules, exported as Common Cartridge and Canvas Course Export bundles for adopters.
- **`examples/`** — Modular, swappable example library (politically-current arguments, fallacy specimens, etc.). Versioned so adopters can pin to a stable example set.
- **`docs/`** — Project documentation, including `PROJECT_PLAN.md` (the comprehensive plan) and `DECISIONS.md` (the chronological decision log).

## Status

**Phase 1** in progress: PDF textbook + linked external tools, targeting Fall 2026 draft and Fall 2027 pilot.

## Authors

- Dr. Michael Reno (UMW Philosophy, lead)
- UMW Philosophy colleague (co-author, named once committed)
- Drafting and editorial collaboration: Claude (Anthropic)

## License

- **Book** (`book/`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (subject to confirmation against VIVA Open Publishing requirements; may switch to CC BY 4.0 if needed)
- **Tools** (`proofchecker/`, `truthtablechecker/`): MIT

## Funding

Targeting the [VIVA Open Creation Grant](https://vivalib.org/va/open/grants/course), Fall 2026 application cycle.

## Accessibility

WCAG 2.1 AA is a hard requirement, treated as a cross-cutting principle and not a Phase 2 polish. See `docs/PROJECT_PLAN.md` for the full accessibility commitments and review process.
