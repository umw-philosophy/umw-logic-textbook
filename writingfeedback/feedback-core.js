/*
 * feedback-core.js
 * Everything in the Argument Feedback tool that does not need the model:
 * sentence numbering, the indicator-word and sentence-variety checks,
 * reconstructions (checking and comparing them), checking the model's
 * replies, the draft comparison, and the exported record.
 * No DOM access; runs in the browser and in Node (see logic-tests.js).
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FeedbackCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LIMITS = {
    items: 3,                // diagnosis items per round
    observationWords: 40,
    questionWords: 30,
    exampleWords: 60,
    exampleSharedRun: 6,     // an example may share at most this many consecutive words with the essay
    followupWords: 40,
    followupExchanges: 3,
    reasonMinWords: 3,       // a "Disagree" needs a reason at least this long
    longSentenceWords: 40,
    maxEssayWords: 3000,
    quoteExemptWords: 2,     // quoted phrases this short (scare quotes) are not checked
    wordTolerance: 5,        // the model is told the limits above; the checker accepts up to this many words more
    similarLengthBand: 4,    // sentences within this many words of each other count as similar length
    similarLengthRun: 3,
    repeatedOpening: 3,
  };

  // ---------------------------------------------------------------- words
  const WORD_RE = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
  function words(s) { return String(s || '').match(WORD_RE) || []; }
  function wordCount(s) { return words(s).length; }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}']+/gu, ' ').trim();
  }
  function round(x, places) { const f = Math.pow(10, places); return Math.round(x * f) / f; }

  // ---------------------------------------------------------------- sentences
  // Abbreviations that end in a period without ending the sentence. "etc." is
  // left out on purpose: before a capital letter it usually does end one.
  const ABBREV = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'sr', 'jr', 'vs', 'e.g', 'i.e', 'cf', 'fig',
    'al', 'approx', 'dept', 'univ', 'u.s', 'u.k', 'a.m', 'p.m', 'mt', 'ft', 'inc', 'co', 'ltd', 'gen', 'gov',
    'sen', 'rep', 'rev', 'vol', 'pp', 'ch', 'sec']);
  const ENDERS = '.!?…';
  const CLOSERS = '"\'”’)]';
  const LIST_MARKER = /^\s*(?:\d+[.)]|[-*•])\s+/;

  function splitSegment(seg) {
    const out = [];
    const len = seg.length;
    const marker = seg.match(LIST_MARKER);
    let start = 0;
    for (let i = marker ? marker[0].length : 0; i < len; i++) {
      const ch = seg[i];
      if (!ENDERS.includes(ch)) continue;
      let j = i + 1;
      while (j < len && ENDERS.includes(seg[j])) j++;
      while (j < len && CLOSERS.includes(seg[j])) j++;
      if (j >= len) { out.push([start, j]); start = j; break; }
      if (!/\s/.test(seg[j])) continue;
      let k = j;
      while (k < len && /\s/.test(seg[k])) k++;
      if (k >= len) { out.push([start, j]); start = k; break; }
      if (!/[\p{Lu}\p{N}"“‘'(\[]/u.test(seg[k])) continue;
      if (ch === '.' && j === i + 1) {
        const before = seg.slice(start, i).match(/([\p{L}.]+)$/u);
        const tok = before ? before[1] : '';
        if (ABBREV.has(tok.toLowerCase())) continue;
        if (/^\p{Lu}$/u.test(tok)) continue;            // an initial, as in "J. S. Mill"
      }
      out.push([start, j]);
      start = k;
      i = k - 1;
    }
    if (start < len && seg.slice(start).trim()) out.push([start, len]);
    return out;
  }

  // Returns [{n, id: 'S1', text, para, start, end}]. Blank lines separate
  // paragraphs; a line starting with a list marker starts a new sentence;
  // other line breaks are treated as spaces.
  function splitSentences(text) {
    const src = String(text || '').replace(/\r\n?/g, '\n');
    const segments = [];
    let pos = 0, para = 0, inPara = false, cur = null;
    for (const line of src.split('\n')) {
      const ln = { start: pos, end: pos + line.length };
      pos += line.length + 1;
      if (!line.trim()) { if (cur) segments.push(cur); cur = null; inPara = false; continue; }
      if (!inPara) { para++; inPara = true; }
      if (!cur || LIST_MARKER.test(line)) { if (cur) segments.push(cur); cur = { start: ln.start, end: ln.end, para }; }
      else cur.end = ln.end;
    }
    if (cur) segments.push(cur);
    const out = [];
    for (const seg of segments) {
      for (const [a, b] of splitSegment(src.slice(seg.start, seg.end))) {
        const raw = src.slice(seg.start + a, seg.start + b);
        const t = raw.trim();
        if (!t) continue;
        const s0 = seg.start + a + (raw.length - raw.trimStart().length);
        out.push({ n: out.length + 1, id: 'S' + (out.length + 1), text: t.replace(/\s+/g, ' '), para: seg.para, start: s0, end: s0 + t.length });
      }
    }
    return out;
  }

  function sentenceRef(ns) { return (ns || []).map((n) => 'S' + n).join(', '); }

  // ---------------------------------------------------------------- indicator words (Chapter 1, §1.3)
  const INDICATORS = [
    { phrase: 'it follows that', role: 'conclusion' },
    { phrase: 'which means that', role: 'conclusion' },
    { phrase: 'therefore', role: 'conclusion' },
    { phrase: 'thus', role: 'conclusion' },
    { phrase: 'hence', role: 'conclusion' },
    { phrase: 'consequently', role: 'conclusion' },
    { phrase: 'so', role: 'conclusion', check: 'So is an indicator only when it is used inferentially.' },
    { phrase: 'given that', role: 'premise' },
    { phrase: 'the reason being', role: 'premise' },
    { phrase: 'because', role: 'premise', check: 'Because can introduce a causal explanation rather than a premise. As a premise indicator it also points to the conclusion.' },
    { phrase: 'since', role: 'premise', check: 'Since can be about time rather than reasons.' },
    { phrase: 'for', role: 'premise', check: 'For is an indicator only when it is used inferentially.' },
    { phrase: 'as', role: 'premise', check: 'As is an indicator only when it gives a reason.' },
  ];
  // Phrases containing an indicator word that are not doing inferential work.
  const NOT_INDICATORS = ['for example', 'for instance', 'as well as', 'such as', 'as if', 'as though', 'so that',
    'so far', 'so-called', 'even so', 'and so on', 'as soon as', 'as long as', 'as much as', 'as many as',
    'as a result of', 'since then', 'ever since', 'or so', 'so much', 'so many', 'not so'];
  const phraseRe = (p) => new RegExp('(?<![\\p{L}\\p{N}])' + p.replace(/ /g, '\\s+') + '(?![\\p{L}\\p{N}])', 'giu');

  function findIndicators(sentences) {
    const hits = [];
    for (const s of sentences) {
      const blocked = [];
      for (const p of NOT_INDICATORS) for (const m of s.text.matchAll(phraseRe(p))) blocked.push([m.index, m.index + m[0].length]);
      // "since 2019", "since last year": time, not reasons
      for (const m of s.text.matchAll(/(?<![\p{L}])since\s+(?:\d|last|the\s+\d|early|late)/giu)) blocked.push([m.index, m.index + 5]);
      const taken = [];
      for (const ind of INDICATORS) {
        for (const m of s.text.matchAll(phraseRe(ind.phrase))) {
          const a = m.index, b = a + m[0].length;
          if (blocked.some(([x, y]) => a >= x && b <= y)) continue;
          if (taken.some(([x, y]) => a < y && b > x)) continue;
          taken.push([a, b]);
          hits.push({ sentence: s.n, phrase: ind.phrase, role: ind.role, check: ind.check || null, index: a });
        }
      }
    }
    return hits.sort((x, y) => x.sentence - y.sentence || x.index - y.index);
  }

  // ---------------------------------------------------------------- sentence variety
  const SUBORDINATORS = new Set(['although', 'though', 'because', 'since', 'when', 'whenever', 'while', 'if', 'unless',
    'after', 'before', 'once', 'until', 'whereas', 'despite', 'even', 'as', 'whether', 'wherever']);
  const TRANSITIONS = new Set(['however', 'therefore', 'thus', 'hence', 'moreover', 'furthermore', 'first', 'second',
    'third', 'finally', 'next', 'then', 'also', 'consequently', 'nevertheless', 'nonetheless', 'still', 'instead',
    'similarly', 'likewise', 'meanwhile', 'indeed', 'overall', 'ultimately', 'so', 'yet', 'but', 'and',
    'in addition', 'for example', 'for instance', 'in contrast', 'on the other hand', 'as a result', 'in short',
    'of course', 'in fact', 'after all', 'by contrast', 'to be sure']);

  // A rough stand-in for sentence structure: does the sentence open with a
  // transition, a subordinate clause, or neither ("plain")?
  function openingKind(text) {
    const w = words(text).map((x) => x.toLowerCase());
    if (!w.length) return 'plain';
    for (const k of [4, 3, 2]) if (TRANSITIONS.has(w.slice(0, k).join(' '))) return 'transition';
    if (SUBORDINATORS.has(w[0])) return 'subordinate';
    if (TRANSITIONS.has(w[0])) return 'transition';
    return 'plain';
  }

  function sentenceVariety(sentences) {
    const lengths = sentences.map((s) => wordCount(s.text));
    const n = lengths.length;
    const mean = n ? lengths.reduce((a, b) => a + b, 0) / n : 0;
    const sd = n > 1 ? Math.sqrt(lengths.reduce((a, x) => a + (x - mean) * (x - mean), 0) / (n - 1)) : 0;
    const sameLengthRuns = [];
    for (let i = 0; i < n;) {
      let j = i, lo = lengths[i], hi = lengths[i];
      while (j + 1 < n && Math.max(hi, lengths[j + 1]) - Math.min(lo, lengths[j + 1]) <= LIMITS.similarLengthBand) {
        j++; lo = Math.min(lo, lengths[j]); hi = Math.max(hi, lengths[j]);
      }
      if (j - i + 1 >= LIMITS.similarLengthRun) { sameLengthRuns.push(sentences.slice(i, j + 1).map((s) => s.n)); i = j + 1; }
      else i++;
    }
    const openers = new Map();
    for (const s of sentences) {
      const w = (words(s.text)[0] || '').toLowerCase();
      if (!w) continue;
      if (!openers.has(w)) openers.set(w, []);
      openers.get(w).push(s.n);
    }
    const repeatedOpenings = [...openers.entries()]
      .filter(([, ns]) => ns.length >= LIMITS.repeatedOpening)
      .map(([word, ns]) => ({ word, sentences: ns }))
      .sort((a, b) => b.sentences.length - a.sentences.length || a.word.localeCompare(b.word));
    const openingKinds = { plain: 0, subordinate: 0, transition: 0 };
    for (const s of sentences) openingKinds[openingKind(s.text)]++;
    return { lengths, mean: round(mean, 1), sd: round(sd, 1), sameLengthRuns, repeatedOpenings, openingKinds };
  }

  // The free checks run on every save of a draft.
  function draftChecks(text) {
    const sentences = splitSentences(text);
    const indicators = findIndicators(sentences);
    const paragraphs = sentences.length ? sentences[sentences.length - 1].para : 0;
    const withIndicator = new Set(indicators.map((h) => sentences[h.sentence - 1].para));
    const paragraphsWithoutIndicators = [];
    for (let p = 1; p <= paragraphs; p++) if (!withIndicator.has(p)) paragraphsWithoutIndicators.push(p);
    const total = wordCount(text);
    return {
      words: total,
      overLimit: total > LIMITS.maxEssayWords,
      paragraphs,
      sentences,
      indicators,
      paragraphsWithoutIndicators,
      longSentences: sentences.filter((s) => wordCount(s.text) > LIMITS.longSentenceWords).map((s) => ({ sentence: s.n, words: wordCount(s.text) })),
      variety: sentenceVariety(sentences),
    };
  }

  // ---------------------------------------------------------------- reconstructions
  // Shape (student's and reader's alike; sentence numbers are 1-based):
  // { conclusion: {text, sentences:[n]},
  //   premises: [{id:'P1', text, sentences:[n], implicit:false}],
  //   subconclusions: [{id:'C1', text, sentences:[n]}],
  //   support: [{target:'C' | 'C1', from:['P1','P2'], type:'dependent' | 'independent'}],
  //   kind: 'deductive' | 'inductive' | 'mixed',
  //   background: [n], unclear: [n] }
  // A conclusion with no sentences is an unstated conclusion.
  const KINDS = ['deductive', 'inductive', 'mixed'];
  const SUPPORT_TYPES = ['dependent', 'independent'];

  function normalizeReconstruction(rec) {
    const r = rec || {};
    return {
      conclusion: { text: String((r.conclusion && r.conclusion.text) || '').trim(), sentences: (r.conclusion && r.conclusion.sentences) || [] },
      premises: (r.premises || []).map((p) => ({ id: p.id, text: String(p.text || '').trim(), sentences: p.sentences || [], implicit: !!p.implicit })),
      subconclusions: (r.subconclusions || []).map((c) => ({ id: c.id, text: String(c.text || '').trim(), sentences: c.sentences || [] })),
      support: (r.support || []).map((g) => ({ target: g.target, from: g.from || [], type: g.type })),
      kind: r.kind,
      background: r.background || [],
      unclear: r.unclear || [],
    };
  }

  function validateReconstruction(rec, nSentences) {
    const errors = [], warnings = [];
    if (!rec || typeof rec !== 'object') return { ok: false, errors: ['The reconstruction is missing.'], warnings };
    const r = normalizeReconstruction(rec);
    const refs = (arr, where) => {
      if (!Array.isArray(arr)) { errors.push(where + ': the sentence list is not a list.'); return; }
      for (const n of arr) if (!Number.isInteger(n) || n < 1 || n > nSentences) errors.push(where + ': there is no sentence ' + n + '.');
    };
    if (!r.conclusion.text) errors.push('The conclusion is missing.');
    refs(r.conclusion.sentences, 'Conclusion');
    const ids = new Set();
    r.premises.forEach((p, i) => {
      const where = p.id || 'Premise ' + (i + 1);
      if (!/^P\d+$/.test(p.id || '')) errors.push(where + ': premise labels are P1, P2, ….');
      if (ids.has(p.id)) errors.push(where + ': this label is used twice.');
      ids.add(p.id);
      if (!p.text) errors.push(where + ': the premise has no text.');
      refs(p.sentences, where);
      if (!p.implicit && Array.isArray(p.sentences) && !p.sentences.length) errors.push(where + ': link it to a sentence, or mark it implicit.');
    });
    r.subconclusions.forEach((c, i) => {
      const where = c.id || 'Sub-conclusion ' + (i + 1);
      if (!/^C\d+$/.test(c.id || '')) errors.push(where + ': sub-conclusion labels are C1, C2, ….');
      if (ids.has(c.id)) errors.push(where + ': this label is used twice.');
      ids.add(c.id);
      if (!c.text) errors.push(where + ': the sub-conclusion has no text.');
      refs(c.sentences, where);
    });
    if (!r.premises.length) errors.push('There are no premises.');
    const used = new Set(), supported = new Set();
    r.support.forEach((g, i) => {
      const where = 'Support ' + (i + 1);
      if (g.target !== 'C' && !r.subconclusions.some((c) => c.id === g.target)) errors.push(where + ': it supports “' + g.target + '”, which is not C or a sub-conclusion.');
      if (!SUPPORT_TYPES.includes(g.type)) errors.push(where + ': the type must be dependent or independent.');
      if (!Array.isArray(g.from) || !g.from.length) errors.push(where + ': it lists no premises.');
      for (const id of g.from || []) {
        if (!ids.has(id)) errors.push(where + ': there is no ' + id + '.');
        if (id === g.target) errors.push(where + ': ' + id + ' cannot support itself.');
        used.add(id);
      }
      if (g.type === 'dependent' && (g.from || []).length < 2) errors.push(where + ': dependent support needs at least two premises working together.');
      supported.add(g.target);
    });
    if (!KINDS.includes(r.kind)) errors.push('Choose deductive, inductive, or mixed.');
    refs(r.background, 'Background');
    refs(r.unclear, 'Unclear');
    if (r.support.length) {
      for (const p of r.premises) if (!used.has(p.id)) warnings.push(p.id + ' does not support anything yet.');
      for (const c of r.subconclusions) {
        if (!used.has(c.id)) warnings.push(c.id + ' does not support anything yet.');
        if (!supported.has(c.id)) warnings.push('Nothing supports ' + c.id + ' yet.');
      }
      if (!supported.has('C')) warnings.push('Nothing supports the conclusion yet.');
    } else if (r.premises.length) warnings.push('Say which premises support what, and whether the support is dependent or independent.');
    for (const n of r.conclusion.sentences) {
      if (r.premises.some((p) => p.sentences.includes(n))) warnings.push('S' + n + ' is marked as both the conclusion and a premise.');
    }
    return { ok: errors.length === 0, errors, warnings };
  }

  const ROLE_RANK = { conclusion: 6, subconclusion: 5, premise: 4, background: 3, unclear: 2, unused: 1 };
  const ARGUMENT_ROLES = ['premise', 'subconclusion'];
  const NON_ARGUMENT_ROLES = ['background', 'unclear', 'unused'];

  // Each sentence's role in a reconstruction. A sentence listed in several
  // places takes the strongest role (conclusion > sub-conclusion > premise > …).
  function sentenceRoles(rec, nSentences) {
    const r = normalizeReconstruction(rec);
    const roles = {};
    for (let i = 1; i <= nSentences; i++) roles[i] = 'unused';
    const set = (ns, role) => { for (const n of ns) if (roles[n] && ROLE_RANK[role] > ROLE_RANK[roles[n]]) roles[n] = role; };
    set(r.unclear, 'unclear');
    set(r.background, 'background');
    for (const p of r.premises) set(p.sentences, 'premise');
    for (const c of r.subconclusions) set(c.sentences, 'subconclusion');
    set(r.conclusion.sentences, 'conclusion');
    return roles;
  }

  function supportTypeOf(rec, n) {
    const r = normalizeReconstruction(rec);
    const ids = r.premises.concat(r.subconclusions).filter((x) => x.sentences.includes(n)).map((x) => x.id);
    const g = r.support.find((x) => x.from.some((id) => ids.includes(id)));
    return g ? g.type : null;
  }

  // The side-by-side comparison of the student's and the reader's readings.
  function compareReconstructions(student, reader, nSentences) {
    const a = normalizeReconstruction(student), b = normalizeReconstruction(reader);
    const ra = sentenceRoles(a, nSentences), rb = sentenceRoles(b, nSentences);
    const rows = [];
    for (let i = 1; i <= nSentences; i++) rows.push({ sentence: i, student: ra[i], reader: rb[i], agree: ra[i] === rb[i] });

    const sa = a.conclusion.sentences.slice().sort((x, y) => x - y), sb = b.conclusion.sentences.slice().sort((x, y) => x - y);
    let match;
    if (!sa.length && !sb.length) match = 'both-unstated';
    else if (!sa.length || !sb.length) match = 'one-unstated';
    else if (sa.length === sb.length && sa.every((x, i) => x === sb[i])) match = 'same';
    else if (sa.some((x) => sb.includes(x))) match = 'overlap';
    else match = 'different';

    const findings = [];
    if (match === 'different' || match === 'one-unstated') findings.push({ type: 'conclusion_differs', student: sa, reader: sb });
    for (const row of rows) {
      if (row.agree) continue;
      const st = row.student, rd = row.reader;
      if (st === 'conclusion' || rd === 'conclusion') continue;   // covered by the conclusion finding
      if (ARGUMENT_ROLES.includes(st) && NON_ARGUMENT_ROLES.includes(rd)) findings.push({ type: 'premise_read_as_background', sentence: row.sentence, student: st, reader: rd });
      else if (ARGUMENT_ROLES.includes(rd) && NON_ARGUMENT_ROLES.includes(st)) findings.push({ type: 'reader_premise_you_left_out', sentence: row.sentence, student: st, reader: rd });
      else if (ARGUMENT_ROLES.includes(st) && ARGUMENT_ROLES.includes(rd)) findings.push({ type: 'layer_differs', sentence: row.sentence, student: st, reader: rd });
    }
    const ia = a.premises.filter((p) => p.implicit).map((p) => p.text);
    const ib = b.premises.filter((p) => p.implicit).map((p) => p.text);
    if (ia.length && !ib.length) findings.push({ type: 'implicit_only_student', student: ia });
    else if (ib.length && !ia.length) findings.push({ type: 'implicit_only_reader', reader: ib });
    else if (ia.length && ib.length) findings.push({ type: 'implicit_compare', student: ia, reader: ib });
    for (const row of rows) {
      if (!ARGUMENT_ROLES.includes(row.student) || !ARGUMENT_ROLES.includes(row.reader)) continue;
      const ta = supportTypeOf(a, row.sentence), tb = supportTypeOf(b, row.sentence);
      if (ta && tb && ta !== tb) findings.push({ type: 'support_type_differs', sentence: row.sentence, student: ta, reader: tb });
    }
    if (a.kind && b.kind && a.kind !== b.kind) findings.push({ type: 'kind_differs', student: a.kind, reader: b.kind });
    return { conclusion: { student: sa, reader: sb, match }, rows, findings };
  }

  const ROLE_WORDS = { conclusion: 'the conclusion', subconclusion: 'a sub-conclusion', premise: 'a premise', background: 'background', unclear: 'unclear', unused: 'not part of the argument' };

  // Adds a final period unless the text already ends with one (inside a closing quote or not).
  const endSentence = (t) => (/[.!?…]["”’)]*$/.test(t) ? t : t + '.');

  function describeFinding(f) {
    const q = (xs) => xs.map((x) => '“' + x + '”').join('; ');
    switch (f.type) {
      case 'conclusion_differs':
        return 'Conclusion: you located it in ' + (f.student.length ? sentenceRef(f.student) : 'no sentence (unstated)') +
          '; the reader located it in ' + (f.reader.length ? sentenceRef(f.reader) : 'no sentence (unstated)') + '.';
      case 'premise_read_as_background':
        return 'S' + f.sentence + ': you treated it as ' + ROLE_WORDS[f.student] + '; the reader read it as ' + ROLE_WORDS[f.reader] + '.';
      case 'reader_premise_you_left_out':
        return 'S' + f.sentence + ': the reader treated it as ' + ROLE_WORDS[f.reader] + '; your reconstruction has it as ' + ROLE_WORDS[f.student] + '.';
      case 'layer_differs':
        return 'S' + f.sentence + ': you treated it as ' + ROLE_WORDS[f.student] + '; the reader treated it as ' + ROLE_WORDS[f.reader] + '.';
      case 'implicit_only_student':
        return endSentence('You supplied an implicit premise the reader did not: ' + q(f.student));
      case 'implicit_only_reader':
        return endSentence('The reader supplied an implicit premise you did not: ' + q(f.reader));
      case 'implicit_compare':
        return endSentence(endSentence('You both supplied implicit premises. Yours: ' + q(f.student)) + ' The reader’s: ' + q(f.reader));
      case 'support_type_differs':
        return 'S' + f.sentence + ': you treated its support as ' + f.student + '; the reader treated it as ' + f.reader + '.';
      case 'kind_differs':
        return 'You read the argument as ' + f.student + '; the reader read it as ' + f.reader + '.';
      default:
        return f.type;
    }
  }

  // Standard form in the book's style (§1.3, §2.3):
  //   P1: Main Street has had twelve crashes. [S2]
  //   P2: What worked nearby would work here. (implicit)
  //   C1: The lane would make the street safer. [S6] (from P1 and P2, which are dependent)
  //   C: The town should build the lane. [S1] (from C1)
  //   Kind: inductive
  //   Background: S4
  // [S…] gives the essay sentences; a line with none is implicit.
  const joinIds = (ids) => ids.length < 2 ? ids.join('') : ids.length === 2 ? ids.join(' and ') : ids.slice(0, -1).join(', ') + ', and ' + ids[ids.length - 1];

  function formatReconstruction(rec) {
    const r = normalizeReconstruction(rec);
    const groups = (id) => r.support.filter((g) => g.target === id).map((g) => {
      if (g.from.length < 2) return joinIds(g.from);
      return joinIds(g.from) + (g.type === 'dependent' ? ', which are dependent' : g.type === 'independent' ? ' independently' : '');
    });
    const line = (label, text, ns, implicit, from) => {
      const notes = [];
      if (implicit) notes.push('implicit');
      if (from && from.length) notes.push('from ' + from.join('; '));
      return label + ': ' + text + (ns.length ? ' [' + sentenceRef(ns) + ']' : '') + (notes.length ? ' (' + notes.join(', ') + ')' : '');
    };
    const lines = [];
    for (const p of r.premises) lines.push(line(p.id, p.text, p.sentences, p.implicit || !p.sentences.length));
    for (const c of r.subconclusions) lines.push(line(c.id, c.text, c.sentences, !c.sentences.length, groups(c.id)));
    lines.push(line('C', r.conclusion.text, r.conclusion.sentences, !r.conclusion.sentences.length, groups('C')));
    if (r.kind) lines.push('Kind: ' + r.kind);
    if (r.background.length) lines.push('Background: ' + sentenceRef(r.background));
    if (r.unclear.length) lines.push('Unclear: ' + sentenceRef(r.unclear));
    return lines.join('\n');
  }

  const refsIn = (s) => (String(s).match(/\d+/g) || []).map(Number);

  function parseStandardForm(text) {
    const rec = { conclusion: { text: '', sentences: [] }, premises: [], subconclusions: [], support: [], kind: undefined, background: [], unclear: [] };
    const errors = [];
    let sawC = false;
    String(text || '').replace(/\r\n?/g, '\n').split('\n').forEach((raw, i) => {
      const lineNo = 'Line ' + (i + 1);
      const ln = raw.trim();
      if (!ln || ln.startsWith('#')) return;
      let m;
      if ((m = ln.match(/^kind\s*:\s*(\w+)\.?$/i))) {
        const k = m[1].toLowerCase();
        if (KINDS.includes(k)) rec.kind = k; else errors.push(lineNo + ': the kind is deductive, inductive, or mixed.');
        return;
      }
      if ((m = ln.match(/^(background|unclear)\s*:\s*(.*)$/i))) { rec[m[1].toLowerCase()] = refsIn(m[2]); return; }
      m = ln.match(/^(P\d+|C\d+|C)\s*[:.]\s*(.*)$/i);
      if (!m) { errors.push(lineNo + ': start the line with P1:, C1:, C:, Kind:, Background:, or Unclear:.'); return; }
      const label = m[1].toUpperCase();
      let rest = m[2];
      let sentences = [], implicit = false, fromNote = null, x;
      for (;;) {
        if ((x = rest.match(/\[([^\]]*)\]\s*$/))) { sentences = sentences.concat(refsIn(x[1])); rest = rest.slice(0, x.index).trim(); continue; }
        if ((x = rest.match(/\(([^()]*)\)\s*$/)) && /\b(implicit|not stated|from)\b/i.test(x[1])) {
          if (/\b(implicit|not stated)\b/i.test(x[1])) implicit = true;
          const f = x[1].match(/\bfrom\b([\s\S]*)$/i);
          if (f) fromNote = f[1];
          rest = rest.slice(0, x.index).trim();
          continue;
        }
        break;
      }
      const textPart = rest.replace(/[\s,]+$/, '').trim();
      if (fromNote !== null) {
        if (label[0] === 'P') errors.push(lineNo + ': ' + label + ' is a premise, so it does not follow from anything. Label it C1, C2, … if it is a sub-conclusion.');
        else {
          for (const seg of fromNote.split(';')) {
            const ids = (seg.match(/\b[PC]\d+\b/gi) || []).map((s) => s.toUpperCase());
            if (!ids.length) continue;
            let type = /independent/i.test(seg) ? 'independent' : /dependent/i.test(seg) ? 'dependent' : ids.length === 1 ? 'independent' : null;
            if (!type) { errors.push(lineNo + ': say whether ' + joinIds(ids) + ' are dependent or independent.'); type = 'independent'; }
            rec.support.push({ target: label, from: ids, type });
          }
        }
      }
      if (label === 'C') {
        if (sawC) errors.push(lineNo + ': there is already a C line.');
        sawC = true;
        rec.conclusion = { text: textPart, sentences };
      } else if (label[0] === 'P') rec.premises.push({ id: label, text: textPart, sentences, implicit });
      else rec.subconclusions.push({ id: label, text: textPart, sentences });
    });
    if (!sawC) errors.push('Add a line for the conclusion, starting C:.');
    return { ok: errors.length === 0, rec, errors };
  }


  // ---------------------------------------------------------------- concept scope
  const SCOPE_PRESETS = [
    { id: 'part1', label: 'Part I (Chapters 1–5)', chapters: [1, 2, 3, 4, 5] },
    { id: 'part1-ch13', label: 'Part I and Chapter 13 (Inductive Reasoning)', chapters: [1, 2, 3, 4, 5, 13] },
    { id: 'part1-part4', label: 'Part I and Part IV (Chapters 13–15)', chapters: [1, 2, 3, 4, 5, 13, 14, 15] },
    { id: 'whole-book', label: 'Whole book', chapters: 'all' },
  ];

  // Concepts the model may name. The writing-chapter terms are always in
  // scope. A term defined in more than one chapter is kept once, from the
  // latest chapter in scope.
  function conceptsInScope(concepts, presetId, opts) {
    const o = opts || {};
    const preset = SCOPE_PRESETS.find((p) => p.id === presetId);
    if (!preset) throw new Error('Unknown scope: ' + presetId);
    const chapterOf = (c) => (c.chapter === 'writing' ? Infinity : c.chapter);
    const inScope = concepts.filter((c) => (c.chapter === 'writing' || preset.chapters === 'all' || preset.chapters.includes(c.chapter)) &&
      (o.fallacies !== false || c.family !== 'fallacies'));
    const best = new Map();
    for (const c of inScope) {
      const key = norm(c.title);
      if (!best.has(key) || chapterOf(c) >= chapterOf(best.get(key))) best.set(key, c);
    }
    const keep = new Set([...best.values()].map((c) => c.id));
    return inScope.filter((c) => keep.has(c.id));
  }

  // ---------------------------------------------------------------- focus: the prompt's chapter sets the concepts
  // focus is a chapter number (1–15) or 'writing'. The concepts are that
  // chapter's terms, the structure terms (family 'writing'), and the core
  // (concepts marked core in concept-settings.json). A title defined in more
  // than one place is kept once: the focus chapter's version, else the
  // structure term, else the core term.
  function conceptsForFocus(concepts, focus) {
    const isChapter = Number.isInteger(focus) && concepts.some((c) => c.chapter === focus);
    if (!isChapter && focus !== 'writing') throw new Error('Unknown focus: ' + focus);
    const rank = (c) => (c.chapter === focus ? 3 : c.family === 'writing' ? 2 : 1);
    const pool = concepts.filter((c) => c.chapter === focus || c.family === 'writing' || c.core);
    const best = new Map();
    for (const c of pool) {
      const key = norm(c.title);
      if (!best.has(key) || rank(c) > rank(best.get(key))) best.set(key, c);
    }
    const keep = new Set([...best.values()].map((c) => c.id));
    return pool.filter((c) => keep.has(c.id));
  }

  // ---------------------------------------------------------------- the student's stated conclusion
  const STATED = { conclusionMinWords: 3, conclusionMaxWords: 60, reasons: 5, reasonMaxWords: 40 };
  function validateStated(stated) {
    const s = stated || {};
    const conclusion = String(s.conclusion || '').trim().replace(/\s+/g, ' ');
    const reasons = (Array.isArray(s.reasons) ? s.reasons : String(s.reasons || '').split('\n'))
      .map((r) => String(r).trim().replace(/^[-*•\d.)\s]+/, '').trim()).filter(Boolean);
    const errors = [];
    if (wordCount(conclusion) < STATED.conclusionMinWords) errors.push('Write your conclusion as a full sentence.');
    if (wordCount(conclusion) > STATED.conclusionMaxWords) errors.push('Keep your conclusion to one sentence of at most ' + STATED.conclusionMaxWords + ' words.');
    if (reasons.length > STATED.reasons) errors.push('List at most ' + STATED.reasons + ' main reasons.');
    reasons.forEach((r, i) => { if (wordCount(r) > STATED.reasonMaxWords) errors.push('Reason ' + (i + 1) + ' is longer than ' + STATED.reasonMaxWords + ' words; a phrase is enough.'); });
    return { ok: errors.length === 0, errors, value: { conclusion, reasons } };
  }

  // ---------------------------------------------------------------- checking the reader's reading
  const AUDIT_MARKS = ['meant', 'not-meant', 'unsure'];
  const AUDIT_WORDS = { meant: 'That’s what I meant', 'not-meant': 'Not what I meant', unsure: 'Not sure' };
  const AUDIT = { noteMinWords: 3, noteMaxWords: 60, missingMaxWords: 100 };

  // The lines of a reconstruction in the order the student checks them:
  // the conclusion, then sub-conclusions, then premises.
  function readingLines(rec) {
    const r = normalizeReconstruction(rec);
    const supportOf = (id) => r.support.filter((g) => g.target === id).map((g) =>
      g.from.length < 2 ? joinIds(g.from) : joinIds(g.from) + (g.type === 'dependent' ? ', working together' : ', each on its own'));
    const lines = [{ label: 'C', role: 'conclusion', text: r.conclusion.text, sentences: r.conclusion.sentences, implicit: !r.conclusion.sentences.length, supportedBy: supportOf('C') }];
    for (const c of r.subconclusions) lines.push({ label: c.id, role: 'subconclusion', text: c.text, sentences: c.sentences, implicit: !c.sentences.length, supportedBy: supportOf(c.id) });
    for (const p of r.premises) lines.push({ label: p.id, role: 'premise', text: p.text, sentences: p.sentences, implicit: p.implicit || !p.sentences.length, supportedBy: [] });
    return lines;
  }

  // audit: { marks: { C: {mark, note}, P1: {...} }, missing: '' }
  function validateAudit(audit, rec) {
    const a = audit || {};
    const marks = a.marks || {};
    const errors = [];
    for (const ln of readingLines(rec)) {
      const m = marks[ln.label];
      if (!m || !AUDIT_MARKS.includes(m.mark)) { errors.push(ln.label + ': mark it as what you meant, not what you meant, or not sure.'); continue; }
      if (m.mark === 'not-meant' && wordCount(m.note) < AUDIT.noteMinWords) errors.push(ln.label + ': say what you did mean.');
      if (wordCount(m.note) > AUDIT.noteMaxWords) errors.push(ln.label + ': keep the note to ' + AUDIT.noteMaxWords + ' words.');
    }
    if (wordCount(a.missing) > AUDIT.missingMaxWords) errors.push('Keep “what the reader missed” to ' + AUDIT.missingMaxWords + ' words.');
    return { ok: errors.length === 0, errors };
  }

  // The reading with the student's marks, as text (for the record and the model).
  function formatReading(rec, audit) {
    const marks = (audit && audit.marks) || {};
    const out = [];
    for (const ln of readingLines(rec)) {
      const m = marks[ln.label];
      let s = ln.label + ': ' + ln.text + (ln.sentences.length ? ' [' + sentenceRef(ln.sentences) + ']' : '') + (ln.implicit ? ' (implicit)' : '') +
        (ln.supportedBy.length ? ' (from ' + ln.supportedBy.join('; ') + ')' : '');
      if (m && m.mark) s += '\n   Student: ' + AUDIT_WORDS[m.mark] + (String(m.note || '').trim() ? ' — ' + String(m.note).trim() : '');
      out.push(s);
    }
    const r = normalizeReconstruction(rec);
    if (r.kind) out.push('Kind: ' + r.kind);
    if (r.background.length) out.push('Background: ' + sentenceRef(r.background));
    if (audit && String(audit.missing || '').trim()) out.push('What the student says the reader missed: ' + String(audit.missing).trim());
    return out.join('\n');
  }

  // ---------------------------------------------------------------- checking the model's replies
  function longestSharedRun(a, b) {
    const x = words(a).map((w) => w.toLowerCase()), y = words(b).map((w) => w.toLowerCase());
    let best = 0;
    let prev = new Array(y.length + 1).fill(0);
    for (let i = 1; i <= x.length; i++) {
      const cur = new Array(y.length + 1).fill(0);
      for (let j = 1; j <= y.length; j++) {
        if (x[i - 1] === y[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > best) best = cur[j]; }
      }
      prev = cur;
    }
    return best;
  }

  // Quoted passages in the model's text must come from the essay or from a
  // definition in scope; anything else suggests the model is writing for the student.
  function unsourcedQuotes(texts, essay, concepts) {
    const sources = [norm(essay)].concat((concepts || []).map((c) => norm(c.title + ' ' + c.definition)));
    const bad = [];
    for (const t of texts) {
      for (const m of String(t || '').matchAll(/["“]([^"”]+)["”]/g)) {
        if (wordCount(m[1]) <= LIMITS.quoteExemptWords) continue;
        const q = norm(m[1]);
        if (!sources.some((s) => s.includes(q))) bad.push(m[1]);
      }
    }
    return bad;
  }

  function checkRefs(arr, nSentences, where, errs, needOne) {
    if (!Array.isArray(arr)) { errs.push(where + ': sentences must be a list.'); return; }
    if (needOne && !arr.length) errs.push(where + ': it names no sentence.');
    for (const n of arr) if (!Number.isInteger(n) || n < 1 || n > nSentences) errs.push(where + ': there is no sentence ' + n + '.');
  }

  const endsWithQuestionMark = (t) => /\?["”’)]*$/.test(t);

  // ctx: { nSentences, concepts (in scope), essay }
  function validateDiagnosis(diag, ctx) {
    const errors = [];
    const itemErrors = [];
    const byId = new Map((ctx.concepts || []).map((c) => [c.id, c]));
    if (!diag || typeof diag !== 'object' || !Array.isArray(diag.items)) {
      return { ok: false, errors: ['The reply has no list of items.'], itemErrors, strengthErrors: [] };
    }
    if (diag.items.length > LIMITS.items) errors.push('The reply has ' + diag.items.length + ' items; the limit is ' + LIMITS.items + '.');
    diag.items.forEach((it, i) => {
      const errs = [];
      const where = 'Item ' + (i + 1);
      const c = byId.get(it && it.concept);
      if (!c) errs.push(where + ': “' + (it && it.concept) + '” is not a concept in scope.');
      checkRefs(it && it.sentences, ctx.nSentences, where, errs, true);
      const obs = String((it && it.observation) || '').trim(), q = String((it && it.question) || '').trim();
      if (!obs) errs.push(where + ': the observation is empty.');
      if (wordCount(obs) > LIMITS.observationWords + LIMITS.wordTolerance) errs.push(where + ': the observation is longer than ' + LIMITS.observationWords + ' words.');
      if (!q) errs.push(where + ': the question is empty.');
      else if (!endsWithQuestionMark(q)) errs.push(where + ': the question does not end with a question mark.');
      if (wordCount(q) > LIMITS.questionWords + LIMITS.wordTolerance) errs.push(where + ': the question is longer than ' + LIMITS.questionWords + ' words.');
      const ex = String((it && it.example) || '').trim();
      if (ex) {
        if (c && c.mode !== 'may-demonstrate') errs.push(where + ': ' + c.title + ' is a concept the helper only asks about; it gave an example.');
        if (wordCount(ex) > LIMITS.exampleWords + LIMITS.wordTolerance) errs.push(where + ': the example is longer than ' + LIMITS.exampleWords + ' words.');
        const run = longestSharedRun(ex, ctx.essay);
        if (run > LIMITS.exampleSharedRun) errs.push(where + ': the example repeats ' + run + ' consecutive words from the essay; examples must be on another topic.');
      }
      for (const bad of unsourcedQuotes([obs, q], ctx.essay, ctx.concepts)) errs.push(where + ': it quotes “' + bad + '”, which is not in the essay or the book.');
      itemErrors.push(errs);
    });
    const strengthErrors = [];
    const st = diag.strength;
    if (!st || typeof st !== 'object') strengthErrors.push('The reply names no strength.');
    else {
      if (!byId.get(st.concept)) strengthErrors.push('Strength: “' + st.concept + '” is not a concept in scope.');
      checkRefs(st.sentences, ctx.nSentences, 'Strength', strengthErrors, true);
      const obs = String(st.observation || '').trim();
      if (!obs) strengthErrors.push('Strength: the observation is empty.');
      if (wordCount(obs) > LIMITS.observationWords + LIMITS.wordTolerance) strengthErrors.push('Strength: the observation is longer than ' + LIMITS.observationWords + ' words.');
      for (const bad of unsourcedQuotes([obs], ctx.essay, ctx.concepts)) strengthErrors.push('Strength: it quotes “' + bad + '”, which is not in the essay or the book.');
    }
    const all = errors.concat(...itemErrors, strengthErrors);
    return { ok: all.length === 0, errors: all, itemErrors, strengthErrors };
  }

  const FOLLOWUP_STATUS = ['further-question', 'addressed'];
  function validateFollowup(reply, exchangesSoFar) {
    const errors = [];
    if (exchangesSoFar >= LIMITS.followupExchanges) errors.push('This item has reached its ' + LIMITS.followupExchanges + ' follow-up exchanges.');
    if (!reply || typeof reply !== 'object') return { ok: false, errors: errors.concat('The reply is missing.') };
    if (!FOLLOWUP_STATUS.includes(reply.status)) errors.push('The status must be further-question or addressed.');
    const t = String(reply.text || '').trim();
    if (!t) errors.push('The reply is empty.');
    if (wordCount(t) > LIMITS.followupWords + LIMITS.wordTolerance) errors.push('The reply is longer than ' + LIMITS.followupWords + ' words.');
    if (reply.status === 'further-question' && t && !endsWithQuestionMark(t)) errors.push('A further question must end with a question mark.');
    return { ok: errors.length === 0, errors };
  }

  // Reads JSON out of pasted text (copy mode): bare JSON, a ```json fence,
  // or the first balanced {...} block.
  function parseModelJSON(text) {
    const s = String(text || '').replace(/^\uFEFF/, '').trim();
    const attempts = [s];
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) attempts.push(fence[1].trim());
    const start = s.indexOf('{');
    if (start >= 0) {
      let depth = 0, inStr = false, esc = false;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) { attempts.push(s.slice(start, i + 1)); break; }
      }
    }
    for (const a of attempts) {
      try { const v = JSON.parse(a); if (v && typeof v === 'object') return { ok: true, value: v }; } catch (e) { /* try the next */ }
    }
    return { ok: false, error: 'No JSON object found in the reply.' };
  }

  // Reads the JSON payload out of a Messages API response (through the relay):
  // a text block holding JSON, or a tool_use block's input.
  function extractReply(message) {
    if (!message || !Array.isArray(message.content)) return { ok: false, error: 'The response has no content.' };
    if (message.stop_reason === 'max_tokens') return { ok: false, error: 'The reply was cut off before it finished.' };
    if (message.stop_reason === 'refusal') return { ok: false, error: 'The model declined to answer.' };
    const tool = message.content.find((b) => b.type === 'tool_use');
    if (tool && tool.input && typeof tool.input === 'object') return { ok: true, value: tool.input };
    const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return text ? parseModelJSON(text) : { ok: false, error: 'The response has no text.' };
  }

  // ---------------------------------------------------------------- the student's responses
  const RESPONSE_CHOICES = ['revise', 'disagree', 'unsure'];
  const RESPONSE_WORDS = { revise: 'Will revise', disagree: 'Disagree', unsure: 'Not sure' };

  function validateResponses(diag, responses) {
    const items = (diag && diag.items) || [];
    const errors = [];
    items.forEach((it, i) => {
      const r = (responses || [])[i];
      if (!r || !RESPONSE_CHOICES.includes(r.choice)) { errors.push('Item ' + (i + 1) + ': choose Will revise, Disagree, or Not sure.'); return; }
      if (r.choice === 'disagree' && wordCount(r.reason) < LIMITS.reasonMinWords) errors.push('Item ' + (i + 1) + ': say why you disagree.');
    });
    return { ok: errors.length === 0, errors };
  }

  // ---------------------------------------------------------------- comparing drafts
  function diffDrafts(oldText, newText) {
    const a = splitSentences(oldText), b = splitSentences(newText);
    const ka = a.map((s) => norm(s.text)), kb = b.map((s) => norm(s.text));
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
      L[i][j] = ka[i] === kb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
    const ops = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (ka[i] === kb[j]) { ops.push({ op: 'same', text: b[j].text, old: a[i].n, new: b[j].n }); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { ops.push({ op: 'removed', text: a[i].text, old: a[i].n }); i++; }
      else { ops.push({ op: 'added', text: b[j].text, new: b[j].n }); j++; }
    }
    while (i < a.length) { ops.push({ op: 'removed', text: a[i].text, old: a[i].n }); i++; }
    while (j < b.length) { ops.push({ op: 'added', text: b[j].text, new: b[j].n }); j++; }
    const count = (k) => ops.filter((o) => o.op === k).length;
    return { ops, same: count('same'), added: count('added'), removed: count('removed') };
  }

  // ---------------------------------------------------------------- the record and saved sessions
  // session: { prompt: {id?, text}, scope, model, modelLabel, via,
  //   drafts: [{ n, savedAt, text, studentRec, readerRec, diagnosis, responses,
  //              followups: [[{ answer, reply: {status, text} }]], feedbackAt }] }
  const APP_ID = 'umw-argument-feedback';
  const SESSION_VERSION = 1;
  const day = (iso) => String(iso || '').slice(0, 10);
  const stamp = (iso) => String(iso || '').slice(0, 16).replace('T', ' ');

  function buildRecord(session, concepts) {
    const byId = new Map((concepts || []).map((c) => [c.id, c]));
    const title = (id) => { const c = byId.get(id); return c ? c.title + (c.section ? ' (§' + c.section + ')' : '') : id; };
    const drafts = session.drafts || [];
    const out = ['ARGUMENT FEEDBACK RECORD', 'UMW Logic Textbook — Argument Feedback tool', ''];
    if (session.prompt && session.prompt.text) out.push('Prompt: ' + session.prompt.text);
    if (session.focusLabel) out.push('Focus: ' + session.focusLabel);
    if ((session.prompt && session.prompt.text) || session.focusLabel) out.push('');
    const fed = drafts.filter((d) => d.diagnosis);
    if (fed.length) {
      const dates = [...new Set(fed.map((d) => day(d.feedbackAt)).filter(Boolean))];
      out.push('AI use: Feedback on draft' + (fed.length > 1 ? 's ' : ' ') + fed.map((d) => d.n).join(', ') + ' came from ' +
        (session.modelLabel || session.model || 'a language model') + (session.model && session.modelLabel ? ' (' + session.model + ')' : '') +
        (session.via ? ' through ' + session.via : '') + (dates.length ? ', on ' + dates.join(', ') : '') +
        '. The helper was limited to questions about the argument and short examples on other topics.', '');
    } else out.push('AI use: none (no feedback was requested).', '');

    for (const d of drafts) {
      const sentences = splitSentences(d.text);
      out.push('=== Draft ' + d.n + (d.savedAt ? ' (saved ' + stamp(d.savedAt) + ')' : '') + ' — ' + wordCount(d.text) + ' words ===');
      for (const s of sentences) out.push('[' + s.id + '] ' + s.text);
      out.push('');
      if (d.stated && d.stated.conclusion) {
        out.push('My conclusion (stated before any feedback): ' + d.stated.conclusion);
        if ((d.stated.reasons || []).length) out.push('My main reasons:', ...d.stated.reasons.map((r) => '- ' + r));
        out.push('');
      }
      if (d.studentRec) out.push('My reconstruction', formatReconstruction(d.studentRec), '');
      if (d.readerRec && !d.studentRec) out.push('The reader’s reading, with my marks', formatReading(d.readerRec, d.audit), '');
      else if (d.readerRec) out.push('Reader’s reconstruction', formatReconstruction(d.readerRec), '');
      if (d.studentRec && d.readerRec) {
        const cmp = compareReconstructions(d.studentRec, d.readerRec, sentences.length);
        out.push('Where the readings differ');
        if (!cmp.findings.length) out.push('- They agree.');
        for (const f of cmp.findings) out.push('- ' + describeFinding(f));
        out.push('');
      }
      if (d.diagnosis) {
        out.push('Feedback');
        (d.diagnosis.items || []).forEach((it, i) => {
          out.push((i + 1) + '. ' + title(it.concept) + ' — ' + sentenceRef(it.sentences));
          out.push('   Observation: ' + it.observation);
          out.push('   Question: ' + it.question);
          if (it.example) out.push('   Example (another topic): ' + it.example);
          const r = (d.responses || [])[i];
          if (r) out.push('   My response: ' + RESPONSE_WORDS[r.choice] + (r.reason ? ' — ' + r.reason : ''));
          const fu = (d.followups || [])[i] || [];
          for (const x of fu) {
            out.push('   Me: ' + x.answer);
            if (x.reply) out.push('   Helper: ' + x.reply.text);
          }
        });
        const st = d.diagnosis.strength;
        if (st) out.push('Strength noted: ' + title(st.concept) + ' — ' + sentenceRef(st.sentences) + ': ' + st.observation);
        out.push('');
      }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  function exportSession(session) {
    return JSON.stringify({ app: APP_ID, version: SESSION_VERSION, session }, null, 2);
  }

  function importSession(text) {
    const p = parseModelJSON(text);
    const v = p.ok ? p.value : null;
    if (!v || v.app !== APP_ID) return { ok: false, error: 'This file is not a saved Argument Feedback session.' };
    if (v.version !== SESSION_VERSION) return { ok: false, error: 'This session was saved by a different version of the tool.' };
    if (!v.session || !Array.isArray(v.session.drafts)) return { ok: false, error: 'The saved session has no drafts.' };
    return { ok: true, session: v.session };
  }

  return {
    LIMITS, SCOPE_PRESETS, INDICATORS, RESPONSE_CHOICES, KINDS, SUPPORT_TYPES, APP_ID, SESSION_VERSION,
    splitSentences, sentenceRef, findIndicators, sentenceVariety, draftChecks,
    normalizeReconstruction, validateReconstruction, sentenceRoles, compareReconstructions, describeFinding, formatReconstruction, parseStandardForm,
    conceptsInScope, conceptsForFocus, validateStated, AUDIT_MARKS, readingLines, validateAudit, formatReading, validateDiagnosis, validateFollowup, parseModelJSON, extractReply, validateResponses,
    diffDrafts, buildRecord, exportSession, importSession,
    _internals: { words, wordCount, norm, splitSegment, openingKind, longestSharedRun, unsourcedQuotes, supportTypeOf },
  };
});
