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
    f.diagnose = (f.diagnose || []).filter(function (d) {
      if (!isFinite(d.value) || seen.some((v) => same(v, d.value))) return false;
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
  // From the book: the odd-numbered exercises answered in the Selected
  // Solutions appendix, numeric parts only. Data and wording follow
  // ch-statistical-reasoning.ptx; answers are computed, and logic-tests.js
  // checks them against appendix-solutions.ptx.
  // ---------------------------------------------------------------------
  const MOE = { 400: 4.9, 500: 4.4, 600: 4.1, 1000: 3.1, 1500: 2.5, 2000: 2.2 };
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
    book: BOOK,
  };
  const MODES = [
    { id: 'center', label: 'Center', section: '15.1' },
    { id: 'spread', label: 'Spread', section: '15.2' },
    { id: 'normal', label: 'Normal', section: '15.3' },
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
