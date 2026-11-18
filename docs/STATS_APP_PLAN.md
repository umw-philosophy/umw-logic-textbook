# Statistics Practice (Chapter 15) — build plan

Companion practice tool for Chapter 15, *Statistical Reasoning*. HTML, CSS, and vanilla JavaScript only, served from GitHub Pages like the other tools. Agreed 2026-11-18.

## Scope

Numeric work only, matching the Chapter 14 probability tool. Every field the student fills in is checked by the program. Interpretation questions (which claim is more honest, what a 95% interval means) stay with the book and Canvas Quiz 22. Where an exercise turns on a judgment with one right answer (does this poll show a majority?), the app asks it as a drop-down choice: the program wrote the data, so it knows the answer.

## Shell and conventions (copied from `probabilitychecker/`)

- Folder `statisticschecker/`: `index.html`, `stats-core.js`, `stats-bank.js`, `logic-tests.js`, and later `story-prompt.md`.
- `stats-core.js` has no page code, so it runs in the browser and in Node. It reuses the seeded generator and hashed problem number from `probability-core.js`. Every answer is computed from the numbers used to write the problem; nothing is stored as a pre-written answer. Checking also lives in the core, so the tests cover it.
- `stats-bank.js` holds wording only (contexts, units, plausible ranges). The program supplies every number.
- Page: blue header "Statistics Practice / Chapter 15: Statistical Reasoning", mode tabs, problem type, level, problem number, Load Number, New Problem. Problem panel beside a Reference panel with collapsible rule summaries and the session tally.
- Behavior: a ✓ or ✗ mark beside each field; a "correct / correct but rounded too coarsely / wrong" verdict; Show Solution unlocks after the first check; the worked solution is a numbered list that takes keyboard focus; session tally only, nothing saved between visits.
- **Jingle.** When the whole problem is first correct, play the same rising C–E–G–C arpeggio the proof checker and probability tool play (Web Audio API, no audio file). Once per problem.

## Modes and problem types

| Tab (section) | Problem types | Steps the student types |
|---|---|---|
| **Center** (§15.1) | Mean; median (odd and even counts); mode (none, one, two); choosing a measure; shape from mean and median | Sorted list → middle value(s) → median. Sum and count → mean. Mode, or "none", plus no mode / unimodal / bimodal. "Which measure describes a typical value?" Skew direction from mean − median (Ex. 6). |
| **Spread** (§15.2) | Range; standard deviation by hand; standard deviation of a larger dataset; how many SDs from the mean | The six steps as a real table: mean, each deviation and squared deviation, sum, ÷ (n − 1), square root. The larger-dataset type checks only the final answer and gives the data on one line to copy into a spreadsheet (STDEV.S). |
| **Normal** (§15.3) | Within k SD; one tail; count out of N; score marking a boundary; "is this value unusual?" | Value → number of SDs from the mean → percent → count. Boundary type runs backward: top 16% → +1 SD → score. |
| **Margin of error** (§15.4) | Interval from n; margin from a stated interval; majority check; lead check | Margin looked up from the book's six sample sizes → low and high ends. Then a choice: whole interval above 50% / interval includes 50% / the two intervals overlap. |
| **Thresholds** (§15.5) | False-negative and false-positive rates; cutoffs at k SD (1, 1.5, 2, 2.5, 3); share of healthy people flagged; direction of change | 1 − sensitivity, 1 − specificity; μ ± kσ; drop-downs for what happens to sensitivity, specificity, false positives, false negatives when the threshold widens or narrows. Links to the Chapter 14 Bayes tab for what a positive result means. |
| **Distortions** (§15.6) | Truncated axis; picture scaled by height; relative vs. absolute risk; percent change from different start years | Actual percent difference vs. apparent ratio of bar heights; area ratio k²; absolute reduction in percentage points vs. relative reduction in percent. The truncated-axis chart is drawn from the program's numbers, with every number also stated in the text. |

Two levels per type: Level 1 uses small whole numbers; Level 2 uses larger datasets, means ending in .5, money, and decimals. For the hand-calculation types the student enters every value (the rule used for the Chapter 14 Bayes problems); the larger-dataset type is the only one that skips steps.

## Checking

- Number reader accepts negatives (including the typographic minus), thousands separators, `$`, a trailing unit word, and `%` in percent fields.
- The program chooses data so every intermediate value is exact. Values that cannot be exact (the square root; a variance divided by 7) must be correct to two places, per the book. A standard deviation computed from a variance already rounded to two places is also accepted.
- Common mistakes are named when an answer matches a known wrong value: dividing by n instead of n − 1; entering the variance; summing unsquared deviations; not sorting; taking one middle value for an even count; entering a number when there is no mode, or the mode's frequency instead of the value; giving the within-percent when the tail was asked, or 5 instead of 2.5; giving the interval's width as the margin; k instead of k²; relative reduction where absolute was asked.

## Accessibility (WCAG 2.1 AA)

Every input labelled and linked to its mark with `aria-describedby`. The deviation table is a real `<table>` whose cells have names such as "Squared deviation for 70". No dragging; keyboard only works. Marks say right or wrong in words, not only color. Charts are `role="img"` with full text equivalents; no problem depends on seeing a chart. Works on a phone.

## Tests (`node statisticschecker/logic-tests.js`)

Number reader and verdicts; several hundred problem numbers per type (exact intermediates, whole-number counts, only the six table sample sizes, no named mistake equal to the right answer); the chapter's worked examples and odd-numbered exercises rebuilt as fixed problems and compared with `appendix-solutions.ptx`.

## Build order

1. `stats-core.js` and tests for Center and Spread.
2. `index.html`, ported from the probability tool.
3. Normal, Margin of error, Thresholds, Distortions.
4. More bank contexts, with a `story-prompt.md` so Gemini can draft wording (words only, so it cannot introduce a wrong answer).
5. Accessibility and phone pass.
6. README row (the README also lacks the probability tool) and a D-037 entry in `DECISIONS.md`.

Steps 2 and 4 can go to a cheaper model; step 1 and the tests should stay with a stronger one.

## Chapter 15 issues the app exposes

- **Pine-tree example (ch-statistical-reasoning.ptx line 570):** text says 68% but computes 500 × 0.682 ≈ 341. With 68%, it is 340.
- **Margin-of-error table:** five of six figures fit 0.98/√n; the 600-person figure should be 4.0%, not 4.1%. The worked poll example uses ±4 (48–56%); Set 4's instructions repeat 4.1.
- ~~**Tails are exercised but not taught.**~~ Fixed 2026-11-18: §15.3 now states the halving step.
- **Set 5, plagiarism exercise:** asks for "the false-positive rate as a percentage of all papers submitted." §15.5 defines that rate over legitimate papers only (about 6.1% here), not all papers (6%). Suggested rewording: "what share of all submitted papers are false positives."

## Decisions (2026-11-18)

1. **From the Book set: yes.** A fifth tab loads the odd-numbered exercises answered in `appendix-solutions.ptx`, numeric parts only: 1, 3, 5, 7, 11, 13, 15, 17, 19, 23. The rest (9, 21, 25, 27, 29, and the writing prompt) are written answers. `logic-tests.js` reads the appendix and fails if any app answer is not stated there, so the two cannot drift apart silently.
2. **Normal tab follows Exercise Set 3:** within 1, 2, or 3 SD; one tail above or below a cutoff (with counts out of N at Level 2); the value marking a top or bottom boundary, or the two ends of a middle band; and whether a value is unusual (beyond 2 SD) or extremely unusual (beyond 3 SD). The 34 / 13.5 / 2.35% band areas stay out.
3. **§15.3 now teaches the halving step** (one tail = half of what lies outside a band: 16%, 2.5%, 0.15%), added just after the empirical rule.

## Status

Built: Center, Spread, Normal, From the Book. Next: Margin of error, Thresholds, Distortions; then the story prompt, accessibility pass, README row, and D-037.
