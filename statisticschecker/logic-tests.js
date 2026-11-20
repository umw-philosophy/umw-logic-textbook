#!/usr/bin/env node
'use strict';

// Run with:  node statisticschecker/logic-tests.js

const assert = require('node:assert/strict');
const core = require('./stats-core.js');
const I = core._internals;

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const sd = (xs) => {
  const m = I.sum(xs) / xs.length;
  return Math.sqrt(I.sum(xs.map((x) => (x - m) * (x - m))) / (xs.length - 1));
};

// ---------------------------------------------------------------- reading numbers
const P = (s, o) => core.parseNumber(s, o);
assert.equal(P('49.5').value, 49.5);
assert.equal(P('-15').value, -15);
assert.equal(P('−15').value, -15);          // typographic minus
assert.equal(P('1,612,600').value, 1612600);
assert.equal(P('$161,260').value, 161260);
assert.equal(P('-$5').value, -5);
assert.equal(P('11.18 points').value, 11.18);
assert.equal(P('160 mg/dL').value, 160);
assert.equal(P('.5').value, 0.5);
assert.equal(P('11.18').decimals, 2);
assert.equal(P('68%', { percent: true }).value, 68);
assert.equal(P('68%').ok, false);                 // not a percent field
assert.equal(P('').ok, false);
assert.equal(P('abc').ok, false);
assert.equal(P('1-2').ok, false);

// ---------------------------------------------------------------- verdicts
const V = (s, t) => core.verdict(P(s), t);
const ex = I.exactT; const rd = I.roundT;
assert.equal(V('75', ex(75)), 'correct');
assert.equal(V('75.0', ex(75)), 'correct');
assert.equal(V('17.5', ex(17.5)), 'correct');
assert.equal(V('18', ex(17.5)), 'imprecise');      // rounded an exact value
assert.equal(V('17', ex(17.5)), 'wrong');
assert.equal(V('11.18', rd(Math.sqrt(125))), 'correct');
assert.equal(V('11.180', rd(Math.sqrt(125))), 'correct');
assert.equal(V('11.2', rd(Math.sqrt(125))), 'imprecise');
assert.equal(V('11', rd(Math.sqrt(125))), 'imprecise');
assert.equal(V('11.17', rd(Math.sqrt(125))), 'wrong');
assert.equal(V('11.19', rd(Math.sqrt(125))), 'wrong');
assert.equal(I.roundTo(2.675, 2), 2.68);
assert.equal(I.roundTo(-12.5, 0), -13);
assert.ok(rd(125).exact);
assert.ok(!rd(288 / 7).exact);

// ---------------------------------------------------------------- the book's numbers
// Worked example, section 15.2: 60, 70, 75, 80, 90 -> about 11.18.
assert.equal(I.roundTo(sd([60, 70, 75, 80, 90]), 2), 11.18);
// Worked example, section 15.1: incomes.
const incomes = [15000, 17000, 23000, 25600, 45000, 54000, 56000, 75000, 99000, 1203000];
assert.equal(I.sum(incomes), 1612600);
assert.equal(I.sum(incomes) / 10, 161260);
assert.equal(I.median(incomes), 49500);
assert.deepEqual(I.modesOf(incomes), []);
// Exercise 1: quiz scores.
const quiz = [62, 74, 74, 78, 80, 83, 83, 83, 91, 100];
assert.equal(I.sum(quiz) / 10, 80.8);
assert.equal(I.median(quiz), 81.5);
assert.deepEqual(I.modesOf(quiz), [83]);
// Exercise 3: shoe sizes.
const shoes = [6, 6.5, 7, 7, 7.5, 7.5, 8, 8, 8, 8.5, 9, 10];
assert.equal(I.sum(shoes) / 12, 7.75);
assert.equal(I.median(shoes), 7.75);
assert.deepEqual(I.modesOf(shoes), [8]);
// Exercise 5: study hours.
assert.equal(I.median([2, 3, 5, 5, 6, 8, 8, 10, 10, 12, 15, 40]), 8);
// Exercise 7: 70 ... 90 -> 7.91.
assert.equal(I.roundTo(sd([70, 75, 80, 85, 90]), 2), 7.91);

// ---------------------------------------------------------------- list and mode fields
const listF = { type: 'list', answer: [22, 27, 29, 30], thousands: false };
assert.equal(core.checkField(listF, '22, 27, 29, 30').correct, true);
assert.equal(core.checkField(listF, '22 27 29 30').correct, true);
assert.equal(core.checkField(listF, '30, 29, 27, 22').correct, true);   // largest first is fine
assert.equal(core.checkField(listF, '27, 22, 29, 30').correct, false);
assert.equal(core.checkField(listF, '22, 27, 29').correct, false);
const moneyF = { type: 'list', answer: [45000, 54000], thousands: true };
assert.equal(core.checkField(moneyF, '45,000, 54,000').correct, true);
assert.equal(core.checkField(moneyF, '$45,000; $54,000').correct, true);
assert.equal(core.checkField(moneyF, '45000 54000').correct, true);

const modeF = (xs) => ({ type: 'modes', answer: I.modesOf(xs), counts: (() => { const c = {}; xs.forEach((x) => { c[x] = (c[x] || 0) + 1; }); return c; })() });
assert.equal(core.checkField(modeF(quiz), '83').correct, true);
assert.match(core.checkField(modeF(quiz), '3').msg, /how many times/);
assert.match(core.checkField(modeF(quiz), '74').msg, /twice/);
assert.equal(core.checkField(modeF(incomes), 'none').correct, true);
assert.equal(core.checkField(modeF(incomes), 'No mode').correct, true);
assert.equal(core.checkField(modeF(incomes), '45000').correct, false);
const bi = [3, 3, 5, 5, 7];
assert.equal(core.checkField(modeF(bi), '5, 3').correct, true);
assert.match(core.checkField(modeF(bi), '3').msg, /list both/);

// ---------------------------------------------------------------- every generated problem
/** What a student who gets every field right would type. */
function rightAnswer(f) {
  if (f.type === 'select') return f.answer;
  if (f.type === 'list') return f.answer.join(', ');
  if (f.type === 'modes') return f.answer.length ? f.answer.join(', ') : 'none';
  return f.target.exact ? String(Number(f.target.value.toFixed(6))) : I.roundTo(f.target.value, f.target.places).toFixed(f.target.places);
}

let problems = 0;
for (const m of core.MODES) {
  for (const k of core.KINDS[m.id]) {
    for (const level of k.levels || [1, 2]) {
      for (let seed = 1; seed <= (k.fixed ? 1 : 400); seed++) {
        const p = core.makeProblem(m.id, k.id, level, seed);
        problems++;
        const where = m.id + '/' + k.id + '/L' + level + '/#' + seed;
        assert.ok(p.setup && p.question && p.solution.length, where + ': text');
        assert.ok(p.fields.length > 0, where + ': fields');
        const ids = new Set();
        for (const f of p.fields) {
          assert.ok(!ids.has(f.id), where + ': duplicate id ' + f.id);
          ids.add(f.id);
          // A perfect student is marked right on every field.
          const r = core.checkField(f, rightAnswer(f));
          assert.equal(r.correct, true, where + ': ' + f.id + ' rejects its own answer (' + rightAnswer(f) + '): ' + r.msg);
          if (f.type === 'number') {
            // Exact targets really are short decimals.
            if (f.target.exact) assert.ok(I.terminates(f.target.value, 2), where + ': ' + f.id + ' not exact: ' + f.target.value);
            // No named mistake gives the right answer.
            for (const d of f.diagnose) {
              assert.ok(!close(d.value, f.target.value, 1e-9), where + ': diagnosis equals answer for ' + f.id);
              const rr = core.checkField(f, String(Number(d.value.toFixed(6))));
              assert.equal(rr.correct, false, where + ': mistake value accepted for ' + f.id);
            }
          }
          if (f.type === 'select') {
            assert.ok(f.options.some((o) => o.value === f.answer), where + ': answer not among options');
          }
        }
        // Kind-specific checks.
        if (k.id === 'sd') {
          const xs = p.data.map(Number);
          const sdf = p.fields.find((f) => f.id === 'sd');
          assert.ok(close(sdf.target.value, sd(xs), 1e-9), where + ': sd');
          assert.ok(sdf.target.value > 0, where + ': sd is 0');
          // Rounding the variance first is accepted.
          const vf = p.fields.find((f) => f.id === 'var');
          const viaRounded = Math.sqrt(I.roundTo(vf.target.value, 2)).toFixed(2);
          assert.equal(core.checkField(sdf, viaRounded).correct, true, where + ': rounded-variance path');
        }
        if (k.id === 'choose') {
          const sel = p.fields.find((f) => f.id === 'measure');
          if (sel.answer === 'median') {
            const mean = p.fields.find((f) => f.id === 'mean').target.value;
            const med = p.fields.find((f) => f.id === 'median').target.value;
            assert.ok(mean >= med * 1.25, where + ': skew too mild to call');
          }
        }
        if (k.id === 'shape') {
          const diff = p.fields.find((f) => f.id === 'diff').target.value;
          const ans = p.fields.find((f) => f.id === 'skew').answer;
          if (ans === 'right') assert.ok(diff > 0, where);
          if (ans === 'left') assert.ok(diff < 0, where);
        }
        if (k.id === 'mode' || (k.id === 'choose' && p.fields.some((f) => f.type === 'modes'))) {
          assert.ok(p.data.length >= 5, where + ': too little data');
        }
        // Same number, same problem.
        const again = core.makeProblem(m.id, k.id, level, seed);
        assert.equal(JSON.stringify(again.data) + again.setup, JSON.stringify(p.data) + p.setup, where + ': not reproducible');
      }
    }
  }
}

// ---------------------------------------------------------------- sections 15.4 to 15.6
// The rule-of-thumb table is 0.98 / sqrt(n), as a percent to one decimal place.
for (const n of Object.keys(core.MOE)) {
  assert.equal(core.MOE[n], I.roundTo(98 / Math.sqrt(Number(n)), 1), 'margin of error table at ' + n);
}
const F = (p, id) => p.fields.find((f) => f.id === id);
const val = (p, id) => F(p, id).target.value;
const seen = {};
const note = (key, v) => { seen[key] = seen[key] || new Set(); seen[key].add(v); };
for (let seed = 1; seed <= 600; seed++) {
  for (const level of [1, 2]) {
    const w = (k) => k + '/L' + level + '/#' + seed;
    // Margin of error: only 600 and 1,000; judgments follow from the intervals and never sit on a boundary.
    for (const k of ['interval', 'majority', 'race', 'change', 'reported']) {
      const p = core.makeProblem('moe', k, level, seed);
      p.fields.filter((f) => /^moe/.test(f.id)).forEach((f) => assert.ok([4, 3.1].includes(f.target.value), w(k) + ': margin not from 600 or 1,000'));
      if (k === 'majority' || k === 'reported') {
        const lo = k === 'majority' ? val(p, 'low') : null;
        const ans = F(p, 'majority').answer;
        if (lo !== null) {
          const hi = val(p, 'high');
          assert.ok(Math.abs(lo - 50) > 0.05 && Math.abs(hi - 50) > 0.05, w(k) + ': interval ends on 50%');
          assert.equal(ans, lo > 50 ? 'yes' : hi < 50 ? 'no' : 'unclear', w(k) + ': majority');
        }
        note(k, ans);
      }
      if (k === 'race') {
        const ov = val(p, 'a-low') < val(p, 'b-high');
        assert.ok(Math.abs(val(p, 'a-low') - val(p, 'b-high')) > 0.05, w(k) + ': intervals just touch');
        assert.equal(F(p, 'lead').answer, ov ? 'within' : 'ahead', w(k));
        note(k, F(p, 'lead').answer);
      }
      if (k === 'change') {
        const ov = val(p, 'a-low') < val(p, 'b-high') && val(p, 'b-low') < val(p, 'a-high');
        assert.equal(F(p, 'change').answer, ov ? 'noise' : 'real', w(k));
        note(k, F(p, 'change').answer);
      }
      if (k === 'reported') {
        assert.ok(['600', '1000'].includes(F(p, 'n').answer), w(k));
        note('reported-n', F(p, 'n').answer);
      }
    }
    // Thresholds
    const r = core.makeProblem('thresholds', 'rates', level, seed);
    if (level === 2) {
      assert.equal(val(r, 'tp') + val(r, 'fn'), val(r, 'p'), w('rates'));
      assert.equal(F(r, 'most').answer, val(r, 'tp') > val(r, 'fp') ? 'true' : 'false', w('rates'));
      note('rates-most', F(r, 'most').answer);
    }
    const mv = core.makeProblem('thresholds', 'move', level, seed);
    const fewer = F(mv, 'flags').answer === 'fewer';
    assert.deepEqual(['sens', 'spec', 'fp', 'fn'].map((id) => F(mv, id).answer),
      fewer ? ['decrease', 'increase', 'decrease', 'increase'] : ['increase', 'decrease', 'increase', 'decrease'], w('move'));
    if (level === 1) assert.equal(val(mv, 'after') < val(mv, 'now'), fewer, w('move') + ': flagged shares');
    note('move', F(mv, 'flags').answer);
    const cu = core.makeProblem('thresholds', 'cutoffs', level, seed);
    assert.ok(val(cu, 'low') > 0 && val(cu, 'low') < val(cu, 'high'), w('cutoffs'));
    assert.equal(val(cu, 'flagged') + val(cu, 'spec'), 100, w('cutoffs'));
    const fl = core.makeProblem('thresholds', 'flags', level, seed);
    assert.equal(val(fl, 'fp') + val(fl, 'genuine'), val(fl, 'flagged'), w('flags'));
    // Distortions
    const t = core.makeProblem('distort', 'truncated', level, seed);
    const [b0, b1] = t.chart.bars.map((b) => b.value);
    const A = Math.max(b0, b1); const B = Math.min(b0, b1); const base = t.chart.base;
    assert.ok(base > 0 && base < B && t.chart.top > A, w('truncated') + ': axis');
    assert.ok(close(val(t, 'apparent'), (A - base) / (B - base)), w('truncated') + ': apparent ratio');
    assert.ok(close(val(t, 'diff'), A - B), w('truncated'));
    assert.ok(close(val(t, 'pct'), (A - B) / B * 100, 1e-6), w('truncated') + ': percent');
    t.chart.ticks.forEach((tk) => assert.ok(t.chart.desc.includes(tk.label), w('truncated') + ': text equivalent lacks ' + tk.label));
    // Text equivalents say what a sighted reader sees, never an answer.
    assert.ok(!/times as tall|times the area/.test(t.chart.desc), w('truncated') + ': description gives away an answer');
    const ar = core.makeProblem('distort', 'area', level, seed);
    assert.equal(ar.chart.kind, 'pictures', w('area'));
    assert.ok(['truck', 'house', 'cap', 'carton', 'cup'].includes(ar.chart.shape), w('area') + ': unknown shape');
    assert.ok(close(ar.chart.items[1].value / ar.chart.items[0].value, val(ar, 'ratio'), 0.005), w('area') + ': pictures do not match the ratio');
    ar.chart.items.forEach((it) => {
      assert.ok(ar.chart.desc.includes(it.label), w('area') + ': description lacks ' + it.label);
      assert.ok(ar.setup.includes(it.label.split(': ')[1]), w('area') + ': ' + it.label + ' not in the problem text');
    });
    assert.ok(!/\d+(\.\d+)? times|times as|area ratio/.test(ar.chart.desc), w('area') + ': description gives away an answer');
    assert.ok(close(val(ar, 'area'), val(ar, 'ratio') * val(ar, 'ratio'), 1e-6), w('area'));
    assert.ok(val(ar, 'ratio') > 1.1, w('area') + ': ratio');
    const rk = core.makeProblem('distort', 'risk', level, seed);
    assert.ok(val(rk, 'rel') > val(rk, 'abs'), w('risk') + ': relative should be the larger number');
    note('risk', F(rk, 'frame').answer);
    const bl = core.makeProblem('distort', 'baseline', level, seed);
    const ys = bl.data.map((d) => Number(d.split(': ')[1].replace(/,/g, '')));
    const yrs = bl.data.map((d) => Number(d.split(':')[0]));
    const startYear = Number(bl.setup.match(/since (\d{4})/)[1]);
    const sv = ys[yrs.indexOf(startYear)];
    const others = ys.filter((_, i) => yrs[i] !== startYear);
    assert.equal(F(bl, 'start').answer, others.every((y) => y < sv) ? 'peak' : others.every((y) => y > sv) ? 'trough' : 'typical', w('baseline'));
    assert.ok(close(val(bl, 'pres'), (ys[ys.length - 1] - sv) / sv * 100, 1e-6), w('baseline') + ': claim');
    assert.ok(close(val(bl, 'full'), (ys[ys.length - 1] - ys[0]) / ys[0] * 100, 1e-6), w('baseline') + ': full period');
    assert.equal(F(bl, 'overall').answer, ys[ys.length - 1] > ys[0] ? 'risen' : 'fallen', w('baseline'));
    note('baseline', F(bl, 'start').answer);
  }
}
// Every judgment comes out each way often enough to matter.
const expectAll = { majority: ['yes', 'no', 'unclear'], race: ['ahead', 'within'], change: ['real', 'noise'], 'reported-n': ['600', '1000'],
  'rates-most': ['true', 'false'], move: ['more', 'fewer'], risk: ['rel', 'abs'], baseline: ['peak', 'trough'] };
for (const k of Object.keys(expectAll)) for (const v of expectAll[k]) assert.ok(seen[k] && seen[k].has(v), k + ' never gives ' + v);

// The margin-of-error table in the Reference panel and in the chapter matches the one the app uses.
{
  const fs0 = require('node:fs'); const path0 = require('node:path');
  const html = fs0.readFileSync(path0.join(__dirname, 'index.html'), 'utf8');
  for (const n of Object.keys(core.MOE)) {
    const m = core.MOE[n].toFixed(1);
    assert.ok(new RegExp('<td>' + Number(n).toLocaleString('en-US') + '</td><td>&plusmn; ' + m.replace('.', '\\.') + '%</td>').test(html), 'Reference panel margin for ' + n);
  }
  const chPath = path0.join(__dirname, '..', 'book', 'source', 'chapters', 'ch-statistical-reasoning.ptx');
  if (fs0.existsSync(chPath)) {
    const ch = fs0.readFileSync(chPath, 'utf8');
    for (const n of Object.keys(core.MOE)) {
      const m = core.MOE[n].toFixed(1).replace('.', '\\.');
      assert.ok(new RegExp(Number(n).toLocaleString('en-US') + ' people: about plus or minus ' + m + '%').test(ch), 'Chapter 15 table margin for ' + n);
    }
    assert.ok(!/plus or minus 4\.1%/.test(ch), 'Chapter 15 still says plus or minus 4.1%');
  }
}

// ---------------------------------------------------------------- From the book vs. the appendix
// Every From the Book answer must agree with appendix-solutions.ptx. When the
// tool is copied somewhere without the book, this part is skipped.
const fs = require('node:fs');
const path = require('node:path');
const appendixPath = path.join(__dirname, '..', 'book', 'source', 'appendix-solutions.ptx');
if (fs.existsSync(appendixPath)) {
  const src = fs.readFileSync(appendixPath, 'utf8');
  const ch15 = src.slice(src.indexOf('sol-ch15-exercise-set-1'), src.indexOf('sol-ch15-writing-prompt'));
  assert.ok(ch15.length > 1000, 'Chapter 15 solutions not found in the appendix');
  const item = (n) => {
    const m = ch15.match(new RegExp('<term>' + n + '\\.</term>([\\s\\S]*?)</p>'));
    assert.ok(m, 'Appendix has no answer for exercise ' + n);
    return m[1].replace(/<[^>]+>/g, ' ').replace(/\{,\}/g, ',').replace(/\s+/g, ' ');
  };
  const shows = (text, v) => {
    const forms = [String(v), Number(v).toLocaleString('en-US')];
    return forms.some((f) => new RegExp('(^|[^\\d.])' + f.replace(/[.,]/g, '\\$&') + '(?![\\d])').test(text));
  };
  // Field ids whose values the appendix states, and words its prose must contain for the choices.
  const EXPECT = {
    ex1: { nums: ['mean', 'median', 'modes'] },
    ex3: { nums: ['mean', 'median', 'modes'], words: [/mode is most useful/i] },
    ex5: { nums: ['median'], words: [/skewed right/i, /median is most appropriate/i] },
    ex7: { nums: ['mean', 'ss', 'var', 'sd'] },
    ex11: { nums: ['z'], words: [/above the mean/i, /unusual/i] },
    ex13: { nums: ['k', 'within', 'tail', 'count'] },
    ex15: { nums: ['a-score', 'b-score', 'c-low', 'c-high'] },
    ex17: { nums: ['moe', 'low', 'high'], words: [/does support/i] },
    ex19: { nums: ['moe', 'low', 'high'], words: [/majority is clearly supported/i] },
    ex23: { nums: ['flagged', 'low', 'high'], words: [/sensitivity increases/i, /specificity decreases/i] },
  };
  for (const k of core.KINDS.book) {
    const n = Number(k.id.replace('ex', ''));
    assert.equal(n % 2, 1, k.id + ' is even; the appendix answers odd exercises only');
    const text = item(n);
    const p = core.makeProblem('book', k.id, 1, 1);
    const want = EXPECT[k.id];
    assert.ok(want, 'No appendix expectations listed for ' + k.id);
    for (const id of want.nums) {
      const f = p.fields.find((x) => x.id === id);
      assert.ok(f, k.id + ': no field ' + id);
      const vals = f.type === 'modes' ? f.answer : [f.target.exact ? f.target.value : I.roundTo(f.target.value, f.target.places)];
      for (const v of vals) assert.ok(shows(text, v), 'Exercise ' + n + ': the appendix does not state ' + v + ' (' + id + ')');
    }
    for (const w of want.words || []) assert.match(text, w, 'Exercise ' + n + ': appendix wording');
  }
  console.log('From the Book answers agree with appendix-solutions.ptx (' + core.KINDS.book.length + ' exercises).');
} else {
  console.log('appendix-solutions.ptx not found; skipped the appendix comparison.');
}

// Mixed practice resolves to a real kind and level.
const mixed = core.makeProblem('center', 'any', 0, 777);
assert.ok(core.KINDS.center.some((k) => k.id === mixed.kind));
assert.ok([1, 2].includes(mixed.level));

console.log('All statistics tests passed (' + problems + ' generated problems checked).');
