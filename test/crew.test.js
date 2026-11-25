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

test('implementation options are complete and written into the guide', () => {
  for (const [data, path] of [['data/options.json', 'docs/IMPLEMENTATION.ru.md'], ['data/options.en.json', 'docs/IMPLEMENTATION.md']]) {
    const options = JSON.parse(read(data));
    const guide = build().get(path);
    for (const option of options) {
      for (const key of ['id', 'name', 'who', 'effort', 'need', 'limit']) assert.ok(option[key], `${option.id}.${key}`);
      assert.ok(option.steps.length >= 3, option.id);
      assert.ok(guide.includes(`## ${option.name}`));
    }
  }
});

test('both languages are complete and the English one holds no Russian', () => {
  const russian = loadRoles('ru');
  const english = loadRoles('en');
  assert.deepEqual(english.map((r) => r.id), russian.map((r) => r.id));
  assert.deepEqual(loadSkills('en').map((s) => s.id), loadSkills('ru').map((s) => s.id));
  for (const [i, role] of english.entries()) {
    for (const key of ['owns', 'outputs', 'kpis', 'connectors', 'approvals', 'never']) assert.equal(role[key].length, russian[i][key].length, `${role.id}.${key}`);
  }
  const files = build();
  const embedded = files.get('dist/artifact.html').match(/const ALL = (\{.*\});\n/)[1];
  const text = JSON.stringify(JSON.parse(embedded).en) + files.get('docs/IMPLEMENTATION.md').replace('[Русский]', '');
  assert.deepEqual(text.match(/[^"]{0,30}[А-Яа-яЁё]{2,}[^"]{0,30}/g)?.slice(0, 5) ?? [], []);
});

test('every suggested pack has a source, a licence note and an install command', () => {
  const { packs } = JSON.parse(read('data/ecosystem.json'));
  for (const pack of packs) {
    assert.match(pack.repo, /^[\w.-]+\/[\w.-]+$/);
    assert.ok(pack.license && pack.stars && pack.install.includes(pack.repo));
  }
});

