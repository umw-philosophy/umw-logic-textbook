#!/usr/bin/env node
'use strict';

// Run with:  node probabilitychecker/logic-tests.js

const assert = require('node:assert/strict');
const core = require('./probability-core.js');
const bank = require('./probability-bank.js');

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ---------------------------------------------------------------- parsing
const P = (s) => core.parseAnswer(s);
assert.equal(P('3/13').ok, true);
assert.ok(close(P('3/13').value, 3 / 13));
assert.ok(close(P(' 0.25 ').value, 0.25));
assert.ok(close(P('.25').value, 0.25));
assert.ok(close(P('25%').value, 0.25));
assert.ok(close(P('9.0 %').value, 0.09));
assert.equal(P('25%').decimals, 2);
assert.equal(P('9.05%').decimals, 4);
assert.equal(P('').ok, false);
assert.equal(P('abc').ok, false);
assert.equal(P('5/0').ok, false);
assert.equal(P('7/5').ok, false);
assert.equal(P('25').ok, false);      // a bare 25 is not a probability
assert.equal(P('-0.2').ok, false);
assert.equal(P('1').ok, true);
assert.equal(P('0').ok, true);

// ---------------------------------------------------------------- comparing
const cmp = (s, target) => core.compare(P(s), target);
assert.equal(cmp('1/3', 1 / 3), 'correct');
assert.equal(cmp('2/6', 1 / 3), 'correct');
assert.equal(cmp('0.333', 1 / 3), 'correct');
assert.equal(cmp('0.33', 1 / 3), 'correct');
assert.equal(cmp('33.3%', 1 / 3), 'correct');
assert.equal(cmp('0.3', 1 / 3), 'imprecise');
assert.equal(cmp('0.34', 1 / 3), 'wrong');
assert.equal(cmp('1/4', 1 / 3), 'wrong');
assert.equal(cmp('0.265', 35 / 132), 'correct');
assert.equal(cmp('0.27', 35 / 132), 'correct');
assert.equal(cmp('0.42', 22 / 52), 'correct');
assert.equal(cmp('0.02', 1 / 52), 'imprecise');   // 4% off: needs more places
assert.equal(cmp('0.019', 1 / 52), 'correct');
assert.equal(cmp('1', 0.99), 'imprecise');
assert.equal(cmp('0.00', 0.0003), 'imprecise');
assert.equal(cmp('0.090', 0.0901639), 'correct');
assert.equal(cmp('9%', 0.0901639), 'correct');
assert.equal(cmp('0.99', 0.0901639), 'wrong');
assert.equal(cmp('0.5', 0.5), 'correct');

// ---------------------------------------------------------------- the deck
assert.equal(core.DECK.length, 52);
const n = (name) => core.DECK.filter(core.CARD_EVENTS.find((e) => e.name === name).test).length;
assert.equal(n('a heart'), 13);
assert.equal(n('a face card'), 12);
assert.equal(n('a red card'), 26);
assert.equal(n('an ace'), 4);
assert.equal(n('an 8'), 4);

// ---------------------------------------------------------------- generators
// Every problem, across many problem numbers: well-formed text, a probability
// strictly between 0 and 1, and a solution whose last line states the answer.
const seen = { basic: new Set(), conditional: new Set(), bayes: new Set() };
const N = 4000;
for (const mode of ['basic', 'conditional']) {
  for (const kind of core.KINDS[mode]) {
    for (let seed = 1; seed <= N; seed++) {
      const p = core.makeProblem(mode, kind.id, seed);
      const where = `${mode}/${kind.id}/${seed}: ${p.text}`;
      assert.ok(p.value > 0 && p.value < 1, 'answer strictly between 0 and 1 — ' + where);
      assert.ok(close(p.value, p.answer.n / p.answer.d), where);
      assert.ok(!/[{}]|undefined|NaN|null/.test(p.text + p.solution.join(' ')), 'clean text — ' + where);
      assert.ok(core.RULES[mode].some((r) => r.id === p.rule), 'known rule — ' + where);
      assert.ok(p.solution.length >= 2, where);
      // The student's own exact fraction and 3-place decimal must be accepted.
      assert.equal(core.compare(P(p.answer.n + '/' + p.answer.d), p.value), 'correct', where);
      const three = core.compare(P(p.value.toFixed(3)), p.value);
      assert.ok(three === 'correct' || (three === 'imprecise' && p.value < 0.02), 'three decimals accepted — ' + where);
      assert.equal(core.compare(P(p.value.toFixed(5)), p.value), 'correct', where);
      // Same number, same problem.
      assert.equal(core.makeProblem(mode, kind.id, seed).text, p.text);
      seen[mode].add(p.text);
    }
  }
}
assert.ok(seen.basic.size > 400, 'variety in basic problems: ' + seen.basic.size);
assert.ok(seen.conditional.size > 400, 'variety in conditional problems: ' + seen.conditional.size);

// The book's own exercises, found among generated problems, give the book's answers.
function find(mode, kind, re) {
  for (let seed = 1; seed <= 60000; seed++) {
    const p = core.makeProblem(mode, kind, seed);
    if (re.test(p.text)) return p;
  }
  throw new Error('No generated problem matches ' + re);
}
const frac = (p) => p.answer.n + '/' + p.answer.d;
assert.equal(frac(find('basic', 'single', /coin is flipped.*lands tails/)), '1/2');                 // 14.1
assert.equal(frac(find('basic', 'complement', /does not land on a 5/)), '5/6');                      // 14.2
assert.equal(frac(find('basic', 'add', /either a 2 or a 3\?/)), '2/13');                             // 14.3
assert.equal(frac(find('basic', 'genadd', /is a face card or a club\?/)), '11/26');                  // 14.4: 22/52
assert.equal(frac(find('basic', 'genadd', /is a heart or a face card\?/)), '11/26');                 // worked example
assert.equal(frac(find('conditional', 'given', /outcome is an odd number, .* outcome is a 3\?/)), '1/3'); // 14.7
assert.equal(frac(find('conditional', 'dependent', /both are aces\?/)), '1/221');                    // 14.8
assert.equal(frac(find('conditional', 'dependent', /both are hearts\?/)), '1/17');                   // worked example
assert.equal(frac(find('conditional', 'independent', /coin is flipped three times.*heads all three/)), '1/8'); // 14.10
assert.equal(frac(find('conditional', 'atleast', /coin is flipped three times.*at least one tail/)), '7/8');   // 14.11
const marbles = find('conditional', 'dependent', /holds 5 red and 7 blue marbles.*first is red and the second is blue/);
assert.equal(frac(marbles), '35/132');                                                               // 14.9

// ---------------------------------------------------------------- Bayes
assert.ok(bank.bayes.length >= 30);
for (const s of bank.bayes) {
  for (const [key, ph] of [['prior', '{p}'], ['tp', '{tp}'], ['fn', '{fn}'], ['fp', '{fp}'], ['tn', '{tn}']]) {
    assert.equal(s[key].split(ph).length, 2, `${s.id}.${key} must contain ${ph} exactly once`);
    assert.equal((s[key].match(/\{/g) || []).length, 1, `${s.id}.${key} has a stray placeholder`);
  }
  for (const key of ['setup', 'H', 'notH', 'E', 'notE', 'question']) {
    assert.ok(s[key] && !/[{}\d]/.test(s[key]), `${s.id}.${key} must have no numbers or placeholders`);
  }
  assert.ok(s.priorRange[0] < s.priorRange[1] && s.tpRange[0] < s.tpRange[1] && s.fpRange[0] < s.fpRange[1], s.id);
  assert.ok(s.fpRange[1] < s.tpRange[0], `${s.id}: evidence must be likelier under H than under ~H`);
}
assert.equal(new Set(bank.bayes.map((s) => s.id)).size, bank.bayes.length, 'unique story ids');

const storiesUsed = new Set();
for (const level of ['level1', 'level2']) {
  for (let seed = 1; seed <= N; seed++) {
    const p = core.makeProblem('bayes', level, seed);
    const v = p.values;
    const where = `bayes/${level}/${seed}`;
    storiesUsed.add(p.storyId);
    assert.ok(!/[{}]|undefined|NaN/.test(p.text + p.question + p.solution.join(' ')), where);
    assert.ok(close(v.pH + v.pNotH, 1), where);
    assert.ok(v.pEH > v.pENotH, where);
    // Independent recomputation by the counting method.
    const pop = 1e9;
    const truePos = pop * v.pH * v.pEH;
    const falsePos = pop * (1 - v.pH) * v.pENotH;
    assert.ok(close(v.posterior, truePos / (truePos + falsePos), 1e-9), where);
    assert.ok(v.posterior > 0 && v.posterior < 1, where);
    // The numbers printed in the problem are the numbers in the answer key.
    const pctText = (x) => String(Number((x * 100).toFixed(4))) + ' percent';
    const shows = (x) => p.text.includes(pctText(x));
    assert.ok(shows(v.pH) || /1 in [\d,]+/.test(p.text), 'prior appears — ' + where);
    assert.ok(p.given.usedFn ? shows(1 - v.pEH) : shows(v.pEH), 'P(E|H) appears — ' + where);
    assert.ok(p.given.usedTn ? shows(1 - v.pENotH) : shows(v.pENotH), 'P(E|~H) appears — ' + where);
    if (level === 'level1') assert.ok(!p.given.usedFn && !p.given.usedTn, where);
    if (level === 'level2') assert.ok(p.given.usedFn || p.given.usedTn, where);
    const m = p.text.match(/1 in ([\d,]+)/);
    if (m) assert.ok(close(1 / Number(m[1].replace(/,/g, '')), v.pH), 'the "1 in N" form matches P(H) — ' + where);
    assert.deepEqual(p.statements.map((s) => s.key).sort(), ['E', 'H', 'notE', 'notH']);
    // A correct setup is accepted in any legal order.
    const A = [v.pEH, v.pH]; const B = [v.pENotH, v.pNotH];
    const slots = (n1, n2, d1, d2, d3, d4) => ({ n1, n2, d1, d2, d3, d4 });
    assert.ok(core.checkBayesFormula(v, slots(A[0], A[1], A[0], A[1], B[0], B[1])).all, where);
    assert.ok(core.checkBayesFormula(v, slots(A[1], A[0], B[1], B[0], A[1], A[0])).all, where);
    assert.equal(core.compare(P(v.posterior.toFixed(3)), v.posterior) !== 'wrong', true, where);
  }
}
assert.equal(storiesUsed.size, bank.bayes.length, 'every story is reachable');

// The chapter's worked example: 1 in 1,000, 99 percent accurate both ways -> about 0.090.
const book = { pH: 0.001, pNotH: 0.999, pEH: 0.99, pENotH: 0.01, posterior: 0.00099 / 0.01098 };
assert.equal(core.compare(P('0.090'), book.posterior), 'correct');
let r = core.checkBayesFormula(book, { n1: 0.99, n2: 0.001, d1: 0.99, d2: 0.001, d3: 0.01, d4: 0.999 });
assert.deepEqual([r.numerator, r.termA, r.termB, r.all], [true, true, true, true]);
// Wrong setups are caught, product by product.
r = core.checkBayesFormula(book, { n1: 0.01, n2: 0.999, d1: 0.99, d2: 0.001, d3: 0.01, d4: 0.999 });
assert.deepEqual([r.numerator, r.all], [false, false]);
assert.match(r.hint, /~H term/);
r = core.checkBayesFormula(book, { n1: 0.99, n2: 0.001, d1: 0.99, d2: 0.001, d3: 0.99, d4: 0.001 });
assert.deepEqual([r.numerator, r.termA, r.termB, r.all], [true, true, false, false]);
r = core.checkBayesFormula(book, { n1: 0.99, n2: 0.001, d1: 0.99, d2: 0.001, d3: 0.01, d4: 0.001 });
assert.deepEqual([r.termA, r.termB, r.all], [true, false, false]);   // forgot P(~H)
r = core.checkBayesFormula(book, { n1: 0.99, n2: 0.999, d1: 0.99, d2: 0.001, d3: 0.01, d4: 0.999 });
assert.equal(r.numerator, false);
r = core.checkBayesFormula(book, { n1: null, n2: 0.001, d1: 0.99, d2: 0.001, d3: 0.01, d4: 0.999 });
assert.equal(r.all, false);
// Common wrong final answers are named.
assert.match(core.diagnoseBayes(book, 0.99), /P\(E \| H\)/);
assert.match(core.diagnoseBayes(book, 0.001), /prior/);
assert.match(core.diagnoseBayes(book, 0.00099), /top of the fraction/);
assert.match(core.diagnoseBayes(book, 1 - book.posterior), /P\(~H \| E\)/);
assert.equal(core.diagnoseBayes(book, 0.4), '');

console.log('All probability tests passed.');
console.log(`  ${seen.basic.size} distinct basic problems and ${seen.conditional.size} distinct conditional problems in ${N} numbers per type`);
console.log(`  ${bank.bayes.length} Bayes stories, each with generated numbers at two levels`);
