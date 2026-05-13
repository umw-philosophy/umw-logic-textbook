# Chapter 11 — Replacement Rules: Outline

## Pedagogical Setup
- Ch. 10 introduced the 8 implication rules (MP, MT, HS, DS, Simp, Conj, Add, CD)
- Ch. 10 previewed DN in one worked proof
- Ch. 10's "Where We're Headed" promises: De Morgan, DN, Material Implication, Material Equivalence
- This chapter adds the 10 replacement rules to complete the 18-rule system

## Key Conceptual Difference from Implication Rules
1. **Bidirectional**: replacement rules work in both directions (equivalences, not one-way inferences)
2. **Applicable to subformulas**: can rewrite a *part* of a line, not just the whole line
3. These two differences need explicit, careful explanation — students confuse them constantly

## Section Plan

### §11.1 — What Replacement Rules Are
- The two key differences (bidirectional, subformula-applicable)
- Why we need them: implication rules alone can't handle many valid arguments
- A motivating example: an argument provably valid by truth table but unprovable with only implication rules
- Conversational hook / tone moment here

### §11.2 — The Ten Replacement Rules
Present each rule as a schema with metavariables (matching Ch. 10 conventions):

1. **De Morgan's Theorems (DeM)**
   - ~(𝒜 · ℬ) ≡ (~𝒜 ∨ ~ℬ)
   - ~(𝒜 ∨ ℬ) ≡ (~𝒜 · ~ℬ)
2. **Commutation (Com)**
   - (𝒜 · ℬ) ≡ (ℬ · 𝒜)
   - (𝒜 ∨ ℬ) ≡ (ℬ ∨ 𝒜)
3. **Association (Assoc)**
   - (𝒜 · (ℬ · 𝒞)) ≡ ((𝒜 · ℬ) · 𝒞)
   - (𝒜 ∨ (ℬ ∨ 𝒞)) ≡ ((𝒜 ∨ ℬ) ∨ 𝒞)
4. **Distribution (Dist)**
   - 𝒜 · (ℬ ∨ 𝒞) ≡ (𝒜 · ℬ) ∨ (𝒜 · 𝒞)
   - 𝒜 ∨ (ℬ · 𝒞) ≡ (𝒜 ∨ ℬ) · (𝒜 ∨ 𝒞)
5. **Double Negation (DN)**
   - 𝒜 ≡ ~~𝒜
6. **Transposition / Contraposition (Trans)**
   - (𝒜 ⊃ ℬ) ≡ (~ℬ ⊃ ~𝒜)
7. **Material Implication (Impl)**
   - (𝒜 ⊃ ℬ) ≡ (~𝒜 ∨ ℬ)
8. **Material Equivalence (Equiv)**
   - (𝒜 ≡ ℬ) ≡ ((𝒜 ⊃ ℬ) · (ℬ ⊃ 𝒜))
   - (𝒜 ≡ ℬ) ≡ ((𝒜 · ℬ) ∨ (~𝒜 · ~ℬ))
9. **Exportation (Exp)**
   - ((𝒜 · ℬ) ⊃ 𝒞) ≡ (𝒜 ⊃ (ℬ ⊃ 𝒞))
10. **Tautology (Taut)**
    - 𝒜 ≡ (𝒜 · 𝒜)
    - 𝒜 ≡ (𝒜 ∨ 𝒜)

### §11.3 — Worked Proofs
- 3–4 proofs of increasing complexity mixing implication + replacement rules
- Emphasis on *when* to reach for a replacement rule (strategic thinking)
- Include at least one proof that requires De Morgan's and one that requires Impl

### §11.4 — Strategy for Replacement Rules
- When to use which rule (pattern-matching advice)
- Common student mistakes (applying implication rules bidirectionally, applying replacement rules only to whole lines)
- "When you are stuck" revisited with replacement rules in the toolkit

### §11.5 — Where We're Headed
- Brief pivot to Conditional Proof and Indirect Proof (next chapter)
- These are the last tools needed for a complete sentential proof system

### Chapter Summary
- Section-by-section recap in the established format (alert-tagged section titles)

### Key Terms
- Alphabetical dl list with section references (matching Ch. 10 format)

### End-of-Chapter Exercises
- Exercise Set 1: Identify the replacement rule (given a line transformation, name the rule)
- Exercise Set 2: Apply a single replacement rule (rewrite a formula)
- Exercise Set 3: Short proofs using implication + replacement rules
- Exercise Set 4: Explain the strategy (which rule would you try first and why)

## Tone Targets
- Conversational opening hook (not just "Chapter 10 introduced...")
- Second-person "you" throughout
- Metacognitive asides for De Morgan's (students find it counterintuitive) and Material Implication
- At least 2 dry humor moments in parentheticals
- Anticipate student confusion about bidirectionality vs. one-way rules
