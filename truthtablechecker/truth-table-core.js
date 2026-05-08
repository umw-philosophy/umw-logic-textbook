(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UMWTruthTableCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const T = {
    ATOM: 'ATOM', NEG: 'NEG', CONJ: 'CONJ', DISJ: 'DISJ',
    COND: 'COND', BICOND: 'BICOND', LPAREN: 'LPAREN', RPAREN: 'RPAREN', EOF: 'EOF',
  };

  class ParseError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ParseError';
    }
  }

  function normalize(input) {
    return String(input || '')
      .replace(/\[/g, '(').replace(/\]/g, ')')
      .replace(/¬/g, '~')
      .replace(/<->/g, '≡').replace(/<=>/g, '≡')
      .replace(/->/g, '⊃').replace(/=>/g, '⊃')
      .replace(/v/g, '∨')
      .replace(/&/g, '·').replace(/\*/g, '·').replace(/\^/g, '·');
  }

  function tokenize(input) {
    const src = normalize(input);
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      switch (ch) {
        case '(': tokens.push({ type: T.LPAREN }); i++; break;
        case ')': tokens.push({ type: T.RPAREN }); i++; break;
        case '~': tokens.push({ type: T.NEG }); i++; break;
        case '·': tokens.push({ type: T.CONJ }); i++; break;
        case '∨': tokens.push({ type: T.DISJ }); i++; break;
        case '⊃': tokens.push({ type: T.COND }); i++; break;
        case '≡': tokens.push({ type: T.BICOND }); i++; break;
        default:
          if (/[A-Z]/.test(ch)) { tokens.push({ type: T.ATOM, name: ch }); i++; }
          else if (/[a-z]/.test(ch)) throw new ParseError(`"${ch}" is not valid. Atomic sentences must be capital letters (A-Z).`);
          else throw new ParseError(`Unrecognized character: "${ch}". Allowed: A-Z, ~, ·, ∨, ⊃, ≡, parentheses.`);
      }
    }
    tokens.push({ type: T.EOF });
    return tokens;
  }

  function parse(input) {
    const trimmed = String(input || '').trim();
    if (!trimmed) throw new ParseError('Formula cannot be empty.');
    const tokens = tokenize(trimmed);
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function tokStr(tok) {
      if (!tok || tok.type === T.EOF) return 'end of formula';
      return ({
        [T.ATOM]: tok.name, [T.NEG]: '~', [T.CONJ]: '·', [T.DISJ]: '∨',
        [T.COND]: '⊃', [T.BICOND]: '≡', [T.LPAREN]: '(', [T.RPAREN]: ')'
      })[tok.type] || tok.type;
    }

    const binops = new Set([T.CONJ, T.DISJ, T.COND, T.BICOND]);
    const nodeType = { [T.CONJ]: 'conj', [T.DISJ]: 'disj', [T.COND]: 'cond', [T.BICOND]: 'bicond' };

    function parseFormula() {
      const tok = peek();
      if (tok.type === T.ATOM) { consume(); return { type: 'atom', name: tok.name }; }
      if (tok.type === T.NEG) {
        consume();
        if (peek().type === T.EOF) throw new ParseError('"~" must be followed by a formula.');
        return { type: 'neg', operand: parseFormula() };
      }
      if (tok.type === T.LPAREN) {
        consume();
        if (peek().type === T.RPAREN) throw new ParseError('Empty parentheses are not valid.');
        const left = parseFormula();
        const op = peek();
        if (!binops.has(op.type)) {
          if (op.type === T.RPAREN) throw new ParseError(`After "${astToString(left)}" inside parentheses, expected a connective (·, ∨, ⊃, or ≡).`);
          if (op.type === T.EOF) throw new ParseError('Reached end of input while looking for a connective inside "(".');
          throw new ParseError(`Expected a connective after "${astToString(left)}", but found "${tokStr(op)}".`);
        }
        consume();
        if (binops.has(peek().type)) throw new ParseError('Two connectives in a row are not allowed.');
        if (peek().type === T.RPAREN) throw new ParseError(`After "${tokStr(op)}", a formula is required before ")".`);
        const right = parseFormula();
        const close = peek();
        if (close.type !== T.RPAREN) {
          if (binops.has(close.type)) throw new ParseError(`Extra connective "${tokStr(close)}" where ")" was expected. Each embedded connective needs parentheses.`);
          throw new ParseError(`Expected ")" but found "${tokStr(close)}".`);
        }
        consume();
        return { type: nodeType[op.type], left, right };
      }
      if (tok.type === T.EOF) throw new ParseError('Formula ended unexpectedly.');
      if (tok.type === T.RPAREN) throw new ParseError('Unexpected ")" — check parentheses.');
      if (binops.has(tok.type)) throw new ParseError(`Connective "${tokStr(tok)}" appears without a formula before it.`);
      throw new ParseError(`Unexpected symbol: "${tokStr(tok)}".`);
    }

    const ast = parseFormula();
    if (peek().type !== T.EOF) {
      const extra = tokStr(peek());
      const hint = binops.has(peek().type) ? ` Hint: wrap the whole thing in parentheses, e.g., (${astToString(ast)} ${extra} ...).` : '';
      throw new ParseError(`Unexpected "${extra}" after the formula.${hint}`);
    }
    return ast;
  }

  function parseTopLevel(input) {
    const trimmed = String(input || '').trim();
    try {
      return parse(trimmed);
    } catch (firstErr) {
      try {
        return parse(`(${trimmed})`);
      } catch (_) {
        throw firstErr;
      }
    }
  }

  function astToString(ast) {
    if (!ast) return '';
    if (ast.type === 'atom') return ast.name;
    if (ast.type === 'neg') return `~${astToString(ast.operand)}`;
    const sym = { conj: '·', disj: '∨', cond: '⊃', bicond: '≡' }[ast.type];
    return `(${astToString(ast.left)} ${sym} ${astToString(ast.right)})`;
  }

  function astToStringDisplay(ast) {
    if (!ast) return '';
    if (ast.type === 'atom') return ast.name;
    if (ast.type === 'neg') return `~${astToString(ast.operand)}`;
    const sym = { conj: '·', disj: '∨', cond: '⊃', bicond: '≡' }[ast.type];
    return `${astToString(ast.left)} ${sym} ${astToString(ast.right)}`;
  }

  function astEquals(a, b) {
    if (!a || !b) return a === b;
    if (a.type !== b.type) return false;
    if (a.type === 'atom') return a.name === b.name;
    if (a.type === 'neg') return astEquals(a.operand, b.operand);
    return astEquals(a.left, b.left) && astEquals(a.right, b.right);
  }

  function evaluate(ast, row) {
    if (ast.type === 'atom') return !!row[ast.name];
    if (ast.type === 'neg') return !evaluate(ast.operand, row);
    const left = evaluate(ast.left, row);
    const right = evaluate(ast.right, row);
    if (ast.type === 'conj') return left && right;
    if (ast.type === 'disj') return left || right;
    if (ast.type === 'cond') return !left || right;
    if (ast.type === 'bicond') return left === right;
    throw new Error(`Unknown AST type: ${ast.type}`);
  }

  function collectVariables(asts) {
    const seen = new Set();
    const vars = [];
    function visit(ast) {
      if (ast.type === 'atom') {
        if (!seen.has(ast.name)) { seen.add(ast.name); vars.push(ast.name); }
        return;
      }
      if (ast.type === 'neg') visit(ast.operand);
      else { visit(ast.left); visit(ast.right); }
    }
    asts.forEach(visit);
    return vars;
  }

  function makeRows(vars) {
    const count = 2 ** vars.length;
    return Array.from({ length: count }, (_, rowIndex) => {
      const row = {};
      vars.forEach((name, i) => {
        const block = 2 ** (vars.length - i - 1);
        row[name] = Math.floor(rowIndex / block) % 2 === 0;
      });
      return row;
    });
  }

  function isAtomic(ast) {
    return ast.type === 'atom';
  }

  function buildColumnsForFormula(formula, rows) {
    const columns = [];
    let next = 1;
    function walk(ast) {
      if (isAtomic(ast)) return null;
      const deps = [];
      if (ast.type === 'neg') {
        const dep = walk(ast.operand);
        if (dep) deps.push(dep);
      } else {
        const left = walk(ast.left);
        const right = walk(ast.right);
        if (left) deps.push(left);
        if (right) deps.push(right);
      }
      const id = `${formula.key}-c${next++}`;
      columns.push({
        id,
        formulaKey: formula.key,
        formulaLabel: formula.label,
        ast,
        label: astToStringDisplay(ast),
        deps,
        isMain: astEquals(ast, formula.ast),
        values: rows.map(row => evaluate(ast, row)),
      });
      return id;
    }
    walk(formula.ast);
    return columns;
  }

  function buildModel(mode, rawFormulas) {
    const formulas = rawFormulas.map((raw, i) => ({
      key: raw.key || `f${i + 1}`,
      role: raw.role || 'statement',
      label: raw.label || `Statement ${i + 1}`,
      raw: normalize(raw.text || raw.raw || '').trim(),
      ast: parseTopLevel(raw.text || raw.raw || ''),
    }));
    const vars = collectVariables(formulas.map(f => f.ast));
    if (vars.length > 4) throw new ParseError(`This checker supports up to 4 sentence letters. This problem uses ${vars.length}: ${vars.join(', ')}.`);
    const rows = makeRows(vars);
    const columns = formulas.flatMap(formula => buildColumnsForFormula(formula, rows));
    const finalColumns = {};
    formulas.forEach(formula => {
      const cols = columns.filter(col => col.formulaKey === formula.key);
      finalColumns[formula.key] = cols.length ? cols[cols.length - 1].id : null;
    });
    return { mode, formulas, vars, rows, columns, finalColumns };
  }

  function classifyStatement(values) {
    if (values.every(Boolean)) return 'tautology';
    if (values.every(v => !v)) return 'self-contradiction';
    return 'contingent';
  }

  function classifyPair(left, right) {
    const same = left.every((v, i) => v === right[i]);
    const opposite = left.every((v, i) => v !== right[i]);
    if (same) return 'equivalent';
    if (opposite) return 'contradictory';
    const bothTrue = left.some((v, i) => v && right[i]);
    return bothTrue ? 'consistent-not-equivalent' : 'inconsistent-not-contradictory';
  }

  function validity(premiseValues, conclusionValues) {
    const counterexamples = [];
    conclusionValues.forEach((conc, i) => {
      if (premiseValues.every(values => values[i]) && !conc) counterexamples.push(i);
    });
    return { valid: counterexamples.length === 0, counterexamples };
  }

  const problems = {
    single: [
      { title: 'Statement 1', difficulty: 'Basic', formula: 'P · Q' },
      { title: 'Statement 2', difficulty: 'Basic', formula: 'P ∨ ~P' },
      { title: 'Statement 3', difficulty: 'Basic', formula: 'P · ~P' },
      { title: 'Statement 4', difficulty: 'Basic', formula: '~(P · Q)' },
      { title: 'Statement 5', difficulty: 'Basic', formula: 'P ⊃ Q' },
      { title: 'Statement 6', difficulty: 'Medium', formula: 'P ⊃ (Q · R)' },
      { title: 'Statement 7', difficulty: 'Medium', formula: '~(P · Q) ≡ (~P ∨ ~Q)' },
      { title: 'Statement 8', difficulty: 'Medium', formula: '(P · Q) ⊃ P' },
      { title: 'Statement 9', difficulty: 'Medium', formula: '(P ∨ Q) · ~(P · Q)' },
      { title: 'Statement 10', difficulty: 'Medium', formula: '~(~P ∨ Q)' },
      { title: 'Statement 11', difficulty: 'Advanced', formula: '(P ⊃ (Q ∨ R)) ≡ (~P ∨ (Q ∨ R))' },
      { title: 'Statement 12', difficulty: 'Advanced', formula: '(P ≡ Q) · (P · ~Q)' },
    ],
    pair: [
      { title: 'Pair 1', difficulty: 'Basic', left: 'P ⊃ Q', right: '~P ∨ Q' },
      { title: 'Pair 2', difficulty: 'Basic', left: 'P · Q', right: '~(P · Q)' },
      { title: 'Pair 3', difficulty: 'Basic', left: 'P', right: 'P ∨ Q' },
      { title: 'Pair 4', difficulty: 'Basic', left: 'P · Q', right: '~P' },
      { title: 'Pair 5', difficulty: 'Medium', left: '~(P ∨ Q)', right: '~P · ~Q' },
      { title: 'Pair 6', difficulty: 'Medium', left: 'P ⊃ Q', right: 'P · ~Q' },
      { title: 'Pair 7', difficulty: 'Medium', left: 'P ≡ Q', right: 'P · Q' },
      { title: 'Pair 8', difficulty: 'Medium', left: 'P ∨ ~P', right: 'Q ∨ ~Q' },
      { title: 'Pair 9', difficulty: 'Medium', left: 'P ⊃ Q', right: '~Q ⊃ ~P' },
      { title: 'Pair 10', difficulty: 'Advanced', left: 'P · ~P', right: 'Q · ~Q' },
      { title: 'Pair 11', difficulty: 'Advanced', left: 'P ⊃ (Q · R)', right: '(P ⊃ Q) · (P ⊃ R)' },
      { title: 'Pair 12', difficulty: 'Advanced', left: 'P · Q', right: '~P ∨ ~Q' },
    ],
    argument: [
      { title: 'Argument 1', difficulty: 'Basic', premises: ['P ⊃ Q', 'P'], conclusion: 'Q' },
      { title: 'Argument 2', difficulty: 'Basic', premises: ['P ⊃ Q', '~Q'], conclusion: '~P' },
      { title: 'Argument 3', difficulty: 'Basic', premises: ['P ⊃ Q', 'Q'], conclusion: 'P' },
      { title: 'Argument 4', difficulty: 'Basic', premises: ['P ∨ Q', '~P'], conclusion: 'Q' },
      { title: 'Argument 5', difficulty: 'Medium', premises: ['P ⊃ Q', 'Q ⊃ R'], conclusion: 'P ⊃ R' },
      { title: 'Argument 6', difficulty: 'Medium', premises: ['P ⊃ Q', '~P'], conclusion: '~Q' },
      { title: 'Argument 7', difficulty: 'Medium', premises: ['P · Q'], conclusion: 'P' },
      { title: 'Argument 8', difficulty: 'Medium', premises: ['P ⊃ Q', 'R ⊃ S', 'P ∨ R'], conclusion: 'Q ∨ S' },
      { title: 'Argument 9', difficulty: 'Medium', premises: ['P ⊃ Q', 'R ⊃ S', 'Q ∨ S'], conclusion: 'P ∨ R' },
      { title: 'Argument 10', difficulty: 'Advanced', premises: ['~(P ∨ Q)'], conclusion: '~P · ~Q' },
      { title: 'Argument 11', difficulty: 'Advanced', premises: ['P ⊃ (Q ⊃ R)', 'P · Q'], conclusion: 'R' },
      { title: 'Argument 12', difficulty: 'Advanced', premises: ['P ⊃ (Q ∨ R)', '~R'], conclusion: 'Q' },
    ],
  };

  return {
    ParseError,
    normalize,
    tokenize,
    parse,
    parseTopLevel,
    astToString,
    astToStringDisplay,
    astEquals,
    evaluate,
    collectVariables,
    makeRows,
    buildModel,
    classifyStatement,
    classifyPair,
    validity,
    problems,
  };
});
