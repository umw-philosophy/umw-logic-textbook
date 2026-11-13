/*
 * probability-core.js
 * Problem generators and answer checking for the Probability Practice tool
 * (UMW Logic Textbook, Chapter 14). No DOM access; runs in the browser and
 * in Node (see logic-tests.js).
 *
 * Every numeric answer is computed here, as an exact fraction, from the same
 * parameters used to write the problem text. Nothing is stored as a
 * pre-written answer.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./probability-bank.js'));
  } else {
    root.ProbCore = factory(root.ProbBank);
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

  // ---------------------------------------------------------------------
  // Exact fractions
  // ---------------------------------------------------------------------
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
  }
  function F(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
  const fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
  const fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
  const fval = (a) => a.n / a.d;
  const fcomp = (a) => fsub(F(1), a);
  function fpow(a, k) { let r = F(1); for (let i = 0; i < k; i++) r = fmul(r, a); return r; }
  const fstr = (a) => (a.d === 1 ? String(a.n) : a.n + '/' + a.d);
  /** A fraction built from a decimal with at most 4 places, e.g. 0.035 -> 7/200. */
  const fromDecimal = (x) => F(Math.round(x * 10000), 10000);

  /** Decimal string with up to `places` places, trailing zeros removed. */
  function dec(x, places) {
    if (places === undefined) places = 6;
    let s = Number(x).toFixed(places);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }
  /** Fraction as an exact decimal when it terminates within 6 places, else rounded to 3 with an approx sign. */
  function decOf(a) {
    const v = fval(a);
    const exact = Math.abs(v - Number(v.toFixed(6))) < 1e-12;
    return exact ? dec(v, 6) : '≈ ' + v.toFixed(3);
  }
  /** "a/b" plus its decimal form, for solutions. */
  function both(a) {
    if (a.d === 1) return String(a.n);
    const d = decOf(a);
    return fstr(a) + (d.charAt(0) === '≈' ? ' ' + d : ' = ' + d);
  }
  const pct = (a) => dec(fval(a) * 100, 4) + ' percent';

  // ---------------------------------------------------------------------
  // Reading a student's answer
  // ---------------------------------------------------------------------
  /**
   * Accepts a fraction (3/13), a decimal (0.25 or .25), a percent (25%),
   * or 0 / 1. Returns { ok, value, decimals, exactForm } or { ok:false, error }.
   * `decimals` is the number of decimal places typed (as a proportion), used
   * to decide how much rounding to allow.
   */
  function parseAnswer(raw) {
    let s = String(raw == null ? '' : raw).trim().replace(/\s+/g, '').replace(/,/g, '');
    if (!s) return { ok: false, error: 'empty' };
    let m = s.match(/^(\d+)\/(\d+)$/);
    if (m) {
      const n = Number(m[1]); const d = Number(m[2]);
      if (d === 0) return { ok: false, error: 'A fraction cannot have 0 on the bottom.' };
      if (n > d) return { ok: false, error: 'A probability cannot be greater than 1.' };
      return { ok: true, value: n / d, decimals: null, exactForm: true };
    }
    m = s.match(/^(\d*\.?\d+|\d+\.)(%|percent)?$/i);
    if (m) {
      const numText = m[1];
      const places = numText.indexOf('.') >= 0 ? numText.length - numText.indexOf('.') - 1 : 0;
      let v = Number(numText);
      let decimals = places;
      if (m[2]) { v = v / 100; decimals = places + 2; }
      if (!isFinite(v)) return { ok: false, error: 'That is not a number.' };
      if (v > 1 + 1e-12) {
        return { ok: false, error: 'A probability cannot be greater than 1. If you mean a percent, add the % sign.' };
      }
      return { ok: true, value: v, decimals, exactForm: false };
    }
    if (/^-/.test(s)) return { ok: false, error: 'A probability cannot be negative.' };
    return { ok: false, error: 'Enter a fraction such as 3/13, a decimal such as 0.231, or a percent such as 23.1%.' };
  }

  /**
   * Compare a parsed answer to the exact target value.
   * Returns 'correct', 'imprecise' (right value, rounded too coarsely), or 'wrong'.
   * A fraction must equal the target. A decimal must be the target correctly
   * rounded to the number of places typed, and within 2.5% of it.
   */
  function compare(parsed, target) {
    const diff = Math.abs(parsed.value - target);
    if (diff < 1e-9) return 'correct';
    if (parsed.exactForm) return 'wrong';
    const window = 0.5 * Math.pow(10, -parsed.decimals) + 1e-12;
    if (diff > window) return 'wrong';
    if (parsed.decimals < 2) return 'imprecise';
    const rel = target === 0 ? Infinity : diff / target;
    return rel <= 0.025 ? 'correct' : 'imprecise';
  }

  /** Exact match only (used for the ingredients typed into Bayes' theorem). */
  function sameValue(parsed, target) {
    return Math.abs(parsed.value - target) < 1e-9;
  }

  // ---------------------------------------------------------------------
  // Sample spaces (events are counted by enumeration, never by hand)
  // ---------------------------------------------------------------------
  const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
  const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
  const DECK = [];
  SUITS.forEach(function (suit) {
    RANKS.forEach(function (rank) {
      DECK.push({
        rank, suit,
        color: suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black',
        face: rank === 'jack' || rank === 'queen' || rank === 'king',
      });
    });
  });

  function article(word) { return (/^(a|e|i|o|u|8)/i.test(word) ? 'an ' : 'a ') + word; }

  const CARD_EVENTS = [
    { name: 'a heart', group: 'suit', test: (c) => c.suit === 'hearts' },
    { name: 'a diamond', group: 'suit', test: (c) => c.suit === 'diamonds' },
    { name: 'a club', group: 'suit', test: (c) => c.suit === 'clubs' },
    { name: 'a spade', group: 'suit', test: (c) => c.suit === 'spades' },
    { name: 'a red card', group: 'color', test: (c) => c.color === 'red' },
    { name: 'a black card', group: 'color', test: (c) => c.color === 'black' },
    { name: 'a face card', group: 'face', test: (c) => c.face },
  ].concat(RANKS.map(function (r) {
    return { name: article(r), group: 'rank', test: (c) => c.rank === r };
  }));

  const DIE = [1, 2, 3, 4, 5, 6];
  const DIE_EVENTS = [
    { name: 'an even number', test: (x) => x % 2 === 0 },
    { name: 'an odd number', test: (x) => x % 2 === 1 },
    { name: 'a number greater than 2', test: (x) => x > 2 },
    { name: 'a number greater than 3', test: (x) => x > 3 },
    { name: 'a number greater than 4', test: (x) => x > 4 },
    { name: 'a number less than 3', test: (x) => x < 3 },
    { name: 'a number less than 4', test: (x) => x < 4 },
    { name: 'a number less than 5', test: (x) => x < 5 },
  ].concat(DIE.map(function (k) { return { name: 'a ' + k, test: (x) => x === k }; }));

  const count = (space, ev) => space.filter(ev.test).length;
  const countBoth = (space, a, b) => space.filter((x) => a.test(x) && b.test(x)).length;

  /** Two events from `events` with neither contained in the other. */
  function pickPair(rng, space, events, wantOverlap) {
    for (let tries = 0; tries < 400; tries++) {
      const a = rng.pick(events); const b = rng.pick(events);
      if (a === b) continue;
      const na = count(space, a); const nb = count(space, b); const nab = countBoth(space, a, b);
      if (nab === na || nab === nb) continue;       // one contains the other
      if (na + nb - nab === space.length) continue;  // union is everything
      if (wantOverlap ? nab > 0 : nab === 0) return { a, b, na, nb, nab };
    }
    throw new Error('pickPair failed');
  }

  const COLORS = ['red', 'blue', 'green', 'yellow', 'white', 'black', 'orange', 'purple'];

  function makeBag(rng, nColors) {
    const colors = rng.shuffle(COLORS).slice(0, nColors);
    const counts = colors.map(() => rng.int(2, 8));
    const total = counts.reduce((s, x) => s + x, 0);
    const parts = colors.map((c, i) => counts[i] + ' ' + c);
    const list = parts.length === 2 ? parts.join(' and ')
      : parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];
    return { colors, counts, total, desc: 'A bag holds ' + list + ' marbles' };
  }

  function makeSpinner(rng) {
    const n = rng.pick([4, 5, 6, 8]);
    const colors = rng.shuffle(COLORS).slice(0, n);
    const words = { 4: 'four', 5: 'five', 6: 'six', 8: 'eight' };
    return {
      n, colors,
      desc: 'A spinner has ' + words[n] + ' equally sized colored regions: ' +
        colors.slice(0, -1).join(', ') + ', and ' + colors[n - 1],
    };
  }

  /** A probability in hundredths within [lo, hi]. */
  function hundredths(rng, lo, hi) {
    return F(rng.int(Math.ceil(lo * 100 - 1e-9), Math.floor(hi * 100 + 1e-9)), 100);
  }

  // ---------------------------------------------------------------------
  // Rules the student chooses from
  // ---------------------------------------------------------------------
  const RULES = {
    basic: [
      { id: 'count', label: 'Count outcomes: favorable outcomes ÷ total outcomes' },
      { id: 'complement', label: 'Complement rule: P(not A) = 1 − P(A)' },
      { id: 'add', label: 'Addition rule (mutually exclusive): P(A or B) = P(A) + P(B)' },
      { id: 'genadd', label: 'General addition rule: P(A or B) = P(A) + P(B) − P(A and B)' },
    ],
    conditional: [
      { id: 'cond', label: 'Conditional probability: P(A | B) = P(A and B) ÷ P(B)' },
      { id: 'mult', label: 'Multiplication rule: P(A and B) = P(A) · P(B | A)' },
      { id: 'indep', label: 'Multiplication rule for independent events: P(A and B) = P(A) · P(B)' },
      { id: 'atleast', label: 'Complement rule together with the multiplication rule' },
    ],
  };

  // ---------------------------------------------------------------------
  // Exercise Set 1: basic rules
  // ---------------------------------------------------------------------
  const BASIC = {};

  BASIC.single = function (rng) {
    const device = rng.pick(['coin', 'die', 'card', 'spinner', 'bag']);
    if (device === 'coin') {
      const side = rng.pick(['heads', 'tails']);
      return {
        text: 'A fair coin is flipped. What is the probability that it lands ' + side + '?',
        answer: F(1, 2), rule: 'count',
        solution: ['There are two equally likely outcomes, heads and tails, and one of them is ' + side + '.',
          'P(' + side + ') = ' + both(F(1, 2)) + '.'],
      };
    }
    if (device === 'die') {
      const ev = rng.pick(DIE_EVENTS); const k = count(DIE, ev);
      return {
        text: 'A fair six-sided die is rolled. What is the probability that it shows ' + ev.name + '?',
        answer: F(k, 6), rule: 'count',
        solution: ['There are 6 equally likely outcomes. ' + fits(k, ev.name) +
          (/^a \d$/.test(ev.name) ? '' : ' (' + DIE.filter(ev.test).join(', ') + ')') + '.',
          'P(' + ev.name + ') = ' + k + '/6' + reduceNote(k, 6) + '.'],
      };
    }
    if (device === 'card') {
      const ev = rng.pick(CARD_EVENTS); const k = count(DECK, ev);
      return {
        text: 'One card is drawn from a standard 52-card deck. What is the probability that the card is ' + ev.name + '?',
        answer: F(k, 52), rule: 'count',
        solution: ['A standard deck has 52 cards, and ' + k + ' of them are ' + plural(ev.name) + '.',
          'P(' + ev.name + ') = ' + k + '/52' + reduceNote(k, 52) + '.'],
      };
    }
    if (device === 'spinner') {
      const sp = makeSpinner(rng); const c = rng.pick(sp.colors);
      return {
        text: sp.desc + '. What is the probability that the spinner lands on ' + c + '?',
        answer: F(1, sp.n), rule: 'count',
        solution: ['There are ' + sp.n + ' equally likely regions, and one of them is ' + c + '.',
          'P(' + c + ') = ' + both(F(1, sp.n)) + '.'],
      };
    }
    const bag = makeBag(rng, rng.pick([2, 3])); const i = rng.int(0, bag.colors.length - 1);
    return {
      text: bag.desc + '. One marble is drawn at random. What is the probability that it is ' + bag.colors[i] + '?',
      answer: F(bag.counts[i], bag.total), rule: 'count',
      solution: ['There are ' + bag.total + ' marbles in all, and ' + bag.counts[i] + ' of them are ' + bag.colors[i] + '.',
        'P(' + bag.colors[i] + ') = ' + bag.counts[i] + '/' + bag.total + reduceNote(bag.counts[i], bag.total) + '.'],
    };
  };

  function plural(name) {
    return name.replace(/^an? /, '') + 's';
  }
  /** "3 of them fit the description ..." */
  function fits(k, name) {
    return k + ' of them ' + (k === 1 ? 'fits' : 'fit') + ' the description “' + name + '”';
  }
  function reduceNote(n, d) {
    const f = F(n, d);
    const reduced = f.d !== d ? ' = ' + fstr(f) : '';
    const dd = decOf(f);
    return reduced + (dd.charAt(0) === '≈' ? ' ' + dd : ' = ' + dd);
  }

  BASIC.complement = function (rng) {
    const kind = rng.pick(['die', 'card', 'bag', 'stated', 'stated']);
    if (kind === 'die') {
      const k = rng.int(1, 6);
      return {
        text: 'A fair six-sided die is rolled. What is the probability that it does not land on a ' + k + '?',
        answer: F(5, 6), rule: 'complement',
        solution: ['P(lands on ' + k + ') = 1/6.',
          'By the complement rule, P(does not land on ' + k + ') = 1 − 1/6 = ' + both(F(5, 6)) + '.'],
      };
    }
    if (kind === 'card') {
      const ev = rng.pick(CARD_EVENTS); const k = count(DECK, ev);
      return {
        text: 'One card is drawn from a standard 52-card deck. What is the probability that the card is not ' + ev.name + '?',
        answer: F(52 - k, 52), rule: 'complement',
        solution: ['P(' + ev.name + ') = ' + k + '/52.',
          'By the complement rule, P(not ' + ev.name + ') = 1 − ' + k + '/52 = ' + (52 - k) + '/52' + reduceNote(52 - k, 52) + '.'],
      };
    }
    if (kind === 'bag') {
      const bag = makeBag(rng, 3); const i = rng.int(0, 2); const k = bag.counts[i];
      return {
        text: bag.desc + '. One marble is drawn at random. What is the probability that it is not ' + bag.colors[i] + '?',
        answer: F(bag.total - k, bag.total), rule: 'complement',
        solution: ['There are ' + bag.total + ' marbles, so P(' + bag.colors[i] + ') = ' + k + '/' + bag.total + '.',
          'By the complement rule, P(not ' + bag.colors[i] + ') = 1 − ' + k + '/' + bag.total + ' = ' +
          (bag.total - k) + '/' + bag.total + reduceNote(bag.total - k, bag.total) + '.'],
      };
    }
    const w = rng.pick(BANK.wrappers.complement);
    const p = hundredths(rng, w.pRange[0], w.pRange[1]);
    return {
      text: fill(w.text, { p: pct(p) }), stated: true,
      answer: fcomp(p), rule: 'complement',
      solution: ['The probability given is ' + dec(fval(p)) + '.',
        'By the complement rule, the probability that this does not happen is 1 − ' + dec(fval(p)) + ' = ' + dec(fval(fcomp(p))) + '.'],
    };
  };

  BASIC.add = function (rng) {
    const kind = rng.pick(['card', 'card', 'die', 'spinner', 'bag']);
    if (kind === 'card') {
      const pr = pickPair(rng, DECK, CARD_EVENTS, false);
      return {
        text: 'One card is drawn from a standard 52-card deck. What is the probability that the card is either ' +
          pr.a.name + ' or ' + pr.b.name + '?',
        answer: F(pr.na + pr.nb, 52), rule: 'add',
        solution: ['No card is both ' + pr.a.name + ' and ' + pr.b.name + ', so the events are mutually exclusive.',
          'P(' + pr.a.name + ') = ' + pr.na + '/52 and P(' + pr.b.name + ') = ' + pr.nb + '/52.',
          'P(' + pr.a.name + ' or ' + pr.b.name + ') = ' + pr.na + '/52 + ' + pr.nb + '/52 = ' + (pr.na + pr.nb) + '/52' +
          reduceNote(pr.na + pr.nb, 52) + '.'],
      };
    }
    if (kind === 'die') {
      const ks = rng.shuffle(DIE).slice(0, 2).sort();
      return {
        text: 'A fair six-sided die is rolled. What is the probability that it shows a ' + ks[0] + ' or a ' + ks[1] + '?',
        answer: F(2, 6), rule: 'add',
        solution: ['One roll cannot show both numbers, so the events are mutually exclusive.',
          'P(' + ks[0] + ' or ' + ks[1] + ') = 1/6 + 1/6 = 2/6 = ' + both(F(1, 3)) + '.'],
      };
    }
    if (kind === 'spinner') {
      const sp = makeSpinner(rng); const cs = rng.shuffle(sp.colors).slice(0, 2);
      return {
        text: sp.desc + '. What is the probability that the spinner lands on ' + cs[0] + ' or ' + cs[1] + '?',
        answer: F(2, sp.n), rule: 'add',
        solution: ['One spin cannot land on both colors, so the events are mutually exclusive.',
          'P(' + cs[0] + ' or ' + cs[1] + ') = 1/' + sp.n + ' + 1/' + sp.n + ' = 2/' + sp.n + reduceNote(2, sp.n) + '.'],
      };
    }
    const bag = makeBag(rng, 3); const idx = rng.shuffle([0, 1, 2]).slice(0, 2);
    const a = bag.counts[idx[0]]; const b = bag.counts[idx[1]];
    return {
      text: bag.desc + '. One marble is drawn at random. What is the probability that it is ' +
        bag.colors[idx[0]] + ' or ' + bag.colors[idx[1]] + '?',
      answer: F(a + b, bag.total), rule: 'add',
      solution: ['One marble cannot be both colors, so the events are mutually exclusive.',
        'P(' + bag.colors[idx[0]] + ' or ' + bag.colors[idx[1]] + ') = ' + a + '/' + bag.total + ' + ' + b + '/' + bag.total +
        ' = ' + (a + b) + '/' + bag.total + reduceNote(a + b, bag.total) + '.'],
    };
  };

  BASIC.genadd = function (rng) {
    const kind = rng.pick(['card', 'card', 'die', 'stated', 'stated']);
    if (kind === 'card' || kind === 'die') {
      const space = kind === 'card' ? DECK : DIE;
      const events = kind === 'card' ? CARD_EVENTS : DIE_EVENTS.filter((e) => !/^a \d$/.test(e.name));
      const pr = pickPair(rng, space, events, true);
      const N = space.length; const u = pr.na + pr.nb - pr.nab;
      const lead = kind === 'card'
        ? 'One card is drawn from a standard 52-card deck. What is the probability that the card is '
        : 'A fair six-sided die is rolled. What is the probability that it shows ';
      return {
        text: lead + pr.a.name + ' or ' + pr.b.name + '?',
        answer: F(u, N), rule: 'genadd',
        solution: ['The events overlap: ' + pr.nab + ' of the ' + N + ' outcomes ' + (pr.nab === 1 ? 'is' : 'are') +
          ' both ' + pr.a.name + ' and ' + pr.b.name + '. Adding without adjusting would count ' +
          (pr.nab === 1 ? 'it' : 'them') + ' twice.',
          'P(' + pr.a.name + ') = ' + pr.na + '/' + N + ', P(' + pr.b.name + ') = ' + pr.nb + '/' + N +
          ', and P(both) = ' + pr.nab + '/' + N + '.',
          'P(' + pr.a.name + ' or ' + pr.b.name + ') = ' + pr.na + '/' + N + ' + ' + pr.nb + '/' + N + ' − ' + pr.nab + '/' + N +
          ' = ' + u + '/' + N + reduceNote(u, N) + '.'],
      };
    }
    const w = rng.pick(BANK.wrappers.genadd);
    let a; let b; let ab; let tries = 0;
    do {
      a = hundredths(rng, w.aRange[0], w.aRange[1]);
      b = hundredths(rng, w.bRange[0], w.bRange[1]);
      const maxAb = Math.round(Math.min(fval(a), fval(b)) * 100) - 2;
      const minAb = Math.max(2, Math.round((fval(a) + fval(b)) * 100) - 95);
      ab = maxAb >= minAb ? F(rng.int(minAb, maxAb), 100) : null;
      tries++;
    } while (!ab && tries < 200);
    if (!ab) { a = F(40, 100); b = F(30, 100); ab = F(12, 100); }
    const u = fsub(fadd(a, b), ab);
    return {
      text: fill(w.text, { a: pct(a), b: pct(b), ab: pct(ab) }), stated: true,
      answer: u, rule: 'genadd',
      solution: ['Let A = ' + w.A + ' and B = ' + w.B + '. The two overlap, so use the general addition rule.',
        'P(A) = ' + dec(fval(a)) + ', P(B) = ' + dec(fval(b)) + ', and P(A and B) = ' + dec(fval(ab)) + '.',
        'P(A or B) = ' + dec(fval(a)) + ' + ' + dec(fval(b)) + ' − ' + dec(fval(ab)) + ' = ' + dec(fval(u)) + '.'],
    };
  };

  // ---------------------------------------------------------------------
  // Exercise Set 2: conditional probability and joint probability
  // ---------------------------------------------------------------------
  const COND = {};

  COND.given = function (rng) {
    const kind = rng.pick(['die', 'card', 'card', 'stated', 'stated']);
    if (kind === 'stated') {
      const w = rng.pick(BANK.wrappers.cond);
      const b = hundredths(rng, w.bRange[0], w.bRange[1]);
      const bn = Math.round(fval(b) * 100);
      const ab = F(rng.int(Math.max(2, Math.round(bn * 0.15)), Math.max(3, Math.round(bn * 0.9))), 100);
      const ans = fdiv(ab, b);
      return {
        text: fill(w.text, { b: pct(b), ab: pct(ab) }), stated: true,
        answer: ans, rule: 'cond',
        solution: ['Let A = ' + w.A + ' and B = ' + w.B + '. We are given P(B) = ' + dec(fval(b)) +
          ' and P(A and B) = ' + dec(fval(ab)) + '.',
          'P(A | B) = P(A and B) ÷ P(B) = ' + dec(fval(ab)) + ' ÷ ' + dec(fval(b)) + ' = ' + both(ans) + '.'],
      };
    }
    const space = kind === 'card' ? DECK : DIE;
    const events = kind === 'card' ? CARD_EVENTS : DIE_EVENTS;
    let a; let b; let nb; let nab;
    for (let t = 0; t < 500; t++) {
      a = rng.pick(events); b = rng.pick(events);
      nb = count(space, b); nab = countBoth(space, a, b);
      if (a !== b && nb >= 2 && nab > 0 && nab < nb) break;
      a = null;
    }
    if (!a) { a = events[events.length - 1]; b = events[0]; nb = count(space, b); nab = countBoth(space, a, b); }
    const lead = kind === 'card'
      ? 'One card is drawn from a standard 52-card deck. Given that the card is ' + b.name +
        ', what is the probability that it is ' + a.name + '?'
      : 'A fair six-sided die is rolled. Given that the outcome is ' + b.name +
        ', what is the probability that the outcome is ' + a.name + '?';
    return {
      text: lead, answer: F(nab, nb), rule: 'cond',
      solution: ['Given that the ' + (kind === 'die' ? 'outcome' : 'card') + ' is ' + b.name + ', only ' + nb +
        ' outcomes remain possible' + (kind === 'die' ? ' (' + DIE.filter(b.test).join(', ') + ')' : '') + '.',
        fits(nab, a.name).replace(' of them ', ' of those ' + nb + ' ') + '.',
        'P(' + a.name + ' | ' + b.name + ') = ' + nab + '/' + nb + reduceNote(nab, nb) + '.'],
    };
  };

  COND.dependent = function (rng) {
    const kind = rng.pick(['cards', 'cards', 'bagMixed', 'bagSame', 'stated']);
    if (kind === 'stated') {
      const w = rng.pick(BANK.wrappers.mult);
      const a = hundredths(rng, w.aRange[0], w.aRange[1]);
      const c = F(rng.int(Math.ceil(w.condRange[0] * 20), Math.floor(w.condRange[1] * 20)), 20);
      const ans = fmul(a, c);
      return {
        text: fill(w.text, { a: pct(a), c: pct(c) }), stated: true,
        answer: ans, rule: 'mult',
        solution: ['Let A = ' + w.A + ' and B = ' + w.B + '. We are given P(A) = ' + dec(fval(a)) +
          ' and P(B | A) = ' + dec(fval(c)) + '.',
          'By the multiplication rule, P(A and B) = P(A) · P(B | A) = ' + dec(fval(a)) + ' × ' + dec(fval(c)) +
          ' = ' + dec(fval(ans)) + '.'],
      };
    }
    if (kind === 'cards') {
      const ev = rng.pick(CARD_EVENTS.filter((e) => count(DECK, e) >= 4)); const k = count(DECK, ev);
      const ans = fmul(F(k, 52), F(k - 1, 51));
      return {
        text: 'Two cards are drawn from a standard 52-card deck without replacement. What is the probability that both are ' +
          plural(ev.name) + '?',
        answer: ans, rule: 'mult',
        solution: ['P(first is ' + ev.name + ') = ' + k + '/52.',
          'Once ' + ev.name + ' is gone, ' + (k - 1) + ' of the remaining 51 cards are ' + plural(ev.name) +
          ', so P(second is ' + ev.name + ' | first is ' + ev.name + ') = ' + (k - 1) + '/51.',
          'By the multiplication rule, P(both) = (' + k + '/52)(' + (k - 1) + '/51) = ' + both(ans) + '.'],
      };
    }
    const bag = makeBag(rng, rng.pick([2, 2, 3]));
    let i = rng.int(0, bag.colors.length - 1); let j = i;
    if (kind === 'bagMixed') { while (j === i) j = rng.int(0, bag.colors.length - 1); }
    const first = bag.counts[i]; const second = j === i ? bag.counts[i] - 1 : bag.counts[j];
    const ans = fmul(F(first, bag.total), F(second, bag.total - 1));
    const ask = j === i
      ? 'What is the probability that both marbles are ' + bag.colors[i] + '?'
      : 'What is the probability that the first is ' + bag.colors[i] + ' and the second is ' + bag.colors[j] + '?';
    return {
      text: bag.desc + '. A marble is drawn at random and not replaced; then a second marble is drawn. ' + ask,
      answer: ans, rule: 'mult',
      solution: ['P(first is ' + bag.colors[i] + ') = ' + first + '/' + bag.total + '.',
        'With one ' + bag.colors[i] + ' marble removed, ' + (bag.total - 1) + ' marbles remain and ' + second +
        (second === 1 ? ' is ' : ' are ') + bag.colors[j] + ', so P(second is ' + bag.colors[j] + ' | first is ' +
        bag.colors[i] + ') = ' + second + '/' + (bag.total - 1) + '.',
        'By the multiplication rule, P(both) = (' + first + '/' + bag.total + ')(' + second + '/' + (bag.total - 1) +
        ') = ' + both(ans) + '.'],
    };
  };

  const TIMES = { 2: 'twice', 3: 'three times', 4: 'four times', 5: 'five times' };
  const NUM = { 2: 'two', 3: 'three', 4: 'four', 5: 'five' };

  COND.independent = function (rng) {
    const kind = rng.pick(['coin', 'die', 'dieEvent', 'coinDie', 'bagReplace']);
    if (kind === 'coin') {
      const n = rng.int(2, 5); const side = rng.pick(['heads', 'tails']); const ans = fpow(F(1, 2), n);
      return {
        text: 'A fair coin is flipped ' + TIMES[n] + '. What is the probability of getting ' + side +
          (n === 2 ? ' both times?' : ' all ' + NUM[n] + ' times?'),
        answer: ans, rule: 'indep',
        solution: ['The flips are independent, and P(' + side + ') = 1/2 on each flip.',
          'P(' + side + ' every time) = (1/2)^' + n + ' = ' + both(ans) + '.'],
      };
    }
    if (kind === 'die') {
      const n = rng.int(2, 3); const k = rng.int(1, 6); const ans = fpow(F(1, 6), n);
      return {
        text: 'A fair six-sided die is rolled ' + TIMES[n] + '. What is the probability that it shows a ' + k +
          (n === 2 ? ' both times?' : ' all three times?'),
        answer: ans, rule: 'indep',
        solution: ['The rolls are independent, and P(' + k + ') = 1/6 on each roll.',
          'P(' + k + ' every time) = (1/6)^' + n + ' = ' + both(ans) + '.'],
      };
    }
    if (kind === 'dieEvent') {
      const ev = rng.pick(DIE_EVENTS.filter((e) => count(DIE, e) >= 2 && count(DIE, e) <= 4));
      const k = count(DIE, ev); const n = rng.int(2, 3); const ans = fpow(F(k, 6), n);
      return {
        text: 'A fair six-sided die is rolled ' + TIMES[n] + '. What is the probability that it shows ' + ev.name +
          (n === 2 ? ' both times?' : ' all three times?'),
        answer: ans, rule: 'indep',
        solution: ['On one roll, P(' + ev.name + ') = ' + k + '/6 = ' + fstr(F(k, 6)) + '. The rolls are independent.',
          'P(' + ev.name + ' every time) = (' + fstr(F(k, 6)) + ')^' + n + ' = ' + both(ans) + '.'],
      };
    }
    if (kind === 'coinDie') {
      const side = rng.pick(['heads', 'tails']); const ev = rng.pick(DIE_EVENTS); const k = count(DIE, ev);
      const ans = fmul(F(1, 2), F(k, 6));
      return {
        text: 'A fair coin is flipped and a fair six-sided die is rolled. What is the probability that the coin lands ' +
          side + ' and the die shows ' + ev.name + '?',
        answer: ans, rule: 'indep',
        solution: ['The coin and the die do not affect each other, so the events are independent.',
          'P(' + side + ') = 1/2 and P(' + ev.name + ') = ' + k + '/6.',
          'P(both) = (1/2)(' + k + '/6) = ' + both(ans) + '.'],
      };
    }
    const bag = makeBag(rng, 2); const i = rng.int(0, 1); const j = rng.int(0, 1);
    const ans = fmul(F(bag.counts[i], bag.total), F(bag.counts[j], bag.total));
    return {
      text: bag.desc + '. A marble is drawn at random, its color is noted, and it is put back. Then a second marble is drawn. ' +
        (i === j ? 'What is the probability that both draws are ' + bag.colors[i] + '?'
          : 'What is the probability that the first is ' + bag.colors[i] + ' and the second is ' + bag.colors[j] + '?'),
      answer: ans, rule: 'indep',
      solution: ['Because the first marble is put back, the second draw is not affected by the first. The draws are independent.',
        'P(first is ' + bag.colors[i] + ') = ' + bag.counts[i] + '/' + bag.total + ' and P(second is ' + bag.colors[j] +
        ') = ' + bag.counts[j] + '/' + bag.total + '.',
        'P(both) = (' + bag.counts[i] + '/' + bag.total + ')(' + bag.counts[j] + '/' + bag.total + ') = ' + both(ans) + '.'],
    };
  };

  COND.atleast = function (rng) {
    const kind = rng.pick(['coin', 'coin', 'die', 'bagReplace']);
    if (kind === 'coin') {
      const n = rng.int(2, 5); const side = rng.pick(['head', 'tail']); const other = side === 'head' ? 'tails' : 'heads';
      const none = fpow(F(1, 2), n); const ans = fcomp(none);
      return {
        text: 'A fair coin is flipped ' + TIMES[n] + '. What is the probability of getting at least one ' + side + '?',
        answer: ans, rule: 'atleast',
        solution: ['Work with the complement. The only way to get no ' + side + 's is to get ' + other + ' on every flip.',
          'P(' + other + ' every time) = (1/2)^' + n + ' = ' + fstr(none) + '.',
          'P(at least one ' + side + ') = 1 − ' + fstr(none) + ' = ' + both(ans) + '.'],
      };
    }
    if (kind === 'die') {
      const n = rng.int(2, 3); const k = rng.int(1, 6); const none = fpow(F(5, 6), n); const ans = fcomp(none);
      return {
        text: 'A fair six-sided die is rolled ' + TIMES[n] + '. What is the probability that it shows a ' + k + ' at least once?',
        answer: ans, rule: 'atleast',
        solution: ['Work with the complement. On one roll, P(not a ' + k + ') = 5/6, and the rolls are independent.',
          'P(no ' + k + ' on any roll) = (5/6)^' + n + ' = ' + fstr(none) + '.',
          'P(at least one ' + k + ') = 1 − ' + fstr(none) + ' = ' + both(ans) + '.'],
      };
    }
    const bag = makeBag(rng, 2); const i = rng.int(0, 1); const o = 1 - i;
    const none = fpow(F(bag.counts[o], bag.total), 2); const ans = fcomp(none);
    return {
      text: bag.desc + '. A marble is drawn at random, its color is noted, and it is put back. Then a second marble is drawn. ' +
        'What is the probability that at least one of the two draws is ' + bag.colors[i] + '?',
      answer: ans, rule: 'atleast',
      solution: ['Work with the complement. The only way to get no ' + bag.colors[i] + ' marble is to draw ' + bag.colors[o] + ' both times.',
        'The draws are independent, so P(' + bag.colors[o] + ' both times) = (' + bag.counts[o] + '/' + bag.total + ')^2 = ' + fstr(none) + '.',
        'P(at least one ' + bag.colors[i] + ') = 1 − ' + fstr(none) + ' = ' + both(ans) + '.'],
    };
  };

  function fill(template, map) {
    return template.replace(/\{(\w+)\}/g, function (m, key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : m;
    });
  }

  // ---------------------------------------------------------------------
  // Exercise Set 5: Bayes' theorem
  // ---------------------------------------------------------------------
  const PRIORS = [0.001, 0.002, 0.004, 0.005, 0.008, 0.01, 0.02, 0.03, 0.04, 0.05, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

  function oneIn(p) {
    const inv = Math.round(p.d / p.n);
    return p.n === 1 ? '1 in ' + inv.toLocaleString('en-US') : null;
  }

  /**
   * level 1: the true-positive and false-positive rates are stated directly.
   * level 2: one or both rates are stated as their complements (a miss rate,
   *          or a correct-rejection rate), the base rate may be "1 in N", and
   *          the sentences come in a shuffled order.
   */
  function makeBayes(rng, level) {
    const s = rng.pick(BANK.bayes);
    const priors = PRIORS.filter((x) => x >= s.priorRange[0] - 1e-9 && x <= s.priorRange[1] + 1e-9);
    const prior = fromDecimal(priors.length ? rng.pick(priors) : s.priorRange[0]);
    const tp = hundredths(rng, s.tpRange[0], s.tpRange[1]);
    let fp = hundredths(rng, s.fpRange[0], s.fpRange[1]);
    if (fval(fp) >= fval(tp)) fp = F(Math.max(1, Math.round(fval(tp) * 100) - 40), 100);
    const notPrior = fcomp(prior);

    const hard = level >= 2;
    const priorPhrase = oneIn(prior) && rng.chance(hard ? 0.6 : 0.2) ? oneIn(prior) : pct(prior);
    const useFn = hard && rng.chance(0.45);
    let useTn = hard && rng.chance(0.6);
    if (hard && !useFn && !useTn) useTn = true;

    const sentences = [
      fill(s.prior, { p: priorPhrase }),
      useFn ? fill(s.fn, { fn: pct(fcomp(tp)) }) : fill(s.tp, { tp: pct(tp) }),
      useTn ? fill(s.tn, { tn: pct(fcomp(fp)) }) : fill(s.fp, { fp: pct(fp) }),
    ].map(capFirst);
    const ordered = hard ? rng.shuffle(sentences) : sentences;

    const num = fmul(tp, prior);
    const alt = fmul(fp, notPrior);
    const den = fadd(num, alt);
    const post = fdiv(num, den);

    const solution = [
      'H = ' + s.H + '. E = ' + s.E + '. The question asks for P(H | E).',
      'P(H) = ' + dec(fval(prior)) + (priorPhrase.indexOf(' in ') > 0 ? ' (' + priorPhrase + ')' : '') + ', the base rate.',
      'P(~H) = 1 − ' + dec(fval(prior)) + ' = ' + dec(fval(notPrior)) + ', by the complement rule.',
      'P(E | H) = ' + dec(fval(tp)) + (useFn
        ? '. The problem gives the rate at which the evidence fails to appear when H is true (' + dec(fval(fcomp(tp))) +
          '), so P(E | H) = 1 − ' + dec(fval(fcomp(tp))) + '.'
        : ', the rate at which the evidence appears when H is true.'),
      'P(E | ~H) = ' + dec(fval(fp)) + (useTn
        ? '. The problem gives the rate at which the evidence correctly does not appear when H is false (' + dec(fval(fcomp(fp))) +
          '), so P(E | ~H) = 1 − ' + dec(fval(fcomp(fp))) + '.'
        : ', the rate at which the evidence appears even though H is false.'),
      'P(H | E) = (' + dec(fval(tp)) + ')(' + dec(fval(prior)) + ') ÷ [(' + dec(fval(tp)) + ')(' + dec(fval(prior)) + ') + (' +
        dec(fval(fp)) + ')(' + dec(fval(notPrior)) + ')] = ' + dec(fval(num), 8) + ' ÷ ' + dec(fval(den), 8) + ' ≈ ' + fval(post).toFixed(3) + '.',
      'Check by counting. Of 100,000 cases, ' + big(fval(prior)) + ' are cases where H is true, and ' + big(fval(num)) +
        ' of those show the evidence. Another ' + big(fval(alt)) + ' cases show the evidence even though H is false. So ' +
        big(fval(num)) + ' of the ' + big(fval(den)) + ' cases that show the evidence are cases where H is true.',
    ];

    return {
      mode: 'bayes', storyId: s.id,
      text: [s.setup].concat(ordered).join(' '),
      question: s.question,
      statements: rng.shuffle([
        { key: 'H', text: s.H }, { key: 'notH', text: s.notH },
        { key: 'E', text: s.E }, { key: 'notE', text: s.notE },
      ]),
      H: s.H, E: s.E,
      values: { pH: fval(prior), pNotH: fval(notPrior), pEH: fval(tp), pENotH: fval(fp), posterior: fval(post) },
      given: { complementTp: fval(fcomp(tp)), complementFp: fval(fcomp(fp)), usedFn: useFn, usedTn: useTn },
      solution,
    };
  }

  function big(x) { return Math.round(x * 100000).toLocaleString('en-US'); }
  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /**
   * Check the six numbers a student typed into Bayes' theorem.
   * slots = { n1, n2, d1, d2, d3, d4 } as numbers (or null when blank/invalid).
   * Order within a product does not matter, and the two terms of the
   * denominator may come in either order.
   */
  function checkBayesFormula(values, slots) {
    const eq = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-9;
    const pairIs = (x, y, p, q) => (eq(x, p) && eq(y, q)) || (eq(x, q) && eq(y, p));
    const T1 = [values.pEH, values.pH];
    const T2 = [values.pENotH, values.pNotH];
    const numerator = pairIs(slots.n1, slots.n2, T1[0], T1[1]);
    const a1 = pairIs(slots.d1, slots.d2, T1[0], T1[1]);
    const a2 = pairIs(slots.d1, slots.d2, T2[0], T2[1]);
    const b1 = pairIs(slots.d3, slots.d4, T1[0], T1[1]);
    const b2 = pairIs(slots.d3, slots.d4, T2[0], T2[1]);
    let termA = a1 || a2;
    let termB = b1 || b2;
    let hint = '';
    if (termA && termB && !((a1 && b2) || (a2 && b1))) {
      termB = false;
      hint = 'The two terms on the bottom should be different: one for H and one for ~H.';
    } else if (!numerator && pairIs(slots.n1, slots.n2, T2[0], T2[1])) {
      hint = 'The top of the fraction is the H term, P(E | H) · P(H). You entered the ~H term.';
    }
    return { numerator, termA, termB, all: numerator && termA && termB, hint };
  }

  /** Name the mistake when a final Bayes answer matches a known wrong value. */
  function diagnoseBayes(values, v) {
    const near = (a, b) => Math.abs(a - b) <= Math.max(0.00001, Math.min(0.0006, 0.006 * b));
    const num = values.pEH * values.pH;
    const den = num + values.pENotH * values.pNotH;
    if (near(v, values.pEH)) return 'That is P(E | H), the probability of the evidence if the hypothesis is true. The question asks for the other direction, P(H | E).';
    if (near(v, 1 - values.pENotH)) return 'That is the rate at which the evidence correctly fails to appear when H is false. It is not P(H | E).';
    if (near(v, values.pH)) return 'That is the prior, P(H). The evidence should change it.';
    if (near(v, num)) return 'That is only the top of the fraction, P(E | H) · P(H). Divide it by the whole bottom.';
    if (near(v, den)) return 'That is the bottom of the fraction, P(E). Divide the top by it.';
    if (near(v, 1 - num / den)) return 'That is P(~H | E). The question asks for P(H | E).';
    if (near(v, num / (values.pENotH * values.pNotH))) return 'It looks as though the bottom has only the ~H term. The bottom needs both terms added together.';
    if (near(v, values.pEH / (values.pEH + values.pENotH))) return 'It looks as though the priors P(H) and P(~H) were left out. That is base-rate neglect.';
    return '';
  }

  // ---------------------------------------------------------------------
  // Public problem factory
  // ---------------------------------------------------------------------
  const KINDS = {
    basic: [
      { id: 'single', label: 'Single event', make: BASIC.single },
      { id: 'complement', label: 'Complement rule', make: BASIC.complement },
      { id: 'add', label: 'Addition rule (mutually exclusive)', make: BASIC.add },
      { id: 'genadd', label: 'General addition rule (overlapping)', make: BASIC.genadd },
    ],
    conditional: [
      { id: 'given', label: 'Conditional probability', make: COND.given },
      { id: 'dependent', label: 'Multiplication rule (without replacement)', make: COND.dependent },
      { id: 'independent', label: 'Independent events', make: COND.independent },
      { id: 'atleast', label: '“At least one” problems', make: COND.atleast },
    ],
    bayes: [
      { id: 'level1', label: 'Level 1: rates stated directly' },
      { id: 'level2', label: 'Level 2: some rates stated as complements' },
    ],
  };

  /**
   * mode: 'basic' | 'conditional' | 'bayes'
   * kind: an id from KINDS[mode], or 'any'
   * seed: positive integer (the "problem number")
   */
  function makeProblem(mode, kind, seed) {
    const rng = makeRng(hashSeed(mode, seed));
    const kinds = KINDS[mode];
    if (!kinds) throw new Error('Unknown mode: ' + mode);
    let chosen = kinds.find((k) => k.id === kind);
    if (!chosen) chosen = rng.pick(kinds);
    let p;
    if (mode === 'bayes') {
      p = makeBayes(rng, chosen.id === 'level2' ? 2 : 1);
    } else {
      p = chosen.make(rng);
      p.mode = mode;
      // Rules that also give the right answer, though they are not the intended one.
      p.altRules = [];
      if (mode === 'basic' && p.rule !== 'count' && !p.stated) p.altRules.push('count');
      if (p.rule === 'indep') p.altRules.push('mult');
      p.value = fval(p.answer);
      p.answerText = both(p.answer);
    }
    p.kind = chosen.id;
    p.seed = seed;
    return p;
  }

  function hashSeed(mode, seed) {
    let h = 2166136261;
    const s = mode + ':' + seed;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  return {
    makeProblem, parseAnswer, compare, sameValue, checkBayesFormula, diagnoseBayes,
    RULES, KINDS, DECK, DIE, CARD_EVENTS, DIE_EVENTS,
    _internals: { F, fval, fstr, both, dec, makeRng, fill, count, countBoth },
  };
});
