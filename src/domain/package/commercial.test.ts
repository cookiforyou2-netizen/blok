import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCatalog, createInstruction, deriveHazardIds, derivePpeIds, emptyDraft, ppeKey, selectionKey } from "../engine.ts";
import type { Draft } from "../types.ts";
import { generateById, listGeneratorIds, registerGenerator } from "./generate/registry.ts";
import { fillTemplate } from "./generate/template.ts";
import { CORE_OSH_DOCUMENTS } from "./modules/core-osh.ts";
import { buildPackage, listPackageExtensions } from "./registry.ts";
import { absorbInstruction } from "./profile.ts";
import { emptyProfile, mergeFacts } from "./facts.ts";
import { createPackageSnapshot, missingRequirements, workflowOf } from "./workflow.ts";
import type { FactInput } from "./types.ts";

const catalog = buildCatalog();

function confirm(field: FactInput["field"], key: string, value: FactInput["value"] = true): FactInput {
  return { field, key, value, source: "user", sourceId: "user-profile", status: value === false ? "rejected" : "confirmed" };
}

function welderDraft(): Draft {
  const profession = catalog.professions.find((item) => item.meta.id === "electrogas_welder");
  assert.ok(profession);
  const base: Draft = {
    ...emptyDraft(),
    orgName: "ООО «Ромашка»",
    docNumber: "ИОТ-СВ-01",
    professionId: "electrogas_welder",
    workIds: [...profession.suggestedWorkIds],
    gearIds: [...profession.suggestedGearIds],
    conditionIds: [...profession.suggestedConditionIds],
  };
  const hazardIds = deriveHazardIds(catalog, base);
  const next = { ...base, hazardIds, hazardKey: selectionKey({ ...base, hazardIds }) };
  return { ...next, ppeIds: derivePpeIds(catalog, next), ppeKey: ppeKey(next) };
}

describe("первый коммерческий контур core_osh", () => {
  it("модуль зарегистрирован и содержит эталонный набор разных типов", () => {
    const extension = listPackageExtensions().find((item) => item.id === "core_osh");
    assert.equal(extension?.title, "Базовая организация охраны труда");
    assert.equal(extension?.version, "1.0.0");
    assert.equal(extension?.status, "active");
    const documents = extension?.documents ?? [];
    assert.equal(documents.length, CORE_OSH_DOCUMENTS.length);
    assert.ok(documents.length >= 7 && documents.length <= 10);
    const shapes = new Set(documents.map((item) => item.shape));
    for (const shape of ["order", "policy", "list", "program"] as const) assert.equal(shapes.has(shape), true);
    for (const document of documents) {
      assert.equal(document.moduleId, "core_osh");
      assert.equal(document.commercialLevel, "PACKAGE");
      assert.ok(document.version);
      assert.equal(document.status, "active");
      assert.ok(document.requiredData && document.requiredData.length > 0);
      assert.equal("templateId" in document, true);
      assert.equal("generatorId" in document, true);
    }
    assert.equal(documents.filter((item) => item.generatorId).length, 1);
    const order = documents.find((item) => item.code === "osh_order_responsible");
    assert.equal(order?.generatorId, "osh_order_responsible");
    assert.equal(order?.templateId, "tpl_osh_order_responsible");
    assert.ok(order?.requiredData?.some((item) => item.id === "responsiblePerson"));
    const tools = documents.find((item) => item.code === "osh_order_power_tools");
    assert.ok(tools?.applicability.any?.some((atom) => atom.field === "equipment"));
  });

  it("от бесплатной инструкции до готовности одного приказа, без повторного вопроса", () => {
    const record = createInstruction(catalog, welderDraft());
    let profile = absorbInstruction(emptyProfile(), record);
    assert.equal(profile.schemaVersion, 1);
    assert.equal(profile.name, "ООО «Ромашка»");
    assert.ok(profile.professionIds.includes("electrogas_welder"));
    assert.ok(profile.gearIds.includes("angle_grinder"));

    const pack = buildPackage(profile);
    const free = pack.included.find((item) => item.document.code === "iot_electrogas_welder");
    assert.equal(free?.document.commercialLevel, "FREE");
    assert.equal(free?.status, "ready");
    assert.equal(free?.document.generator, "instruction");

    const order = pack.items.find((item) => item.document.code === "osh_order_responsible");
    assert.ok(order);
    assert.equal(order.trace.result, "YES");
    assert.equal(workflowOf(order, profile, []), "needs_data");
    const missing = missingRequirements(profile, order.document).map((item) => item.id);
    assert.deepEqual(missing.sort(), ["approvalDate", "organization.address", "organization.director", "responsiblePerson"].sort());
    assert.equal(missing.includes("organization.name"), false);

    const needsData = pack.items.filter((item) => item.document.moduleId === "core_osh" && workflowOf(item, profile, []) === "needs_data");
    assert.deepEqual(needsData.map((item) => item.document.code), ["osh_order_responsible"]);

    const tools = pack.items.find((item) => item.document.code === "osh_order_power_tools");
    assert.equal(tools?.match, "yes");
    assert.equal(workflowOf(tools!, profile, []), "defined");

    profile = mergeFacts(profile, [
      confirm("director", "value", "Иванов И.И."),
      confirm("address", "value", "г. Казань, ул. Примерная, 1"),
      confirm("responsible", "value", "Петров П.П."),
      confirm("approval_date", "value", "2026-04-01"),
    ]);
    const readyPack = buildPackage(profile);
    const ready = readyPack.items.find((item) => item.document.code === "osh_order_responsible");
    assert.equal(workflowOf(ready!, profile, []), "ready_to_generate");
    assert.equal(missingRequirements(profile, ready!.document).length, 0);

    const generated = generateById("osh_order_responsible", profile, ready!.document);
    const text = generated.blocks.map((block) => block.text).join("\n");
    assert.match(text, /Ромашка/);
    assert.match(text, /Иванов И\.И\./);
    assert.match(text, /Петров П\.П\./);
    assert.match(text, /01\.04\.2026/);
    assert.equal(generated.templateId, "tpl_osh_order_responsible");
    assert.doesNotMatch(text, /не указано/);
    assert.equal(workflowOf(ready!, profile, [ready!.document.id]), "formed");

    const snapshot = createPackageSnapshot(profile, readyPack, "2026-04-01T12:00:00.000Z");
    assert.equal(snapshot.profileVersion, 1);
    assert.equal(snapshot.createdAt, "2026-04-01T12:00:00.000Z");
    assert.ok(snapshot.documents.some((item) => item.code === "osh_order_responsible" && item.result === "YES"));
    assert.ok(snapshot.documents.some((item) => item.code === "iot_electrogas_welder"));
  });

  it("генератор не решает применимость и следующий подключается той же регистрацией", () => {
    const order = CORE_OSH_DOCUMENTS.find((item) => item.generatorId === "osh_order_responsible");
    assert.ok(order);
    const blank = generateById(order.generatorId!, emptyProfile(), order);
    assert.match(blank.blocks.map((block) => block.text).join("\n"), /не указано/);
    const blocked = mergeFacts(emptyProfile(), [
      confirm("equipment", "angle_grinder", false),
      confirm("equipment", "drill", false),
      confirm("flag", "powerTools", false),
    ]);
    assert.equal(buildPackage(blocked).items.some((item) => item.document.code === "osh_order_power_tools"), false);
    assert.ok(generateById(order.generatorId!, blocked, order).blocks.length > 3);

    registerGenerator({
      id: "demo_next",
      templateId: "tpl_demo_next",
      generate() {
        return fillTemplate({ id: "tpl_demo_next", title: "Следующий документ", filename: "next", blocks: [{ kind: "body", text: "подключён" }] }, {});
      },
    });
    assert.ok(listGeneratorIds().includes("osh_order_responsible"));
    assert.ok(listGeneratorIds().includes("demo_next"));
    const next = generateById("demo_next", emptyProfile(), { ...order, generatorId: "demo_next", templateId: "tpl_demo_next" });
    assert.equal(next.blocks[0]?.text, "подключён");
  });
});
