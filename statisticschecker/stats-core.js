/*
 * stats-core.js
 * Problem generators and answer checking for the Statistics Practice tool
 * (UMW Logic Textbook, Chapter 15). No DOM access; runs in the browser and
 * in Node (see logic-tests.js).
 *
 * Every answer is computed here from the same numbers used to write the
 * problem. Nothing is stored as a pre-written answer. Data are chosen so
 * that every intermediate value is exact; only values that cannot be exact
 * (a square root, a variance divided by 7) are checked to two decimal places.
 *
 * A problem is a list of steps; each step is a list of fields. The page
 * renders the fields and hands what the student typed to checkField().
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./stats-bank.js'));
  } else {
    root.StatsCore = factory(root.StatsBank);
  }
})(typeof self !== 'undefined' ? self : this, function (BANK) {
  'use strict';

  // ---------------------------------------------------------------------
  // Random numbers (seeded, so a problem number always gives the same problem)
  // ---------------------------------------------------------------------
  function makeRng(seed) {
    let a = (seed >>> 0) || 1;
    const next = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int(lo, hi) { return lo + Math.floor(next() * (hi - lo + 1)); },
      pick(list) { return list[Math.floor(next() * list.length)]; },
      shuffle(list) {
        const out = list.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      },
      chance(p) { return next() < p; },
    };
  }

  function hashSeed(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ---------------------------------------------------------------------
  // Numbers
  // ---------------------------------------------------------------------
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const same = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

  /** Round half away from zero, robust to binary noise (2.675 -> 2.68). */
  function roundTo(x, places) {
    const f = Math.pow(10, places);
    const s = x < 0 ? -1 : 1;
    return s * Math.round(Math.abs(x) * f + 1e-7) / f;
  }
  /** True when x has at most `places` decimal places. */
  function terminates(x, places) {
    const f = Math.pow(10, places);
    return Math.abs(x * f - Math.round(x * f)) < 1e-6;
  }

  function commas(s) {
    const neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    const parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '−' : '') + parts.join('.');
  }
  /** Number as text: up to 4 places with trailing zeros dropped, or fixed places. */
  function numStr(x, places) {
    if (Math.abs(x) < 1e-12) x = 0;
    const s = places === undefined ? String(Number(x.toFixed(4))) : x.toFixed(places);
    return commas(s);
  }
  /** A value from a context: dollars get a $ sign and cents when needed. */
  function fmt(ctx, x, places) {
    if (ctx && ctx.money) {
      const cents = places !== undefined ? places : (terminates(x, 0) ? 0 : 2);
      return (x < 0 ? '−' : '') + '$' + numStr(Math.abs(x), cents);
    }
    return numStr(x, places);
  }
  /** A value with its unit: "75 points", "$49,500". */
  function withUnit(ctx, x, places) {
    const u = ctx && ctx.unit ? ' ' + ctx.unit : '';
    return fmt(ctx, x, places) + u;
  }
  // ---------------------------------------------------------------------
  // Reading what the student typed
  // ---------------------------------------------------------------------
  /**
   * Accepts 49.5, -15, −15, 1,612,600, $161,260, 11.18 points, 68%.
   * opts.percent: the field asks for a percent, so a % sign is allowed.
   * Returns { ok, value, decimals } or { ok:false, error }.
   */
  function parseNumber(raw, opts) {
    opts = opts || {};
    let s = String(raw == null ? '' : raw).trim();
    if (!s) return { ok: false, error: 'empty' };
    s = s.replace(/[−–—]/g, '-').replace(/\s+/g, '').replace(/,/g, '');
    s = s.replace(/^(-?)\$/, '$1').replace(/^\$-/, '-');
    s = s.replace(/([0-9.%])(?:[a-z°µ/]+\.?)$/i, '$1');
    let percent = false;
    if (/%$/.test(s)) { percent = true; s = s.slice(0, -1); }
    const m = s.match(/^-?(\d+\.?\d*|\.\d+)$/);
    if (!m) {
      return { ok: false, error: 'Enter a number, such as 49.5 or −15.' };
    }
    if (percent && !opts.percent) {
      return { ok: false, error: 'This answer is not a percent. Leave off the % sign.' };
    }
    const dot = s.indexOf('.');
    const decimals = dot >= 0 ? s.length - dot - 1 : 0;
    return { ok: true, value: Number(s), decimals };
  }

  /** Split a typed list. Commas separate values unless values can have thousands separators. */
  function splitList(raw, thousands) {
    let s = String(raw == null ? '' : raw).trim().replace(/[−–—]/g, '-');
    if (!s) return [];
    const parts = thousands ? s.split(/;|,\s+|\s+/) : s.split(/[;,\s]+/);
    return parts.map((t) => t.trim()).filter(Boolean);
  }

  // Targets
  const exactT = (v) => ({ value: v, exact: true, places: 0 });
  /** Exact when v has at most `places` decimals; otherwise checked to `places`. */
  const roundT = (v, places) => {
    places = places === undefined ? 2 : places;
    return terminates(v, places) ? exactT(v) : { value: v, exact: false, places };
  };

  /** 'correct' | 'imprecise' (right value, rounded too far) | 'wrong' */
  function verdict(parsed, t) {
    if (same(parsed.value, t.value)) return 'correct';
    if (!same(roundTo(t.value, parsed.decimals), parsed.value)) return 'wrong';
    if (t.exact) return 'imprecise';
    return parsed.decimals >= t.places ? 'correct' : 'imprecise';
  }

  // ---------------------------------------------------------------------
  // Checking one field
  // Returns { state: 'ok' | 'warn' | 'bad', correct: boolean, msg }
  // ---------------------------------------------------------------------
  const OK = (msg) => ({ state: 'ok', correct: true, msg: msg || 'Correct.' });
  const BAD = (msg) => ({ state: 'bad', correct: false, msg: msg || 'Not yet.' });
  const WARN = (msg) => ({ state: 'warn', correct: false, msg });

  function checkNumber(f, raw) {
    const p = parseNumber(raw, { percent: f.percent });
    if (!p.ok) return BAD(p.error === 'empty' ? 'Enter a number.' : p.error);
    if (f.nonNegative && p.value < 0) return BAD(f.negMsg || 'This value cannot be negative.');
    const v = verdict(p, f.target);
    if (v === 'correct') return OK(f.okMsg);
    for (const alt of f.alts || []) {
      if (verdict(p, alt.target) === 'correct') return OK(alt.msg);
    }
    for (const d of f.diagnose || []) {
      const t = { value: d.value, exact: f.target.exact, places: f.target.places };
      if (verdict(p, t) !== 'wrong') return BAD(d.msg);
    }
    if (v === 'imprecise') {
      return WARN(f.target.exact
        ? 'Close, but this one comes out exactly. Give the exact value.'
        : 'Right value, but round to ' + f.target.places + ' decimal places.');
    }
    return BAD(f.wrongMsg);
  }

  function checkSelect(f, raw) {
    if (!raw) return BAD('Choose an answer.');
    if (raw === f.answer) return OK(f.okMsg || 'Right.');
    if (f.accept && f.accept[raw]) return OK(f.accept[raw]);
    return BAD((f.wrong && f.wrong[raw]) || f.wrongMsg || 'Not this one.');
  }

  function parseAll(tokens) {
    const vals = [];
    for (const t of tokens) {
      const p = parseNumber(t);
      if (!p.ok) return { ok: false, error: '“' + t + '” is not a number.' };
      vals.push(p.value);
    }
    return { ok: true, vals };
  }
  const sameMultiset = (a, b) => {
    if (a.length !== b.length) return false;
    const x = a.slice().sort((m, n) => m - n); const y = b.slice().sort((m, n) => m - n);
    return x.every((v, i) => same(v, y[i]));
  };

  /** A list in order, smallest to largest. f.answer is the sorted list. */
  function checkList(f, raw) {
    const toks = splitList(raw, f.thousands);
    if (!toks.length) return BAD('Enter the values, separated by commas.');
    const r = parseAll(toks);
    if (!r.ok) return BAD(r.error);
    const vals = r.vals;
    const n = f.answer.length;
    if (vals.length !== n) {
      return BAD('You listed ' + vals.length + ' value' + (vals.length === 1 ? '' : 's') + '; the data has ' + n + '.' +
        (f.thousands ? ' Put a space after each separating comma, so 45,000, 54,000 reads as two values.' : ''));
    }
    if (!sameMultiset(vals, f.answer)) return BAD('Your list does not have the same values as the data. Look for a value that is missing, repeated, or changed.');
    if (vals.every((v, i) => same(v, f.answer[i]))) return OK(f.okMsg || 'In order.');
    const desc = f.answer.slice().reverse();
    if (vals.every((v, i) => same(v, desc[i]))) return OK('Largest to smallest works too.');
    return BAD('Those are the right values, but they are not in order yet.');
  }

  /** The mode or modes, or "none". f.answer is a sorted list ([] for no mode); f.counts maps value -> count. */
  function checkModes(f, raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return BAD('Enter the mode, both modes, or none.');
    let vals;
    if (/^(none|no\s*mode|no|n\/?a|nothing)\.?$/i.test(s)) vals = [];
    else {
      const r = parseAll(splitList(s, f.thousands));
      if (!r.ok) return BAD(r.error + ' Type none if there is no mode.');
      vals = r.vals;
    }
    const ans = f.answer;
    if (sameMultiset(vals, ans)) {
      return OK(ans.length === 0 ? 'Right. Every value appears once, so there is no mode.'
        : ans.length === 1 ? 'Right.' : 'Right. Both values tie for most frequent.');
    }
    const countOf = (v) => {
      const k = Object.keys(f.counts).find((key) => same(Number(key), v));
      return k === undefined ? 0 : f.counts[k];
    };
    const top = Math.max.apply(null, Object.values(f.counts));
    if (ans.length === 0) {
      return BAD('Every value appears exactly once, so no value is more common than the others. Type none.');
    }
    if (vals.length === 0) return BAD('At least one value appears more than once, so there is a mode.');
    if (vals.length === 1 && countOf(vals[0]) === 0 && same(vals[0], top)) {
      return BAD('That is how many times the mode appears. Give the value itself.');
    }
    const extra = vals.find((v) => !ans.some((a) => same(a, v)));
    if (extra !== undefined) {
      const c = countOf(extra);
      if (c === 0) return BAD(fmt(f.ctx, extra) + ' is not in the data.');
      return BAD(fmt(f.ctx, extra) + ' appears ' + times(c) + ', but ' +
        (ans.length === 1 ? fmt(f.ctx, ans[0]) + ' appears ' : 'the most common values appear ') + times(top) + '.');
    }
    return BAD('That is one of them. Two values tie for most frequent; list both, separated by a comma.');
  }
  const times = (c) => (c === 1 ? 'once' : c === 2 ? 'twice' : c + ' times');

  function checkField(field, raw) {
    switch (field.type) {
      case 'number': return checkNumber(field, raw);
      case 'select': return checkSelect(field, raw);
      case 'list': return checkList(field, raw);
      case 'modes': return checkModes(field, raw);
      default: throw new Error('Unknown field type: ' + field.type);
    }
  }

  // Field builders
  function numF(id, label, target, o) {
    return Object.assign({ type: 'number', id, label, target, alts: [], diagnose: [] }, o || {});
  }
  function selF(id, label, options, answer, o) {
    return Object.assign({ type: 'select', id, label, options, answer }, o || {});
  }
  /** Drop diagnoses whose value equals the right answer or an earlier diagnosis. */
  function cleanDiag(f) {
    const seen = [f.target.value].concat((f.alts || []).map((a) => a.target.value));
    const targets = [f.target].concat((f.alts || []).map((a) => a.target));
    f.diagnose = (f.diagnose || []).filter(function (d) {
      if (!isFinite(d.value) || seen.some((v) => same(v, d.value))) return false;
      // A mistake the checker would mark right can never be reached.
      const typed = parseNumber(String(Number(d.value.toFixed(6))));
      if (targets.some((t) => verdict(typed, t) === 'correct')) return false;
      seen.push(d.value);
      return true;
    });
    return f;
  }

  // ---------------------------------------------------------------------
  // Data helpers
  // ---------------------------------------------------------------------
  function unitRange(ctx, r) {
    r = r || ctx.range;
    return [Math.ceil(r[0] / ctx.step - 1e-9), Math.floor(r[1] / ctx.step + 1e-9)];
  }
  const ints = (rng, n, lo, hi) => Array.from({ length: n }, () => rng.int(lo, hi));
  const sorted = (xs) => xs.slice().sort((a, b) => a - b);
  function median(xs) {
    const s = sorted(xs); const n = s.length;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  /** The middle of a list without sorting it (a common mistake). */
  function middleAsGiven(xs) {
    const n = xs.length;
    return n % 2 ? xs[(n - 1) / 2] : (xs[n / 2 - 1] + xs[n / 2]) / 2;
  }
  function counts(xs) {
    const c = {};
    xs.forEach((x) => { c[x] = (c[x] || 0) + 1; });
    return c;
  }
  function modesOf(xs) {
    const c = counts(xs);
    const top = Math.max.apply(null, Object.values(c));
    if (top === 1) return [];
    return sorted(Object.keys(c).filter((k) => c[k] === top).map(Number));
  }
  /** Shuffle until the order is not already sorted either way. */
  function scramble(rng, xs) {
    const s = sorted(xs);
    if (s[0] === s[s.length - 1]) return xs.slice();
    let out;
    for (let i = 0; i < 20; i++) {
      out = rng.shuffle(xs);
      const up = out.every((v, j) => v === s[j]);
      const down = out.every((v, j) => v === s[s.length - 1 - j]);
      if (!up && !down) return out;
    }
    return out;
  }
  function pickCtx(rng, pred) {
    const list = BANK.center.filter(pred);
    if (!list.length) throw new Error('No context fits.');
    return rng.pick(list);
  }
  const fill = (tpl, map) => tpl.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
  const hasThousands = (ctx, xs) => xs.some((x) => Math.abs(x) >= 1000);
  const listText = (ctx, xs) => xs.map((x) => fmt(ctx, x)).join(', ');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** Mean that is a whole number of units (level 1) or ends in .5 of a unit (level 2). */
  function meanOk(ks, level) {
    const s = sum(ks); const n = ks.length;
    return level === 1 ? s % n === 0 : (2 * s) % n === 0;
  }

  // ---------------------------------------------------------------------
  // Center (section 15.1)
  // ---------------------------------------------------------------------
  const MEASURES = [
    { value: 'mean', label: 'The mean' },
    { value: 'median', label: 'The median' },
    { value: 'mode', label: 'The mode' },
  ];

  function meanFields(ctx, xs, idPrefix) {
    const n = xs.length; const S = sum(xs); const M = S / n; const med = median(xs);
    return [
      numF(idPrefix + 'sum', 'Sum of the values', exactT(S), { wrongMsg: 'Add up every value in the data.' }),
      numF(idPrefix + 'count', 'Number of values', exactT(n), {
        diagnose: [{ value: n - 1, msg: 'Count every value in the data.' }],
      }),
      cleanDiag(numF(idPrefix + 'mean', 'Mean', exactT(M), {
        wrongMsg: 'The mean is the sum of the values divided by how many values there are.',
        diagnose: [
          { value: S / (n - 1), msg: 'You divided by one less than the number of values. That is for the variance; the mean divides by the number of values.' },
          { value: med, msg: 'That is the median. The mean is the sum divided by the number of values.' },
        ],
      })),
    ];
  }
  function meanSolution(ctx, xs) {
    const n = xs.length; const S = sum(xs);
    return [
      'Add the ' + n + ' values: ' + xs.map((x) => fmt(ctx, x)).join(' + ') + ' = ' + fmt(ctx, S) + '.',
      'Divide by the number of values: ' + fmt(ctx, S) + ' ÷ ' + n + ' = ' + fmt(ctx, S / n) + '. The mean is ' + withUnit(ctx, S / n) + '.',
    ];
  }
  function medianSolution(ctx, xs) {
    const s = sorted(xs); const n = s.length;
    const lines = ['In order: ' + listText(ctx, s) + '.'];
    if (n % 2) {
      const k = (n + 1) / 2;
      lines.push('With ' + n + ' values, the middle one is value number ' + k + ', with ' + (k - 1) + ' on each side. The median is ' + withUnit(ctx, s[k - 1]) + '.');
    } else {
      const a = s[n / 2 - 1]; const b = s[n / 2];
      lines.push('With ' + n + ' values, there are two middle values, numbers ' + (n / 2) + ' and ' + (n / 2 + 1) + ': ' +
        fmt(ctx, a) + ' and ' + fmt(ctx, b) + '. The median is their average: (' + fmt(ctx, a) + ' + ' + fmt(ctx, b) + ') ÷ 2 = ' + withUnit(ctx, (a + b) / 2) + '.');
    }
    return lines;
  }

  function genMean(rng, level) {
    const ctx = pickCtx(rng, (c) => !c.modeOnly);
    const n = level === 1 ? rng.int(5, 7) : rng.pick([8, 10, 12]);
    const [lo, hi] = unitRange(ctx);
    let ks;
    do {
      ks = ints(rng, n, lo, hi);
      if (level === 2 && ctx.outlier && rng.chance(0.5)) {
        const [olo, ohi] = unitRange(ctx, ctx.outlier);
        ks[rng.int(0, n - 1)] = rng.int(olo, ohi);
      }
    } while (!meanOk(ks, level));
    const xs = ks.map((k) => k * ctx.step);
    return {
      setup: fill(ctx.setup, { n }), dataLabel: ctx.label, data: xs.map((x) => fmt(ctx, x)),
      question: 'Find the mean ' + ctx.noun + '.',
      steps: [
        { legend: 'Step 1: Add up the values', fields: meanFields(ctx, xs, '').slice(0, 1) },
        { legend: 'Step 2: Divide by how many values there are', fields: meanFields(ctx, xs, '').slice(1) },
      ],
      solution: meanSolution(ctx, xs),
    };
  }

  function medianSteps(ctx, xs, shown) {
    const s = sorted(xs); const n = s.length;
    const th = hasThousands(ctx, xs);
    const listField = {
      type: 'list', id: 'sorted', label: 'The values in order, smallest to largest', answer: s, thousands: th, ctx,
      help: th ? 'Separate values with a comma and a space: 45,000, 54,000' : 'Separate values with commas.',
    };
    const diag = [
      { value: middleAsGiven(shown), msg: 'That is the middle of the list as given. Put the values in order first.' },
      { value: sum(xs) / n, msg: 'That is the mean. The median is the middle value in order.' },
    ];
    let step2;
    if (n % 2) {
      const k = (n + 1) / 2;
      step2 = {
        legend: 'Step 2: Find the middle value',
        fields: [
          numF('position', 'Position of the middle value (count from the smallest)', exactT(k), {
            diagnose: [{ value: n / 2, msg: 'There should be the same number of values on each side of the middle one.' },
              { value: (n - 1) / 2, msg: 'That many values sit on each side. Which position is the middle one itself?' }],
          }),
          cleanDiag(numF('median', 'Median', exactT(s[k - 1]), { diagnose: diag, wrongMsg: 'The median is the value in the middle position of the sorted list.' })),
        ],
      };
    } else {
      const a = s[n / 2 - 1]; const b = s[n / 2];
      step2 = {
        legend: 'Step 2: Average the two middle values',
        help: 'With an even number of values, there is no single middle value.',
        fields: [
          { type: 'list', id: 'middle', label: 'The two middle values', answer: [a, b], thousands: th, ctx,
            help: th ? 'Separate them with a comma and a space.' : 'Separate them with a comma.' },
          cleanDiag(numF('median', 'Median', exactT((a + b) / 2), {
            wrongMsg: 'Add the two middle values and divide by 2.',
            diagnose: diag.concat([
              { value: a, msg: 'That is one of the two middle values. With an even count, the median is their average.' },
              { value: b, msg: 'That is one of the two middle values. With an even count, the median is their average.' },
            ]),
          })),
        ],
      };
    }
    return [{ legend: 'Step 1: Put the values in order', fields: [listField] }, step2];
  }

  function genMedian(rng, level) {
    const ctx = pickCtx(rng, (c) => !c.modeOnly);
    const n = level === 1 ? rng.pick([5, 7, 9]) : rng.pick([6, 8, 10]);
    const [lo, hi] = unitRange(ctx);
    const ks = ints(rng, n, lo, hi);
    if (level === 2 && ctx.outlier && rng.chance(0.4)) {
      const [olo, ohi] = unitRange(ctx, ctx.outlier);
      ks[0] = rng.int(olo, ohi);
    }
    const xs = ks.map((k) => k * ctx.step);
    const shown = scramble(rng, xs);
    return {
      setup: fill(ctx.setup, { n }), dataLabel: ctx.label, data: shown.map((x) => fmt(ctx, x)),
      question: 'Find the median ' + ctx.noun + '.',
      steps: medianSteps(ctx, xs, shown),
      solution: medianSolution(ctx, xs),
    };
  }

  /** Values with a planted shape: 'none' | 'one' | 'two'. */
  function modeData(rng, ctx, shape, n) {
    const [lo, hi] = unitRange(ctx);
    const pool = rng.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));
    const ks = [];
    let i = 0;
    if (shape === 'one') {
      const c = rng.int(3, 4);
      for (let j = 0; j < c; j++) ks.push(pool[0]);
      i = 1;
      if (n - c >= 4 && rng.chance(0.6)) { ks.push(pool[1], pool[1]); i = 2; }
    } else if (shape === 'two') {
      const c = rng.int(2, 3);
      for (let j = 0; j < c; j++) ks.push(pool[0], pool[1]);
      i = 2;
    }
    while (ks.length < n && i < pool.length) ks.push(pool[i++]);
    return ks.map((k) => k * ctx.step);
  }
  function modeFields(ctx, xs, idPrefix) {
    const modes = modesOf(xs); const c = counts(xs);
    return {
      type: 'modes', id: idPrefix + 'modes', label: 'Mode', answer: modes, counts: c, ctx,
      thousands: hasThousands(ctx, xs),
      help: 'Type the value, both values separated by a comma, or none.',
    };
  }
  function modeSolution(ctx, xs) {
    const modes = modesOf(xs); const c = counts(xs);
    const tallies = sorted(Object.keys(c).map(Number)).map((v) => fmt(ctx, v) + ' (' + times(c[v]) + ')');
    const lines = ['Count each value: ' + tallies.join(', ') + '.'];
    if (!modes.length) lines.push('Every value appears exactly once, so there is no mode.');
    else if (modes.length === 1) lines.push(fmt(ctx, modes[0]) + ' appears most often, so the mode is ' + withUnit(ctx, modes[0]) + '. The data is unimodal.');
    else lines.push(fmt(ctx, modes[0]) + ' and ' + fmt(ctx, modes[1]) + ' tie for most frequent, so both are modes. The data is bimodal.');
    return lines;
  }

  function genMode(rng, level) {
    const shape = level === 1 ? rng.pick(['none', 'one', 'one']) : rng.pick(['none', 'one', 'two', 'two']);
    const ctx = pickCtx(rng, function (c) {
      const [lo, hi] = unitRange(c);
      return hi - lo <= 40 && !c.money && (shape !== 'none' || hi - lo >= 7);
    });
    const n = level === 1 ? rng.int(7, 9) : rng.int(9, 12);
    const xs = modeData(rng, ctx, shape, n);
    const shown = level === 1 ? sorted(xs) : scramble(rng, xs);
    const kind = { none: 'nomode', one: 'unimodal', two: 'bimodal' }[shape];
    return {
      setup: fill(ctx.setup, { n: xs.length }), dataLabel: ctx.label, data: shown.map((x) => fmt(ctx, x)),
      question: 'Find the mode, if there is one, and describe the dataset.',
      steps: [
        { legend: 'Step 1: Find the most frequent value', fields: [modeFields(ctx, xs, '')] },
        {
          legend: 'Step 2: Describe the dataset', fields: [selF('shape', 'This dataset is', [
            { value: 'nomode', label: 'No mode (every value appears once)' },
            { value: 'unimodal', label: 'Unimodal (one mode)' },
            { value: 'bimodal', label: 'Bimodal (two modes)' },
          ], kind, { wrongMsg: 'Count how many values tie for most frequent.' })],
        },
      ],
      solution: modeSolution(ctx, xs),
    };
  }

  function genChoose(rng, level) {
    const shape = rng.pick(['skew', 'skew', 'sym', 'freq']);
    let ctx; let xs; let question;
    if (shape === 'skew') {
      ctx = pickCtx(rng, (c) => !!c.outlier);
      const n = level === 1 ? rng.pick([7, 8, 9]) : rng.pick([10, 12]);
      const [lo, hi] = unitRange(ctx); const [olo, ohi] = unitRange(ctx, ctx.outlier);
      let ks;
      // The outlier must pull the mean well above the median (at least 25%).
      do { ks = ints(rng, n - 1, lo, hi).concat([rng.int(olo, ohi)]); }
      while (!meanOk(ks, level) || sum(ks) / n < 1.25 * median(ks));
      xs = ks.map((k) => k * ctx.step);
    } else if (shape === 'sym') {
      ctx = pickCtx(rng, (c) => !c.modeOnly);
      const n = level === 1 ? rng.pick([5, 7]) : rng.pick([7, 9]);
      const [lo, hi] = unitRange(ctx);
      const half = (n - 1) / 2;
      const span = Math.floor((hi - lo) / 2);
      const c = rng.int(lo + half, hi - half);
      const room = Math.min(c - lo, hi - c, span);
      const ds = rng.shuffle(Array.from({ length: room }, (_, i) => i + 1)).slice(0, half);
      const ks = [c];
      ds.forEach((d) => { ks.push(c - d, c + d); });
      xs = ks.map((k) => k * ctx.step);
    } else {
      ctx = pickCtx(rng, (c) => !!c.modeQ);
      const n = level === 1 ? rng.int(8, 10) : rng.int(10, 12);
      xs = modeData(rng, ctx, 'one', n);
    }
    const shown = level === 1 ? sorted(xs) : scramble(rng, xs);
    const steps = [];
    const measureOpts = { wrong: {}, accept: {} };
    if (shape === 'freq') {
      question = ctx.modeQ + ' Find the mode, then decide which measure answers the question.';
      steps.push({ legend: 'Step 1: Find the mode', fields: [modeFields(ctx, xs, '')] });
      measureOpts.wrong.mean = 'The question is about which value comes up most often. That is what the mode measures.';
      measureOpts.wrong.median = 'The question is about which value comes up most often. That is what the mode measures.';
    } else {
      question = 'Find the mean and the median. Then decide which measure best describes a typical ' + ctx.noun + '.';
      const mf = meanFields(ctx, xs, '');
      steps.push({ legend: 'Step 1: Find the mean', fields: [mf[0], mf[2]] });
      const med = median(xs);
      steps.push({ legend: 'Step 2: Find the median', fields: [cleanDiag(numF('median', 'Median', exactT(med), {
        wrongMsg: 'Put the values in order and take the middle one (or the average of the two middle ones).',
        diagnose: [{ value: middleAsGiven(shown), msg: 'That is the middle of the list as given. Put the values in order first.' }],
      }))] });
      if (shape === 'skew') {
        const below = xs.filter((x) => x < sum(xs) / xs.length).length;
        measureOpts.wrong.mean = below + ' of the ' + xs.length + ' values are below the mean. One extreme value pulls the mean up; the median resists it.';
        measureOpts.wrong.mode = 'The question asks for a typical value, not the most frequent one.';
      } else {
        measureOpts.accept.median = 'The median works here too, since it matches the mean. The chapter’s guideline is the mean when the data is symmetric with no outliers, because it uses every value.';
        measureOpts.wrong.mode = 'The question asks for a typical value, not the most frequent one.';
      }
    }
    const answer = { skew: 'median', sym: 'mean', freq: 'mode' }[shape];
    steps.push({
      legend: 'Step ' + (steps.length + 1) + ': Choose a measure',
      fields: [selF('measure', 'Which measure best answers the question?', MEASURES, answer, measureOpts)],
    });
    let solution;
    if (shape === 'freq') {
      solution = modeSolution(ctx, xs).concat(['The question asks which value comes up most often, so the mode answers it.']);
    } else {
      solution = meanSolution(ctx, shown).concat(medianSolution(ctx, xs));
      solution.push(shape === 'skew'
        ? 'One extreme value (' + withUnit(ctx, Math.max.apply(null, xs)) + ') pulls the mean above almost every value. The median, ' + withUnit(ctx, median(xs)) + ', is closer to what most of the data looks like, so it better describes a typical ' + ctx.noun + '.'
        : 'The data is symmetric with no outliers, and the mean and median agree. The chapter’s guideline is to use the mean here, since it uses every value.');
    }
    return {
      setup: fill(ctx.setup, { n: xs.length }), dataLabel: ctx.label, data: shown.map((x) => fmt(ctx, x)),
      question, steps, solution,
    };
  }

  function genShape(rng, level) {
    const ctx = pickCtx(rng, (c) => !c.modeOnly);
    const dirs = ['sym'];
    if (ctx.outlier) dirs.push('right', 'right');
    if (ctx.left) dirs.push('left', 'left');
    if (dirs.length === 1) dirs.push('right');
    const dir = rng.pick(dirs);
    const [lo, hi] = unitRange(ctx);
    const medK = rng.int(lo + Math.floor((hi - lo) / 4), hi - Math.floor((hi - lo) / 4));
    const med = medK * ctx.step;
    const unitStep = ctx.money ? ctx.step : 1;
    let mean;
    if (dir === 'right') mean = Math.round(med * (1 + rng.int(15, 60) / 100) / unitStep) * unitStep;
    else if (dir === 'left') mean = Math.round(med * (1 - rng.int(8, 15) / 100) / unitStep) * unitStep;
    else mean = med + (rng.chance(0.5) ? 0 : rng.pick([-1, 1]) * Math.max(unitStep, Math.round(med * 0.01 / unitStep) * unitStep));
    if (level === 2 && !ctx.money) { mean = mean + rng.pick([0.2, 0.4, 0.6, 0.8]); }
    if (dir === 'sym' && Math.abs(mean - med) > 0.02 * med) mean = med;
    const n = rng.int(30, 200);
    const diff = mean - med;
    return {
      setup: fill(ctx.setup, { n }) + ' The report does not list the values. It gives a mean of ' + withUnit(ctx, mean) + ' and a median of ' + withUnit(ctx, med) + '.',
      dataLabel: '', data: [],
      question: 'What does the relationship between the mean and the median suggest about the shape of the distribution?',
      steps: [
        { legend: 'Step 1: Compare the mean with the median', fields: [cleanDiag(numF('diff', 'Mean − median', exactT(diff), {
          wrongMsg: 'Subtract the median from the mean.',
          diagnose: [{ value: -diff, msg: 'Subtract the median from the mean, not the other way round.' }],
        }))] },
        { legend: 'Step 2: Describe the shape', fields: [selF('skew', 'The distribution is most likely', [
          { value: 'right', label: 'Skewed right: a few unusually high values pull the mean above the median' },
          { value: 'left', label: 'Skewed left: a few unusually low values pull the mean below the median' },
          { value: 'sym', label: 'Roughly symmetric: the mean and median are close together' },
        ], dir, {
          wrong: {
            right: diff < 0 ? 'The mean is below the median here, so any long tail is on the low side.' : 'The mean and median are within 2% of each other.',
            left: diff > 0 ? 'The mean is above the median here, so any long tail is on the high side.' : 'The mean and median are within 2% of each other.',
            sym: 'The gap between the mean and the median is ' + Math.round(Math.abs(diff) / med * 100) + '% of the median. That is too large to call symmetric.',
          },
        })] },
      ],
      solution: [
        'Mean − median = ' + fmt(ctx, mean) + ' − ' + fmt(ctx, med) + ' = ' + fmt(ctx, diff) + '.',
        dir === 'right' ? 'The mean is well above the median. A few unusually high values are pulling the mean up, so the distribution is skewed right.'
          : dir === 'left' ? 'The mean is below the median. A few unusually low values are pulling the mean down, so the distribution is skewed left.'
            : 'The mean and median are nearly equal, which is what a roughly symmetric distribution looks like.',
      ],
    };
  }

  // ---------------------------------------------------------------------
  // Spread (section 15.2)
  // ---------------------------------------------------------------------
  function genRange(rng, level) {
    const ctx = pickCtx(rng, (c) => !c.modeOnly);
    const n = level === 1 ? rng.int(6, 8) : rng.int(9, 12);
    const [lo, hi] = unitRange(ctx);
    const ks = ints(rng, n, lo, hi);
    if (level === 2 && ctx.outlier && rng.chance(0.5)) {
      const [olo, ohi] = unitRange(ctx, ctx.outlier);
      ks[0] = rng.int(olo, ohi);
    }
    const xs = ks.map((k) => k * ctx.step);
    const shown = scramble(rng, xs);
    const mx = Math.max.apply(null, xs); const mn = Math.min.apply(null, xs);
    return {
      setup: fill(ctx.setup, { n }), dataLabel: ctx.label, data: shown.map((x) => fmt(ctx, x)),
      question: 'Find the range.',
      steps: [
        { legend: 'Step 1: Find the extremes', fields: [
          numF('max', 'Largest value', exactT(mx), { wrongMsg: 'Look through every value for the largest one.', diagnose: [{ value: shown[shown.length - 1], msg: 'That is the last value listed. Look for the largest.' }] }),
          numF('min', 'Smallest value', exactT(mn), { wrongMsg: 'Look through every value for the smallest one.', diagnose: [{ value: shown[0], msg: 'That is the first value listed. Look for the smallest.' }] }),
        ].map(cleanDiag) },
        { legend: 'Step 2: Subtract', fields: [cleanDiag(numF('range', 'Range', exactT(mx - mn), {
          wrongMsg: 'Range = largest value − smallest value.',
          diagnose: [{ value: mn - mx, msg: 'Subtract the smallest value from the largest.' }],
        }))] },
      ],
      solution: [
        'Largest value: ' + withUnit(ctx, mx) + '. Smallest value: ' + withUnit(ctx, mn) + '.',
        'Range = ' + fmt(ctx, mx) + ' − ' + fmt(ctx, mn) + ' = ' + withUnit(ctx, mx - mn) + '.',
      ],
    };
  }

  /** Six-step sample standard deviation. */
  function sdData(rng, ctx, level) {
    const [lo, hi] = unitRange(ctx);
    if (level === 1) {
      const span = hi - lo;
      const g = span >= 40 && rng.chance(0.6) ? 5 : 1;
      for (;;) {
        const m = rng.int(lo + Math.floor(span / 4), hi - Math.floor(span / 4));
        const D = Math.floor(Math.min(m - lo, hi - m, g === 5 ? 25 : 12) / g);
        if (D < 2) continue;
        const ds = ints(rng, 4, -D, D);
        const last = -sum(ds);
        if (Math.abs(last) > D) continue;
        ds.push(last);
        if (new Set(ds).size < 3) continue;
        return rng.shuffle(ds.map((d) => (m + d * g) * ctx.step));
      }
    }
    for (;;) {
      const n = rng.pick([6, 8]);
      const mid = Math.round((lo + hi) / 2);
      const w = Math.min(Math.floor((hi - lo) / 2), 14);
      const ks = ints(rng, n, mid - w, mid + w);
      if (!meanOk(ks, 2) || new Set(ks).size < 4) continue;
      return ks.map((k) => k * ctx.step);
    }
  }

  function genSD(rng, level) {
    const ctx = pickCtx(rng, (c) => c.sd);
    return sdProblem(ctx, sdData(rng, ctx, level));
  }

  /** The six-step problem for a given dataset (also used for the book's Exercise 7). */
  function sdProblem(ctx, xs) {
    const n = xs.length; const M = sum(xs) / n;
    const devs = xs.map((x) => x - M); const sqs = devs.map((d) => d * d);
    const SS = sum(sqs); const V = SS / (n - 1); const SD = Math.sqrt(V);
    const Vpop = SS / n;
    const vT = roundT(V, 2);
    const rows = xs.map(function (x, i) {
      const name = 'value ' + (i + 1) + ' (' + fmt(ctx, x) + ')';
      return {
        value: fmt(ctx, x),
        dev: cleanDiag(numF('dev' + i, 'Deviation for ' + name, exactT(devs[i]), {
          wrongMsg: 'Value − mean: ' + fmt(ctx, x) + ' − ' + fmt(ctx, M) + '.',
          diagnose: [{ value: -devs[i], msg: 'Subtract the mean from the value: ' + fmt(ctx, x) + ' − ' + fmt(ctx, M) + '. Values below the mean have negative deviations.' }],
        })),
        sq: cleanDiag(numF('sq' + i, 'Squared deviation for ' + name, exactT(sqs[i]), {
          nonNegative: true, negMsg: 'A squared number is never negative: a negative times a negative is positive.',
          wrongMsg: 'Multiply the deviation by itself.',
          diagnose: [
            { value: 2 * devs[i], msg: 'Squaring means multiplying the deviation by itself, not by 2.' },
            { value: devs[i], msg: 'Square the deviation: multiply it by itself.' },
            { value: -sqs[i], msg: 'A squared number is never negative.' },
          ],
        })),
      };
    });
    const sdAlts = vT.exact ? [] : [{ target: roundT(Math.sqrt(roundTo(V, 2)), 2), msg: 'Correct. (You rounded the variance first, which can shift the last digit; that is fine.)' }];
    const steps = [
      { legend: 'Step 1: Calculate the mean', fields: [cleanDiag(numF('mean', 'Mean', exactT(M), {
        wrongMsg: 'Add the values and divide by how many there are.',
        diagnose: [{ value: sum(xs) / (n - 1), msg: 'The mean divides by the number of values, not one less.' }],
      }))] },
      {
        legend: 'Steps 2 and 3: Find each deviation and square it',
        help: 'Deviation = value − mean. Values below the mean have negative deviations.',
        table: { caption: 'Deviations and squared deviations', rows },
        fields: [],
      },
      { legend: 'Step 4: Add up the squared deviations', fields: [cleanDiag(numF('ss', 'Sum of squared deviations', exactT(SS), {
        wrongMsg: 'Add up the squared deviations in the right-hand column.',
        diagnose: [{ value: 0, msg: 'That is the sum of the deviations, which is always 0. Add the squared deviations.' }],
      }))] },
      { legend: 'Step 5: Divide by one less than the number of values (the variance)', fields: [cleanDiag(numF('var', 'Variance', vT, {
        wrongMsg: 'Divide the sum of squared deviations by ' + (n - 1) + '.',
        diagnose: [
          { value: Vpop, msg: 'You divided by ' + n + '. For sample data, divide by one less than the number of values: ' + (n - 1) + '.' },
          { value: SS, msg: 'Divide the sum of squared deviations by ' + (n - 1) + '.' },
        ],
      }))] },
      { legend: 'Step 6: Take the square root (the standard deviation)', fields: [cleanDiag(numF('sd', 'Standard deviation', roundT(SD, 2), {
        alts: sdAlts,
        wrongMsg: 'Take the square root of the variance.',
        diagnose: [
          { value: V, msg: 'That is the variance. Take its square root.' },
          { value: Math.sqrt(Vpop), msg: 'That divides by ' + n + ' instead of ' + (n - 1) + '. It is the population standard deviation, not the sample one.' },
          { value: Math.sqrt(SS), msg: 'Take the square root of the variance, not of the sum of squared deviations.' },
        ],
      }))] },
    ];
    steps[1].fields = rows.reduce((acc, r) => acc.concat([r.dev, r.sq]), []);
    const sqLine = sqs.map((q) => fmt(null, q)).join(' + ');
    return {
      setup: fill(ctx.setup, { n }), dataLabel: ctx.label, data: xs.map((x) => fmt(ctx, x)),
      question: 'Find the sample standard deviation. Round only at the end, to two decimal places.',
      steps,
      solution: [
        'Step 1. Mean: ' + fmt(ctx, sum(xs)) + ' ÷ ' + n + ' = ' + fmt(ctx, M) + '.',
      ].concat(xs.map((x, i) => 'For ' + fmt(ctx, x) + ': deviation ' + fmt(null, devs[i]) + '; squared deviation ' + fmt(null, sqs[i]) + '.'))
        .concat([
          'Step 4. Sum of squared deviations: ' + sqLine + ' = ' + fmt(null, SS) + '.',
          'Step 5. Variance: ' + fmt(null, SS) + ' ÷ ' + (n - 1) + (vT.exact ? ' = ' + fmt(null, V) + '.' : ' ≈ ' + numStr(roundTo(V, 2), 2) + '. Keep the unrounded value, ' + numStr(V, 4) + '…, for the last step if you can.'),
          'Step 6. Standard deviation: the square root of the variance is about ' + numStr(roundTo(SD, 2), 2) + ' ' + (ctx.unit || '') + '.',
        ]),
    };
  }

  function genSDBig(rng) {
    const ctx = rng.pick(BANK.big);
    const n = rng.int(12, 16);
    const f = Math.pow(10, ctx.decimals);
    const lo = Math.round(ctx.range[0] * f); const hi = Math.round(ctx.range[1] * f);
    const mid = (lo + hi) / 2; const half = (hi - lo) / 2;
    // Sum of two uniforms: values bunch toward the middle, as real data would.
    const ks = Array.from({ length: n }, () => Math.round(mid + (rng.next() + rng.next() - 1) * half));
    const xs = ks.map((k) => k / f);
    const M = sum(ks) / n / f;
    const SS = sum(ks.map((k) => (k / f - M) * (k / f - M)));
    const SD = Math.sqrt(SS / (n - 1)); const SDp = Math.sqrt(SS / n);
    const text = xs.map((x) => x.toFixed(ctx.decimals)).join(', ');
    return {
      setup: fill(ctx.setup, { n }), dataLabel: ctx.label, data: xs.map((x) => x.toFixed(ctx.decimals)), copy: text,
      question: 'Use a spreadsheet to find the mean and the sample standard deviation. Round each to two decimal places.',
      steps: [
        { legend: 'Paste the data into a spreadsheet', help: 'In Excel or Google Sheets, =AVERAGE() gives the mean and =STDEV.S() gives the sample standard deviation.', fields: [
          cleanDiag(numF('mean', 'Mean', roundT(M, 2), { wrongMsg: 'Check that every value was pasted, then use =AVERAGE().', diagnose: [{ value: median(xs), msg: 'That is the median. Use =AVERAGE().' }] })),
          cleanDiag(numF('sd', 'Sample standard deviation', roundT(SD, 2), {
            wrongMsg: 'Check that every value was pasted, then use =STDEV.S().',
            diagnose: [
              { value: SDp, msg: 'That is the population standard deviation, from =STDEV.P(). For sample data, use =STDEV.S().' },
              { value: SS / (n - 1), msg: 'That is the variance (=VAR.S()). The standard deviation is its square root.' },
            ],
          })),
        ] },
      ],
      solution: [
        'Mean: =AVERAGE(...) gives ' + numStr(M, 4) + ', which rounds to ' + numStr(roundTo(M, 2), 2) + ' ' + ctx.unit + '.',
        'Sample standard deviation: =STDEV.S(...) gives ' + numStr(SD, 4) + ', which rounds to ' + numStr(roundTo(SD, 2), 2) + ' ' + ctx.unit + '.',
        '=STDEV.P(...) would give ' + numStr(SDp, 4) + '. It divides by ' + n + ' instead of ' + (n - 1) + ', which is right only when the data is the whole population.',
      ],
    };
  }

  function genZ(rng, level) {
    const ctx = rng.pick(BANK.normal);
    const mean = rng.pick(ctx.mean); const sd = rng.pick(ctx.sd);
    const zs = level === 1 ? [-3, -2, -1, 1, 2, 3] : [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
    let z; let x;
    do { z = rng.pick(zs); x = mean + z * sd; } while (x <= 0);
    const dist = Math.abs(x - mean); const k = Math.abs(z);
    const side = z > 0 ? 'above' : 'below';
    return {
      setup: fill(ctx.setup, { mean: numStr(mean), sd: numStr(sd) }) + ' ' + fill(ctx.item, { x: numStr(x) }),
      dataLabel: '', data: [],
      question: 'How many standard deviations from the mean is this value, and is it above or below the mean?',
      steps: [
        { legend: 'Step 1: Find the distance from the mean', fields: [cleanDiag(numF('dist', 'Distance from the mean', exactT(dist), {
          wrongMsg: 'Subtract the mean from the value.',
          alts: [{ target: exactT(-dist), msg: 'Correct. The distance is ' + numStr(dist) + '; the minus sign says the value is below the mean.' }],
        }))] },
        { legend: 'Step 2: Divide by the standard deviation', fields: [
          cleanDiag(numF('z', 'Number of standard deviations', exactT(k), {
            wrongMsg: 'Divide the distance by the standard deviation, ' + numStr(sd) + '.',
            alts: [{ target: exactT(-k), msg: 'Correct. The minus sign says the value is below the mean.' }],
            diagnose: [
              { value: dist, msg: 'That is the distance in ' + ctx.unit + '. Divide it by the standard deviation, ' + numStr(sd) + '.' },
              { value: x / sd, msg: 'Subtract the mean first, then divide by the standard deviation.' },
            ],
          })),
          selF('side', 'The value is', [{ value: 'above', label: 'Above the mean' }, { value: 'below', label: 'Below the mean' }], side),
        ] },
      ],
      solution: [
        'Distance from the mean: ' + numStr(x) + ' − ' + numStr(mean) + ' = ' + numStr(x - mean) + ' ' + ctx.unit + '.',
        'Divide by the standard deviation: ' + numStr(dist) + ' ÷ ' + numStr(sd) + ' = ' + numStr(k) + '.',
        'The value is ' + numStr(k) + ' standard deviation' + (k === 1 ? '' : 's') + ' ' + side + ' the mean.',
      ],
    };
  }

  // ---------------------------------------------------------------------
  // The normal distribution (section 15.3)
  // ---------------------------------------------------------------------
  const WITHIN = { 1: 68, 2: 95, 3: 99.7 };
  const OUTSIDE = { 1: 32, 2: 5, 3: 0.3 };
  const TAIL = { 1: 16, 2: 2.5, 3: 0.15 };
  const sds = (k) => numStr(k) + ' standard deviation' + (k === 1 ? '' : 's');

  /** A percent field. Typing the decimal form (0.95 for 95%) gets a pointer, not a pass. */
  function pctF(id, label, value, o) {
    o = o || {};
    const f = numF(id, label, exactT(value), Object.assign({ percent: true }, o));
    f.diagnose = (o.diagnose || []).concat([{ value: value / 100, msg: 'Give this as a percent rather than a decimal (multiply by 100).' }]);
    return cleanDiag(f);
  }
  function pickNormal(rng, countable) {
    const list = BANK.normal.filter((c) => !countable || c.countable);
    const ctx = rng.pick(list);
    return { ctx, mean: rng.pick(ctx.mean), sd: rng.pick(ctx.sd) };
  }
  const nu = (ctx, x) => numStr(x) + (ctx.unit ? ' ' + ctx.unit : '');
  function normalSetup(ctx, mean, sd) { return fill(ctx.setup, { mean: numStr(mean), sd: numStr(sd) }); }
  /** A batch size that makes N x pct% a whole number. */
  function pickN(rng, pcts) {
    const ok = [200, 400, 500, 800, 1000, 2000, 4000, 5000, 10000]
      .filter((N) => pcts.every((p) => terminates(N * p / 100, 0)));
    return rng.pick(ok);
  }

  function kField(ctx, k, sd, target) {
    return cleanDiag(numF('k', 'How many standard deviations is ' + target + ' from the mean?', exactT(k), {
      wrongMsg: 'Find the distance from the mean, then divide by the standard deviation, ' + numStr(sd) + '.',
      diagnose: [{ value: k * sd, msg: 'That is the distance in ' + (ctx.unit || 'points') + '. Divide it by the standard deviation.' }],
    }));
  }
  function withinField(k) {
    return pctF('within', 'Percentage within ' + 'that many standard deviations of the mean (%)', WITHIN[k], {
      wrongMsg: 'Use the empirical rule: 68%, 95%, or 99.7%.',
      diagnose: [1, 2, 3].filter((j) => j !== k).map((j) => ({ value: WITHIN[j], msg: 'That is the percentage within ' + sds(j) + '.' }))
        .concat([{ value: OUTSIDE[k], msg: 'That is the percentage outside the band. This box asks for the percentage inside it.' }]),
    });
  }

  function genWithin(rng, level) {
    let ctx, mean, sd, k;
    do { ({ ctx, mean, sd } = pickNormal(rng, level === 2)); k = rng.int(1, 3); } while (mean - k * sd <= 0);
    const a = mean - k * sd; const b = mean + k * sd; const pct = WITHIN[k];
    const N = level === 2 ? pickN(rng, [pct]) : 0;
    const steps = [
      { legend: 'Step 1: Measure the range in standard deviations', fields: [kField(ctx, k, sd, numStr(b))] },
      { legend: 'Step 2: Apply the empirical rule', fields: [withinField(k)] },
    ];
    const solution = [
      numStr(b) + ' − ' + numStr(mean) + ' = ' + numStr(k * sd) + ', which is ' + numStr(k * sd) + ' ÷ ' + numStr(sd) + ' = ' + sds(k) + '. The range ' + numStr(a) + ' to ' + numStr(b) + ' runs from ' + sds(k) + ' below the mean to ' + sds(k) + ' above it.',
      'By the empirical rule, about ' + pct + '% of values fall within ' + sds(k) + ' of the mean.',
    ];
    if (N) {
      const c = N * pct / 100;
      steps.push({ legend: 'Step 3: Turn the percentage into a count', fields: [cleanDiag(numF('count', 'Approximate number of ' + ctx.things, exactT(c), {
        wrongMsg: 'Multiply ' + numStr(N) + ' by the percentage written as a decimal.',
        diagnose: [{ value: N * pct, msg: 'Write the percentage as a decimal before multiplying (divide it by 100).' }],
      }))] });
      solution.push(numStr(N) + ' × ' + numStr(pct / 100) + ' = ' + numStr(c) + ' ' + ctx.things + '.');
    }
    return {
      setup: normalSetup(ctx, mean, sd), dataLabel: '', data: [],
      question: N
        ? 'Out of ' + numStr(N) + ' ' + ctx.things + ', approximately how many have ' + ctx.measure + ' between ' + numStr(a) + ' and ' + nu(ctx, b) + '?'
        : 'Approximately what percentage of ' + ctx.things + ' have ' + ctx.measure + ' between ' + numStr(a) + ' and ' + nu(ctx, b) + '?',
      steps, solution,
    };
  }

  /** One-tail problem: share (and, with N, count) beyond mean +/- k SD. Used for Exercise 13. */
  function tailProblem(ctx, mean, sd, k, side, N, setupText, questionText) {
    const cut = side === 'above' ? mean + k * sd : mean - k * sd;
    const t = TAIL[k];
    const steps = [
      { legend: 'Step 1: Measure the cutoff in standard deviations', fields: [kField(ctx, k, sd, numStr(cut))] },
      { legend: 'Step 2: Apply the empirical rule', fields: [
        withinField(k),
        pctF('outside', 'Percentage outside that band, both tails together (%)', OUTSIDE[k], {
          wrongMsg: 'Subtract the percentage inside the band from 100%.',
          diagnose: [{ value: WITHIN[k], msg: 'That is the percentage inside the band. Subtract it from 100%.' }],
        }),
      ] },
      { legend: 'Step 3: Take one tail', help: 'The normal distribution is symmetric, so the percentage outside the band splits evenly between the two tails.', fields: [
        pctF('tail', 'Percentage ' + side + ' ' + nu(ctx, cut) + ' (%)', t, {
          wrongMsg: 'Halve the percentage outside the band.',
          diagnose: [
            { value: OUTSIDE[k], msg: 'That is both tails together. Half of it lies on each side of the mean.' },
            { value: WITHIN[k], msg: 'That is the middle band. The question asks about one tail.' },
            { value: 100 - t, msg: 'That is everything on the other side of the cutoff.' },
          ],
        }),
      ] },
    ];
    const solution = [
      'Distance from the mean: ' + numStr(Math.abs(cut - mean)) + ' ' + (ctx.unit || '') + ', which is ' + numStr(Math.abs(cut - mean)) + ' ÷ ' + numStr(sd) + ' = ' + sds(k) + ' ' + side + ' the mean.',
      'About ' + WITHIN[k] + '% of values fall within ' + sds(k) + ' of the mean, so about 100% − ' + WITHIN[k] + '% = ' + OUTSIDE[k] + '% fall outside that band.',
      'By symmetry, half of that, about ' + t + '%, lies ' + side + ' ' + nu(ctx, cut) + '.',
    ];
    if (N) {
      const c = N * t / 100;
      steps.push({ legend: 'Step 4: Turn the percentage into a count', fields: [cleanDiag(numF('count', 'Approximate number of ' + ctx.things, exactT(c), {
        wrongMsg: 'Multiply ' + numStr(N) + ' by the one-tail percentage written as a decimal.',
        diagnose: [
          { value: N * OUTSIDE[k] / 100, msg: 'That counts both tails. Only one tail is ' + side + ' the cutoff.' },
          { value: N * WITHIN[k] / 100, msg: 'That counts the middle band, not the tail.' },
          { value: N * t, msg: 'Write the percentage as a decimal before multiplying (divide it by 100).' },
        ],
      }))] });
      solution.push(numStr(N) + ' × ' + numStr(t / 100) + ' = ' + numStr(c) + ' ' + ctx.things + '.');
    }
    const more = side === 'above' ? 'above' : 'below';
    return {
      setup: setupText || normalSetup(ctx, mean, sd), dataLabel: '', data: [],
      question: questionText || (N
        ? 'Out of ' + numStr(N) + ' ' + ctx.things + ', approximately how many have ' + ctx.measure + ' ' + more + ' ' + nu(ctx, cut) + '?'
        : 'Approximately what percentage of ' + ctx.things + ' have ' + ctx.measure + ' ' + more + ' ' + nu(ctx, cut) + '?'),
      steps, solution,
    };
  }

  function genTail(rng, level) {
    let ctx, mean, sd, k, side;
    do {
      ({ ctx, mean, sd } = pickNormal(rng, level === 2));
      k = rng.int(1, 3); side = rng.pick(['above', 'below']);
    } while (mean - k * sd <= 0);
    const N = level === 2 ? pickN(rng, [TAIL[k], OUTSIDE[k], WITHIN[k]]) : 0;
    return tailProblem(ctx, mean, sd, k, side, N);
  }

  /** Boundary of a top or bottom tail: part of Exercise 15. */
  function boundaryFields(ctx, mean, sd, t, side, prefix) {
    const k = [1, 2, 3].find((j) => TAIL[j] === t);
    const score = side === 'top' ? mean + k * sd : mean - k * sd;
    const other = side === 'top' ? mean - k * sd : mean + k * sd;
    return {
      k, score,
      fields: [
        cleanDiag(numF(prefix + 'k', 'How many standard deviations from the mean is that boundary?', exactT(k), {
          wrongMsg: 'Double ' + t + '% to get both tails, subtract from 100% to get the middle band, then find which band that is.',
        })),
        cleanDiag(numF(prefix + 'score', 'Boundary of the ' + side + ' ' + t + '%', exactT(score), {
          wrongMsg: 'Go ' + sds(k) + ' ' + (side === 'top' ? 'above' : 'below') + ' the mean.',
          diagnose: [{ value: other, msg: 'That is on the wrong side of the mean. The ' + side + ' of the distribution is ' + (side === 'top' ? 'above' : 'below') + ' the mean.' }],
        })),
      ],
    };
  }

  function genBoundary(rng, level) {
    let ctx, mean, sd;
    if (level === 1) {
      let t, side, b;
      do {
        ({ ctx, mean, sd } = pickNormal(rng, false));
        t = rng.pick([16, 2.5, 0.15]); side = rng.pick(['top', 'bottom']);
        b = boundaryFields(ctx, mean, sd, t, side, '');
      } while (mean - b.k * sd <= 0);
      return {
        setup: normalSetup(ctx, mean, sd), dataLabel: '', data: [],
        question: 'What value marks the boundary of the ' + side + ' ' + t + '% of ' + ctx.measure + '?',
        steps: [
          { legend: 'Step 1: Find the matching band', fields: [
            pctF('both', 'Both tails together: double ' + t + '% (%)', 2 * t, { wrongMsg: 'The other tail holds the same ' + t + '%, so add them.' }),
            pctF('middle', 'The middle band that leaves (%)', 100 - 2 * t, { wrongMsg: 'Subtract both tails from 100%.' }),
          ] },
          { legend: 'Step 2: Find the boundary', fields: b.fields },
        ],
        solution: [
          'The ' + side + ' ' + t + '% is one tail. Both tails together hold ' + numStr(2 * t) + '%, leaving ' + numStr(100 - 2 * t) + '% in the middle.',
          'By the empirical rule, the middle ' + numStr(100 - 2 * t) + '% lies within ' + sds(b.k) + ' of the mean.',
          'The boundary is ' + numStr(mean) + (side === 'top' ? ' + ' : ' − ') + numStr(b.k) + '(' + numStr(sd) + ') = ' + nu(ctx, b.score) + '.',
        ],
      };
    }
    let k;
    do { ({ ctx, mean, sd } = pickNormal(rng, false)); k = rng.int(1, 3); } while (mean - k * sd <= 0);
    const p = WITHIN[k]; const lo = mean - k * sd; const hi = mean + k * sd;
    return {
      setup: normalSetup(ctx, mean, sd), dataLabel: '', data: [],
      question: 'Between what two values do the middle ' + p + '% of ' + ctx.measure + ' fall?',
      steps: [
        { legend: 'Step 1: Find the band', fields: [cleanDiag(numF('k', 'The middle ' + p + '% lies within how many standard deviations of the mean?', exactT(k), {
          wrongMsg: 'Use the empirical rule: 68% within 1, 95% within 2, 99.7% within 3.',
        }))] },
        { legend: 'Step 2: Find the two ends', fields: [
          cleanDiag(numF('low', 'Lower end', exactT(lo), { wrongMsg: 'Subtract ' + sds(k) + ' from the mean.', diagnose: [{ value: hi, msg: 'That is the upper end.' }] })),
          cleanDiag(numF('high', 'Upper end', exactT(hi), { wrongMsg: 'Add ' + sds(k) + ' to the mean.', diagnose: [{ value: lo, msg: 'That is the lower end.' }] })),
        ] },
      ],
      solution: [
        'By the empirical rule, the middle ' + p + '% lies within ' + sds(k) + ' of the mean.',
        numStr(mean) + ' − ' + numStr(k) + '(' + numStr(sd) + ') = ' + numStr(lo) + ' and ' + numStr(mean) + ' + ' + numStr(k) + '(' + numStr(sd) + ') = ' + numStr(hi) + '.',
        'The middle ' + p + '% falls between ' + numStr(lo) + ' and ' + nu(ctx, hi) + '.',
      ],
    };
  }

  const UNUSUAL = [
    { value: 'typical', label: 'Not unusual: within 2 standard deviations, where about 95% of values fall' },
    { value: 'unusual', label: 'Unusual: between 2 and 3 standard deviations away, outside the middle 95%' },
    { value: 'extreme', label: 'Extremely unusual: more than 3 standard deviations away, outside the middle 99.7%' },
  ];
  /** How far out is one value, and is it unusual? Used for Exercise 11. */
  function unusualProblem(ctx, mean, sd, x, setupText) {
    const k = Math.abs(x - mean) / sd; const side = x > mean ? 'above' : 'below';
    const cls = k < 2 ? 'typical' : k < 3 ? 'unusual' : 'extreme';
    return {
      setup: setupText || normalSetup(ctx, mean, sd) + ' ' + fill(ctx.item, { x: numStr(x) }),
      dataLabel: '', data: [],
      question: 'How many standard deviations from the mean is this value? Is it unusual?',
      steps: [
        { legend: 'Step 1: Measure the distance in standard deviations', fields: [
          cleanDiag(numF('z', 'Number of standard deviations from the mean', exactT(k), {
            alts: [{ target: exactT(-k), msg: 'Correct. The minus sign says the value is below the mean.' }],
            wrongMsg: 'Subtract the mean from the value, then divide by the standard deviation, ' + numStr(sd) + '.',
            diagnose: [{ value: Math.abs(x - mean), msg: 'That is the distance in ' + (ctx.unit || 'points') + '. Divide it by the standard deviation.' }],
          })),
          selF('side', 'The value is', [{ value: 'above', label: 'Above the mean' }, { value: 'below', label: 'Below the mean' }], side),
        ] },
        { legend: 'Step 2: Judge how unusual it is', fields: [selF('unusual', 'This value is', UNUSUAL, cls, {
          wrongMsg: 'Compare ' + sds(k) + ' with the 2- and 3-standard-deviation bands of the empirical rule.',
        })] },
      ],
      solution: [
        '(' + numStr(x) + ' − ' + numStr(mean) + ') ÷ ' + numStr(sd) + ' = ' + numStr(x - mean) + ' ÷ ' + numStr(sd) + ' = ' + numStr((x - mean) / sd) + ', so the value is ' + sds(k) + ' ' + side + ' the mean.',
        cls === 'typical' ? 'That is within 2 standard deviations, where about 95% of values fall, so it is not unusual.'
          : cls === 'unusual' ? 'That is beyond 2 standard deviations, outside the middle 95%, but within 3, where 99.7% fall. It is unusual but not extreme.'
            : 'That is beyond 3 standard deviations, outside the middle 99.7%. Values like it are extremely rare.',
      ],
    };
  }
  function genUnusual(rng) {
    let ctx, mean, sd, z;
    do {
      ({ ctx, mean, sd } = pickNormal(rng, false));
      z = rng.pick([0.5, 1, 1.5, 2.5, 2.5, 3.5]) * (rng.chance(0.5) ? 1 : -1);
    } while (mean + z * sd <= 0);
    return unusualProblem(ctx, mean, sd, mean + z * sd);
  }

  // ---------------------------------------------------------------------
  // Margin of error (section 15.4). Every poll has 600 or 1,000 people, the
  // two sample sizes students meet most often in news coverage.
  // ---------------------------------------------------------------------
  /** The book's rule-of-thumb table (95% confidence). 600 is 0.98/sqrt(600), about 4.0. */
  const MOE = { 400: 4.9, 500: 4.4, 600: 4.0, 1000: 3.1, 1500: 2.5, 2000: 2.2 };
  const POLL_N = [600, 1000];
  const r1 = (x) => roundTo(x, 1);
  const pc = (x) => numStr(r1(x)) + '%';
  /** Judgments (majority, overlap) never sit exactly on their boundary. */
  const clearOf = (a, b) => Math.abs(a - b) > 0.05;

  function moeField(n, id, label) {
    const m = MOE[n];
    const other = POLL_N.filter((k) => k !== n).map((k) => ({
      value: MOE[k], msg: 'That is the margin for a sample of ' + numStr(k) + '. This poll asked ' + numStr(n) + ' people.',
    }));
    return pctF(id || 'moe', label || 'Margin of error for a sample of ' + numStr(n) + ' (percentage points)', m, {
      wrongMsg: 'Find ' + numStr(n) + ' in the rule-of-thumb table in the Reference panel.',
      diagnose: other.concat([{ value: 2 * m, msg: 'That is the width of the whole interval. The margin of error is half of it: the amount added and subtracted.' }]),
    });
  }

  function ciFields(prefix, who, est, m) {
    const lo = r1(est - m); const hi = r1(est + m);
    return [
      pctF(prefix + 'low', 'Lower end' + who + ' (%)', lo, {
        wrongMsg: 'Subtract the margin of error from ' + pc(est) + '.',
        diagnose: [
          { value: r1(est - 2 * m), msg: 'Subtract the margin of error once, not twice.' },
          { value: r1(est - m / 2), msg: 'Subtract the whole margin of error, not half of it.' },
          { value: hi, msg: 'That is the upper end.' },
        ],
      }),
      pctF(prefix + 'high', 'Upper end' + who + ' (%)', hi, {
        wrongMsg: 'Add the margin of error to ' + pc(est) + '.',
        diagnose: [
          { value: r1(est + 2 * m), msg: 'Add the margin of error once, not twice.' },
          { value: r1(est + m / 2), msg: 'Add the whole margin of error, not half of it.' },
          { value: lo, msg: 'That is the lower end.' },
        ],
      }),
    ];
  }

  /** Level 2 gives a count of people; the student turns it into a percent. */
  function countField(id, label, count, n, pct) {
    return pctF(id, label, pct, {
      wrongMsg: 'Divide ' + numStr(count) + ' by ' + numStr(n) + ', then multiply by 100.',
      diagnose: [{ value: count, msg: 'That is the number of people. Turn it into a percentage of the ' + numStr(n) + ' polled.' }],
    });
  }
  const countLine = (count, n, pct) => numStr(count) + ' ÷ ' + numStr(n) + ' = ' + numStr(pct / 100) + ', or ' + pct + '%.';

  function pollSetup(ctx, n, est, level) {
    return level === 1
      ? 'A random sample of ' + numStr(n) + ' ' + ctx.pop + ' finds that ' + est + '% ' + ctx.phrase + '.'
      : 'In a random sample of ' + numStr(n) + ' ' + ctx.pop + ', ' + numStr(n * est / 100) + ' ' + ctx.phrase + '.';
  }

  /** An estimate whose interval is wholly above, wholly below, or across 50%. */
  function pickEst(rng, n, want) {
    const m = MOE[n];
    for (;;) {
      const e = rng.int(38, 62); const lo = e - m; const hi = e + m;
      if (!clearOf(lo, 50) || !clearOf(hi, 50)) continue;
      const cat = lo > 50 ? 'yes' : hi < 50 ? 'no' : 'unclear';
      if (cat === want) return e;
    }
  }

  const MAJORITY = [
    { value: 'yes', label: 'Yes: the whole interval lies above 50%' },
    { value: 'no', label: 'No: the whole interval lies below 50%, so this view is held by less than half' },
    { value: 'unclear', label: 'Cannot tell: the interval includes 50%, so the result is within the margin of error' },
  ];
  function majorityField(lo, hi) {
    const ans = lo > 50 ? 'yes' : hi < 50 ? 'no' : 'unclear';
    return selF('majority', 'Does the poll show that a majority hold this view?', MAJORITY, ans, {
      wrong: {
        yes: 'The interval runs from ' + pc(lo) + ' to ' + pc(hi) + '. For a majority, every value in it must be above 50%.',
        no: 'The interval runs from ' + pc(lo) + ' to ' + pc(hi) + '. Not all of it is below 50%.',
        unclear: 'The interval runs from ' + pc(lo) + ' to ' + pc(hi) + '. Does it actually contain 50%?',
      },
    });
  }
  function majorityLine(lo, hi) {
    return lo > 50 ? 'Even the lower end, ' + pc(lo) + ', is above 50%, so the poll supports a majority at the 95% confidence level.'
      : hi < 50 ? 'Even the upper end, ' + pc(hi) + ', is below 50%, so the poll shows that less than half hold this view.'
        : 'The interval runs from below 50% to above it, so the poll cannot tell whether a majority hold this view. The result is within the margin of error.';
  }

  function pollBasics(rng, level, est, ctxIn, nIn) {
    const ctx = ctxIn || rng.pick(BANK.poll);
    const n = nIn || rng.pick(POLL_N);
    const m = MOE[n];
    const steps = []; const solution = [];
    if (level === 2) {
      const count = n * est / 100;
      steps.push({ legend: 'Step 1: Turn the count into a percentage', fields: [countField('pct', 'Percentage who ' + ctx.phrase + ' (%)', count, n, est)] });
      solution.push(countLine(count, n, est));
    }
    steps.push({ legend: 'Step ' + (steps.length + 1) + ': Look up the margin of error', help: 'Use the rule-of-thumb table in the Reference panel.', fields: [moeField(n)] });
    steps.push({ legend: 'Step ' + (steps.length + 1) + ': Build the confidence interval', fields: ciFields('', '', est, m) });
    solution.push('A random sample of ' + numStr(n) + ' gives a margin of error of about plus or minus ' + m + ' percentage points at the 95% confidence level.');
    solution.push('The interval runs from ' + est + ' − ' + m + ' = ' + pc(est - m) + ' to ' + est + ' + ' + m + ' = ' + pc(est + m) + '.');
    return { ctx, n, m, steps, solution, setup: pollSetup(ctx, n, est, level) };
  }

  function genInterval(rng, level) {
    const est = rng.int(25, 75);
    const b = pollBasics(rng, level, est);
    return {
      setup: b.setup, dataLabel: '', data: [],
      question: 'Give the 95% confidence interval for the percentage of all ' + b.ctx.pop + ' who ' + b.ctx.phrase + '.',
      steps: b.steps, solution: b.solution,
    };
  }

  function genMajority(rng, level) {
    const n = rng.pick(POLL_N);
    const est = pickEst(rng, n, rng.pick(['yes', 'no', 'unclear', 'unclear']));
    const b = pollBasics(rng, level, est, null, n);
    const lo = est - b.m; const hi = est + b.m;
    b.steps.push({ legend: 'Step ' + (b.steps.length + 1) + ': Read the interval', fields: [majorityField(lo, hi)] });
    b.solution.push(majorityLine(lo, hi));
    return {
      setup: b.setup + ' A report claims that a majority of all ' + b.ctx.pop + ' ' + b.ctx.phrase + '.', dataLabel: '', data: [],
      question: 'Does the poll support the claim? Build the interval, then compare it with 50%.',
      steps: b.steps, solution: b.solution,
    };
  }

  const RACE = (A) => [
    { value: 'ahead', label: 'Yes: the intervals do not overlap, so ' + A + '’s lead is larger than the sampling uncertainty' },
    { value: 'within', label: 'No: the intervals overlap, so the race is within the margin of error' },
  ];

  function genRace(rng, level) {
    const ctx = rng.pick(BANK.race);
    const n = rng.pick(POLL_N); const m = MOE[n];
    const wantOverlap = rng.chance(0.55);
    let a, b;
    for (;;) {
      a = rng.int(42, 56); b = rng.int(34, a - 1);
      if (a + b > 97 || !clearOf(a - b, 2 * m)) continue;
      if ((a - b < 2 * m) === wantOverlap) break;
    }
    const A = ctx.a; const B = ctx.b; const lead = a - b;
    const aLo = a - m; const bHi = b + m;
    const steps = []; const solution = [];
    let setup;
    if (level === 1) {
      setup = 'A poll of ' + numStr(n) + ' randomly selected ' + ctx.pop + ' about ' + ctx.office + ' finds that ' + a + '% support ' + A + ' and ' + b + '% support ' + B + '; the rest are undecided.';
    } else {
      setup = 'In a poll of ' + numStr(n) + ' randomly selected ' + ctx.pop + ' about ' + ctx.office + ', ' + numStr(n * a / 100) + ' support ' + A + ' and ' + numStr(n * b / 100) + ' support ' + B + '; the rest are undecided.';
      steps.push({ legend: 'Step 1: Turn the counts into percentages', fields: [
        countField('a-pct', 'Percentage for ' + A + ' (%)', n * a / 100, n, a),
        countField('b-pct', 'Percentage for ' + B + ' (%)', n * b / 100, n, b),
      ] });
      solution.push(A + ': ' + countLine(n * a / 100, n, a) + ' ' + B + ': ' + countLine(n * b / 100, n, b));
    }
    const s = (t) => 'Step ' + (steps.length + 1) + ': ' + t;
    steps.push({ legend: s('Look up the margin of error'), help: 'Both candidates come from the same poll, so they share one margin of error.', fields: [moeField(n)] });
    steps.push({ legend: s('Interval for ' + A), fields: ciFields('a-', ' for ' + A, a, m) });
    steps.push({ legend: s('Interval for ' + B), fields: ciFields('b-', ' for ' + B, b, m) });
    const ov = aLo < bHi;
    steps.push({ legend: s('Compare the intervals'), fields: [selF('lead', 'Does the poll show that ' + A + ' is really ahead?', RACE(A), ov ? 'within' : 'ahead', {
      wrong: {
        ahead: A + '’s interval reaches down to ' + pc(aLo) + ', and ' + B + '’s reaches up to ' + pc(bHi) + '. Those ranges overlap.',
        within: A + '’s lowest plausible value, ' + pc(aLo) + ', is still above ' + B + '’s highest, ' + pc(bHi) + '.',
      },
    })] });
    solution.push('A sample of ' + numStr(n) + ' gives a margin of error of about plus or minus ' + m + ' percentage points.');
    solution.push(A + ': ' + a + '% ± ' + m + ' runs from ' + pc(a - m) + ' to ' + pc(a + m) + '. ' + B + ': ' + b + '% ± ' + m + ' runs from ' + pc(b - m) + ' to ' + pc(b + m) + '.');
    solution.push(ov
      ? 'The intervals overlap: ' + A + '’s could be as low as ' + pc(aLo) + ' and ' + B + '’s as high as ' + pc(bHi) + '. It is consistent with the data that ' + B + ' is actually ahead, so the race is within the margin of error.'
      : A + '’s lowest plausible value, ' + pc(aLo) + ', is above ' + B + '’s highest, ' + pc(bHi) + '. The intervals do not overlap, so the poll supports ' + A + '’s lead at the 95% confidence level.');
    solution.push('A shortcut: the intervals overlap exactly when the lead (' + lead + ' points) is smaller than twice the margin of error (' + numStr(2 * m) + ' points).');
    return {
      setup: setup + ' A news anchor says, “' + A + ' is ahead.”', dataLabel: '', data: [],
      question: 'Does the poll show that ' + A + ' is really ahead?',
      steps, solution,
    };
  }

  const CHANGE = [
    { value: 'real', label: 'Yes: the intervals do not overlap, so the change is larger than the sampling uncertainty' },
    { value: 'noise', label: 'No: the intervals overlap, so the change could be sampling variation' },
  ];

  function genChange(rng, level) {
    const ctx = rng.pick(BANK.poll);
    const months = rng.pick([['March', 'May'], ['January', 'April'], ['September', 'October'], ['June', 'August']]);
    const wantReal = rng.chance(0.45);
    let n1, n2, p1, p2;
    for (;;) {
      n1 = rng.pick(POLL_N); n2 = rng.pick(POLL_N);
      p1 = rng.int(35, 65); p2 = p1 + rng.int(2, 12) * (rng.chance(0.5) ? 1 : -1);
      if (p2 < 30 || p2 > 70) continue;
      const lim = MOE[n1] + MOE[n2];
      if (!clearOf(Math.abs(p2 - p1), lim)) continue;
      if ((Math.abs(p2 - p1) > lim) === wantReal) break;
    }
    const m1 = MOE[n1]; const m2 = MOE[n2]; const d = p2 - p1;
    const dirWord = d > 0 ? 'risen' : 'fallen';
    const steps = []; const solution = [];
    let setup;
    if (level === 1) {
      setup = 'In ' + months[0] + ', a random sample of ' + numStr(n1) + ' ' + ctx.pop + ' found that ' + p1 + '% ' + ctx.phrase + '. In ' + months[1] + ', a new random sample of ' + numStr(n2) + ' found ' + p2 + '%.';
    } else {
      setup = 'In ' + months[0] + ', ' + numStr(n1 * p1 / 100) + ' of ' + numStr(n1) + ' randomly sampled ' + ctx.pop + ' said they ' + ctx.phrase.replace(/^(say|says) they /, '') + '. In ' + months[1] + ', ' + numStr(n2 * p2 / 100) + ' of a new random sample of ' + numStr(n2) + ' said so.';
      steps.push({ legend: 'Step 1: Turn the counts into percentages', fields: [
        countField('p1', months[0] + ' percentage (%)', n1 * p1 / 100, n1, p1),
        countField('p2', months[1] + ' percentage (%)', n2 * p2 / 100, n2, p2),
      ] });
      solution.push(months[0] + ': ' + countLine(n1 * p1 / 100, n1, p1) + ' ' + months[1] + ': ' + countLine(n2 * p2 / 100, n2, p2));
    }
    const s = (t) => 'Step ' + (steps.length + 1) + ': ' + t;
    steps.push({ legend: s('Look up both margins of error'), help: n1 === n2 ? 'Both polls are the same size.' : 'The two polls are different sizes, so their margins differ.', fields: [
      moeField(n1, 'moe1', months[0] + ' poll (' + numStr(n1) + ' people): margin of error (percentage points)'),
      moeField(n2, 'moe2', months[1] + ' poll (' + numStr(n2) + ' people): margin of error (percentage points)'),
    ] });
    steps.push({ legend: s(months[0] + ' interval'), fields: ciFields('a-', ' (' + months[0] + ')', p1, m1) });
    steps.push({ legend: s(months[1] + ' interval'), fields: ciFields('b-', ' (' + months[1] + ')', p2, m2) });
    const real = Math.abs(d) > m1 + m2;
    steps.push({ legend: s('Compare the intervals'), fields: [selF('change', 'Do the polls show a real change?', CHANGE, real ? 'real' : 'noise', {
      wrong: {
        real: 'Look for a value that lies inside both intervals. If there is one, the true percentage could be the same in both months.',
        noise: 'The ' + (d > 0 ? 'lower end of the ' + months[1] : 'lower end of the ' + months[0]) + ' interval is above the upper end of the other one.',
      },
    })] });
    solution.push('Margins of error: ' + months[0] + ' (' + numStr(n1) + ' people), ±' + m1 + '; ' + months[1] + ' (' + numStr(n2) + ' people), ±' + m2 + '.');
    solution.push(months[0] + ': ' + pc(p1 - m1) + ' to ' + pc(p1 + m1) + '. ' + months[1] + ': ' + pc(p2 - m2) + ' to ' + pc(p2 + m2) + '.');
    solution.push(real
      ? 'The intervals do not overlap, so the ' + Math.abs(d) + '-point change is larger than sampling alone would explain. The share has really ' + dirWord + '.'
      : 'The intervals overlap, so the true percentage could be the same in both months. The ' + Math.abs(d) + '-point change could be nothing more than the difference between two random samples.');
    return {
      setup: setup + ' A headline says the share has ' + dirWord + ' ' + Math.abs(d) + ' points.', dataLabel: '', data: [],
      question: 'Do the two polls show that the share who ' + ctx.phrase + ' has really ' + dirWord + '?',
      steps, solution,
    };
  }

  const SIZES = Object.keys(MOE).map((k) => ({ value: k, label: numStr(Number(k)) + ' people (± ' + MOE[k] + ')' }));

  function genReported(rng, level) {
    const ctx = rng.pick(BANK.poll);
    const n = rng.pick(POLL_N); const m = MOE[n];
    const est = pickEst(rng, n, rng.pick(['yes', 'no', 'unclear']));
    const lo = r1(est - m); const hi = r1(est + m);
    const steps = []; const solution = [];
    let setup;
    if (level === 1) {
      setup = 'A news story reports that ' + est + '% of ' + ctx.pop + ' ' + ctx.phrase + ', with a 95% confidence interval from ' + pc(lo) + ' to ' + pc(hi) + '. The story does not say how many people were polled.';
      steps.push({ legend: 'Step 1: Find the margin of error', fields: [pctF('moe', 'Margin of error (percentage points)', m, {
        wrongMsg: 'The margin is the distance from the estimate to either end: ' + pc(hi) + ' − ' + pc(est) + '.',
        diagnose: [{ value: r1(hi - lo), msg: 'That is the width of the whole interval. The margin of error is half of it.' }],
      })] });
      solution.push('The margin of error is the distance from the estimate to either end: ' + numStr(hi) + ' − ' + est + ' = ' + numStr(m) + ' percentage points.');
    } else {
      setup = 'A news story reports that, at the 95% confidence level, between ' + pc(lo) + ' and ' + pc(hi) + ' of ' + ctx.pop + ' ' + ctx.phrase + '. It gives neither the poll’s estimate nor how many people were polled.';
      steps.push({ legend: 'Step 1: Find the estimate and the margin', fields: [
        pctF('est', 'The poll’s estimate: the middle of the interval (%)', est, {
          wrongMsg: 'Average the two ends: (' + pc(lo) + ' + ' + pc(hi) + ') ÷ 2.',
          diagnose: [{ value: r1(hi - lo), msg: 'That is the width of the interval. The estimate is its middle.' }],
        }),
        pctF('moe', 'Margin of error (percentage points)', m, {
          wrongMsg: 'Half the width of the interval: (' + pc(hi) + ' − ' + pc(lo) + ') ÷ 2.',
          diagnose: [{ value: r1(hi - lo), msg: 'That is the width of the whole interval. The margin of error is half of it.' }],
        }),
      ] });
      solution.push('The estimate is the middle of the interval: (' + numStr(lo) + ' + ' + numStr(hi) + ') ÷ 2 = ' + est + '%.');
      solution.push('The margin of error is half the width: (' + numStr(hi) + ' − ' + numStr(lo) + ') ÷ 2 = ' + numStr(m) + ' percentage points.');
    }
    steps.push({ legend: 'Step 2: Work back to the sample size', help: 'Use the rule-of-thumb table.', fields: [selF('n', 'About how many people were polled?', SIZES, String(n), {
      wrongMsg: 'Find the sample size whose margin of error is ± ' + m + '.',
    })] });
    steps.push({ legend: 'Step 3: Read the interval', fields: [majorityField(lo, hi)] });
    solution.push('In the rule-of-thumb table, a margin of ± ' + m + ' goes with a sample of about ' + numStr(n) + ' people.');
    solution.push(majorityLine(lo, hi));
    return {
      setup, dataLabel: '', data: [],
      question: 'Work out the margin of error and the sample size, then say whether the poll shows a majority.',
      steps, solution,
    };
  }

  // ---------------------------------------------------------------------
  // Diagnostic thresholds (section 15.5)
  // ---------------------------------------------------------------------
  const DIR = [{ value: 'increase', label: 'Increase' }, { value: 'decrease', label: 'Decrease' }];
  const STAKES = [
    { value: 'sens', label: 'High sensitivity: catch as many true cases as possible' },
    { value: 'spec', label: 'High specificity: avoid false alarms' },
  ];
  const BAYES_NOTE = 'For the probability that a single positive result is correct, use the Bayes problems in the Chapter 14 probability tool.';

  function rateFields(ctx, sens, spec) {
    return [
      pctF('fnr', 'False-negative rate: the share of ' + ctx.items + ' that ' + ctx.cond + ' but test negative (%)', 100 - sens, {
        wrongMsg: 'False-negative rate = 100% − sensitivity.',
        diagnose: [
          { value: sens, msg: 'That is the sensitivity, the share caught. The false-negative rate is the share missed.' },
          { value: 100 - spec, msg: 'That comes from the specificity, which is about ' + ctx.items + ' that ' + ctx.neg + '. False negatives are cases that are really there.' },
        ],
      }),
      pctF('fpr', 'False-positive rate: the share of ' + ctx.items + ' that ' + ctx.neg + ' but test positive (%)', 100 - spec, {
        wrongMsg: 'False-positive rate = 100% − specificity.',
        diagnose: [
          { value: spec, msg: 'That is the specificity, the share correctly cleared. The false-positive rate is the share wrongly flagged.' },
          { value: 100 - sens, msg: 'That comes from the sensitivity, which is about ' + ctx.items + ' that ' + ctx.cond + '. False positives come from the others.' },
        ],
      }),
    ];
  }

  function genRates(rng, level) {
    const ctx = rng.pick(BANK.test);
    const sens = rng.pick([80, 85, 90, 92, 95, 98, 99]);
    const spec = rng.pick([75, 80, 85, 90, 95, 97, 98, 99]);
    const intro = ctx.name + ' has a sensitivity of ' + sens + '% and a specificity of ' + spec + '%.';
    if (level === 1) {
      const stake = rng.pick(['sens', 'spec']);
      return {
        setup: intro + (stake === 'sens'
          ? ' In this setting, missing a true case would be far more costly than a false alarm.'
          : ' In this setting, a false alarm would be far more costly than a missed case.'),
        dataLabel: '', data: [],
        question: 'What are the false-negative and false-positive rates? Given the stakes, which should the test favor?',
        steps: [
          { legend: 'Step 1: Turn sensitivity and specificity into error rates', fields: rateFields(ctx, sens, spec) },
          { legend: 'Step 2: Weigh the stakes', fields: [selF('stakes', 'Which should this test favor?', STAKES, stake, {
            wrongMsg: stake === 'sens' ? 'Missing a true case is the costly error here. Which property guards against misses?' : 'A false alarm is the costly error here. Which property guards against false alarms?',
          })] },
        ],
        solution: [
          'False-negative rate = 100% − ' + sens + '% = ' + (100 - sens) + '%: of the ' + ctx.items + ' that ' + ctx.cond + ', that share is missed.',
          'False-positive rate = 100% − ' + spec + '% = ' + (100 - spec) + '%: of the ' + ctx.items + ' that ' + ctx.neg + ', that share is wrongly flagged.',
          stake === 'sens'
            ? 'Misses are the costly error, so the test should favor high sensitivity, even at the price of more false alarms.'
            : 'False alarms are the costly error, so the test should favor high specificity, even at the price of more missed cases.',
        ],
      };
    }
    let N, br, P, TP, FP;
    for (;;) {
      N = rng.pick([1000, 2000, 5000, 10000, 20000]); br = rng.pick([1, 2, 5, 10, 20, 30]);
      P = N * br / 100; TP = P * sens / 100; FP = (N - P) * (100 - spec) / 100;
      if (terminates(TP, 0) && terminates(FP, 0) && TP !== FP) break;
    }
    const FN = P - TP;
    const most = TP > FP ? 'true' : 'false';
    return {
      setup: intro + ' It is used on ' + numStr(N) + ' ' + ctx.items + ', and ' + br + '% of them ' + ctx.cond + '.',
      dataLabel: '', data: [], note: BAYES_NOTE,
      question: 'How many true positives, false negatives, and false positives should we expect? Are most positive results right or wrong?',
      steps: [
        { legend: 'Step 1: Turn sensitivity and specificity into error rates', fields: rateFields(ctx, sens, spec) },
        { legend: 'Step 2: Split the group', fields: [cleanDiag(numF('p', 'Number of ' + ctx.items + ' that ' + ctx.cond, exactT(P), {
          wrongMsg: br + '% of ' + numStr(N) + '.', diagnose: [{ value: N - P, msg: 'That is the number that ' + ctx.neg + '.' }],
        }))] },
        { legend: 'Step 3: Count each kind of result', fields: [
          cleanDiag(numF('tp', 'True positives: ' + ctx.items + ' that ' + ctx.cond + ' and test positive', exactT(TP), {
            wrongMsg: 'Sensitivity × the number that ' + ctx.cond + ': ' + sens + '% of ' + numStr(P) + '.',
            diagnose: [{ value: N * sens / 100, msg: 'Apply the sensitivity only to the ' + numStr(P) + ' that ' + ctx.cond + ', not to everyone.' }],
          })),
          cleanDiag(numF('fn', 'False negatives: ' + ctx.items + ' that ' + ctx.cond + ' but test negative', exactT(FN), {
            wrongMsg: 'The ' + numStr(P) + ' that ' + ctx.cond + ', minus the true positives.',
          })),
          cleanDiag(numF('fp', 'False positives: ' + ctx.items + ' that ' + ctx.neg + ' but test positive', exactT(FP), {
            wrongMsg: 'False-positive rate × the number that ' + ctx.neg + ': ' + (100 - spec) + '% of ' + numStr(N - P) + '.',
            diagnose: [
              { value: N * (100 - spec) / 100, msg: 'Apply the false-positive rate only to the ' + numStr(N - P) + ' that ' + ctx.neg + '.' },
              { value: (N - P) * spec / 100, msg: 'That is the number correctly cleared. Use the false-positive rate, ' + (100 - spec) + '%.' },
            ],
          })),
        ] },
        { legend: 'Step 4: Compare', fields: [selF('most', 'Among all the positive results', [
          { value: 'true', label: 'Most are true positives' },
          { value: 'false', label: 'Most are false positives' },
        ], most, { wrongMsg: 'Compare the true positives (' + numStr(TP) + ') with the false positives (' + numStr(FP) + ').' })] },
      ],
      solution: [
        'False-negative rate = 100% − ' + sens + '% = ' + (100 - sens) + '%. False-positive rate = 100% − ' + spec + '% = ' + (100 - spec) + '%.',
        br + '% of ' + numStr(N) + ' is ' + numStr(P) + ' ' + ctx.items + ' that ' + ctx.cond + ', leaving ' + numStr(N - P) + ' that ' + ctx.neg + '.',
        'True positives: ' + sens + '% of ' + numStr(P) + ' = ' + numStr(TP) + '. False negatives: ' + numStr(P) + ' − ' + numStr(TP) + ' = ' + numStr(FN) + '.',
        'False positives: ' + (100 - spec) + '% of ' + numStr(N - P) + ' = ' + numStr(FP) + '.',
        most === 'false'
          ? 'There are more false positives (' + numStr(FP) + ') than true positives (' + numStr(TP) + '), so most positive results are wrong. With only ' + br + '% of ' + ctx.items + ' affected, even a small false-positive rate applied to the large unaffected group swamps the true cases.'
          : 'There are more true positives (' + numStr(TP) + ') than false positives (' + numStr(FP) + '), so most positive results are right. The condition is common enough here (' + br + '%) that the true cases outnumber the false alarms.',
      ],
    };
  }

  function pickScreen(rng, ks) {
    for (;;) {
      const ctx = rng.pick(BANK.screen);
      const mean = rng.pick(ctx.mean); const sd = rng.pick(ctx.sd);
      const k = rng.pick(ks);
      if (mean - 3 * sd > 0) return { ctx, mean, sd, k };
    }
  }
  const sv = (x) => numStr(roundTo(x, 4));
  const svu = (ctx, x) => sv(x) + ' ' + ctx.unit;
  function screenIntro(ctx, mean, sd) {
    return ctx.what + (ctx.who ? ' in ' + ctx.who : '') + ' is approximately normally distributed, with a mean of ' + svu(ctx, mean) + ' and a standard deviation of ' + svu(ctx, sd) + '.';
  }
  function cutFields(ctx, mean, sd, k, prefix, what) {
    const lo = roundTo(mean - k * sd, 4); const hi = roundTo(mean + k * sd, 4);
    return [
      cleanDiag(numF(prefix + 'low', cap(what + 'lower cutoff (' + ctx.unit + ')'), exactT(lo), {
        wrongMsg: 'Mean − ' + sv(k) + ' × standard deviation: ' + sv(mean) + ' − ' + sv(k) + '(' + sv(sd) + ').',
        diagnose: [{ value: hi, msg: 'That is the upper cutoff.' }, { value: roundTo(mean - sd, 4), msg: 'Go ' + sv(k) + ' standard deviations below the mean, not 1.' }, { value: roundTo(mean - k, 4), msg: 'Multiply ' + sv(k) + ' by the standard deviation before subtracting.' }],
      })),
      cleanDiag(numF(prefix + 'high', cap(what + 'upper cutoff (' + ctx.unit + ')'), exactT(hi), {
        wrongMsg: 'Mean + ' + sv(k) + ' × standard deviation: ' + sv(mean) + ' + ' + sv(k) + '(' + sv(sd) + ').',
        diagnose: [{ value: lo, msg: 'That is the lower cutoff.' }, { value: roundTo(mean + sd, 4), msg: 'Go ' + sv(k) + ' standard deviations above the mean, not 1.' }, { value: roundTo(mean + k, 4), msg: 'Multiply ' + sv(k) + ' by the standard deviation before adding.' }],
      })),
    ];
  }
  function flaggedField(id, label, k) {
    return pctF(id, label, OUTSIDE[k], {
      wrongMsg: 'About ' + WITHIN[k] + '% fall within ' + sds(k) + '. What share is outside, on both sides?',
      diagnose: [
        { value: WITHIN[k], msg: 'That is the share inside the normal range, who are not flagged.' },
        { value: TAIL[k], msg: 'Readings are flagged on both sides, high and low. Count both tails.' },
      ],
    });
  }

  function genCutoffs(rng, level) {
    const { ctx, mean, sd, k } = pickScreen(rng, [1, 2, 3]);
    const lo = mean - k * sd; const hi = mean + k * sd;
    const steps = [
      { legend: 'Step 1: Find the cutoffs', fields: cutFields(ctx, mean, sd, k, '', '') },
      { legend: 'Step 2: Healthy readings that get flagged', help: 'Use the empirical rule. These are all false positives.', fields: [
        flaggedField('flagged', 'Share of ' + ctx.things + ' flagged as abnormal (%)', k),
        pctF('spec', 'Specificity: the share of ' + ctx.things + ' correctly passed (%)', WITHIN[k], {
          wrongMsg: 'Specificity is the share of healthy cases that test negative: here, the share inside the normal range.',
          diagnose: [{ value: OUTSIDE[k], msg: 'That is the share flagged, the false-positive rate. Specificity is the share passed.' }],
        }),
      ] },
    ];
    const solution = [
      'Cutoffs: ' + sv(mean) + ' − ' + sv(k) + '(' + sv(sd) + ') = ' + sv(lo) + ' and ' + sv(mean) + ' + ' + sv(k) + '(' + sv(sd) + ') = ' + svu(ctx, hi) + '.',
      'About ' + WITHIN[k] + '% of ' + ctx.things + ' fall within ' + sds(k) + ' of the mean, so about ' + OUTSIDE[k] + '% fall outside and are flagged. Every one of them is a false positive.',
      'Specificity is the share correctly passed: about ' + WITHIN[k] + '%.',
    ];
    if (level === 2) {
      const N = pickN(rng, [OUTSIDE[k], WITHIN[k]]);
      steps.push({ legend: 'Step 3: Turn the share into a count', fields: [cleanDiag(numF('count', 'Out of ' + numStr(N) + ' ' + ctx.things + ', about how many are flagged?', exactT(N * OUTSIDE[k] / 100), {
        wrongMsg: 'Multiply ' + numStr(N) + ' by ' + OUTSIDE[k] + '% written as a decimal.',
        diagnose: [{ value: N * TAIL[k] / 100, msg: 'That counts only one side. Readings are flagged on both sides.' }, { value: N * WITHIN[k] / 100, msg: 'That counts the ones passed, not the ones flagged.' }],
      }))] });
      solution.push(numStr(N) + ' × ' + numStr(OUTSIDE[k] / 100) + ' = ' + numStr(N * OUTSIDE[k] / 100) + ' ' + ctx.things + ' flagged.');
    }
    return {
      setup: screenIntro(ctx, mean, sd) + ' ' + ctx.test + ' flags any reading more than ' + sds(k) + ' from the mean as abnormal.',
      dataLabel: '', data: [],
      question: 'What are the cutoffs, and how often does the test flag a healthy reading?',
      steps, solution,
    };
  }

  function genMove(rng, level) {
    let ctx, mean, sd, k1, k2;
    for (;;) {
      ({ ctx, mean, sd, k: k1 } = pickScreen(rng, [1, 2, 3]));
      k2 = level === 1 ? rng.pick([1, 2, 3]) : rng.pick([1.5, 2.5]);
      if (k2 !== k1) break;
    }
    const wider = k2 > k1;
    const lo1 = mean - k1 * sd; const hi1 = mean + k1 * sd;
    const steps = [{ legend: 'Step 1: Find the new cutoffs', fields: cutFields(ctx, mean, sd, k2, '', 'New ') }];
    const solution = ['New cutoffs: ' + sv(mean) + ' − ' + sv(k2) + '(' + sv(sd) + ') = ' + sv(mean - k2 * sd) + ' and ' + sv(mean) + ' + ' + sv(k2) + '(' + sv(sd) + ') = ' + svu(ctx, mean + k2 * sd) + '.'];
    if (level === 1) {
      steps.push({ legend: 'Step 2: Healthy readings flagged, before and after', fields: [
        flaggedField('now', 'Share of ' + ctx.things + ' flagged now, at ' + sds(k1) + ' (%)', k1),
        flaggedField('after', 'Share flagged after the change, at ' + sds(k2) + ' (%)', k2),
      ] });
      solution.push('Healthy readings flagged: about ' + OUTSIDE[k1] + '% now and ' + OUTSIDE[k2] + '% after the change.');
    }
    const more = wider ? 'fewer' : 'more';
    const why = 'A ' + (wider ? 'wider' : 'narrower') + ' normal range flags ' + more + ' readings. ';
    const sel = (id, label, ans, msg) => selF(id, label, DIR, ans, { wrongMsg: why + msg });
    steps.push({ legend: 'Step ' + (steps.length + 1) + ': The tradeoff', help: 'Compare the new normal range with the current one, ' + sv(lo1) + ' to ' + svu(ctx, hi1) + '.', fields: [
      selF('flags', 'The test would flag', [{ value: 'more', label: 'More readings' }, { value: 'fewer', label: 'Fewer readings' }], more, {
        wrongMsg: 'Is the new normal range wider or narrower than the current one?',
      }),
      sel('sens', 'Sensitivity would', wider ? 'decrease' : 'increase', wider ? 'Some real problems now fall inside the range and are missed.' : 'More real problems fall outside the range and are caught.'),
      sel('spec', 'Specificity would', wider ? 'increase' : 'decrease', wider ? 'More healthy readings fall inside the range and are passed.' : 'More healthy readings fall outside the range and are flagged.'),
      sel('fp', 'False positives would', wider ? 'decrease' : 'increase', wider ? 'Fewer healthy readings fall outside the range.' : 'More healthy readings fall outside the range.'),
      sel('fn', 'False negatives would', wider ? 'increase' : 'decrease', wider ? 'More real problems hide inside the range.' : 'Fewer real problems hide inside the range.'),
    ] });
    solution.push(wider
      ? 'Moving from ' + sds(k1) + ' to ' + sds(k2) + ' widens the normal range, so the test flags fewer readings. Fewer healthy readings are flagged: false positives fall and specificity rises. But more real problems fall inside the range: false negatives rise and sensitivity falls.'
      : 'Moving from ' + sds(k1) + ' to ' + sds(k2) + ' narrows the normal range, so the test flags more readings. More real problems are caught: false negatives fall and sensitivity rises. But more healthy readings are flagged too: false positives rise and specificity falls.');
    return {
      setup: screenIntro(ctx, mean, sd) + ' ' + ctx.test + ' currently flags readings more than ' + sds(k1) + ' from the mean (outside ' + sv(lo1) + ' to ' + svu(ctx, hi1) + '). It is considering a threshold of ' + sds(k2) + ' instead.',
      dataLabel: '', data: [],
      question: 'What would the new cutoffs be, and how would the change affect the test?',
      steps, solution,
    };
  }

  const FRACS1 = [[1, 2], [1, 4], [3, 4]];
  const FRACS2 = [[1, 3], [2, 3], [1, 5], [2, 5], [3, 5], [4, 5], [1, 4], [3, 4]];
  const fracWords = (a, b) => a + ' out of every ' + b;

  function genFlags(rng, level) {
    const ctx = rng.pick(BANK.flags);
    let N, f, a, b, F, FP;
    for (;;) {
      N = rng.pick(level === 1 ? [400, 500, 800, 1000, 2000] : [1200, 1500, 2400, 3000, 6000]);
      f = rng.pick([4, 5, 6, 8, 9, 10, 12, 15, 20]);
      [a, b] = rng.pick(level === 1 ? FRACS1 : FRACS2);
      F = N * f / 100; FP = F * a / b;
      if (terminates(F, 0) && terminates(FP, 0) && terminates(f * a / b, 2)) break;
    }
    const G = F - FP; const share = f * a / b;
    const steps = [
      { legend: 'Step 1: Count the flags', fields: [cleanDiag(numF('flagged', 'Number of ' + ctx.flagged, exactT(F), {
        wrongMsg: f + '% of ' + numStr(N) + '.', diagnose: [{ value: N * f, msg: 'Write the percentage as a decimal before multiplying.' }],
      }))] },
      { legend: 'Step 2: Sort the flags', fields: [
        cleanDiag(numF('fp', 'False positives: flagged ' + ctx.items + ' that turned out to be ' + ctx.good, exactT(FP), {
          wrongMsg: a + '/' + b + ' of the ' + numStr(F) + ' flagged.',
          diagnose: [{ value: G, msg: 'That is the number of ' + ctx.bad + '. False positives are the ones wrongly flagged.' }],
        })),
        cleanDiag(numF('genuine', 'Flagged ' + ctx.items + ' that turned out to be ' + ctx.bad, exactT(G), {
          wrongMsg: 'The flagged total minus the false positives.',
          diagnose: [{ value: FP, msg: 'That is the number of false positives.' }],
        })),
      ] },
      { legend: 'Step 3: False positives as a share of everything', fields: [pctF('share', 'What percentage of all ' + ctx.items + ' are false positives? (%)', share, {
        wrongMsg: 'Divide the false positives by all ' + numStr(N) + ' ' + ctx.items + ', or take ' + a + '/' + b + ' of ' + f + '%.',
        diagnose: [
          { value: 100 * a / b, msg: 'That is the share of flagged ' + ctx.items + ' that are false positives. The question asks about all ' + ctx.items + '.' },
          { value: f, msg: 'That is everything flagged, including the ' + ctx.bad + '.' },
        ],
      })] },
    ];
    const solution = [
      f + '% of ' + numStr(N) + ' = ' + numStr(F) + ' ' + ctx.flagged + '.',
      a + '/' + b + ' of ' + numStr(F) + ' = ' + numStr(FP) + ' are ' + ctx.good + ' (false positives); the other ' + numStr(G) + ' are ' + ctx.bad + '.',
      numStr(FP) + ' ÷ ' + numStr(N) + ' = ' + numStr(share / 100) + ', so ' + numStr(share) + '% of all ' + ctx.items + ' are false positives. (Equivalently, ' + a + '/' + b + ' of ' + f + '%.)',
    ];
    if (level === 2) {
      const mostly = a / b > 0.5 ? 'good' : 'bad';
      steps.push({ legend: 'Step 4: What a flag tells you', fields: [selF('mostly', 'When this tool flags one of the ' + ctx.items + ', it is', [
        { value: 'good', label: 'More likely a false alarm than a real case' },
        { value: 'bad', label: 'More likely a real case than a false alarm' },
      ], mostly, { wrongMsg: 'Compare the false positives (' + numStr(FP) + ') with the real cases (' + numStr(G) + ').' })] });
      solution.push(mostly === 'good'
        ? 'Most flags (' + numStr(FP) + ' of ' + numStr(F) + ') are false alarms, so a flag by itself is weak evidence. Each one needs a person’s review.'
        : 'Most flags (' + numStr(G) + ' of ' + numStr(F) + ') are real cases, but ' + numStr(FP) + ' are not, so each flag still needs a person’s review.');
    }
    return {
      setup: ctx.tool + ' checked ' + numStr(N) + ' ' + ctx.items + ' and flagged ' + f + '% of them. On review, ' + fracWords(a, b) + ' ' + ctx.flagged + ' turned out to be ' + ctx.good + '; the rest were ' + ctx.bad + '.',
      dataLabel: '', data: [],
      question: 'How many ' + ctx.items + ' were flagged, how many of those were false positives, and what percentage of all ' + ctx.items + ' were false positives?',
      steps, solution,
    };
  }

  // ---------------------------------------------------------------------
  // Lying with statistics (section 15.6)
  // ---------------------------------------------------------------------
  function genTruncated(rng, level) {
    const ctx = rng.pick(BANK.bars);
    const g = ctx.scale;
    let r, u, K, pct;
    for (;;) {
      r = level === 1 ? rng.pick([2, 3, 4, 5]) : rng.pick([2.5, 3, 4, 5, 6]);
      u = rng.int(2, 14); K = rng.int(ctx.size[0], ctx.size[1]);
      if (!terminates((r - 1) * u, 0)) continue;
      pct = (r - 1) * u / (K + u) * 100;
      if (pct >= 1.5 && pct <= 30 && terminates(pct, level === 1 ? 0 : 1)) break;
    }
    const base = K * g; const B = (K + u) * g; const A = B + (r - 1) * u * g; const top = A + u * g;
    const bigFirst = rng.chance(0.5);
    const big = ctx.labels[bigFirst ? 0 : 1]; const small = ctx.labels[bigFirst ? 1 : 0];
    const cfmt = { money: ctx.money, unit: ctx.unit };
    const v = (x) => fmt(cfmt, x); const vu = (x) => withUnit(cfmt, x);
    const bars = bigFirst ? [{ label: big, value: A }, { label: small, value: B }] : [{ label: small, value: B }, { label: big, value: A }];
    const desc = 'Bar chart titled “' + ctx.title + '.” The vertical axis starts at ' + v(base) + ', not at zero, and runs to ' + v(top) + ', with a break mark at the bottom. ' +
      bars.map((b) => b.label + '’s bar reaches ' + v(b.value) + '.').join(' ') + ' On the chart, ' + big + '’s bar looks ' + numStr(r) + ' times as tall as ' + small + '’s.';
    const honest = A / B;
    return {
      setup: 'A bar chart compares ' + ctx.measure + ' for ' + bars[0].label + ' and ' + bars[1].label + '. Its vertical axis starts at ' + v(base) + ', not at zero. ' + big + ': ' + vu(A) + '. ' + small + ': ' + vu(B) + '.',
      dataLabel: '', data: [],
      chart: {
        kind: 'bars', title: ctx.title, base, top, desc,
        ticks: [base, B, A, top].map((t) => ({ value: t, label: v(t) })),
        bars: bars.map((b) => ({ label: b.label, value: b.value })),
      },
      question: 'How big is the real difference, and how big does the chart make it look?',
      steps: [
        { legend: 'Step 1: The real difference', fields: [
          cleanDiag(numF('diff', big + ' − ' + small + (ctx.unit ? ' (' + ctx.unit + ')' : ''), exactT(A - B), { wrongMsg: 'Subtract the smaller value from the larger.' })),
          pctF('pct', 'How much larger is ' + big + ', as a percent of ' + small + '? (%)', pct, {
            wrongMsg: 'Divide the difference by ' + small + '’s value, then multiply by 100.',
            diagnose: [
              { value: roundTo((A - B) / A * 100, 1), msg: 'Divide by ' + small + '’s value, the one you are comparing against.' },
              { value: (r - 1) * 100, msg: 'That is what the chart suggests, not what the numbers say.' },
            ],
          }),
        ] },
        { legend: 'Step 2: What the chart shows', help: 'On the chart, each bar starts at ' + v(base) + ', so its visible height is its value minus ' + v(base) + '.', fields: [
          cleanDiag(numF('apparent', 'On the chart as drawn, ' + big + '’s bar is how many times as tall as ' + small + '’s?', exactT(r), {
            wrongMsg: '(' + v(A) + ' − ' + v(base) + ') ÷ (' + v(B) + ' − ' + v(base) + ').',
            diagnose: [{ value: roundTo(honest, 2), msg: 'That measures the bars from zero. On this chart they start at ' + v(base) + '.' }],
          })),
          cleanDiag(numF('honest', 'On an axis that starts at zero, how many times as tall would it be? (two decimal places)', roundT(honest, 2), {
            wrongMsg: v(A) + ' ÷ ' + v(B) + '.',
            diagnose: [{ value: r, msg: 'That is the truncated chart. From zero, divide the two values themselves.' }],
          })),
        ] },
      ],
      solution: [
        'Difference: ' + v(A) + ' − ' + v(B) + ' = ' + vu(A - B) + '. As a percent of ' + small + ': ' + v(A - B) + ' ÷ ' + v(B) + ' × 100 = ' + numStr(pct) + '%.',
        'On the chart, the bars rise from ' + v(base) + '. ' + big + '’s visible height is ' + v(A - base) + ' and ' + small + '’s is ' + v(B - base) + ', a ratio of ' + numStr(r) + ' to 1.',
        'From zero, the ratio is ' + v(A) + ' ÷ ' + v(B) + ' ≈ ' + numStr(roundTo(honest, 2), 2) + ': the bars would be nearly the same height.',
        'The chart makes a difference of ' + numStr(pct) + '% look like a ratio of ' + numStr(r) + ' to 1. On a zero-based axis the gap is still visible, and it looks as modest as it is.',
      ],
    };
  }

  function genArea(rng, level) {
    const ctx = rng.pick(BANK.icon);
    const cf = { money: true };
    const step = ctx.cents ? (level === 1 ? 0.1 : 0.01) : (ctx.range[1] > 5000 ? 500 : 50);
    const [lo, hi] = [Math.ceil(ctx.range[0] / step), Math.floor(ctx.range[1] / step)];
    let v1, v2, k;
    for (;;) {
      const a = rng.int(lo, Math.floor((lo + hi) / 2));
      v1 = roundTo(a * step, 2);
      if (level === 1) {
        k = rng.pick([1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.5]);
        v2 = roundTo(v1 * k, 2);
        if (!same(v2, v1 * k) || !terminates(v2 / step, 0)) continue;
        break;
      }
      v2 = roundTo(rng.int(Math.round(v1 * 1.15 / step), Math.round(v1 * 2.1 / step)) * step, 2);
      k = v2 / v1;
      if (!terminates(k, 1)) break;
    }
    const money = (x) => fmt(cf, x, ctx.cents ? 2 : 0);
    const kR = level === 1 ? k : roundTo(k, 2);
    const ratioT = level === 1 ? exactT(k) : roundT(k, 2);
    const areaT = level === 1 ? exactT(roundTo(k * k, 2)) : roundT(k * k, 2);
    const realT = level === 1 ? exactT(roundTo((k - 1) * 100, 2)) : roundT((k - 1) * 100, 0);
    const picT = level === 1 ? exactT(roundTo((k * k - 1) * 100, 2)) : roundT((k * k - 1) * 100, 0);
    const altArea = level === 2 ? [{ target: roundT(kR * kR, 2), msg: 'Correct, working from the rounded ratio.' }] : [];
    const altPic = level === 2 ? [{ target: roundT((kR * kR - 1) * 100, 0), msg: 'Correct, working from the rounded ratio.' }] : [];
    return {
      setup: ctx.what + ' rose from ' + money(v1) + ' to ' + money(v2) + '. An infographic shows each value as a picture of ' + ctx.icon + ', with the later picture drawn taller in proportion to the value and its width scaled up to match.',
      dataLabel: '', data: [],
      question: 'How much did the value actually rise, and how much bigger does the later picture look?',
      steps: [
        { legend: 'Step 1: The ratio in the data', fields: [
          cleanDiag(numF('ratio', 'Later value ÷ earlier value' + (level === 2 ? ' (two decimal places)' : ''), ratioT, {
            wrongMsg: 'Divide ' + money(v2) + ' by ' + money(v1) + '.',
            diagnose: [{ value: roundTo(v1 / v2, 2), msg: 'Divide the later value by the earlier one.' }, { value: roundTo(k - 1, 2), msg: 'That is the increase as a fraction. The ratio is later ÷ earlier.' }],
          })),
          pctF('real', 'Percent increase in the value (%)', realT.value, {
            target: realT,
            wrongMsg: '(ratio − 1) × 100.',
            diagnose: [{ value: roundTo(k * 100, 0), msg: 'That is the later value as a percent of the earlier one. Subtract 100 to get the increase.' }],
          }),
        ] },
        { legend: 'Step 2: The picture', help: 'When height and width both grow by the ratio, the area grows by the ratio times itself.', fields: [
          cleanDiag(numF('area', 'The later picture’s area is how many times the earlier one’s?' + (level === 2 ? ' (two decimal places)' : ''), areaT, {
            alts: altArea,
            wrongMsg: 'Multiply the ratio by itself.',
            diagnose: [{ value: kR, msg: 'That is the height ratio. The width grows too, so the area grows by the ratio squared.' }, { value: roundTo(2 * kR, 2), msg: 'Multiply the ratio by itself, not by 2.' }],
          })),
          pctF('pic', 'Percent increase the picture’s area suggests (%)', picT.value, {
            target: picT,
            alts: altPic,
            wrongMsg: '(area ratio − 1) × 100.',
            diagnose: [{ value: roundTo(k * k * 100, 0), msg: 'That is the later area as a percent of the earlier one. Subtract 100.' }],
          }),
        ] },
      ],
      solution: [
        'Ratio: ' + money(v2) + ' ÷ ' + money(v1) + (level === 1 ? ' = ' + numStr(k) : ' ≈ ' + numStr(kR, 2)) + '. The value rose about ' + numStr(roundTo((kR - 1) * 100, 0)) + '%.',
        'Drawn ' + numStr(kR) + ' times as tall and ' + numStr(kR) + ' times as wide, the later picture covers ' + numStr(kR) + ' × ' + numStr(kR) + (level === 1 ? ' = ' : ' ≈ ') + numStr(roundTo(kR * kR, 2)) + ' times the area.',
        'The eye reads area, so the picture suggests an increase of about ' + numStr(roundTo((kR * kR - 1) * 100, 0)) + '%, not ' + numStr(roundTo((kR - 1) * 100, 0)) + '%. A bar chart with fixed-width bars would show the real ratio.',
      ],
    };
  }

  const FRAME = [
    { value: 'rel', label: 'The relative risk reduction' },
    { value: 'abs', label: 'The absolute risk reduction' },
  ];

  function genRisk(rng, level) {
    const ctx = rng.pick(BANK.risk);
    let c, t, rel;
    for (;;) {
      if (level === 1) { c = rng.int(2, 30); t = rng.int(1, c - 1); }
      else { c = rng.int(10, 80) / 10; t = rng.int(5, Math.round(c * 10) - 1) / 10; }
      rel = (c - t) / c * 100;
      if (rel >= 20 && rel <= 75) break;
    }
    const absV = roundTo(c - t, 1);
    const frame = rng.pick(['rel', 'abs']);
    const relShown = Math.round(rel);
    const Tr = cap(ctx.treatment);
    const headline = frame === 'rel'
      ? Tr + ' cuts the risk of ' + ctx.outcome + ' by ' + relShown + '%'
      : Tr + ' cuts the risk of ' + ctx.outcome + ' by ' + numStr(absV) + ' percentage point' + (absV === 1 ? '' : 's');
    const steps = [
      { legend: 'Step 1: Absolute risk reduction', fields: [cleanDiag(numF('abs', 'Absolute risk reduction (percentage points)', exactT(absV), {
        percent: true,
        wrongMsg: 'Subtract the treatment group’s rate from the control group’s: ' + numStr(c) + '% − ' + numStr(t) + '%.',
        diagnose: [{ value: roundTo(rel, 0), msg: 'That is the relative reduction. The absolute reduction is the plain difference between the two rates.' }],
      }))] },
      { legend: 'Step 2: Relative risk reduction', fields: [cleanDiag(numF('rel', 'Relative risk reduction (%)', roundT(rel, 0), {
        percent: true,
        wrongMsg: 'Divide the absolute reduction by the control group’s rate, then multiply by 100.',
        diagnose: [
          { value: absV, msg: 'That is the absolute reduction. Divide it by the control group’s rate, ' + numStr(c) + '%.' },
          { value: roundTo(t / c * 100, 0), msg: 'That is the treatment group’s risk as a percent of the control group’s. The reduction is 100% minus that.' },
          { value: roundTo((c - t) / t * 100, 0), msg: 'Divide by the control group’s rate, the starting point, not the treatment group’s.' },
        ],
      }))] },
    ];
    const solution = [
      'Absolute reduction: ' + numStr(c) + '% − ' + numStr(t) + '% = ' + numStr(absV) + ' percentage point' + (absV === 1 ? '' : 's') + '.',
      'Relative reduction: ' + numStr(absV) + ' ÷ ' + numStr(c) + ' × 100 ≈ ' + numStr(roundTo(rel, 1)) + '%. The treatment removes about that share of the risk the control group faced.',
    ];
    if (level === 2) {
      const N = terminates(1000 * absV / 100, 0) ? 1000 : 10000;
      steps.push({ legend: 'Step 3: In people', fields: [cleanDiag(numF('people', 'Out of ' + numStr(N) + ' ' + ctx.group + ' like those in the trial, how many fewer would have ' + ctx.outcome + '?', exactT(roundTo(N * absV / 100, 2)), {
        wrongMsg: numStr(absV) + '% of ' + numStr(N) + ': use the absolute reduction.',
        diagnose: [{ value: roundTo(N * rel / 100, 0), msg: 'That uses the relative reduction. A count of people comes from the absolute reduction.' }, { value: N * absV, msg: 'Write the percentage as a decimal before multiplying.' }],
      }))] });
      solution.push('Out of ' + numStr(N) + ', ' + numStr(N * c / 100) + ' in the control group versus ' + numStr(N * t / 100) + ' with the treatment: ' + numStr(N * absV / 100) + ' fewer.');
    }
    steps.push({ legend: 'Step ' + (steps.length + 1) + ': The headline', fields: [selF('frame', 'The headline’s number is', FRAME, frame, {
      wrongMsg: frame === 'rel' ? relShown + '% matches the relative reduction you found.' : numStr(absV) + ' percentage points is the plain difference between the two rates.',
    })] });
    solution.push(frame === 'rel'
      ? 'The headline reports the relative reduction, ' + relShown + '%. It is the larger, more impressive number; the absolute reduction of ' + numStr(absV) + ' point' + (absV === 1 ? '' : 's') + ' is what matters to someone deciding whether to use it.'
      : 'The headline reports the absolute reduction, ' + numStr(absV) + ' percentage point' + (absV === 1 ? '' : 's') + '. The same result could be reported as a ' + relShown + '% relative reduction, which sounds much larger.');
    return {
      setup: 'In a trial of ' + ctx.treatment + ', ' + numStr(c) + '% of ' + ctx.group + ' in the control group had ' + ctx.outcome + ' ' + ctx.period + ', compared with ' + numStr(t) + '% of those who received the treatment. A headline reads: “' + headline + '.”',
      dataLabel: '', data: [],
      question: 'Find the absolute and relative risk reductions. Which one does the headline report?',
      steps, solution,
    };
  }

  /** Starting values that make every percent change a short decimal. */
  const FRIENDLY = [20, 25, 40, 50, 80, 100, 125, 200, 250, 400, 500];

  function genBaseline(rng, level) {
    const ctx = rng.pick(BANK.trend);
    const n = level === 1 ? 9 : 12;
    const last = 2025; const first = last - n + 1;
    const pattern = rng.pick(['peak', 'trough']);
    let ys, j, S0, Sj, E;
    for (let tries = 0; ; tries++) {
      j = rng.int(2, n - 4);
      if (pattern === 'peak') {
        S0 = rng.pick(FRIENDLY.slice(0, 8)); Sj = rng.pick(FRIENDLY.filter((x) => x >= S0 * 1.5));
        if (!Sj) continue;
        E = rng.int(Math.ceil(S0 * 1.08), Math.floor(Sj * 0.85));
      } else {
        S0 = rng.pick(FRIENDLY.slice(3)); Sj = rng.pick(FRIENDLY.filter((x) => x <= S0 * 0.65));
        if (!Sj) continue;
        E = rng.int(Math.ceil(Sj * 1.3), Math.floor(S0 * 0.93));
      }
      if (!(E > 0)) continue;
      ys = [];
      for (let i = 0; i < n; i++) {
        let y;
        if (i === 0) y = S0; else if (i === j) y = Sj; else if (i === n - 1) y = E;
        else if (i < j) y = S0 + (Sj - S0) * i / j;
        else y = Sj + (E - Sj) * (i - j) / (n - 1 - j);
        if (i !== 0 && i !== j && i !== n - 1) y = y * (1 + (rng.next() - 0.5) * 0.08);
        ys.push(Math.round(y));
      }
      const others = ys.filter((_, i) => i !== j);
      const ok = pattern === 'peak' ? others.every((y) => y < Sj) : others.every((y) => y > Sj);
      const pcts = [(E - Sj) / Sj * 100, (E - S0) / S0 * 100];
      if (ok && pcts.every((p) => terminates(p, 2) && Math.abs(p) >= 3)) break;
      if (tries > 500) throw new Error('baseline generator stuck');
    }
    const g = ctx.scale;
    const show = (y) => numStr(y * g);
    const yj = first + j;
    const pres = roundTo((E - Sj) / Sj * 100, 2); const full = roundTo((E - S0) / S0 * 100, 2);
    const word = (p) => (p > 0 ? 'risen' : 'fallen');
    const lc = ctx.what.charAt(0).toLowerCase() + ctx.what.slice(1);
    const pctField = (id, from, S, p) => cleanDiag(numF(id, 'Percent change from ' + from + ' to ' + last + ' (%)', exactT(p), {
      percent: true,
      alts: [{ target: exactT(-p), msg: 'Right size. Write a decrease with a minus sign: ' + numStr(-Math.abs(p)) + '%.' }].filter(() => p < 0),
      wrongMsg: '(' + last + ' value − ' + from + ' value) ÷ ' + from + ' value × 100.',
      diagnose: [
        { value: roundTo((E - S) / E * 100, 2), msg: 'Divide by the ' + from + ' value, the starting point.' },
        { value: (E - S) * g, msg: 'That is the change in ' + ctx.unit + '. Divide it by the ' + from + ' value and multiply by 100.' },
        { value: roundTo(E / S * 100, 2), msg: 'That is the ' + last + ' value as a percent of the ' + from + ' value. Subtract 100.' },
      ],
    }));
    return {
      setup: ctx.presenter + ' says that ' + lc + ' has ' + word(pres) + ' ' + numStr(Math.abs(pres)) + '% since ' + yj + '. Here are the figures for every year from ' + first + ' to ' + last + '.',
      dataLabel: ctx.what + ' (' + ctx.unit + ')', data: ys.map((y, i) => (first + i) + ': ' + show(y)),
      question: 'Check the claim. Then find the change over the whole period, and say what the choice of starting year does.',
      steps: [
        { legend: 'Step 1: Check the claim', fields: [pctField('pres', String(yj), Sj, pres)] },
        { legend: 'Step 2: The whole period', fields: [
          pctField('full', String(first), S0, full),
          selF('overall', 'From ' + first + ' to ' + last + ', the value has', [{ value: 'risen', label: 'Risen' }, { value: 'fallen', label: 'Fallen' }], word(full), { wrongMsg: 'Compare the first year with the last.' }),
        ] },
        { legend: 'Step 3: The starting year', fields: [selF('start', 'The claim starts in ' + yj + '. That year was', [
          { value: 'peak', label: 'A peak: higher than every other year shown' },
          { value: 'trough', label: 'A low point: lower than every other year shown' },
          { value: 'typical', label: 'A typical year' },
        ], pattern, { wrongMsg: 'Compare ' + yj + '’s figure, ' + show(Sj) + ', with the other years.' })] },
      ],
      solution: [
        'From ' + yj + ' to ' + last + ': (' + show(E) + ' − ' + show(Sj) + ') ÷ ' + show(Sj) + ' × 100 = ' + numStr(pres) + '%. The claim’s arithmetic is right.',
        'From ' + first + ' to ' + last + ': (' + show(E) + ' − ' + show(S0) + ') ÷ ' + show(S0) + ' × 100 = ' + numStr(full) + '%.',
        pattern === 'peak'
          ? yj + ' was the highest year shown. Starting there makes a ' + (full > 0 ? 'value that is still higher than in ' + first : 'modest overall change') + ' look like a steep decline.'
          : yj + ' was the lowest year shown. Starting there turns a ' + (full < 0 ? 'value that is still below its ' + first + ' level' : 'modest overall change') + ' into an impressive-sounding gain.',
        'An honest presentation shows the longer history, or explains why the window starts where it does.',
      ],
    };
  }

  // ---------------------------------------------------------------------
  // From the book: the odd-numbered exercises answered in the Selected
  // Solutions appendix, numeric parts only. Data and wording follow
  // ch-statistical-reasoning.ptx; answers are computed, and logic-tests.js
  // checks them against appendix-solutions.ptx.
  // ---------------------------------------------------------------------
  const WRITTEN = 'The written parts of this exercise are answered in the Selected Solutions appendix.';

  function bookEx1() {
    const ctx = { unit: 'points', money: false };
    const xs = [62, 74, 74, 78, 80, 83, 83, 83, 91, 100];
    const mf = meanFields(ctx, xs, '');
    return {
      setup: 'A professor records quiz scores for ten students.', dataLabel: 'Quiz scores', data: xs.map(String),
      question: 'Find the mean, median, and mode.', note: WRITTEN,
      steps: [
        { legend: 'Step 1: Mean', fields: mf },
        { legend: 'Step 2: Median', help: 'The scores are already in order.', fields: [
          { type: 'list', id: 'middle', label: 'The two middle values', answer: [80, 83], help: 'Separate them with a comma.' },
          cleanDiag(numF('median', 'Median', exactT(81.5), { wrongMsg: 'Average the two middle values.', diagnose: [{ value: 80, msg: 'With ten values, average the 5th and 6th.' }, { value: 83, msg: 'With ten values, average the 5th and 6th.' }] })),
        ] },
        { legend: 'Step 3: Mode', fields: [modeFields(ctx, xs, '')] },
      ],
      solution: meanSolution(ctx, xs).concat(medianSolution(ctx, xs), modeSolution(ctx, xs)),
    };
  }

  function bookEx3() {
    const ctx = { unit: '', money: false };
    const xs = [6, 6.5, 7, 7, 7.5, 7.5, 8, 8, 8, 8.5, 9, 10];
    const mf = meanFields(ctx, xs, '');
    return {
      setup: 'A shoe store tracks women’s sizes sold over a month.', dataLabel: 'Sizes sold', data: xs.map(String),
      question: 'Find the mode, and say which measure is most useful here.', note: WRITTEN,
      steps: [
        { legend: 'Step 1: Mean and median', help: 'The appendix notes these to show why they do not help the store.', fields: [mf[0], mf[2],
          { type: 'list', id: 'middle', label: 'The two middle values', answer: [7.5, 8], help: 'Separate them with a comma.' },
          cleanDiag(numF('median', 'Median', exactT(7.75), { wrongMsg: 'Average the two middle values.' })),
        ] },
        { legend: 'Step 2: Mode', fields: [modeFields(ctx, xs, '')] },
        { legend: 'Step 3: Choose a measure', fields: [selF('measure', 'Which measure is most useful to the store?', MEASURES, 'mode', {
          wrong: {
            mean: 'The mean, 7.75, is not even a size on the rack.',
            median: 'The median, 7.75, is not even a size on the rack.',
          },
        })] },
      ],
      solution: meanSolution(ctx, xs).concat(medianSolution(ctx, xs), modeSolution(ctx, xs),
        ['A store stocks whole and half sizes, not averages. The mode, 8, is the size it sells most often.']),
    };
  }

  function bookEx5() {
    const ctx = { unit: 'hours', money: false };
    const xs = [2, 3, 5, 5, 6, 8, 8, 10, 10, 12, 15, 40];
    return {
      setup: 'Twelve students report how many hours per week they study.', dataLabel: 'Study hours per week', data: xs.map(String),
      question: 'Is this distribution approximately symmetric or skewed? Which measure of center is most appropriate to report? Compute that measure.',
      steps: [
        { legend: 'Step 1: Shape', fields: [selF('skew', 'The distribution is', [
          { value: 'right', label: 'Skewed right: one or a few unusually high values' },
          { value: 'left', label: 'Skewed left: one or a few unusually low values' },
          { value: 'sym', label: 'Roughly symmetric' },
        ], 'right', { wrongMsg: 'Look at the largest value compared with the rest.' })] },
        { legend: 'Step 2: Choose a measure', fields: [selF('measure', 'The most appropriate measure of center is', MEASURES, 'median', {
          wrong: { mean: 'The 40-hour value pulls the mean up. With a skewed distribution and an outlier, use a measure that resists it.', mode: 'The question asks for a typical value, not the most frequent one.' },
        })] },
        { legend: 'Step 3: Compute it', fields: [
          { type: 'list', id: 'middle', label: 'The two middle values', answer: [8, 8], help: 'The data is already in order. Separate the two values with a comma.' },
          cleanDiag(numF('median', 'Median', exactT(8), { wrongMsg: 'Average the 6th and 7th values.', diagnose: [{ value: 124 / 12, msg: 'That is the mean.' }] })),
        ] },
      ],
      solution: [
        'Most students study between 2 and 15 hours, but one reports 40, far above the rest, so the distribution is skewed right.',
        'With a skewed distribution and an outlier, the median is most appropriate because the extreme value does not pull it.',
      ].concat(medianSolution(ctx, xs)),
    };
  }

  function bookEx7() {
    const p = sdProblem({ unit: 'points', money: false, label: 'Exam scores', setup: '' }, [70, 75, 80, 85, 90]);
    p.setup = 'Compute the sample standard deviation of these five exam scores. Show all six steps.';
    p.dataLabel = 'Exam scores';
    p.question = 'Round to two decimal places.';
    return p;
  }

  function bookEx11() {
    return unusualProblem({ unit: '' }, 50, 10, 75,
      'A dataset has mean 50 and standard deviation 10. A value of 75 appears in the dataset. Assume the data is approximately normally distributed.');
  }

  function bookEx13() {
    const ctx = { unit: 'hours', things: 'bulbs', measure: 'lifetimes' };
    return tailProblem(ctx, 1000, 50, 2, 'above', 10000,
      'A factory produces light bulbs with mean lifetime 1,000 hours and standard deviation 50 hours.',
      'Out of a batch of 10,000 bulbs, approximately how many would you expect to last more than 1,100 hours?');
  }

  function bookEx15() {
    const ctx = { unit: '' };
    const a = boundaryFields(ctx, 500, 100, 16, 'top', 'a-');
    const b = boundaryFields(ctx, 500, 100, 2.5, 'bottom', 'b-');
    return {
      setup: 'A standardized test is normally distributed with mean 500 and standard deviation 100.', dataLabel: '', data: [],
      question: '(a) What score marks the boundary of the top 16% of test-takers? (b) What score marks the boundary of the bottom 2.5%? (c) Between what two scores do the middle 99.7% of test-takers fall?',
      steps: [
        { legend: '(a) The top 16%', fields: a.fields },
        { legend: '(b) The bottom 2.5%', fields: b.fields },
        { legend: '(c) The middle 99.7%', fields: [
          cleanDiag(numF('c-low', 'Lower score', exactT(200), { wrongMsg: 'The middle 99.7% lies within 3 standard deviations of the mean.', diagnose: [{ value: 800, msg: 'That is the upper score.' }] })),
          cleanDiag(numF('c-high', 'Upper score', exactT(800), { wrongMsg: 'The middle 99.7% lies within 3 standard deviations of the mean.', diagnose: [{ value: 200, msg: 'That is the lower score.' }] })),
        ] },
      ],
      solution: [
        '(a) About 68% of scores fall within 1 standard deviation, leaving 32% in the two tails and 16% in the upper tail. The boundary is 500 + 100 = 600.',
        '(b) About 95% fall within 2 standard deviations, leaving 5% in the two tails and 2.5% in the lower tail. The boundary is 500 − 2(100) = 300.',
        '(c) The middle 99.7% lies within 3 standard deviations: from 500 − 3(100) = 200 to 500 + 3(100) = 800.',
      ],
    };
  }

  function pollProblem(n, est, setupText, questionText, note) {
    const m = MOE[n]; const lo = est - m; const hi = est + m;
    return {
      setup: setupText, dataLabel: '', data: [], note,
      question: questionText,
      steps: [
        { legend: 'Step 1: Look up the margin of error', help: 'Use the rule-of-thumb table in the Reference panel.', fields: [
          pctF('moe', 'Margin of error for a sample of ' + numStr(n) + ' (percentage points)', m, { wrongMsg: 'Find ' + numStr(n) + ' in the rule-of-thumb table.' }),
        ] },
        { legend: 'Step 2: Build the confidence interval', fields: [
          pctF('low', 'Lower end (%)', lo, { wrongMsg: 'Subtract the margin of error from ' + est + '%.', diagnose: [{ value: est - 2 * m, msg: 'Subtract the margin of error once, not twice.' }, { value: hi, msg: 'That is the upper end.' }] }),
          pctF('high', 'Upper end (%)', hi, { wrongMsg: 'Add the margin of error to ' + est + '%.', diagnose: [{ value: est + 2 * m, msg: 'Add the margin of error once, not twice.' }, { value: lo, msg: 'That is the lower end.' }] }),
        ] },
        { legend: 'Step 3: Read the interval', fields: [selF('majority', 'Does the poll support the claim that a majority is in favor?', [
          { value: 'yes', label: 'Yes: the whole interval lies above 50%' },
          { value: 'no', label: 'No: the interval reaches 50% or below' },
        ], lo > 50 ? 'yes' : 'no', { wrongMsg: 'Compare the lower end of the interval with 50%.' })] },
      ],
      solution: [
        'A sample of ' + numStr(n) + ' gives a margin of error of about plus or minus ' + m + ' percentage points at the 95% confidence level.',
        'The interval runs from ' + est + ' − ' + m + ' = ' + numStr(lo) + '% to ' + est + ' + ' + m + ' = ' + numStr(hi) + '%.',
        lo > 50 ? 'The lower end is above 50%, so the data supports a majority at the 95% confidence level.' : 'The interval reaches 50%, so the data does not establish a majority.',
      ],
    };
  }
  function bookEx17() {
    return pollProblem(1000, 58, 'A poll of 1,000 randomly selected adults finds that 58% support a proposed ballot measure.',
      'Use the rule-of-thumb margin of error to state the confidence interval for the true proportion of supporters. Does the result support the claim that a majority favors the measure?');
  }
  function bookEx19() {
    return pollProblem(500, 61, 'A campus survey of 500 students finds that 61% support extending library hours during finals. A student newspaper reports: “Students overwhelmingly support longer library hours.”',
      'What confidence interval should the article have in mind?', 'Whether “overwhelmingly” overstates the result is a written answer; see the Selected Solutions appendix.');
  }

  function bookEx23() {
    const dir = [{ value: 'increase', label: 'Increase' }, { value: 'decrease', label: 'Decrease' }];
    return {
      setup: 'Return to the cholesterol example from §15.5: normally distributed with mean 160 mg/dL, standard deviation 50 mg/dL. The current test flags anyone outside the 2-SD range (60 to 260 mg/dL).',
      dataLabel: '', data: [],
      question: '(a) What percentage of the healthy population is currently flagged as abnormal? (b) If the threshold is moved to 1.5 SDs from the mean, what are the new cutoffs? (c) Would this change increase or decrease sensitivity and specificity?',
      steps: [
        { legend: '(a) Flagged now', fields: [pctF('flagged', 'Percentage of healthy people outside the 2-SD range (%)', 5, {
          wrongMsg: 'About 95% fall within 2 standard deviations. How many are outside?',
          diagnose: [{ value: 95, msg: 'That is the percentage inside the range, who are not flagged.' }, { value: 2.5, msg: 'People are flagged on both sides, high and low. Count both tails.' }],
        })] },
        { legend: '(b) New cutoffs at 1.5 SD', fields: [
          cleanDiag(numF('low', 'Lower cutoff (mg/dL)', exactT(85), { wrongMsg: '160 − 1.5 × 50.', diagnose: [{ value: 235, msg: 'That is the upper cutoff.' }] })),
          cleanDiag(numF('high', 'Upper cutoff (mg/dL)', exactT(235), { wrongMsg: '160 + 1.5 × 50.', diagnose: [{ value: 85, msg: 'That is the lower cutoff.' }] })),
        ] },
        { legend: '(c) The tradeoff', help: 'A narrower normal band flags more people overall.', fields: [
          selF('sens', 'Sensitivity would', dir, 'increase', { wrongMsg: 'Flagging more people catches more of those who really have abnormal cholesterol.' }),
          selF('spec', 'Specificity would', dir, 'decrease', { wrongMsg: 'Flagging more people also flags more healthy people.' }),
        ] },
      ],
      solution: [
        '(a) About 95% of the healthy population falls within 2 standard deviations, so about 5% falls outside and is flagged.',
        '(b) 160 − 1.5(50) = 85 mg/dL and 160 + 1.5(50) = 235 mg/dL.',
        '(c) The narrower band flags more people. That catches more true cases, so sensitivity increases, and flags more healthy people, so specificity decreases.',
      ],
    };
  }

  const BOOK = [
    { id: 'ex1', label: 'Exercise 1 (Set 1: Measuring the Middle)', make: bookEx1 },
    { id: 'ex3', label: 'Exercise 3 (Set 1: Measuring the Middle)', make: bookEx3 },
    { id: 'ex5', label: 'Exercise 5 (Set 1: Measuring the Middle)', make: bookEx5 },
    { id: 'ex7', label: 'Exercise 7 (Set 2: Standard Deviation)', make: bookEx7 },
    { id: 'ex11', label: 'Exercise 11 (Set 2: Standard Deviation)', make: bookEx11 },
    { id: 'ex13', label: 'Exercise 13 (Set 3: The Normal Distribution)', make: bookEx13 },
    { id: 'ex15', label: 'Exercise 15 (Set 3: The Normal Distribution)', make: bookEx15 },
    { id: 'ex17', label: 'Exercise 17 (Set 4: Confidence Intervals)', make: bookEx17 },
    { id: 'ex19', label: 'Exercise 19 (Set 4: Confidence Intervals)', make: bookEx19 },
    { id: 'ex23', label: 'Exercise 23 (Set 5: Diagnostic Thresholds)', make: bookEx23 },
  ].map((b) => Object.assign(b, { levels: [1], fixed: true }));

  // ---------------------------------------------------------------------
  // Registry
  // ---------------------------------------------------------------------
  const KINDS = {
    center: [
      { id: 'mean', label: 'Mean', make: genMean },
      { id: 'median', label: 'Median', make: genMedian },
      { id: 'mode', label: 'Mode', make: genMode },
      { id: 'choose', label: 'Choosing a measure', make: genChoose },
      { id: 'shape', label: 'Shape from the mean and median', make: genShape },
    ],
    spread: [
      { id: 'range', label: 'Range', make: genRange },
      { id: 'sd', label: 'Standard deviation by hand', make: genSD },
      { id: 'sdbig', label: 'Standard deviation with a spreadsheet', make: genSDBig, levels: [1] },
      { id: 'z', label: 'Standard deviations from the mean', make: genZ },
    ],
    normal: [
      { id: 'within', label: 'Within 1, 2, or 3 standard deviations', make: genWithin },
      { id: 'tail', label: 'One tail (above or below a cutoff)', make: genTail },
      { id: 'boundary', label: 'Value that marks a boundary', make: genBoundary },
      { id: 'unusual', label: 'Is this value unusual?', make: genUnusual, levels: [1] },
    ],
    moe: [
      { id: 'interval', label: 'Confidence interval from a poll', make: genInterval },
      { id: 'majority', label: 'Does the poll show a majority?', make: genMajority },
      { id: 'race', label: 'Is the leader really ahead?', make: genRace },
      { id: 'change', label: 'Did opinion really change?', make: genChange },
      { id: 'reported', label: 'Reported interval: margin and sample size', make: genReported },
    ],
    thresholds: [
      { id: 'rates', label: 'Error rates from sensitivity and specificity', make: genRates },
      { id: 'cutoffs', label: 'Cutoffs and healthy readings flagged', make: genCutoffs },
      { id: 'move', label: 'Moving the threshold', make: genMove },
      { id: 'flags', label: 'Flags that turn out wrong', make: genFlags },
    ],
    distort: [
      { id: 'truncated', label: 'Truncated axis', make: genTruncated },
      { id: 'area', label: 'Picture scaled by height', make: genArea },
      { id: 'risk', label: 'Relative vs. absolute risk', make: genRisk },
      { id: 'baseline', label: 'Choosing the starting year', make: genBaseline },
    ],
    book: BOOK,
  };
  const MODES = [
    { id: 'center', label: 'Center', section: '15.1' },
    { id: 'spread', label: 'Spread', section: '15.2' },
    { id: 'normal', label: 'Normal', section: '15.3' },
    { id: 'moe', label: 'Margin of Error', section: '15.4' },
    { id: 'thresholds', label: 'Thresholds', section: '15.5' },
    { id: 'distort', label: 'Distortions', section: '15.6' },
    { id: 'book', label: 'From the Book', section: null, fixed: true },
  ];

  /**
   * mode: an id from MODES; kind: an id from KINDS[mode] or 'any';
   * level: 1, 2, or 0 for either; seed: positive integer (the problem number).
   */
  function makeProblem(mode, kind, level, seed) {
    const kinds = KINDS[mode];
    if (!kinds) throw new Error('Unknown mode: ' + mode);
    const rng = makeRng(hashSeed(mode + ':' + kind + ':' + level + ':' + seed));
    const chosen = kinds.find((k) => k.id === kind) || rng.pick(kinds);
    const levels = chosen.levels || [1, 2];
    const lv = levels.indexOf(level) >= 0 ? level : rng.pick(levels);
    const p = chosen.make(rng, lv);
    p.mode = mode; p.kind = chosen.id; p.level = lv; p.seed = seed;
    p.fields = [];
    p.steps.forEach((s) => { p.fields = p.fields.concat(s.fields); });
    return p;
  }

  return {
    makeProblem, checkField, parseNumber, verdict, KINDS, MODES, MOE,
    _internals: { makeRng, roundTo, terminates, numStr, fmt, median, modesOf, sum, exactT, roundT, splitList },
  };
});
