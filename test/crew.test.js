import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build, loadRoles, loadSkills } from '../scripts/build.mjs';
import { unitEconomics } from '../plugin/skills/unit-economics/unit-economics.mjs';

const roles = loadRoles();
const skills = loadSkills();
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replaceAll('\r\n', '\n');

test('every role is complete and refers only to skills that exist', () => {
  const ids = new Set(skills.map((s) => s.id));
  assert.equal(new Set(roles.map((r) => r.id)).size, roles.length);
  for (const role of roles) {
    for (const key of ['name', 'title', 'group', 'color', 'mission', 'when', 'question']) assert.ok(role[key], `${role.id}.${key}`);
    for (const key of ['owns', 'outputs', 'kpis', 'skills', 'addons', 'connectors', 'approvals', 'never']) assert.ok(role[key].length, `${role.id}.${key}`);
    for (const skill of role.skills) assert.ok(ids.has(skill), `${role.id} uses unknown skill ${skill}`);
  }
});

test('every skill is used by some role and is named after its folder', () => {
  const used = new Set(roles.flatMap((r) => r.skills));
  for (const skill of skills) {
    assert.equal(skill.name, skill.id);
    assert.ok(used.has(skill.id), `${skill.id} is not used`);
  }
});

test('generated files are up to date', () => {
  for (const [path, text] of build()) {
    if (path.startsWith('dist/')) continue;
    assert.equal(read(path), text, `${path} is stale: run npm run build`);
  }
});

test('data cannot break out of the page script', () => {
  const page = build().get('dist/artifact.html');
  assert.equal(page.match(/<\/script>/g).length, 1);
  assert.ok(!page.includes('__CREW_DATA__'));
});

test('unit economics', () => {
  const result = unitEconomics({ price: 100, variableCost: 35, paymentFee: 0.03, cac: 40, purchasesPerMonth: 1, lifetimeMonths: 6, fixedCosts: 3000 });
  assert.deepEqual(result, { marginPerSale: 62, marginPercent: 62, ltv: 372, ltvToCac: 9.3, paybackMonths: 0.65, breakEvenSalesPerMonth: 49 });
});

test('unit economics with a loss and with bad input', () => {
  const loss = unitEconomics({ price: 10, variableCost: 12, paymentFee: 0, cac: 5, purchasesPerMonth: 1, lifetimeMonths: 3, fixedCosts: 100 });
  assert.equal(loss.breakEvenSalesPerMonth, null);
  assert.equal(loss.paybackMonths, null);
  assert.throws(() => unitEconomics({ price: 100 }), /variableCost/);
  assert.throws(() => unitEconomics({ price: 100, variableCost: 1, paymentFee: 3, cac: 1, purchasesPerMonth: 1, lifetimeMonths: 1, fixedCosts: 1 }), /share/);
});
