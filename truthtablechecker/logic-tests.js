#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const core = require('./truth-table-core.js');

function bools(values) {
  return values.map(v => (v ? 'T' : 'F')).join('');
}

assert.equal(core.normalize('[A -> B]'), '(A ⊃ B)');
assert.equal(core.normalize('A & B'), 'A · B');
assert.equal(core.normalize('A * B'), 'A · B');
assert.equal(core.normalize('A ^ B'), 'A · B');
assert.equal(core.normalize('A <-> B'), 'A ≡ B');
assert.equal(core.normalize('¬A'), '~A');
assert.throws(() => core.parseTopLevel('p'), /capital letters/);
assert.throws(() => core.parseTopLevel('A ⊃ B · C'), /Unexpected/);

const atoms = core.buildModel('single', [{ key: 's', text: 'P ⊃ (Q · R)' }]);
assert.deepEqual(atoms.vars, ['P', 'Q', 'R']);
assert.deepEqual(atoms.rows.map(row => `${row.P ? 'T' : 'F'}${row.Q ? 'T' : 'F'}${row.R ? 'T' : 'F'}`), [
  'TTT', 'TTF', 'TFT', 'TFF', 'FTT', 'FTF', 'FFT', 'FFF',
]);

const negConj = core.buildModel('single', [{ key: 's', text: '~(P · Q)' }]);
assert.deepEqual(negConj.columns.map(c => c.label), ['P · Q', '~(P · Q)']);
assert.equal(bools(negConj.columns[0].values), 'TFFF');
assert.equal(bools(negConj.columns[1].values), 'FTTT');

const repeated = core.buildModel('single', [{ key: 's', text: '(P · Q) ≡ (P · Q)' }]);
assert.deepEqual(repeated.columns.map(c => c.label), ['P · Q', 'P · Q', '(P · Q) ≡ (P · Q)']);
assert.notEqual(repeated.columns[0].id, repeated.columns[1].id);

function singleClass(formula) {
  const model = core.buildModel('single', [{ key: 's', text: formula }]);
  const finalCol = model.columns.find(c => c.id === model.finalColumns.s);
  return core.classifyStatement(finalCol.values);
}

assert.equal(singleClass('P ∨ ~P'), 'tautology');
assert.equal(singleClass('P · ~P'), 'self-contradiction');
assert.equal(singleClass('P ⊃ Q'), 'contingent');

function pairClass(left, right) {
  const model = core.buildModel('pair', [
    { key: 'left', text: left },
    { key: 'right', text: right },
  ]);
  const formula = key => model.formulas.find(f => f.key === key);
  const valuesFor = key => {
    const colId = model.finalColumns[key];
    const col = colId ? model.columns.find(c => c.id === colId) : null;
    return col ? col.values : model.rows.map(row => core.evaluate(formula(key).ast, row));
  };
  const l = valuesFor('left');
  const r = valuesFor('right');
  return core.classifyPair(l, r);
}

assert.equal(pairClass('P ⊃ Q', '~P ∨ Q'), 'equivalent');
assert.equal(pairClass('P · Q', '~(P · Q)'), 'contradictory');
assert.equal(pairClass('P', 'P ∨ Q'), 'consistent-not-equivalent');
assert.equal(pairClass('P · Q', '~P'), 'inconsistent-not-contradictory');

function argValidity(premises, conclusion) {
  const raw = premises.map((text, i) => ({ key: `p${i}`, role: 'premise', text }));
  raw.push({ key: 'conclusion', role: 'conclusion', text: conclusion });
  const model = core.buildModel('argument', raw);
  const valuesFor = key => {
    const colId = model.finalColumns[key];
    const col = colId ? model.columns.find(c => c.id === colId) : null;
    const formula = model.formulas.find(f => f.key === key);
    return col ? col.values : model.rows.map(row => core.evaluate(formula.ast, row));
  };
  const premiseValues = premises.map((_, i) => valuesFor(`p${i}`));
  const conclusionValues = valuesFor('conclusion');
  return core.validity(premiseValues, conclusionValues);
}

assert.deepEqual(argValidity(['P ⊃ Q', 'P'], 'Q'), { valid: true, counterexamples: [] });
assert.deepEqual(argValidity(['P ⊃ Q', 'Q'], 'P'), { valid: false, counterexamples: [2] });

assert.equal(core.problems.single.length >= 12, true);
assert.equal(core.problems.pair.length >= 12, true);
assert.equal(core.problems.argument.length >= 12, true);

for (const list of Object.values(core.problems)) {
  for (const problem of list) {
    assert.doesNotMatch(
      problem.title,
      /tautolog|contradict|contingent|equivalent|consistent|inconsistent|valid|invalid|modus|syllogism|dilemma|transposition|implication|morgan|impossible|counterexample/i,
    );
    if (problem.formula) core.parseTopLevel(problem.formula);
    if (problem.left) core.parseTopLevel(problem.left);
    if (problem.right) core.parseTopLevel(problem.right);
    if (problem.premises) problem.premises.forEach(p => core.parseTopLevel(p));
    if (problem.conclusion) core.parseTopLevel(problem.conclusion);
  }
}

console.log('Truth table checker logic tests passed.');
