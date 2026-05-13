# Chapter 12 — Conditional Proof and Indirect Proof: Outline

## Pedagogical Setup
- Ch. 10 introduced the 8 implication rules
- Ch. 11 introduced the 10 replacement rules, completing the 18-rule system
- Ch. 11's "Where We're Headed" previewed CP and IP as proof *strategies*, not new rules
- This chapter teaches both strategies and shows how they expand what students can prove efficiently

## Key Concepts
1. **CP and IP are not new rules of inference** — they are strategies for organizing proofs
2. Both use **assumptions** that open a **scope** (indented, vertical line)
3. Both **discharge** the assumption at the end, citing the line range

### Conditional Proof (CP)
- **When to use**: target is a conditional (𝒜 ⊃ ℬ)
- **Procedure**: Assume 𝒜 (the antecedent) → derive ℬ (the consequent) inside scope → discharge: line-range CP → produces 𝒜 ⊃ ℬ
- **Justification**: "Assume for CP" on assumption line; "n–m CP" on discharge line

### Indirect Proof (IP)
- **When to use**: direct proof seems impossible; want to prove φ
- **Procedure**: Assume ~φ → derive an explicit contradiction (P · ~P via Conj) → discharge: line-range IP → produces ~(assumption), i.e., one tilde prepended to whatever the assumption line says
- **Justification**: "Assume for IP" on assumption line; "n–m IP" on discharge line
- **Important**: IP gives you ~(the assumption). If you assumed ~Q, IP gives ~~Q. You typically need DN to clean up.

## Section Plan

### §12.1 — Two New Strategies
- CP and IP are not additional rules — they are organizational strategies
- Both use assumptions and scoped subproofs
- Motivating scenario: proofs where the conclusion doesn't appear in the premises
- When to reach for CP vs. IP

### §12.2 — Conditional Proof
- The CP procedure step by step
- Format: assumption line, scope/indentation, discharge line
- The user's CP example as the primary worked proof
- A simpler CP example first
- When CP is the right strategy (target is a conditional)
- Can use any of the 18 rules inside the scope

### §12.3 — Indirect Proof
- The IP procedure step by step
- Format: assumption line, scope/indentation, derive contradiction, discharge
- The user's IP example as the primary worked proof
- A simpler IP example first
- Key point: IP gives ~(assumption) — one tilde on the front
- When IP is the right strategy (direct proof stuck; no obvious CP target)

### §12.4 — Strategy: Choosing Between CP and IP
- Decision heuristic: Is the target a conditional? → Try CP. Otherwise → Try IP.
- Can you nest CP inside IP or vice versa? (Yes, but rarely needed at this level)
- Common mistakes: forgetting to discharge, using lines from inside scope after discharge, not building explicit contradiction for IP

### §12.5 — Where We're Headed
- Brief: this completes the sentential logic toolkit
- Part IV will shift to inductive and statistical reasoning
- Everything from Parts I–III is foundational for evaluating arguments in the broader sense

### Chapter Summary
- Section-by-section recap

### Key Terms
- Alphabetical dl list

### End-of-Chapter Exercises
- Exercise Set 1: Identify the strategy (given a proof goal, say CP or IP)
- Exercise Set 2: Complete the CP proof (premises + assumption given, fill in steps)
- Exercise Set 3: Complete the IP proof (premises + assumption given, fill in steps)
- Exercise Set 4: Full proofs using CP or IP

## Tone Targets
- Conversational hook: "Every valid argument can be proven with the 18 rules. But some proofs are brutally hard to find without a better strategy."
- Second-person throughout
- Metacognitive aside for the scope concept (students find it confusing)
- Dry humor about the "assume the opposite and blow things up" nature of IP
- Anticipate confusion about what IP gives you (~assumption, not the target directly)

## Proof Format (from user's handwritten examples)
- Indented lines with vertical scope line (|) for assumption block
- "Assume for CP" / "Assume for IP" as justification
- Discharge: "n–m CP" / "n–m IP" citing the line range
- IP contradiction must be EXPLICIT: P · ~P built via Conj
- IP discharge produces ~(assumption) — one tilde prepended
- Lines inside scope can use any of the 18 rules + earlier non-scoped lines
- Lines inside scope CANNOT be used after the scope closes
