import { LIBRARY } from "./library";
import { professions } from "./professions";
import { updates } from "./updates";
import type {
  AssembledInstruction,
  Catalog,
  CustomHazard,
  CustomItem,
  DocBlock,
  Draft,
  GearKind,
  InstructionRecord,
  ModuleMeta,
  ModuleStatus,
  NormUpdate,
  Profession,
  QualityIssue,
  SafetyPoint,
  SoutRow,
} from "./types";

export interface Overrides {
  pointText: Record<string, string>;
  moduleStatus: Record<string, ModuleStatus>;
  moduleVersion: Record<string, string>;
  moduleChangelog: Record<string, ModuleMeta["changelog"]>;
  regulationStatus: Record<string, ModuleStatus>;
  updateStatus: Record<string, NormUpdate["status"]>;
  updateReview: Record<string, { name: string; comment: string }>;
  customProfessions: Profession[];
}

export const emptyOverrides = (): Overrides => ({
  pointText: {},
  moduleStatus: {},
  moduleVersion: {},
  moduleChangelog: {},
  regulationStatus: {},
  updateStatus: {},
  updateReview: {},
  customProfessions: [],
});

function applyMeta(item: ModuleMeta, overrides: Overrides): ModuleMeta {
  const version = overrides.moduleVersion[item.id] ?? item.version;
  const status = overrides.moduleStatus[item.id] ?? item.status;
  const changelog = overrides.moduleChangelog[item.id] ?? item.changelog;
  return { ...item, version, status, changelog, updatedAt: changelog.at(-1)?.date ?? item.updatedAt };
}

function mapPoints(points: SafetyPoint[], overrides: Overrides): SafetyPoint[] {
  return points.map((point) => ({
    ...point,
    text: overrides.pointText[point.id] ?? point.text,
  }));
}

export function buildCatalog(overrides: Overrides = emptyOverrides()): Catalog {
  const regulations = LIBRARY.regulations.map((item) => ({
    ...item,
    status: overrides.regulationStatus[item.id] ?? item.status,
  }));
  return {
    regulations,
    hazards: LIBRARY.hazards.map((item) => ({
      ...item,
      meta: applyMeta(item.meta, overrides),
      measures: mapPoints(item.measures, overrides),
    })),
    risks: LIBRARY.risks.map((item) => ({ ...item, meta: applyMeta(item.meta, overrides) })),
    ppe: LIBRARY.ppe.map((item) => ({ ...item, meta: applyMeta(item.meta, overrides) })),
    emergencies: LIBRARY.emergencies.map((item) => ({ ...item, meta: applyMeta(item.meta, overrides) })),
    works: LIBRARY.works.map((item) => ({
      ...item,
      meta: applyMeta(item.meta, overrides),
      beforePoints: mapPoints(item.beforePoints, overrides),
      duringPoints: mapPoints(item.duringPoints, overrides),
      afterPoints: mapPoints(item.afterPoints, overrides),
    })),
    gears: LIBRARY.gears.map((item) => ({
      ...item,
      meta: applyMeta(item.meta, overrides),
      beforePoints: mapPoints(item.beforePoints, overrides),
      duringPoints: mapPoints(item.duringPoints, overrides),
      afterPoints: mapPoints(item.afterPoints, overrides),
    })),
    conditions: LIBRARY.conditions.map((item) => ({
      ...item,
      meta: applyMeta(item.meta, overrides),
      beforePoints: mapPoints(item.beforePoints, overrides),
      duringPoints: mapPoints(item.duringPoints, overrides),
      afterPoints: mapPoints(item.afterPoints, overrides),
    })),
    professions: [...professions, ...overrides.customProfessions].map((item) => ({
      ...item,
      meta: applyMeta(item.meta, overrides),
    })),
    updates: updates.map((item) => ({
      ...item,
      status: overrides.updateStatus[item.id] ?? item.status,
    })),
  };
}

export function emptyDraft(): Draft {
  return {
    orgName: "",
    docNumber: "",
    professionId: null,
    customProfession: "",
    workIds: [],
    gearIds: [],
    conditionIds: [],
    hazardIds: [],
    hazardKey: "",
    customHazards: [],
    customGear: [],
    customWorks: [],
    ppeIds: [],
    ppeKey: "",
    customPpe: [],
    sout: [],
  };
}

export function selectionKey(draft: Draft): string {
  return [draft.professionId, draft.workIds.join("."), draft.gearIds.join("."), draft.conditionIds.join(".")].join("|");
}

export function ppeKey(draft: Draft): string {
  return `${selectionKey(draft)}|${draft.hazardIds.join(".")}`;
}

export function deriveHazardIds(catalog: Catalog, draft: Draft): string[] {
  const ids = new Set<string>();
  for (const id of draft.workIds) {
    catalog.works.find((item) => item.meta.id === id)?.hazardIds.forEach((hazard) => ids.add(hazard));
  }
  for (const id of draft.gearIds) {
    catalog.gears.find((item) => item.meta.id === id)?.hazardIds.forEach((hazard) => ids.add(hazard));
  }
  for (const id of draft.conditionIds) {
    catalog.conditions.find((item) => item.meta.id === id)?.hazardIds.forEach((hazard) => ids.add(hazard));
  }
  return [...ids];
}

export function derivePpeIds(catalog: Catalog, draft: Draft): string[] {
  const ids = new Set<string>();
  for (const id of draft.hazardIds) {
    catalog.hazards.find((item) => item.meta.id === id)?.ppeIds.forEach((ppe) => ids.add(ppe));
  }
  for (const id of draft.gearIds) {
    catalog.gears.find((item) => item.meta.id === id)?.ppeIds.forEach((ppe) => ids.add(ppe));
  }
  for (const id of draft.workIds) {
    catalog.works.find((item) => item.meta.id === id)?.ppeIds.forEach((ppe) => ids.add(ppe));
  }
  for (const id of draft.conditionIds) {
    catalog.conditions.find((item) => item.meta.id === id)?.ppeIds.forEach((ppe) => ids.add(ppe));
  }
  return [...ids];
}

export function professionTitle(catalog: Catalog, draft: Draft): string {
  if (draft.customProfession.trim()) return draft.customProfession.trim();
  return catalog.professions.find((item) => item.meta.id === draft.professionId)?.meta.title ?? "Профессия не выбрана";
}

function normNote(catalog: Catalog, regulationIds: string[]): string {
  if (regulationIds.length === 0) return "Нормативное основание требует проверки";
  const labels = regulationIds.map((id) => {
    const reg = catalog.regulations.find((item) => item.id === id);
    if (!reg) return "Нормативное основание требует проверки";
    if (reg.status !== "active") return `${reg.kind} ${reg.number} — статус ${reg.status}, основание требует проверки`;
    return `${reg.kind} ${reg.publisher} от ${reg.date} № ${reg.number}`;
  });
  return labels.join("; ");
}

function block(
  catalog: Catalog,
  meta: ModuleMeta,
  heading: string,
  points: SafetyPoint[],
): DocBlock | null {
  if (points.length === 0) return null;
  return {
    moduleId: meta.id,
    ownerProfessionId: null,
    heading,
    points: points.map((point) => ({ id: point.id, text: point.text, hazardIds: point.hazardIds })),
    normativeNote: normNote(catalog, meta.regulationIds),
  };
}

function dedupePoints(points: SafetyPoint[]): SafetyPoint[] {
  const seen = new Set<string>();
  const result: SafetyPoint[] = [];
  for (const point of points) {
    const key = point.text.replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(point);
  }
  return result;
}

export function assemble(catalog: Catalog, draft: Draft, date = new Date()): AssembledInstruction {
  const profession = catalog.professions.find((item) => item.meta.id === draft.professionId) ?? null;
  const title = professionTitle(catalog, draft);
  const works = catalog.works.filter((item) => draft.workIds.includes(item.meta.id));
  const gears = catalog.gears.filter((item) => draft.gearIds.includes(item.meta.id));
  const conditions = catalog.conditions.filter((item) => draft.conditionIds.includes(item.meta.id));
  const hazards = catalog.hazards.filter((item) => draft.hazardIds.includes(item.meta.id));
  const risks = catalog.risks.filter((item) => draft.hazardIds.includes(item.hazardId));
  const ppe = catalog.ppe.filter((item) => draft.ppeIds.includes(item.meta.id));

  const generalPoints: SafetyPoint[] = [
    {
      id: "gen.scope",
      text: `Инструкция распространяется на работника по профессии «${title}» при выполнении только тех работ, с тем оборудованием и в тех условиях, которые перечислены в этом документе. Работы и оборудование, не указанные здесь, настоящей инструкцией не разрешаются.`,
      hazardIds: [],
    },
    ...(profession?.workerRequirements ?? []).map((text, index) => ({
      id: `gen.worker.${index}`,
      text,
      hazardIds: [] as string[],
    })),
    ...((profession?.admission.length ? profession.admission : [
      "Допуск к работе оформляют по локальному порядку работодателя после обучения, стажировки и проверки знаний в объёме порученной работы.",
    ]).map((text, index) => ({ id: `gen.admit.${index}`, text, hazardIds: [] as string[] }))),
  ];
  const workRest = profession?.workRest;
  if (workRest) {
    generalPoints.push({ id: "gen.rest", text: workRest, hazardIds: [] });
  }
  generalPoints.push({
    id: "gen.notify",
    text: "О неисправности, травме, признаках пожара, утечке и любой угрозе работник немедленно сообщает непосредственному руководителю, а при угрозе жизни — также оповещает находящихся рядом. Работу до устранения угрозы не продолжают.",
    hazardIds: [],
  });
  for (const line of profession?.hygiene ?? [
    "Руки моют до еды и в конце смены. Пищу на рабочем месте не хранят.",
  ]) {
    generalPoints.push({ id: `gen.hyg.${line.slice(0, 12)}`, text: line, hazardIds: [] });
  }
  for (const line of profession?.extras ?? []) {
    generalPoints.push({ id: `gen.extra.${line.slice(0, 16)}`, text: line, hazardIds: [] });
  }

  const hazardList = hazards.map((item) => ({
    id: `gen.haz.${item.meta.id}`,
    text: `${item.meta.title}. Источник: ${item.source}. Возможное событие: ${item.event}.`,
    hazardIds: [item.meta.id],
  }));
  const customHazardPoints = draft.customHazards.map((item) => ({
    id: `gen.customhaz.${item.id}`,
    text: `${item.title}. Источник: ${item.source}. Возможное событие: ${item.event}.`,
    hazardIds: [item.id],
  }));
  const measures = hazards.flatMap((item) => item.measures);
  const customMeasures = draft.customHazards.filter((item) => item.measure.trim()).map((item) => ({
    id: `gen.custommeas.${item.id}`,
    text: item.measure.trim(),
    hazardIds: [item.id],
  }));
  const riskPoints = risks.map((item) => ({
    id: `gen.risk.${item.meta.id}`,
    text: `${item.meta.title}. Возможный уровень для проекта: ${item.level}. Последствие: ${item.consequence}. Это не заменяет утверждённую работодателем оценку профессиональных рисков.`,
    hazardIds: [item.hazardId],
  }));
  const harmful = hazards.filter((item) => item.factorKind === "harmful").map((item) => item.meta.title);
  const dangerous = hazards.filter((item) => item.factorKind === "dangerous").map((item) => item.meta.title);
  const factorPoint: SafetyPoint = {
    id: "gen.factors",
    text: `Вредные факторы по выбранным опасностям: ${harmful.join("; ") || "не выявлены в подтверждённом перечне"}. Опасные факторы: ${dangerous.join("; ") || "не выявлены в подтверждённом перечне"}.`,
    hazardIds: hazards.map((item) => item.meta.id),
  };
  const ppePoint: SafetyPoint = {
    id: "gen.ppe",
    text:
      ppe.length + draft.customPpe.length === 0
        ? "СИЗ по подтверждённым опасностям не выбраны."
        : `Применять подтверждённые СИЗ: ${[...ppe.map((item) => item.meta.title), ...draft.customPpe].join("; ")}. Перечень не является юридическим заключением о нормах выдачи и подлежит проверке по результатам СОУТ, оценки рисков и нормам, действующим у работодателя.`,
    hazardIds: [],
  };
  const soutPoint: SafetyPoint = {
    id: "gen.sout",
    text:
      draft.sout.length === 0
        ? "Сведения СОУТ в проект не внесены. Их заполняют по карте специальной оценки. СОУТ не подменяет оценку профессиональных рисков: в документе эти сведения разделены."
        : `По карте СОУТ, внесённой в проект: ${draft.sout
            .map((row) => `${row.factor}, класс ${row.laborClass}, источник: ${row.source}${row.note ? `, ${row.note}` : ""}`)
            .join("; ")}. Эти сведения не являются оценкой профессиональных рисков.`,
    hazardIds: [],
  };

  const general = block(catalog, { ...structuralMeta(), regulationIds: [] }, "Общие положения", [
    ...generalPoints,
    ...hazardList,
    ...customHazardPoints,
    ...measures,
    ...customMeasures,
    ...riskPoints,
    factorPoint,
    ppePoint,
    soutPoint,
  ]);

  const before = [
    block(catalog, structuralMeta(), "Перед началом работы", dedupePoints([
      ...works.flatMap((item) => item.beforePoints),
      ...gears.flatMap((item) => item.beforePoints),
      ...conditions.flatMap((item) => item.beforePoints),
      ...customBefore(draft.customGear, draft.customWorks),
    ])),
  ].filter(Boolean) as DocBlock[];

  const during = [
    ...works.map((item) => block(catalog, item.meta, item.meta.title, item.duringPoints)),
    ...gears.map((item) => block(catalog, item.meta, item.meta.title, item.duringPoints)),
    ...conditions.map((item) => block(catalog, item.meta, item.meta.title, item.duringPoints)),
    ...draft.customWorks.filter((item) => item.title.trim()).map((item) => customBlock(item, "work")),
    ...draft.customGear.filter((item) => item.title.trim()).map((item) => customBlock(item, "gear")),
  ].filter(Boolean) as DocBlock[];

  const emergencyIds = new Set<string>();
  for (const item of [...works, ...gears, ...conditions]) item.emergencyIds.forEach((id) => emergencyIds.add(id));
  const emergency = catalog.emergencies
    .filter((item) => emergencyIds.has(item.meta.id))
    .map((item) =>
      block(
        catalog,
        item.meta,
        item.meta.title,
        item.steps.map((text, index) => ({ id: `${item.meta.id}.s${index + 1}`, text, hazardIds: item.hazardIds })),
      ),
    )
    .filter(Boolean) as DocBlock[];

  const after = [
    block(catalog, structuralMeta(), "По окончании работы", dedupePoints([
      ...works.flatMap((item) => item.afterPoints),
      ...gears.flatMap((item) => item.afterPoints),
      ...conditions.flatMap((item) => item.afterPoints),
      {
        id: "after.notify",
        text: "Сообщить руководителю о неисправностях, отказах и случаях, которые случились в смене.",
        hazardIds: [],
      },
      ...draft.customGear.filter((item) => item.title.trim()).map((item) => ({
        id: `after.custom.${item.id}`,
        text: `Оборудование «${item.title.trim()}» остановить способом, указанным изготовителем, отключить питание или перекрыть подачу среды и убрать из прохода.`,
        hazardIds: [] as string[],
      })),
    ])),
  ].filter(Boolean) as DocBlock[];

  const usedRegs = new Map<string, { needsCheck: boolean }>();
  usedRegs.set("reg-772n", { needsCheck: false });
  const collect = (ids: string[]) => {
    if (ids.length === 0) return;
    for (const id of ids) {
      const reg = catalog.regulations.find((item) => item.id === id);
      usedRegs.set(id, { needsCheck: !reg || reg.status !== "active" });
    }
  };
  for (const item of [...works, ...gears, ...conditions, ...hazards]) collect(item.meta.regulationIds);

  const moduleVersions = [
    ...(profession ? [versionOf(profession.meta)] : []),
    ...works.map((item) => versionOf(item.meta)),
    ...gears.map((item) => versionOf(item.meta)),
    ...conditions.map((item) => versionOf(item.meta)),
    ...hazards.map((item) => versionOf(item.meta)),
    ...risks.map((item) => versionOf(item.meta)),
    ...ppe.map((item) => versionOf(item.meta)),
    ...catalog.emergencies.filter((item) => emergencyIds.has(item.meta.id)).map((item) => versionOf(item.meta)),
  ];

  const sections = {
    general: general ? [general] : [],
    before,
    during,
    emergency,
    after,
  };
  collapseNotes(sections);

  const doc: AssembledInstruction = {
    title: `Инструкция по охране труда для профессии «${title}»`,
    professionTitle: title,
    orgName: draft.orgName.trim() || "Организация не указана",
    number: draft.docNumber.trim() || "без номера",
    date: date.toLocaleDateString("ru-RU"),
    disclaimer:
      "Проект локальной инструкции собран конструктором ychy-pro.ru из подтверждённых модулей. Перед утверждением работодатель проверяет текст по фактическим условиям, карте СОУТ, оценке профессиональных рисков, эксплуатационной документации изготовителей и действующим нормативным актам. Модель не заменяет эту проверку.",
    basis:
      "Структура из пяти разделов задана как проект по приказу Минтруда России от 29.10.2021 № 772н (действует до 1 марта 2028 г.). Операционные меры, у которых в модуле нет подтверждённой ссылки, помечены: «Нормативное основание требует проверки». Номера пунктов других документов в текст не подставляются.",
    sections,
    hazards: [
      ...hazards.map((item) => ({
        id: item.meta.id,
        title: item.meta.title,
        source: item.source,
        event: item.event,
        factorKind: item.factorKind,
        measures: item.measures.map((point) => point.text),
      })),
      ...draft.customHazards.map((item) => ({
        id: item.id,
        title: item.title,
        source: item.source,
        event: item.event,
        factorKind: "уточняется",
        measures: item.measure.trim() ? [item.measure.trim()] : [],
      })),
    ],
    risks: [
      ...risks.map((item) => ({
        id: item.meta.id,
        title: item.meta.title,
        level: item.level,
        consequence: item.consequence,
        controls: item.controls,
      })),
      ...draft.customHazards.map((item) => ({
        id: `risk-${item.id}`,
        title: `Риск: ${(item.event || item.title).toLowerCase()}`,
        level: "требует оценки",
        consequence: item.event || "не описано",
        controls: item.measure.trim() || "Мера не задана",
      })),
    ],
    sout: draft.sout,
    ppe: [
      ...ppe.map((item) => ({ id: item.meta.id, title: item.meta.title, purpose: item.purpose })),
      ...draft.customPpe.map((item, index) => ({ id: `custom-ppe-${index}`, title: item, purpose: "Добавлено вручную, норма выдачи требует проверки" })),
    ],
    works: works.map((item) => ({ id: item.meta.id, title: item.meta.title })),
    gears: gears.map((item) => ({ id: item.meta.id, title: item.meta.title, kind: item.kind })),
    conditions: conditions.map((item) => ({ id: item.meta.id, title: item.meta.title })),
    regulations: [...usedRegs.entries()].map(([id, flags]) => {
      const reg = catalog.regulations.find((item) => item.id === id);
      return {
        id,
        label: reg ? `${reg.kind} от ${reg.date} № ${reg.number}. ${reg.title}` : id,
        status: reg?.status ?? "draft",
        needsCheck: flags.needsCheck || !reg,
        officialSource: reg?.officialSource ?? "",
      };
    }),
    moduleVersions,
    plain: "",
  };
  doc.plain = toPlain(doc);
  return doc;
}

function collapseNotes(sections: AssembledInstruction["sections"]) {
  for (const blocks of Object.values(sections)) {
    const seen = new Set<string>();
    for (const item of blocks) {
      const note = item.normativeNote.trim();
      if (!note || seen.has(note)) item.normativeNote = "";
      else seen.add(note);
    }
  }
}

function customBefore(gear: CustomItem[], works: CustomItem[]): SafetyPoint[] {
  return [...gear, ...works].filter((item) => item.title.trim()).map((item) => ({
    id: `before.custom.${item.id}`,
    text: `Осмотреть «${item.title.trim()}» по руководству изготовителя: нет повреждений, оснастка штатная, рабочая зона свободна. При повреждении не начинать.`,
    hazardIds: [],
  }));
}

function customBlock(item: CustomItem, kind: "work" | "gear"): DocBlock {
  const name = item.title.trim();
  const measure = item.measure.trim();
  return {
    moduleId: `custom-${kind}-${item.id}`,
    ownerProfessionId: null,
    heading: name,
    points: [
      {
        id: `custom.${item.id}`,
        text: measure || `Для «${name}» мера безопасности не задана.`,
        hazardIds: [],
      },
    ],
    normativeNote: "Нормативное основание требует проверки",
  };
}

function structuralMeta(): ModuleMeta {
  return {
    id: "iot_structure",
    title: "Структура инструкции",
    version: "1.0.0",
    createdAt: "2026-09-26",
    updatedAt: "2026-09-26",
    status: "active",
    regulationIds: [],
    verifiedAt: "2026-09-26",
    author: "ychy-pro.ru",
    changelog: [],
  };
}

function versionOf(meta: ModuleMeta) {
  return { id: meta.id, title: meta.title, version: meta.version, status: meta.status };
}

const SECTION_TITLE = {
  general: "1. Общие требования охраны труда",
  before: "2. Требования охраны труда перед началом работы",
  during: "3. Требования охраны труда во время работы",
  emergency: "4. Требования охраны труда в аварийных ситуациях",
  after: "5. Требования охраны труда по окончании работы",
} as const;

export const APPROVAL_LINES = [
  "УТВЕРЖДАЮ",
  "Должность _______________",
  "Подпись _______________",
  "ФИО _______________",
  "Дата _______________",
] as const;

export function toPlain(doc: AssembledInstruction): string {
  const lines: string[] = [
    ...APPROVAL_LINES,
    "",
    doc.orgName,
    doc.title,
    `Номер: ${doc.number}`,
    `Дата формирования: ${doc.date}`,
    "Сформировано конструктором ychy-pro.ru",
    "",
    doc.basis,
    "",
    doc.disclaimer,
    "",
  ];
  (Object.keys(SECTION_TITLE) as (keyof typeof SECTION_TITLE)[]).forEach((key) => {
    lines.push(SECTION_TITLE[key]);
    let n = 1;
    for (const block of doc.sections[key]) {
      if (block.heading && key !== "general" && key !== "before" && key !== "after") {
        lines.push("");
        lines.push(block.heading);
      }
      for (const point of block.points) {
        lines.push(`${n}. ${point.text}`);
        n += 1;
      }
      if (block.normativeNote) lines.push(block.normativeNote);
    }
    lines.push("");
  });
  lines.push("Снимок версий модулей:");
  for (const item of doc.moduleVersions) lines.push(`- ${item.title}: ${item.version} (${item.status})`);
  return lines.join("\n");
}

const BANNED = [
  "работник подвергается воздействию опасных факторов",
  "соблюдать технику безопасности",
  "быть внимательным и осторожным",
  "выполнять работу безопасно",
];

function operationalText(doc: AssembledInstruction): string {
  const chunks: string[] = [];
  for (const key of ["before", "during", "emergency", "after"] as const) {
    for (const block of doc.sections[key]) {
      if (block.heading) chunks.push(block.heading);
      for (const point of block.points) chunks.push(point.text);
    }
  }
  for (const block of doc.sections.general) {
    for (const point of block.points) {
      if (point.id.startsWith("gen.haz.") || point.id.startsWith("gen.customhaz.")) continue;
      if (point.hazardIds.length > 0) chunks.push(point.text);
    }
  }
  return chunks.join("\n").toLowerCase();
}

function includesStem(haystack: string, mention: string): boolean {
  return haystack.includes(mention.toLowerCase());
}

const WELDING_WORKS = new Set(["work_manual_arc", "work_semi_auto", "work_gas_cutting", "work_weld_clean"]);

export function qualityGate(catalog: Catalog, draft: Draft, doc: AssembledInstruction): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const need: [keyof AssembledInstruction["sections"], string][] = [
    ["general", "Нет раздела общих требований"],
    ["before", "Нет требований перед началом работы"],
    ["during", "Нет требований во время работы"],
    ["emergency", "Нет аварийных ситуаций"],
    ["after", "Нет требований по окончании работы"],
  ];
  for (const [key, message] of need) {
    const points = doc.sections[key].flatMap((item) => item.points);
    if (points.length === 0) issues.push({ code: key, message });
  }
  if (doc.hazards.length === 0) issues.push({ code: "hazards", message: "Опасности не подтверждены" });
  if (doc.risks.length === 0) {
    issues.push({ code: "risks", message: "Профессиональные риски не сформированы" });
  }
  const plain = doc.plain.toLowerCase();
  const ops = operationalText(doc);
  for (const gear of catalog.gears) {
    const selected = draft.gearIds.includes(gear.meta.id);
    if (selected && !includesStem(plain, gear.meta.title)) {
      issues.push({ code: "gear-missing", message: `Выбранное оборудование не попало в текст: ${gear.meta.title}` });
    }
    if (!selected) {
      for (const mention of gear.mentions) {
        if (includesStem(ops, mention)) {
          issues.push({ code: "gear-extra", message: `В тексте есть невыбранное: ${mention}` });
        }
      }
    }
  }
  for (const work of catalog.works) {
    const selected = draft.workIds.includes(work.meta.id);
    if (selected && !includesStem(plain, work.meta.title)) {
      issues.push({ code: "work-missing", message: `Выбранная работа не раскрыта: ${work.meta.title}` });
    }
    if (!selected) {
      for (const mention of work.mentions) {
        if (includesStem(ops, mention)) {
          issues.push({ code: "work-extra", message: `В тексте есть невыбранная работа: ${mention}` });
        }
      }
    }
  }
  for (const condition of catalog.conditions) {
    if (draft.conditionIds.includes(condition.meta.id)) continue;
    for (const mention of condition.mentions) {
      if (includesStem(ops, mention)) {
        issues.push({ code: "cond-extra", message: `В тексте есть невыбранное условие: ${mention}` });
      }
    }
  }
  const selectedWorks = catalog.works.filter((item) => draft.workIds.includes(item.meta.id));
  for (const work of selectedWorks) {
    for (const gearId of work.requiredGearIds) {
      if (draft.gearIds.includes(gearId)) continue;
      const gearTitle = catalog.gears.find((item) => item.meta.id === gearId)?.meta.title ?? gearId;
      issues.push({
        code: "gear-required",
        message: `Работа «${work.meta.title}» требует оборудование «${gearTitle}»`,
      });
    }
  }
  for (const gear of catalog.gears) {
    if (!draft.gearIds.includes(gear.meta.id)) continue;
    for (const hazardId of gear.hazardIds) {
      if (draft.hazardIds.includes(hazardId)) continue;
      const hazardTitle = catalog.hazards.find((item) => item.meta.id === hazardId)?.meta.title ?? hazardId;
      issues.push({
        code: "hazard-removed",
        message: `Оборудование «${gear.meta.title}» требует опасность «${hazardTitle}»`,
      });
    }
  }
  if (draft.hazardIds.length > 0 && draft.ppeIds.length === 0 && draft.customPpe.length === 0) {
    issues.push({ code: "ppe-empty", message: "Опасности подтверждены, а СИЗ не выбраны" });
  }
  const inactive = new Set(["draft", "outdated", "archived"]);
  for (const item of doc.moduleVersions) {
    if (inactive.has(item.status)) {
      issues.push({ code: "module-inactive", message: `Модуль не активен: ${item.title}` });
    }
  }
  for (const reg of doc.regulations) {
    if (reg.status !== "active") {
      issues.push({ code: "reg-inactive", message: `Документ не в статусе «действует»: ${reg.label}` });
    }
  }
  for (const phrase of BANNED) {
    if (plain.includes(phrase)) issues.push({ code: "generic", message: `Общая фраза вместо меры: «${phrase}»` });
  }
  const allowedNumbers = catalog.regulations.flatMap((item) => [item.number, item.number.replace("н", "Н")]);
  const found = doc.plain.match(/№\s*[0-9][0-9а-яА-Я.-]*/g) ?? [];
  for (const token of found) {
    const value = token.replace("№", "").trim();
    if (!allowedNumbers.some((item) => value.includes(item.replace("№", "").trim()) || item.includes(value))) {
      issues.push({ code: "fake-reg", message: `Номер документа не из реестра: ${token}` });
    }
  }
  if (/(?:статья|ст\.|пункт|п\.)\s*\d+/i.test(doc.plain)) {
    issues.push({ code: "fake-point", message: "В тексте есть номер статьи или пункта. Такие ссылки не подтверждены реестром." });
  }
  for (const hazard of doc.hazards) {
    const linked = doc.sections.general
      .flatMap((item) => item.points)
      .concat(doc.sections.during.flatMap((item) => item.points))
      .some((point) => point.hazardIds.includes(hazard.id) && point.text.length > 20);
    if (!linked || hazard.measures.length === 0) {
      issues.push({ code: "link", message: `Нет меры для опасности: ${hazard.title}` });
    }
  }
  for (const item of draft.customGear) {
    if (item.title.trim() && item.measure.trim().length < 20) {
      issues.push({ code: "custom-gear", message: `Для «${item.title}» нет конкретной меры — документ не готов` });
    }
  }
  for (const item of draft.customWorks) {
    if (item.title.trim() && item.measure.trim().length < 20) {
      issues.push({ code: "custom-work", message: `Для работы «${item.title}» нет конкретной меры — документ не готов` });
    }
  }
  const pointById = new Map<string, string>();
  for (const section of Object.values(doc.sections)) {
    for (const item of section) for (const point of item.points) pointById.set(point.id, point.text);
  }
  for (const work of catalog.works) {
    for (const point of [...work.beforePoints, ...work.duringPoints, ...work.afterPoints]) {
      for (const other of point.contradicts ?? []) {
        if (pointById.has(point.id) && pointById.has(other)) {
          issues.push({ code: "conflict", message: `Противоречие мер ${point.id} и ${other}` });
        }
      }
    }
  }
  if (draft.hazardIds.length > 0 && doc.sections.general.flatMap((item) => item.points).every((point) => point.hazardIds.length === 0)) {
    issues.push({ code: "link-empty", message: "Опасности не связаны с мерами" });
  }
  const hasWelding = draft.workIds.some((id) => WELDING_WORKS.has(id));
  if (!hasWelding) {
    for (const stem of ["свар", "огнев", "экран"]) {
      if (plain.includes(stem)) {
        issues.push({ code: "weld-leak", message: `Сварочное содержание без сварочных работ: «${stem}»` });
      }
    }
  }
  return issues;
}

export function createInstruction(catalog: Catalog, draft: Draft): InstructionRecord {
  const snapshot = assemble(catalog, draft);
  const issues = qualityGate(catalog, draft, snapshot);
  const versions: Record<string, string> = {};
  for (const item of snapshot.moduleVersions) versions[item.id] = item.version;
  return {
    id: `iot-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    professionTitle: snapshot.professionTitle,
    professionId: draft.professionId,
    orgName: snapshot.orgName,
    number: snapshot.number,
    qualityPassed: issues.length === 0,
    issues,
    moduleVersions: versions,
    snapshot,
  };
}

export function professionsUsingModule(catalog: Catalog, moduleId: string): Profession[] {
  return catalog.professions.filter((item) => {
    if (item.suggestedWorkIds.includes(moduleId) || item.suggestedGearIds.includes(moduleId) || item.suggestedConditionIds.includes(moduleId)) {
      return true;
    }
    return item.suggestedWorkIds.some((workId) => catalog.works.find((work) => work.meta.id === workId)?.gearIds.includes(moduleId));
  });
}

export function gearKindLabel(kind: GearKind): string {
  if (kind === "equipment") return "Оборудование";
  if (kind === "tool") return "Инструмент";
  if (kind === "vehicle") return "Транспорт";
  if (kind === "material") return "Материал";
  return "Механизм";
}

export function blankSout(): SoutRow {
  return { id: `sout-${Date.now().toString(36)}`, factor: "", laborClass: "2", source: "", note: "" };
}

export function blankCustom(prefix: string): CustomItem {
  return { id: `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, title: "", measure: "" };
}

export function blankHazard(): CustomHazard {
  return { id: `haz-${Date.now().toString(36)}`, title: "", source: "", event: "", measure: "" };
}

export const SECTION_LABEL = SECTION_TITLE;

const UPDATE_FLOW = ["DETECTED", "ANALYZED", "PROPOSED", "HUMAN_VERIFIED", "PUBLISHED"] as const;

export type UpdateStepResult = "ok" | "blocked" | "need-review" | "no-change";

function bumpVersion(version: string): string {
  const [major, minor, patch] = version.split(".").map((item) => Number(item) || 0);
  return `${major}.${minor + 1}.${patch}`;
}

function moduleMeta(catalog: Catalog, moduleId: string): ModuleMeta | undefined {
  return (
    catalog.works.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.gears.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.hazards.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.conditions.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.ppe.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.emergencies.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.professions.find((item) => item.meta.id === moduleId)?.meta ??
    catalog.risks.find((item) => item.meta.id === moduleId)?.meta
  );
}

function findPointText(catalog: Catalog, pointId: string): string | undefined {
  const lists: SafetyPoint[][] = [
    ...catalog.works.map((item) => [...item.beforePoints, ...item.duringPoints, ...item.afterPoints]),
    ...catalog.gears.map((item) => [...item.beforePoints, ...item.duringPoints, ...item.afterPoints]),
    ...catalog.conditions.map((item) => [...item.beforePoints, ...item.duringPoints, ...item.afterPoints]),
    ...catalog.hazards.map((item) => item.measures),
  ];
  for (const points of lists) {
    const found = points.find((point) => point.id === pointId);
    if (found) return found.text;
  }
  return undefined;
}

function pointBelongs(pointId: string, moduleId: string): boolean {
  return pointId.startsWith(`${moduleId}_`) || pointId.startsWith(`${moduleId}.`);
}

export function applyUpdateStep(
  overrides: Overrides,
  updateId: string,
  review?: { name: string; comment: string },
  today = new Date().toISOString().slice(0, 10),
): { status: UpdateStepResult; overrides: Overrides } {
  const catalog = buildCatalog(overrides);
  const update = catalog.updates.find((item) => item.id === updateId);
  if (!update || update.status === "PUBLISHED" || update.status === "REJECTED") {
    return { status: "blocked", overrides };
  }
  const index = UPDATE_FLOW.indexOf(update.status as (typeof UPDATE_FLOW)[number]);
  if (index < 0) return { status: "blocked", overrides };
  const next = UPDATE_FLOW[index + 1];
  if (!next) return { status: "blocked", overrides };

  const updateReview = { ...(overrides.updateReview ?? {}) };
  const stored = updateReview[updateId];
  const incomingName = review?.name.trim() ?? "";
  const incomingComment = review?.comment.trim() ?? "";
  const name = incomingName || stored?.name || "";
  const comment = review ? incomingComment || stored?.comment || "" : stored?.comment || "";
  if ((next === "HUMAN_VERIFIED" || next === "PUBLISHED") && !name) {
    return { status: "need-review", overrides };
  }
  if (name) updateReview[updateId] = { name, comment };

  const updateStatus = { ...overrides.updateStatus, [updateId]: next };
  if (next !== "PUBLISHED") {
    return { status: "ok", overrides: { ...overrides, updateStatus, updateReview } };
  }

  const contentTargets = update.targetModuleIds.filter((id) => !id.startsWith("reg-"));
  const pointText = { ...overrides.pointText };
  let changed = false;
  if (update.pointId && update.newPointText) {
    const current = pointText[update.pointId] ?? findPointText(catalog, update.pointId);
    if (current === undefined) return { status: "blocked", overrides };
    if (current !== update.newPointText) {
      pointText[update.pointId] = update.newPointText;
      changed = true;
    }
  }
  if (contentTargets.length > 0 && !changed) return { status: "no-change", overrides };

  const moduleVersion = { ...overrides.moduleVersion };
  const moduleChangelog = { ...overrides.moduleChangelog };
  const reviewer = updateReview[updateId];
  for (const moduleId of contentTargets) {
    if (!update.pointId || !pointBelongs(update.pointId, moduleId)) continue;
    const current = moduleMeta(catalog, moduleId);
    if (!current) continue;
    const version = bumpVersion(current.version);
    moduleVersion[moduleId] = version;
    moduleChangelog[moduleId] = [
      ...current.changelog,
      {
        version,
        date: today,
        note: reviewer?.comment.trim() ? `${update.code}: ${reviewer.comment.trim()}` : `${update.code}: ${update.title}`,
        author: reviewer?.name.trim() || "не указан",
      },
    ];
  }
  return {
    status: "ok",
    overrides: { ...overrides, updateStatus, updateReview, pointText, moduleVersion, moduleChangelog },
  };
}
