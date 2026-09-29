import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCatalog, createInstruction, deriveHazardIds, derivePpeIds, emptyDraft, ppeKey, selectionKey } from "../engine.ts";
import type { Draft } from "../types.ts";
import { renderCoreDocument } from "./generate/core-render.ts";
import { generateById, listGeneratorIds, registerGenerator } from "./generate/registry.ts";
import { fillTemplate, type GenerateContext } from "./generate/template.ts";
import { archivePath, packageFolderName, packageZipBlob } from "./generate/zip.ts";
import { CORE_OSH_DOCUMENTS } from "./modules/core-osh.ts";
import { buildPackage, listPackageExtensions } from "./registry.ts";
import { absorbInstruction } from "./profile.ts";
import { emptyProfile, mergeFacts } from "./facts.ts";
import { SHARED_REQUISITES } from "./requisites.ts";
import { createPackageSnapshot, missingRequirements, packageReadiness, workflowOf } from "./workflow.ts";
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

function contextFor(record: ReturnType<typeof createInstruction>): GenerateContext {
  return {
    instructions: [
      {
        id: record.id,
        professionId: record.professionId,
        professionTitle: record.professionTitle,
        number: record.number,
        date: record.snapshot.date,
        plain: record.snapshot.plain,
      },
    ],
    professionTitle: (id) => catalog.professions.find((item) => item.meta.id === id)?.meta.title ?? id,
    gearTitle: (id) => catalog.gears.find((item) => item.meta.id === id)?.meta.title ?? id,
    reason: "Документ требуется: профессия и оборудование подтверждены.",
    formedAt: "2026-04-01T12:00:00.000Z",
  };
}

const SHARED_ANSWERS: FactInput[] = [
  confirm("short_name", "value", "Ромашка"),
  confirm("city", "value", "Казань"),
  confirm("address", "value", "г. Казань, ул. Примерная, 1"),
  confirm("director", "value", "Иванов И.И."),
  confirm("director_title", "value", "Директор"),
  confirm("responsible", "value", "Петров П.П."),
  confirm("responsible_title", "value", "специалист по охране труда"),
  confirm("approval_date", "value", "2026-04-01"),
];

describe("первый коммерческий контур core_osh", () => {
  it("модуль зарегистрирован и все восемь документов идут через генератор", () => {
    const extension = listPackageExtensions().find((item) => item.id === "core_osh");
    assert.equal(extension?.title, "Базовая организация охраны труда");
    assert.equal(extension?.version, "1.0.0");
    const documents = extension?.documents ?? [];
    assert.equal(documents.length, 8);
    const shapes = new Set(documents.map((item) => item.shape));
    for (const shape of ["order", "policy", "list", "program"] as const) assert.equal(shapes.has(shape), true);
    for (const document of documents) {
      assert.equal(document.moduleId, "core_osh");
      assert.equal(document.commercialLevel, "PACKAGE");
      assert.equal(document.normativeStatus, "needs_review");
      assert.equal(document.generatorId, document.code);
      assert.equal(document.templateId, `tpl_${document.code}`);
      assert.deepEqual(document.requiredData?.map((item) => item.id), SHARED_REQUISITES.map((item) => item.id));
      assert.ok(listGeneratorIds().includes(document.generatorId!));
    }
  });

  it("общие реквизиты спрашиваются один раз, перечни и электроинструмент берутся из профиля", () => {
    const record = createInstruction(catalog, welderDraft());
    let profile = absorbInstruction(emptyProfile(), record);
    assert.equal(profile.name, "ООО «Ромашка»");
    assert.ok(profile.gearIds.includes("angle_grinder"));

    const pack = buildPackage(profile);
    const free = pack.included.find((item) => item.document.code === "iot_electrogas_welder");
    assert.equal(free?.document.commercialLevel, "FREE");
    assert.equal(free?.status, "ready");

    const before = packageReadiness(pack.items, profile, []);
    assert.equal(before.needsData.length, 8);
    assert.equal(before.clarify.length, 0);
    const missing = missingRequirements(profile, before.needsData[0]!.item.document).map((item) => item.id);
    assert.equal(missing.includes("organization.name"), false);
    assert.ok(missing.includes("organization.director"));
    assert.ok(missing.includes("organization.shortName"));
    assert.deepEqual(missingRequirements(profile, CORE_OSH_DOCUMENTS[0]!).map((item) => item.id), missing);

    profile = mergeFacts(profile, SHARED_ANSWERS);
    const readyPack = buildPackage(profile);
    const ready = packageReadiness(readyPack.items, profile, []);
    assert.equal(ready.needsData.length, 0);
    assert.equal(ready.ready.length, 8);
    assert.ok(ready.ready.some((row) => row.item.document.code === "osh_order_power_tools"));

    const context = contextFor(record);
    const positions = generateById("osh_list_positions", profile, ready.ready.find((row) => row.item.document.code === "osh_list_positions")!.item.document, context);
    assert.match(positions.blocks.map((block) => block.text).join("\n"), /Электрогазосварщик/);
    const instructions = generateById("osh_list_instructions", profile, ready.ready.find((row) => row.item.document.code === "osh_list_instructions")!.item.document, context);
    const instructionText = instructions.blocks.map((block) => block.text).join("\n");
    assert.match(instructionText, /ИОТ-СВ-01/);
    assert.match(instructionText, /Электрогазосварщик/);
    const tools = generateById("osh_order_power_tools", profile, ready.ready.find((row) => row.item.document.code === "osh_order_power_tools")!.item.document, context);
    const toolText = tools.blocks.map((block) => block.text).join("\n");
    assert.match(toolText, /УШМ|шлифовальн/i);
    assert.equal(tools.normativeStatus, "needs_review");
    assert.doesNotMatch(toolText, /ГОСТ|приказ Минтруда|№\s*\d+/i);
    const order = generateById("osh_order_responsible", profile, ready.ready[0]!.item.document.code === "osh_order_responsible" ? ready.ready[0]!.item.document : CORE_OSH_DOCUMENTS[0]!, context);
    const orderText = order.blocks.map((block) => block.text).join("\n");
    assert.match(orderText, /Ромашка/);
    assert.match(orderText, /Иванов И\.И\./);
    assert.match(orderText, /Петров П\.П\./);
    assert.match(orderText, /01\.04\.2026/);
    assert.equal(order.formedAt, "2026-04-01T12:00:00.000Z");

    const snapshot = createPackageSnapshot(profile, readyPack, "2026-04-01T12:00:00.000Z");
    assert.equal(snapshot.profileVersion, 1);
    assert.ok(snapshot.documents.some((item) => item.code === "osh_list_positions"));
  });

  it("нет электроинструмента — документ не входит, генератор сам это не решает", () => {
    const unknown = buildPackage(emptyProfile());
    const pending = unknown.items.find((item) => item.document.code === "osh_order_power_tools");
    assert.equal(pending?.match, "unknown");
    assert.equal(workflowOf(pending!, emptyProfile(), []), "clarify");

    const blocked = mergeFacts(emptyProfile(), [
      confirm("equipment", "angle_grinder", false),
      confirm("equipment", "drill", false),
      confirm("flag", "powerTools", false),
    ]);
    assert.equal(buildPackage(blocked).items.some((item) => item.document.code === "osh_order_power_tools"), false);
    const anyway = renderCoreDocument(blocked, CORE_OSH_DOCUMENTS.find((item) => item.code === "osh_order_power_tools")!);
    assert.ok(anyway.blocks.length > 3);

    const order = CORE_OSH_DOCUMENTS[0]!;
    assert.match(generateById(order.generatorId!, emptyProfile(), order).blocks.map((block) => block.text).join("\n"), /не указано/);
    registerGenerator({
      id: "demo_next",
      templateId: "tpl_demo_next",
      generate() {
        return fillTemplate({ id: "tpl_demo_next", title: "Следующий документ", filename: "next", blocks: [{ kind: "body", text: "подключён" }] }, {});
      },
    });
    assert.equal(generateById("demo_next", emptyProfile(), { ...order, generatorId: "demo_next", templateId: "tpl_demo_next" }).blocks[0]?.text, "подключён");
  });

  it("архив раскладывает документы по папкам и не молчит о неготовых", () => {
    assert.equal(packageFolderName("ООО «Ромашка»"), "Пакет_ОТ_ООО_Ромашка");
    assert.equal(archivePath("ООО «Ромашка»", "order", "prikaz-obyazannosti-ot"), "Пакет_ОТ_ООО_Ромашка/01_Приказы/prikaz-obyazannosti-ot.docx");
    assert.equal(archivePath("ООО «Ромашка»", "policy", "polozhenie-suot"), "Пакет_ОТ_ООО_Ромашка/02_Положения/polozhenie-suot.docx");
    assert.equal(archivePath("ООО «Ромашка»", "program", "programma"), "Пакет_ОТ_ООО_Ромашка/03_Программы/programma.docx");
    assert.equal(archivePath("ООО «Ромашка»", "list", "perechen"), "Пакет_ОТ_ООО_Ромашка/04_Перечни/perechen.docx");
    assert.equal(archivePath("ООО «Ромашка»", "instruction", "iot"), "Пакет_ОТ_ООО_Ромашка/05_Инструкции/iot.docx");

    const record = createInstruction(catalog, welderDraft());
    const profile = absorbInstruction(emptyProfile(), record);
    const readiness = packageReadiness(buildPackage(profile).items, profile, []);
    assert.ok(readiness.needsData.length > 0);
    assert.equal(readiness.ready.length, 0);
  });

  it("zip собирает docx восьми документов и инструкцию сварщика", async () => {
    const record = createInstruction(catalog, welderDraft());
    let profile = absorbInstruction(emptyProfile(), record);
    profile = mergeFacts(profile, SHARED_ANSWERS);
    const pack = buildPackage(profile);
    const context = contextFor(record);
    const produced = pack.items
      .filter((item) => item.document.moduleId === "core_osh" && item.match === "yes")
      .map((item) => ({ document: renderCoreDocument(profile, item.document, context), shape: item.document.shape }));
    assert.equal(produced.length, 8);
    const blob = await packageZipBlob(profile.name, produced, context.instructions);
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    const names = Object.keys(zip.files).filter((name) => !name.endsWith("/"));
    assert.equal(names.length, 9);
    for (const folder of ["01_Приказы/", "02_Положения/", "03_Программы/", "04_Перечни/", "05_Инструкции/"]) {
      assert.ok(names.some((name) => name.includes(folder)), folder);
    }
    const instructionFile = names.find((name) => name.includes("05_Инструкции/"));
    const orderFile = names.find((name) => name.includes("01_Приказы/prikaz-elektroinstrument"));
    assert.ok(instructionFile);
    assert.ok(orderFile);
    const instructionXml = await JSZip.loadAsync(await zip.file(instructionFile)!.async("uint8array")).then((file) => file.file("word/document.xml")!.async("string"));
    const orderXml = await JSZip.loadAsync(await zip.file(orderFile)!.async("uint8array")).then((file) => file.file("word/document.xml")!.async("string"));
    assert.match(instructionXml, /Электрогазосварщик/);
    assert.match(orderXml, /шлифовальн|УШМ/);
    assert.doesNotMatch(orderXml, /ГОСТ|приказ Минтруда/);
  });
});
