import assert from "node:assert/strict";
import { NORMATIVE_BASIS, PLACEHOLDERS, policySections, renderPolicy, verifiedBasis } from "./index.ts";

const FORBIDDEN = [
  "нормативное основание требует проверки",
  "needs_review",
  "schemaVersion",
  "generatorId",
  "templateId",
  "конструктор",
  "пресет",
  "модуль",
  "трейс",
  "Package Engine",
  "632н",
  "статья 213",
  "228.1",
  "не сверен",
  "не фиксируется",
  "требует проверки",
  "генератор",
  "черновик",
];

const sections = policySections();
assert.equal(sections.length, 20);
const ids = new Set(sections.map((section) => section.id));
assert.equal(ids.size, 20);
const seen = new Set<string>();
for (const section of sections) {
  assert.ok(section.title.trim().length > 0, section.id);
  assert.ok(section.paragraphs.length >= 4, section.id);
  for (const paragraph of section.paragraphs) {
    assert.ok(paragraph.trim().length > 40, `${section.id}: ${paragraph}`);
    assert.equal(seen.has(paragraph), false, paragraph.slice(0, 80));
    seen.add(paragraph);
  }
}

const rendered = renderPolicy({
  "organization.name": "ООО «Ромашка»",
  "organization.shortName": "Ромашка",
  "organization.director": "Иванов И.И.",
  "organization.directorPosition": "Директор",
  "organization.address": "г. Казань, ул. Примерная, 1",
  responsiblePerson: "Петров П.П.",
  responsiblePosition: "специалист по охране труда",
  approvalDate: "01.04.2026",
  city: "Казань",
});
const text = rendered.map((block) => block.text).join("\n");
assert.ok(text.length > 18000, String(text.length));
assert.equal(text.includes("{{"), false);
assert.match(text, /ООО «Ромашка»/);
assert.match(text, /Ромашка/);
assert.match(text, /Казань/);
assert.match(text, /ул\. Примерная/);
assert.match(text, /Иванов И\.И\./);
assert.match(text, /Директор/);
assert.match(text, /Петров П\.П\./);
assert.match(text, /специалист по охране труда/);
assert.match(text, /01\.04\.2026/);
for (const word of FORBIDDEN) assert.equal(text.toLowerCase().includes(word.toLowerCase()), false, word);
for (const token of text.match(/\{\{[^}]+\}\}/g) ?? []) throw new Error(token);

const used = new Set<string>();
for (const section of sections) {
  for (const match of section.paragraphs.join("\n").matchAll(/\{\{\s*([a-zA-Z0-9.]+)\s*\}\}/g)) used.add(match[1]);
}
for (const key of PLACEHOLDERS) assert.equal(used.has(key), true, key);
for (const key of used) assert.ok((PLACEHOLDERS as readonly string[]).includes(key), key);

assert.ok(verifiedBasis().length > 0);
assert.ok(verifiedBasis().every((item) => item.status === "verified"));
assert.ok(NORMATIVE_BASIS.some((item) => item.status === "needs_review"));
for (const item of verifiedBasis()) {
  assert.equal(item.confirms.includes("213"), false, item.act);
  assert.equal(item.confirms.includes("632"), false, item.act);
}

assert.match(text, /пункт 3\.2/);
assert.match(text, /не реже одного раза в шесть месяцев/);
assert.match(text, /не реже одного раза в три месяца/);
assert.match(text, /меньше двух смен она быть не может/);
assert.match(text, /трёх календарных дней/);
assert.match(text, /15 календарных дней/);
assert.match(text, /превышает 50 человек/);
assert.match(text, /0,2 процента/);
assert.match(text, /одного раза в пять лет/);
assert.match(text, /Руководитель организации/);
assert.match(text, /Непосредственный руководитель/);
assert.match(text, /Ответственный/);
assert.match(text, /№ 2464/);
assert.match(text, /№ 776н/);
assert.match(text, /№ 766н/);
assert.match(text, /№ 29н/);
assert.match(text, /№ 426-ФЗ/);

const unfilled = renderPolicy({});
assert.match(unfilled.map((block) => block.text).join("\n"), /\{\{organization\.name\}\}/);

console.log(`core_osh_suot_v2 ok, chars ${text.length}, sections ${sections.length}, clauses ${seen.size}`);
