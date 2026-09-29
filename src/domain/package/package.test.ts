import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCatalog, createInstruction, deriveHazardIds, derivePpeIds, emptyDraft, ppeKey, selectionKey } from "../engine.ts";
import type { Draft, InstructionRecord } from "../types.ts";
import { evaluateApplicability, matchApplicability } from "./applicability.ts";
import { emptyProfile, findFact, mergeFacts, setFactClock, verdictOf, winningSource } from "./facts.ts";
import { organizationDocuments } from "./documents.ts";
import { buildPackage, listPackageExtensions, registerPackageModule } from "./registry.ts";
import { absorbInstruction, applyPreset, normalizeProfile, userRejected } from "./profile.ts";
import { createProfileRepository, type KeyValueStorage } from "./storage.ts";
import { PRESETS, presetById } from "./presets.ts";
import type { Applicability, DocumentModule, FactInput, OrganizationProfile } from "./types.ts";
import { FACT_FIELDS } from "./types.ts";

const catalog = buildCatalog();
const USER = "user-profile";

function codes(profile: OrganizationProfile) {
  return buildPackage(profile).included.map((item) => item.document.code).sort();
}

function confirm(field: FactInput["field"], key: string, value: FactInput["value"] = true): FactInput {
  return { field, key, value, source: "user", sourceId: USER, status: value === false ? "rejected" : "confirmed" };
}

function withFacts(inputs: FactInput[], base = emptyProfile()): OrganizationProfile {
  return mergeFacts(base, inputs);
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

function memory(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const WELDER_RULE: Applicability = {
  all: [
    { field: "profession", in: ["welder"] },
    { field: "work", in: ["welding"] },
  ],
  any: [
    { field: "equipment", in: ["angle_grinder", "drill"] },
    { field: "hazard", in: ["hot_work"] },
  ],
};

describe("пакет документов", () => {
  it("две организации одной отрасли различаются только фактами профиля", () => {
    const school = presetById("school");
    assert.ok(school);
    const suggested = applyPreset(emptyProfile(), school);
    const confirmed = mergeFacts(suggested, [confirm("profession", "car_driver"), confirm("profession", "cook"), confirm("equipment", "ladder")]);
    const rejected = mergeFacts(suggested, [confirm("profession", "car_driver", false), confirm("profession", "cook", false), confirm("flag", "food", false)]);
    assert.equal(confirmed.industry, "Образование");
    assert.equal(rejected.industry, "Образование");
    assert.notDeepEqual(codes(confirmed), codes(rejected));
    assert.ok(codes(confirmed).includes("iot_cook"));
    assert.ok(codes(confirmed).includes("iot_car_driver"));
    assert.equal(codes(rejected).includes("iot_cook"), false);
    assert.equal(codes(rejected).includes("iot_car_driver"), false);
    assert.equal(buildPackage(rejected).items.some((item) => item.document.code === "iot_car_driver"), false);
  });

  it("пресет не является готовым пакетом и не делает документ обязательным", () => {
    for (const preset of PRESETS) {
      assert.equal(Object.hasOwn(preset, "documents"), false);
      assert.equal("applicability" in preset, false);
    }
    const school = presetById("school");
    assert.ok(school);
    const filled = applyPreset(emptyProfile(), school);
    assert.ok(filled.professionIds.includes("car_driver"));
    assert.equal(filled.facts.some((fact) => fact.id === "profession:car_driver" && fact.sources.some((source) => source.source === "preset" && source.status === "inferred")), true);
    const pack = buildPackage(filled);
    assert.equal(pack.included.some((item) => item.document.code === "iot_car_driver"), false);
    assert.equal(pack.included.some((item) => item.document.code === "order_height"), false);
    assert.equal(pack.clarifications.some((item) => item.document.code === "iot_car_driver"), true);
    assert.equal(pack.clarifications.some((item) => item.document.code === "order_height"), true);
    const withoutDriver = mergeFacts(filled, [confirm("profession", "car_driver", false)]);
    assert.equal(buildPackage(withoutDriver).items.some((item) => item.document.code === "iot_car_driver"), false);
  });

  it("инструкция сварщика пополняет профиль и не спрашивается заново", () => {
    const record = createInstruction(catalog, welderDraft());
    const once = absorbInstruction(emptyProfile(), record);
    const twice = absorbInstruction(once, record);
    assert.deepEqual(twice.instructionIds, [record.id]);
    assert.deepEqual(twice.professionIds, ["electrogas_welder"]);
    assert.ok(twice.gearIds.includes("angle_grinder"));
    assert.ok(twice.workIds.includes("work_manual_arc"));
    assert.equal(twice.name, "ООО «Ромашка»");
    assert.equal(twice.flags.powerTools, true);
    assert.equal(twice.flags.hazardousWork, true);
    const fact = findFact(twice, "equipment", "angle_grinder");
    assert.equal(fact?.sources.filter((source) => source.source === "instruction").length, 1);
    const pack = buildPackage(twice);
    assert.ok(pack.included.some((item) => item.document.code === "iot_electrogas_welder" && item.document.commercialLevel === "FREE" && item.status === "ready"));
    assert.equal(pack.included.some((item) => item.document.code === "iot_car_driver"), false);
  });

  it("новый модуль добавляется реестром и несёт версию и статус", () => {
    const lift: DocumentModule = {
      id: "auto_lift_order",
      code: "auto_lift_order",
      name: "Приказ о безопасной эксплуатации подъёмника",
      category: "hazardous",
      shape: "order",
      version: "1.2.0",
      status: "active",
      applicability: { any: [{ field: "equipment", in: ["vehicle_lift"] }] },
      dependencies: [],
      normativeBasis: "Нормативное основание требует проверки",
      template: null,
      generator: "none",
      commercialLevel: "PRO",
      optional: false,
      moduleId: "auto_service",
    };
    const retired: DocumentModule = { ...lift, id: "auto_lift_old", code: "auto_lift_old", status: "deprecated", version: "0.9.0" };
    registerPackageModule({ id: "auto_service", title: "Автосервис", version: "1.2.0", status: "active", documents: [lift, retired] });
    const stored = listPackageExtensions().find((item) => item.id === "auto_service");
    assert.equal(stored?.version, "1.2.0");
    assert.equal(stored?.status, "active");
    assert.equal(codes(emptyProfile()).includes("auto_lift_order"), false);
    assert.equal(codes(emptyProfile()).includes("auto_lift_old"), false);
    const withLift = withFacts([confirm("equipment", "vehicle_lift")]);
    const item = buildPackage(withLift).included.find((entry) => entry.document.code === "auto_lift_order");
    assert.ok(item);
    assert.equal(item.status, "locked");
    assert.equal(item.document.moduleId, "auto_service");
    assert.equal(item.document.version, "1.2.0");
    assert.equal(buildPackage(withLift).items.some((entry) => entry.document.code === "auto_lift_old"), false);
    const sample = organizationDocuments()[0];
    assert.equal(sample.id, "policy_suot");
    assert.equal(sample.version, "1.0.0");
    assert.equal(sample.status, "active");
  });

  it("старый профиль без фактов не теряет название, профессию и явный отказ", () => {
    const profile = normalizeProfile({ name: "Школа № 1", professionIds: ["cook"], flags: { food: false } });
    assert.equal(profile.name, "Школа № 1");
    assert.deepEqual(profile.professionIds, ["cook"]);
    assert.equal(profile.flags.food, false);
    assert.equal(profile.flags.height, null);
    assert.equal(profile.flags.ppe, true);
    assert.equal(verdictOf(findFact(profile, "profession", "cook")), "yes");
    assert.equal(userRejected(profile, "flag", "food"), true);
  });

  it("хранилище профиля заменяемо и не вшито в применимость", () => {
    const repo = createProfileRepository(memory(), "test-profile");
    assert.deepEqual(repo.loadProfile().facts, []);
    const saved = repo.setFact(emptyProfile(), confirm("profession", "cook"));
    assert.deepEqual(repo.loadProfile().professionIds, ["cook"]);
    assert.equal(saved.professionIds[0], "cook");
    assert.equal(repo.getFact("profession:cook")?.key, "cook");
    assert.equal(repo.getFact("profession:cook", saved)?.sources[0]?.source, "user");
    const cleared = repo.removeFact(saved, "profession:cook");
    assert.deepEqual(cleared.professionIds, []);
    assert.equal(repo.getFact("profession:cook"), undefined);
  });

  it("A. пресет предлагает водителя, явный отказ пользователя исключает документы водителя", () => {
    const school = presetById("school");
    assert.ok(school);
    const profile = mergeFacts(applyPreset(emptyProfile(), school), [confirm("profession", "car_driver", false)]);
    assert.equal(userRejected(profile, "profession", "car_driver"), true);
    assert.equal(profile.professionIds.includes("car_driver"), false);
    assert.equal(findFact(profile, "profession", "car_driver")?.sources.some((source) => source.source === "preset"), true);
    const pack = buildPackage(profile);
    assert.equal(pack.items.some((item) => item.document.code === "iot_car_driver"), false);
    assert.equal(pack.included.some((item) => item.document.code === "iot_car_driver"), false);
    assert.equal(pack.clarifications.some((item) => item.document.code === "iot_car_driver"), false);
  });

  it("B. УШМ из инструкции сварщика доказывает применимость документа по электроинструменту", () => {
    const record = createInstruction(catalog, welderDraft());
    const profile = absorbInstruction(emptyProfile(), record);
    const fact = findFact(profile, "equipment", "angle_grinder");
    assert.equal(verdictOf(fact), "yes");
    assert.equal(fact?.sources[0]?.source, "instruction");
    assert.equal(fact?.sources[0]?.sourceId, record.id);
    assert.equal(fact?.sources[0]?.status, "inferred");
    const item = buildPackage(profile).included.find((entry) => entry.document.code === "order_tools");
    assert.ok(item);
    assert.equal(item.match, "yes");
    assert.match(item.reason, /angle_grinder/);
    assert.ok(item.sources.includes(record.id));
    assert.match(item.reason, /Документ включён/);
  });

  it("C. явный отказ пользователя важнее факта из инструкции", () => {
    const record = createInstruction(catalog, welderDraft());
    const learned = absorbInstruction(emptyProfile(), record);
    const profile = mergeFacts(learned, [confirm("equipment", "angle_grinder", false)]);
    const fact = findFact(profile, "equipment", "angle_grinder");
    assert.equal(verdictOf(fact), "no");
    assert.equal(fact?.sources.some((source) => source.source === "instruction" && source.sourceId === record.id), true);
    assert.equal(fact?.sources.some((source) => source.source === "user" && source.status === "rejected"), true);
    assert.equal(profile.gearIds.includes("angle_grinder"), false);
    assert.equal(profile.flags.powerTools, null);
    const onlyGrinder: Applicability = { any: [{ field: "equipment", in: ["angle_grinder"] }] };
    const decision = evaluateApplicability(profile, onlyGrinder);
    assert.equal(decision.applicable, "no");
    assert.equal(buildPackage(profile).included.some((item) => item.document.code === "order_tools"), false);
  });

  it("D. неизвестная высота — это UNKNOWN и статус «нужно уточнить», а не отказ", () => {
    const decision = evaluateApplicability(emptyProfile(), { any: [{ field: "flag", in: ["height"] }, { field: "equipment", in: ["ladder"] }] });
    assert.equal(decision.applicable, "unknown");
    assert.ok(decision.missing.includes("flag:height"));
    assert.ok(decision.missing.includes("equipment:ladder"));
    const item = buildPackage(emptyProfile()).clarifications.find((entry) => entry.document.code === "order_height");
    assert.ok(item);
    assert.equal(item.match, "unknown");
    assert.equal(item.status, "clarify");
    assert.match(item.reason, /Нужно уточнить/);
    const refused = mergeFacts(emptyProfile(), [
      confirm("flag", "height", false),
      confirm("equipment", "ladder", false),
      confirm("condition", "cond_height", false),
      confirm("hazard", "fall_height", false),
    ]);
    assert.equal(buildPackage(refused).items.some((entry) => entry.document.code === "order_height"), false);
    assert.equal(matchApplicability(emptyProfile(), { any: [{ field: "headcount", min: 50 }] }), "unknown");
    assert.equal(matchApplicability(withFacts([confirm("headcount", "value", 12)]), { any: [{ field: "headcount", min: 50 }] }), "no");
    assert.equal(matchApplicability(withFacts([confirm("headcount", "value", 50)]), { any: [{ field: "headcount", min: 50 }] }), "yes");
  });

  it("E. ALL и ANY: сварщик и сварка и (УШМ или дрель)", () => {
    const ready = withFacts([
      confirm("profession", "welder"),
      confirm("work", "welding"),
      confirm("equipment", "angle_grinder"),
    ]);
    const matched = evaluateApplicability(ready, WELDER_RULE);
    assert.equal(matched.applicable, "yes");
    assert.ok(matched.reasons.some((reason) => reason.includes("welder")));
    assert.ok(matched.reasons.some((reason) => reason.includes("welding")));
    assert.ok(matched.reasons.some((reason) => reason.includes("angle_grinder")));

    const drillOnly = withFacts([
      confirm("profession", "welder"),
      confirm("work", "welding"),
      confirm("equipment", "drill", false),
      confirm("equipment", "angle_grinder", false),
    ]);
    const viaDrill = withFacts([
      confirm("profession", "welder"),
      confirm("work", "welding"),
      confirm("equipment", "drill"),
      confirm("equipment", "angle_grinder", false),
    ]);
    assert.equal(evaluateApplicability(viaDrill, WELDER_RULE).applicable, "yes");

    const missingTool = withFacts([confirm("profession", "welder"), confirm("work", "welding")]);
    const unknown = evaluateApplicability(missingTool, WELDER_RULE);
    assert.equal(unknown.applicable, "unknown");
    assert.ok(unknown.missing.includes("equipment:angle_grinder"));
    assert.ok(unknown.missing.includes("equipment:drill"));

    const notWelder = withFacts([
      confirm("profession", "welder", false),
      confirm("work", "welding"),
      confirm("equipment", "angle_grinder"),
    ]);
    assert.equal(evaluateApplicability(notWelder, WELDER_RULE).applicable, "no");

    const blocked = evaluateApplicability(ready, {
      ...WELDER_RULE,
      none: [{ field: "flag", in: ["activity_not_performed"] }],
    });
    assert.equal(blocked.applicable, "unknown");
    const closed = mergeFacts(ready, [confirm("flag", "activity_not_performed")]);
    assert.equal(evaluateApplicability(closed, { ...WELDER_RULE, none: [{ field: "flag", in: ["activity_not_performed"] }] }).applicable, "no");
    const allowed = mergeFacts(ready, [confirm("flag", "activity_not_performed", false)]);
    assert.equal(evaluateApplicability(allowed, { ...WELDER_RULE, none: [{ field: "flag", in: ["activity_not_performed"] }] }).applicable, "yes");
    assert.equal(evaluateApplicability(drillOnly, { any: [{ field: "equipment", in: ["angle_grinder"] }] }).applicable, "no");
  });

  it("F. один и тот же инструмент из двух инструкций не дублируется, источники сохраняются", () => {
    const first = createInstruction(catalog, welderDraft());
    const second: InstructionRecord = {
      ...first,
      id: `${first.id}-fitter`,
      professionId: "repair_fitter",
      professionTitle: "Слесарь-ремонтник",
    };
    const profile = absorbInstruction(absorbInstruction(emptyProfile(), first), second);
    const matches = profile.facts.filter((fact) => fact.id === "equipment:angle_grinder");
    assert.equal(matches.length, 1);
    const sources = matches[0]?.sources.filter((source) => source.source === "instruction") ?? [];
    assert.deepEqual(sources.map((source) => source.sourceId).sort(), [first.id, second.id].sort());
    assert.equal(verdictOf(matches[0]), "yes");
    assert.equal(profile.gearIds.filter((id) => id === "angle_grinder").length, 1);
  });

  it("TEST 6. NONE: сварка есть, и её явно не исключали", () => {
    const rule: Applicability = {
      all: [{ field: "work", in: ["welding"] }],
      none: [{ field: "work", in: ["welding_explicitly_excluded"] }],
    };
    const welding = withFacts([confirm("work", "welding")]);
    const unknown = evaluateApplicability(welding, rule);
    assert.equal(unknown.applicable, "unknown");
    assert.ok(unknown.missing.includes("work:welding_explicitly_excluded"));

    const allowed = mergeFacts(welding, [confirm("work", "welding_explicitly_excluded", false)]);
    assert.equal(evaluateApplicability(allowed, rule).applicable, "yes");

    const blocked = mergeFacts(welding, [confirm("work", "welding_explicitly_excluded")]);
    const decision = evaluateApplicability(blocked, rule);
    assert.equal(decision.applicable, "no");
    assert.match(decision.reasons.join(" "), /welding_explicitly_excluded/);
  });

  it("признак flag проходит через тот же resolver, что и остальные поля", () => {
    const used = new Set<string>();
    const walk = (rule: Applicability) => {
      for (const atom of [...(rule.all ?? []), ...(rule.any ?? []), ...(rule.none ?? [])]) used.add(atom.field);
    };
    for (const document of organizationDocuments()) walk(document.applicability);
    for (const field of used) assert.equal(FACT_FIELDS.includes(field as (typeof FACT_FIELDS)[number]), true);
    assert.equal(used.has("flag"), true);
    const viaFlag = withFacts([confirm("flag", "powerTools")]);
    const viaGear = withFacts([confirm("equipment", "angle_grinder")]);
    const rule: Applicability = { any: [{ field: "flag", in: ["powerTools"] }, { field: "equipment", in: ["angle_grinder"] }] };
    const flagged = evaluateApplicability(viaFlag, rule);
    const geared = evaluateApplicability(viaGear, rule);
    assert.equal(flagged.applicable, "yes");
    assert.equal(geared.applicable, "yes");
    assert.ok(flagged.trace.facts.includes("flag:powerTools"));
    assert.ok(geared.trace.facts.includes("equipment:angle_grinder"));
    assert.equal(flagged.trace.result, "YES");
  });

  it("последнее явное решение пользователя по УШМ побеждает, история источников не теряется", () => {
    let tick = 0;
    setFactClock(() => `2026-03-01T00:00:${String(tick++).padStart(2, "0")}.000Z`);
    try {
      const record = createInstruction(catalog, welderDraft());
      let profile = absorbInstruction(emptyProfile(), record);
      profile = mergeFacts(profile, [confirm("equipment", "angle_grinder", true)]);
      profile = mergeFacts(profile, [confirm("equipment", "angle_grinder", false)]);
      profile = mergeFacts(profile, [confirm("equipment", "angle_grinder", true)]);
      const fact = findFact(profile, "equipment", "angle_grinder");
      assert.ok(fact);
      assert.equal(verdictOf(fact), "yes");
      assert.equal(winningSource(fact)?.source, "user");
      assert.equal(winningSource(fact)?.value, true);
      assert.equal(winningSource(fact)?.status, "confirmed");
      assert.equal(fact.sources.some((source) => source.source === "instruction" && source.value === true && source.sourceId === record.id), true);
      assert.equal(fact.sources.some((source) => source.source === "user" && source.value === false && source.status === "rejected"), true);
      assert.equal(fact.sources.some((source) => source.source === "user" && source.value === true && source.status === "confirmed"), true);
      assert.equal(profile.gearIds.includes("angle_grinder"), true);
    } finally {
      setFactClock(() => new Date().toISOString());
    }
  });

  it("у результата документа есть Decision Trace", () => {
    const ready = withFacts([confirm("profession", "welder"), confirm("work", "welding"), confirm("equipment", "angle_grinder")]);
    const decision = evaluateApplicability(ready, WELDER_RULE);
    assert.equal(decision.trace.result, "YES");
    assert.ok(decision.trace.facts.includes("profession:welder"));
    assert.ok(decision.trace.facts.includes("work:welding"));
    assert.ok(decision.trace.facts.includes("equipment:angle_grinder"));
    assert.ok(decision.trace.matchedRules.some((rule) => rule.group === "all" && rule.field === "profession"));
    assert.ok(decision.trace.matchedRules.some((rule) => rule.group === "any" && rule.field === "equipment"));
    assert.deepEqual(decision.trace.missing, []);
    assert.ok(decision.trace.sources.includes(USER));
    const item = buildPackage(ready).included.find((entry) => entry.document.code === "order_tools");
    assert.equal(item?.trace.result, "YES");
    assert.ok((item?.trace.facts.length ?? 0) > 0);
  });

  it("сохранённый профиль содержит schemaVersion без миграции", () => {
    const bucket = memory();
    const repo = createProfileRepository(bucket, "schema-profile");
    const saved = repo.setFact(emptyProfile(), confirm("profession", "cook"));
    assert.equal(saved.schemaVersion, 1);
    const raw = JSON.parse(bucket.getItem("schema-profile") ?? "{}") as { schemaVersion?: number };
    assert.equal(raw.schemaVersion, 1);
    assert.equal(repo.loadProfile().schemaVersion, 1);
    assert.equal(normalizeProfile({ name: "Школа № 1", professionIds: ["cook"] }).schemaVersion, 1);
    assert.equal(normalizeProfile({ schemaVersion: 1, facts: saved.facts }).schemaVersion, 1);
  });
});
