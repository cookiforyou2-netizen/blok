import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyUpdateStep,
  assemble,
  buildCatalog,
  createInstruction,
  deriveHazardIds,
  derivePpeIds,
  emptyDraft,
  emptyOverrides,
  qualityGate,
  selectionKey,
  ppeKey,
} from "./engine.ts";
import { fileBase } from "./export-doc.ts";
import type { Draft } from "./types.ts";

const catalog = buildCatalog();
const review = { name: "Петров Пётр Петрович", comment: "Пункт проверен по руководству изготовителя" };

function publish(id: string) {
  let overrides = emptyOverrides();
  for (let step = 0; step < 5; step += 1) {
    const result = applyUpdateStep(overrides, id, review, "2026-09-27");
    if (result.status !== "ok") return result;
    overrides = result.overrides;
    if (buildCatalog(overrides).updates.find((item) => item.id === id)?.status === "PUBLISHED") return result;
  }
  return { status: "blocked" as const, overrides };
}

function withDerived(draft: Draft, source = catalog): Draft {
  const hazardIds = deriveHazardIds(source, draft);
  const next = { ...draft, hazardIds, hazardKey: selectionKey({ ...draft, hazardIds }) };
  return { ...next, ppeIds: derivePpeIds(source, next), ppeKey: ppeKey(next) };
}

function draftFor(professionId: string, patch: Partial<Draft> = {}): Draft {
  const profession = catalog.professions.find((item) => item.meta.id === professionId);
  assert.ok(profession, professionId);
  return withDerived({
    ...emptyDraft(),
    orgName: "ООО «Пример»",
    docNumber: "ИОТ-1",
    professionId,
    workIds: [...profession.suggestedWorkIds],
    gearIds: [...profession.suggestedGearIds],
    conditionIds: [...profession.suggestedConditionIds],
    ...patch,
  });
}

function gate(draft: Draft, source = catalog) {
  const doc = assemble(source, draft);
  return { doc, issues: qualityGate(source, draft, doc) };
}

describe("конструктор ИОТ", () => {
  it("цеховой и монтажный сварщик проходят Gate без чужого оборудования", () => {
    const shop = gate(draftFor("electrogas_welder", { docNumber: "ИОТ-СВ-01" }));
    assert.deepEqual(shop.issues, []);
    assert.equal(/баллон|резак|высот/i.test(shop.doc.plain), false);

    const site = gate(withDerived({
      ...emptyDraft(),
      orgName: "ООО «Пример»",
      docNumber: "ИОТ-СВ-02",
      professionId: "electrogas_welder",
      workIds: ["work_manual_arc", "work_gas_cutting", "work_moving_parts"],
      gearIds: ["welding_machine", "gas_cylinder", "hand_tools"],
      conditionIds: ["cond_outdoor", "cond_height", "cond_hot_zone"],
    }));
    assert.deepEqual(site.issues, []);
    assert.equal(/ушм|шлиф|абразив/i.test(site.doc.plain), false);
  });

  it("все профессии с модулями по умолчанию проходят Gate", () => {
    const failed = catalog.professions.flatMap((profession) => {
      const { issues } = gate(draftFor(profession.meta.id));
      return issues.length ? [`${profession.meta.title}: ${issues.map((item) => item.message).join(" | ")}`] : [];
    });
    assert.deepEqual(failed, []);
  });

  it("повар, пекарь и горячий металл не содержат сварочный текст", () => {
    for (const id of ["cook", "baker", "confectioner", "blacksmith", "foundry", "heat_treat"]) {
      const { doc, issues } = gate(draftFor(id));
      assert.deepEqual(issues, [], id);
      assert.equal(/свар|огнев|экран/i.test(doc.plain), false, `${id}: ${doc.plain.match(/[^\n]{0,40}(свар|огнев|экран)[^\n]{0,40}/i)?.[0]}`);
      assert.equal(doc.plain.includes("Зона огневых работ"), false, id);
      assert.equal(doc.plain.includes("Костюм сварщика"), false, id);
    }
  });

  it("Gate не пройден в запрещённых сборках", () => {
    const cutting = gate(withDerived({
      ...emptyDraft(),
      professionId: "gas_cutter",
      workIds: ["work_gas_cutting"],
      gearIds: ["hand_tools"],
      conditionIds: ["cond_hot_zone"],
    }));
    assert.ok(cutting.issues.some((item) => item.message.includes("требует оборудование") && item.message.includes("Газовые баллоны")));

    const base = draftFor("repair_fitter");
    const stripped = gate({ ...base, hazardIds: base.hazardIds.filter((id) => id !== "disc_burst") });
    assert.ok(stripped.issues.some((item) => item.code === "hazard-removed"));

    const bare = gate({ ...base, ppeIds: [], customPpe: [] });
    assert.ok(bare.issues.some((item) => item.code === "ppe-empty"));

    const archivedCatalog = buildCatalog({ ...emptyOverrides(), moduleStatus: { angle_grinder: "archived" } });
    const archivedDraft = draftFor("repair_fitter");
    const archived = qualityGate(archivedCatalog, archivedDraft, assemble(archivedCatalog, archivedDraft));
    assert.ok(archived.some((item) => item.message.startsWith("Модуль не активен")));

    const outdated = buildCatalog({ ...emptyOverrides(), regulationStatus: { "reg-772n": "outdated" } });
    const order = qualityGate(outdated, base, assemble(outdated, base));
    assert.ok(order.some((item) => item.code === "reg-inactive"));
  });

  it("публикация УШМ меняет текст живых профессий и не переписывает старый снимок", () => {
    const ids = ["electrogas_welder", "repair_fitter", "electrician"] as const;
    const before = ids.map((id) => createInstruction(catalog, draftFor(id)));
    const published = publish("upd-ag-01");
    assert.equal(published.status, "ok");
    const nextCatalog = buildCatalog(published.overrides);
    const marker = "развёрнутый в сторону работника";
    for (const record of before) {
      assert.equal(record.snapshot.plain.includes(marker), false, record.professionTitle);
      assert.equal(record.snapshot.moduleVersions.find((item) => item.id === "angle_grinder")?.version, "1.0.0");
    }
    for (const id of ids) {
      const doc = assemble(nextCatalog, draftFor(id));
      assert.equal(doc.plain.includes(marker), true, id);
      assert.equal(doc.moduleVersions.find((item) => item.id === "angle_grinder")?.version, "1.1.0");
      const note = nextCatalog.gears.find((item) => item.meta.id === "angle_grinder")?.meta.changelog.at(-1);
      assert.equal(note?.author, review.name);
    }
    const repeat = applyUpdateStep(
      { ...published.overrides, updateStatus: { ...published.overrides.updateStatus, "upd-ag-01": "HUMAN_VERIFIED" } },
      "upd-ag-01",
      review,
      "2026-09-27",
    );
    assert.equal(repeat.status, "no-change");
  });

  it("публикация сварочного уточнения меняет только модуль с новым текстом", () => {
    const published = publish("upd-weld-01");
    assert.equal(published.status, "ok");
    assert.equal(published.overrides.moduleVersion.work_manual_arc, "1.1.0");
    assert.equal(published.overrides.moduleVersion.welding_machine, undefined);
    const doc = assemble(buildCatalog(published.overrides), draftFor("electrogas_welder"));
    assert.equal(doc.plain.includes("трубопроводы и канаты"), true);
  });

  it("имя файла инструкции латиницей", () => {
    assert.equal(fileBase({ professionTitle: "Электрогазосварщик" }), "IOT-elektrogazosvarshchik");
  });
});
