import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCatalog, createInstruction, deriveHazardIds, derivePpeIds, emptyDraft, ppeKey, selectionKey } from "../engine.ts";
import type { Draft } from "../types.ts";
import { matchApplicability } from "./applicability.ts";
import { buildPackage, registerPackageModule } from "./registry.ts";
import { absorbInstruction, applyPreset, emptyFlags, emptyProfile, inferProfile, normalizeProfile } from "./profile.ts";
import { PRESETS, presetById } from "./presets.ts";
import type { DocumentModule, OrganizationProfile } from "./types.ts";

const catalog = buildCatalog();

function codes(profile: OrganizationProfile) {
  return buildPackage(profile).included.map((item) => item.document.code).sort();
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

describe("пакет документов", () => {
  it("две школы с одной отраслью получают разный состав только из-за профиля", () => {
    const school = presetById("school");
    assert.ok(school);
    const full = applyPreset(emptyProfile(), school);
    const small = inferProfile({
      ...emptyProfile(),
      name: "Школа без транспорта",
      industry: "Образование",
      activity: "Общее образование",
      professionIds: ["cleaner_office"],
      workIds: ["work_cleaning"],
      gearIds: ["cleaning_agents"],
      conditionIds: ["cond_indoor"],
      flags: {
        ...emptyFlags(),
        height: false,
        electrical: false,
        food: false,
        warehouse: false,
        production: false,
        transport: false,
        hazardousWork: false,
        sout: false,
        medical: false,
        powerTools: false,
        ppe: true,
      },
    });
    assert.equal(full.industry, "Образование");
    assert.equal(small.industry, "Образование");
    const fullCodes = codes(full);
    const smallCodes = codes(small);
    assert.notDeepEqual(fullCodes, smallCodes);
    assert.ok(fullCodes.includes("iot_cook"));
    assert.ok(fullCodes.includes("iot_car_driver"));
    assert.ok(fullCodes.includes("order_height"));
    assert.equal(smallCodes.includes("iot_cook"), false);
    assert.equal(smallCodes.includes("iot_car_driver"), false);
    assert.equal(smallCodes.includes("order_height"), false);
    assert.equal(smallCodes.includes("order_food"), false);
    assert.ok(smallCodes.includes("iot_cleaner_office"));
    assert.equal(buildPackage(small).included.find((item) => item.document.code === "iot_cleaner_office")?.status, "ready");
    assert.equal(buildPackage(full).included.find((item) => item.document.code === "order_height")?.status, "locked");
  });

  it("пресет не является готовым пакетом", () => {
    for (const preset of PRESETS) {
      assert.equal(Object.hasOwn(preset, "documents"), false);
      assert.equal("applicability" in preset, false);
    }
    const school = presetById("school");
    assert.ok(school);
    const filled = applyPreset(emptyProfile(), school);
    const withCook = codes(filled);
    const withoutCook = codes(
      inferProfile({
        ...filled,
        professionIds: filled.professionIds.filter((id) => id !== "cook"),
        workIds: filled.workIds.filter((id) => id !== "work_kitchen"),
        conditionIds: filled.conditionIds.filter((id) => id !== "cond_hot_kitchen"),
        flags: { ...filled.flags, food: false },
      }),
    );
    assert.ok(withCook.includes("iot_cook"));
    assert.equal(withoutCook.includes("iot_cook"), false);
    assert.equal(withoutCook.includes("order_food"), false);
    assert.deepEqual(codes(filled), codes(applyPreset(emptyProfile(), school)));
  });

  it("инструкция сварщика пополняет профиль и не спрашивается заново", () => {
    const record = createInstruction(catalog, welderDraft());
    const once = absorbInstruction(emptyProfile(), record);
    const twice = absorbInstruction(once, record);
    assert.deepEqual(twice.instructionIds, [record.id]);
    assert.deepEqual(twice.professionIds, ["electrogas_welder"]);
    assert.ok(twice.gearIds.includes("angle_grinder"));
    assert.ok(twice.gearIds.includes("welding_machine"));
    assert.ok(twice.workIds.includes("work_manual_arc"));
    assert.ok(twice.conditionIds.includes("cond_hot_zone"));
    assert.equal(twice.name, "ООО «Ромашка»");
    assert.equal(twice.flags.powerTools, true);
    assert.equal(twice.flags.hazardousWork, true);
    const pack = buildPackage(twice);
    assert.ok(pack.included.some((item) => item.document.code === "iot_electrogas_welder" && item.document.commercialLevel === "FREE"));
    assert.equal(pack.included.some((item) => item.document.code === "iot_car_driver"), false);
  });

  it("новый модуль добавляется реестром и срабатывает только по своему правилу", () => {
    const lift: DocumentModule = {
      code: "auto_lift_order",
      name: "Приказ о безопасной эксплуатации подъёмника",
      category: "hazardous",
      shape: "order",
      version: "1.0.0",
      status: "active",
      applicability: { anyOf: [{ gearIds: ["vehicle_lift"] }] },
      dependencies: [],
      normativeBasis: "Нормативное основание требует проверки",
      template: null,
      generator: "none",
      commercialLevel: "PRO",
      optional: false,
      moduleId: "auto_service",
    };
    registerPackageModule({ id: "auto_service", title: "Автосервис", documents: [lift] });
    assert.equal(codes(emptyProfile()).includes("auto_lift_order"), false);
    const withLift = inferProfile({ ...emptyProfile(), gearIds: ["vehicle_lift"] });
    const item = buildPackage(withLift).included.find((entry) => entry.document.code === "auto_lift_order");
    assert.ok(item);
    assert.equal(item.status, "locked");
    assert.equal(item.document.moduleId, "auto_service");
    assert.equal(codes(withLift).includes("order_height"), false);
  });

  it("незаполненный признак просит уточнение, а явный отказ исключает документ", () => {
    const rule = { anyOf: [{ flags: { height: true } }, { gearIds: ["ladder"] }] };
    assert.equal(matchApplicability(emptyProfile(), rule), "unknown");
    assert.equal(matchApplicability(inferProfile({ ...emptyProfile(), flags: { ...emptyFlags(), height: false } }), rule), "no");
    assert.equal(matchApplicability({ ...emptyProfile(), headcount: null }, { anyOf: [{ minHeadcount: 50 }] }), "unknown");
    assert.equal(matchApplicability({ ...emptyProfile(), headcount: 12 }, { anyOf: [{ minHeadcount: 50 }] }), "no");
    assert.equal(matchApplicability({ ...emptyProfile(), headcount: 50 }, { anyOf: [{ minHeadcount: 50 }] }), "yes");
  });

  it("старый профиль без новых полей не теряет название и профессии", () => {
    const profile = normalizeProfile({ name: "Школа № 1", professionIds: ["cook"], flags: { food: false } });
    assert.equal(profile.name, "Школа № 1");
    assert.deepEqual(profile.professionIds, ["cook"]);
    assert.equal(profile.flags.food, false);
    assert.equal(profile.flags.height, null);
    assert.equal(profile.flags.ppe, true);
    assert.deepEqual(profile.instructionIds, []);
  });
});
