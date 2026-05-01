#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const TWO_REGIONS = [
  { id: 'S', bits: { S: true, P: false } },
  { id: 'SP', bits: { S: true, P: true } },
  { id: 'P', bits: { S: false, P: true } },
  { id: 'O', bits: { S: false, P: false } },
];

const THREE_REGIONS = [
  { id: 'S', bits: { S: true, P: false, M: false } },
  { id: 'SP', bits: { S: true, P: true, M: false } },
  { id: 'P', bits: { S: false, P: true, M: false } },
  { id: 'SM', bits: { S: true, P: false, M: true } },
  { id: 'SPM', bits: { S: true, P: true, M: true } },
  { id: 'PM', bits: { S: false, P: true, M: true } },
  { id: 'M', bits: { S: false, P: false, M: true } },
  { id: 'O', bits: { S: false, P: false, M: false } },
];

function regionHas(region, role) {
  return !!region.bits[role];
}

function regionsForProposition(regions, prop) {
  const subj = prop.subject;
  const pred = prop.predicate;
  if (prop.form === 'all') {
    return { shade: regions.filter(r => regionHas(r, subj) && !regionHas(r, pred)).map(r => r.id), x: [] };
  }
  if (prop.form === 'no') {
    return { shade: regions.filter(r => regionHas(r, subj) && regionHas(r, pred)).map(r => r.id), x: [] };
  }
  if (prop.form === 'some') {
    return { shade: [], x: [regions.filter(r => regionHas(r, subj) && regionHas(r, pred)).map(r => r.id)] };
  }
  return { shade: [], x: [regions.filter(r => regionHas(r, subj) && !regionHas(r, pred)).map(r => r.id)] };
}

function solveDiagram(regions, propositions) {
  const shaded = new Set();
  const rawX = [];
  for (const prop of propositions) {
    const translated = regionsForProposition(regions, prop);
    translated.shade.forEach(id => shaded.add(id));
    translated.x.forEach(ids => rawX.push(ids));
  }

  const xSets = rawX
    .map(ids => ids.filter(id => !shaded.has(id)).sort())
    .filter(ids => ids.length > 0);
  return { shaded, xSets };
}

function canonicalSet(ids) {
  return [...ids].sort().join('|');
}

function projectToConclusion(solution) {
  const map = {
    S: 'S',
    SP: 'SP',
    SM: 'S',
    SPM: 'SP',
    P: 'P',
    PM: 'P',
    M: 'O',
    O: 'O',
  };
  const shaded = new Set();
  const groups = { S: ['S', 'SM'], SP: ['SP', 'SPM'], P: ['P', 'PM'], O: ['O', 'M'] };
  Object.entries(groups).forEach(([twoId, threeIds]) => {
    if (threeIds.every(id => solution.shaded.has(id))) shaded.add(twoId);
  });
  const xSets = solution.xSets
    .map(ids => [...new Set(ids.map(id => map[id]))].sort())
    .filter(ids => ids.length > 0);
  return { shaded, xSets };
}

function conclusionWarranted(premiseSolution, conclusionSolution) {
  for (const id of conclusionSolution.shaded) {
    if (!premiseSolution.shaded.has(id)) return false;
  }
  for (const needed of conclusionSolution.xSets) {
    const neededKey = canonicalSet(needed);
    const match = premiseSolution.xSets.some(have => canonicalSet(have) === neededKey);
    if (!match) return false;
  }
  return true;
}

function ids(set) {
  return [...set].sort();
}

assert.deepEqual(ids(solveDiagram(TWO_REGIONS, [{ form: 'all', subject: 'S', predicate: 'P' }]).shaded), ['S']);
assert.deepEqual(solveDiagram(TWO_REGIONS, [{ form: 'all', subject: 'S', predicate: 'P' }]).xSets, []);
assert.deepEqual(solveDiagram(TWO_REGIONS, [{ form: 'no', subject: 'S', predicate: 'P' }]).xSets, []);
assert.deepEqual(solveDiagram(TWO_REGIONS, [{ form: 'some', subject: 'S', predicate: 'P' }]).xSets, [['SP']]);
assert.deepEqual(solveDiagram(TWO_REGIONS, [{ form: 'some-not', subject: 'S', predicate: 'P' }]).xSets, [['S']]);

const validPremises = solveDiagram(THREE_REGIONS, [
  { form: 'all', subject: 'M', predicate: 'P' },
  { form: 'some', subject: 'S', predicate: 'M' },
]);
assert.deepEqual(ids(validPremises.shaded), ['M', 'SM']);
assert.deepEqual(validPremises.xSets, [['SPM']]);
assert.equal(
  conclusionWarranted(projectToConclusion(validPremises), solveDiagram(TWO_REGIONS, [{ form: 'some', subject: 'S', predicate: 'P' }])),
  true
);

const invalidPremises = solveDiagram(THREE_REGIONS, [
  { form: 'some', subject: 'P', predicate: 'M' },
  { form: 'some', subject: 'M', predicate: 'S' },
]);
assert.deepEqual(invalidPremises.xSets, [['PM', 'SPM'], ['SM', 'SPM']]);
assert.equal(
  conclusionWarranted(projectToConclusion(invalidPremises), solveDiagram(TWO_REGIONS, [{ form: 'some', subject: 'S', predicate: 'P' }])),
  false
);

const barbara = solveDiagram(THREE_REGIONS, [
  { form: 'all', subject: 'M', predicate: 'P' },
  { form: 'all', subject: 'S', predicate: 'M' },
]);
assert.deepEqual(ids(projectToConclusion(barbara).shaded), ['S']);
assert.equal(
  conclusionWarranted(projectToConclusion(barbara), solveDiagram(TWO_REGIONS, [{ form: 'all', subject: 'S', predicate: 'P' }])),
  true
);

console.log('Venn checker logic tests passed.');
