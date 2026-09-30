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

const PERSON = new Set(["organization.director", "organization.directorPosition", "responsiblePerson", "responsiblePosition"]);

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
    assert.equal(/в лице\s+\{\{/.test(paragraph), false, paragraph);
    assert.equal(/поручается\s+\{\{/.test(paragraph), false, paragraph);
    assert.equal(/поручается\s+Ответственному/.test(paragraph), false, paragraph);
    for (const match of paragraph.matchAll(/\{\{\s*([a-zA-Z0-9.]+)\s*\}\}/g)) {
      if (!PERSON.has(match[1])) continue;
      const before = paragraph.slice(0, match.index);
      assert.match(before, /—\s*(?:\{\{[^}]+\}\}\s*)?$/, `${match[1]}: ${paragraph}`);
    }
  }
}
assert.equal(seen.size, 142);

const rendered = renderPolicy({
  "organization.name": "ООО «Ромашка»",
  "organization.shortName": "Ромашка",
  "organization.director": "Иванов И.И.",
  "organization.directorPosition": "Директор",
  "organization.address": "г. Казань, ул. Примерная, 1",
  responsiblePerson: "Петров П.П.",
  responsiblePosition: "специалист по охране труда",
  approvalDate: "15.04.2026",
  approvalOrderDate: "01.04.2026",
  approvalOrderNumber: "12",
  city: "Казань",
});
const text = rendered.map((block) => block.text).join("\n");
assert.ok(text.length > 18000, String(text.length));
assert.equal(text.includes("{{"), false);
assert.match(text, /ООО «Ромашка»/);
assert.match(text, /Краткое наименование — Ромашка/);
assert.match(text, /Место издания Положения — Казань/);
assert.match(text, /адресу: г\. Казань, ул\. Примерная, 1/);
assert.equal(text.includes("Казань, г. Казань"), false);
assert.match(text, /Руководитель организации — Директор Иванов И\.И\./);
assert.match(text, /Ответственный за функционирование СУОТ — специалист по охране труда Петров П\.П\./);
assert.match(text, /УТВЕРЖДЕНО/);
assert.equal(text.includes("УТВЕРЖДАЮ"), false);
assert.equal(text.toLowerCase().includes("в лице"), false);
assert.match(text, /приказом Ромашка/);
assert.match(text, /от 01\.04\.2026 № 12/);
assert.match(text, /вступает в силу с 15\.04\.2026/);
assert.equal(/в лице Директор/.test(text), false);
assert.equal(/поручается специалист/.test(text), false);
for (const word of FORBIDDEN) assert.equal(text.toLowerCase().includes(word.toLowerCase()), false, word);
for (const token of text.match(/\{\{[^}]+\}\}/g) ?? []) throw new Error(token);

const sameName = renderPolicy({
  "organization.name": "ООО «Ромашка»",
  "organization.shortName": "ООО «Ромашка»",
  "organization.director": "Иванов Иван Иванович",
  "organization.directorPosition": "Директор",
  "organization.address": "г. Самара, ул. Ленина, 1",
  responsiblePerson: "Петров Пётр Петрович",
  responsiblePosition: "Специалист по охране труда",
  approvalDate: "15.04.2026",
  approvalOrderDate: "01.04.2026",
  approvalOrderNumber: "15",
  city: "Самара",
});
const sameText = sameName.map((block) => block.text).join("\n");
assert.equal(sameText.includes("{{"), false);
assert.equal(sameText.includes("ООО «Ромашка» (ООО «Ромашка»)"), false);
assert.equal(sameText.includes("Краткое наименование — ООО «Ромашка»"), false);
assert.equal(sameText.includes("Самара, г. Самара"), false);
assert.match(sameText, /приказом ООО «Ромашка»/);
assert.match(sameText, /от 01\.04\.2026 № 15/);
assert.match(sameText, /адресу: г\. Самара, ул\. Ленина, 1/);
assert.match(sameText, /Руководитель организации — Директор Иванов Иван Иванович/);
assert.match(sameText, /Ответственный за функционирование СУОТ — Специалист по охране труда Петров Пётр Петрович/);
assert.equal(/в лице Директор/.test(sameText), false);
assert.equal(/поручается Специалист/.test(sameText), false);
const sameLines = sameName.map((block) => block.text);
for (let index = 1; index < sameLines.length; index += 1) {
  assert.equal(sameLines[index] === "ООО «Ромашка»" && sameLines[index - 1] === "ООО «Ромашка»", false);
}

const used = new Set<string>();
for (const section of sections) {
  for (const match of section.paragraphs.join("\n").matchAll(/\{\{\s*([a-zA-Z0-9.]+)\s*\}\}/g)) used.add(match[1]);
}
for (const line of ["УТВЕРЖДЕНО", "приказом {{organization.shortName}}", "от {{approvalOrderDate}} № {{approvalOrderNumber}}"]) {
  for (const match of line.matchAll(/\{\{\s*([a-zA-Z0-9.]+)\s*\}\}/g)) used.add(match[1]);
}
for (const key of PLACEHOLDERS) assert.equal(used.has(key), true, key);
for (const key of used) assert.ok((PLACEHOLDERS as readonly string[]).includes(key), key);
assert.ok(PLACEHOLDERS.includes("approvalOrderDate"));
assert.ok(PLACEHOLDERS.includes("approvalOrderNumber"));

assert.ok(verifiedBasis().length > 0);
assert.ok(verifiedBasis().every((item) => item.status === "verified"));
assert.ok(NORMATIVE_BASIS.some((item) => item.status === "needs_review"));
for (const item of verifiedBasis()) {
  assert.equal(item.confirms.includes("213"), false, item.act);
  assert.equal(item.confirms.includes("632"), false, item.act);
}
const repeatBriefing = NORMATIVE_BASIS.find((item) => item.point.includes("№ 805") && item.point.includes("пункт 14"));
assert.equal(repeatBriefing?.status, "verified");
assert.match(repeatBriefing?.confirms ?? "", /не реже одного раза в 6 месяцев/);
assert.match(repeatBriefing?.confirms ?? "", /не реже одного раза в 3 месяца в течение первого года работы/);
assert.match(repeatBriefing?.confirms ?? "", /впервые начавших трудовую деятельность/);

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
const unfilledText = unfilled.map((block) => block.text).join("\n");
assert.match(unfilledText, /\{\{organization\.name\}\}/);
assert.match(unfilledText, /\{\{approvalOrderDate\}\}/);
assert.match(unfilledText, /\{\{approvalOrderNumber\}\}/);

console.log(`core_osh_suot_v2 ok, chars ${text.length}, sections ${sections.length}, clauses ${seen.size}`);
