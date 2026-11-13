# Prompt for drafting more Bayes stories

Paste everything below the line into Gemini (or any model). Save the reply as a `.json` file and hand it to Claude to check and merge into `probability-bank.js`. The stories supply words only. The app generates the numbers and computes every answer, so a drafted story cannot introduce a wrong answer; what needs checking is that each sentence says what its field claims.

---

You are drafting story templates for a browser practice app that accompanies the probability chapter of an introductory college logic textbook. A program fills in the numbers; you write only the words. Reply with one JSON array of 30 objects and nothing else: strictly valid JSON, double quotes, no comments, no trailing commas, no Markdown fence.

Each object is a two-hypothesis Bayes' theorem problem of the "screening test or detector" shape: a hypothesis that is true or false of a randomly chosen case, and a piece of evidence (a signal that fired).

Style rules:

- Plain, concrete English for first-year undergraduates. One idea per sentence. No jokes and no exclamation marks.
- Timeless scenarios: no real people, brands, current events, politics, or dates.
- Nothing involving race, ethnicity, religion, sexuality, immigration, mental illness, suicide, pregnancy, or terrorism.
- Spread the topics: medicine (at most a quarter), campus life, technology, law and forensics, sports, weather, nature and agriculture, manufacturing, everyday life.
- State the hypothesis positively. Avoid a hypothesis that is itself a negation ("the cap is not sealed"); write "the cap has a faulty seal" instead.
- Put no digits and no number words for probabilities in any field. Use only the placeholders below.
- `{p}` is replaced by either "4 percent" or "1 in 250", so the sentence must read correctly with both. "{p} of the parts are defective" works. "a {p} chance" does not.
- Every other placeholder is replaced by "N percent". "{tp} of the time" is a good pattern.
- Never use the letters H or E as labels in the text. The student has to work out which statement is the hypothesis and which is the evidence.

Fields, all required:

- `id`: short unique kebab-case string.
- `topic`: one of "medical", "campus", "technology", "legal", "everyday", "sports", "nature", "manufacturing".
- `setup`: one or two sentences of context, with no numbers and no placeholders.
- `H`: the hypothesis as a full clause, lowercase first letter, no final period.
- `notH`: its negation.
- `E`: the evidence as a full clause.
- `notE`: its negation.
- `prior`: one sentence giving the base rate of the hypothesis, with `{p}` exactly once.
- `tp`: one sentence saying how often the evidence occurs when the hypothesis is true, with `{tp}` exactly once.
- `fn`: the same fact the other way round, how often the evidence fails to occur when the hypothesis is true, with `{fn}` exactly once.
- `fp`: one sentence saying how often the evidence occurs when the hypothesis is false, with `{fp}` exactly once.
- `tn`: the same fact the other way round, how often the evidence correctly does not occur when the hypothesis is false, with `{tn}` exactly once.
- `question`: say that the evidence occurred in a particular case, then ask for the probability that the hypothesis is true. No numbers.
- `priorRange`: `[low, high]`, a plausible range for the base rate, between 0.001 and 0.5.
- `tpRange`: `[low, high]`, a plausible range for the true-positive rate, between 0.5 and 0.99.
- `fpRange`: `[low, high]`, a plausible range for the false-positive rate, between 0.01 and 0.3. Its high end must be below the low end of `tpRange`.

Before you reply, check each story: `tp` and `fn` are both about cases where the hypothesis is true; `fp` and `tn` are both about cases where it is false; `tp` and `fp` describe the same evidence event.

One finished example:

{
  "id": "card-fraud-alert",
  "topic": "technology",
  "setup": "A bank scores every card purchase for signs of fraud. The system sends an alert when a purchase gets a high score.",
  "H": "the card purchase is fraudulent",
  "notH": "the card purchase is legitimate",
  "E": "the system sends an alert for the purchase",
  "notE": "the system does not send an alert for the purchase",
  "prior": "Of all card purchases made by a bank's customers, {p} are fraudulent.",
  "tp": "When a purchase is in fact fraudulent, the system sends an alert {tp} of the time.",
  "fn": "When a purchase is in fact fraudulent, the system fails to send an alert {fn} of the time.",
  "fp": "When a purchase is legitimate, the system sends an alert anyway {fp} of the time.",
  "tn": "When a purchase is legitimate, the system correctly sends no alert {tn} of the time.",
  "question": "The system sends an alert for a card purchase. What is the probability that the purchase is actually fraudulent?",
  "priorRange": [
    0.001,
    0.01
  ],
  "tpRange": [
    0.8,
    0.95
  ],
  "fpRange": [
    0.02,
    0.08
  ]
}

Do not reuse these scenarios, which are already in the bank: banknote-marker-pen, battery-cell-tester, bottle-cap-seal-check, bowling-pin-sensor, campus-forecast-rain, campus-parking-camera, campus-shuttle-tracker, car-low-fuel-light, card-fraud-alert, check-watermark-review, circuit-board-solder-joint, dental-cavity-scanner, doorbell-motion-alert, egg-crack-scanner, email-spam-filter, essay-ai-detector, fingerprint-lab-match, goal-line-camera, highway-camera-stolen-list, highway-traffic-app, iron-deficiency-blood-test, kitchen-smoke-alarm, library-book-gate, orchard-frost-warning, paint-batch-color-sensor, peanut-skin-test, ranger-station-smoke-sensor, rapid-strep-test, recreation-center-turnstile, salad-freshness-label, self-checkout-scale, shot-clock-sensor, ski-race-start-gate, speed-camera-county-road, stadium-ticket-scanner, stamping-press-die-sensor, student-login-alert, trail-camera-deer, wrist-fracture-program.
