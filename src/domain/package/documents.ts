import { professions } from "../professions";
import type { Applicability, DocumentModule } from "./types";

const CHECK = "Нормативное основание требует проверки";
const BASIS_IOT =
  "Структура инструкции соответствует приказу Минтруда России от 29.10.2021 № 772н. Иные нормативные основания требуют проверки.";

const FOOD = ["cook", "confectioner", "baker", "food_line", "butcher", "dishwasher"];
const HEIGHT: Applicability = {
  any: [
    { field: "condition", in: ["cond_height"] },
    { field: "equipment", in: ["ladder"] },
    { field: "hazard", in: ["fall_height"] },
    { field: "flag", in: ["height"] },
  ],
};
const ELECTRICAL: Applicability = {
  any: [
    { field: "work", in: ["work_electrical_install", "work_electrical_maint"] },
    { field: "condition", in: ["cond_live"] },
    { field: "equipment", in: ["voltage_indicator", "insulated_tools"] },
    { field: "flag", in: ["electrical"] },
  ],
};
const FOOD_RULE: Applicability = {
  any: [
    { field: "profession", in: FOOD },
    { field: "work", in: ["work_kitchen"] },
    { field: "condition", in: ["cond_hot_kitchen"] },
    { field: "flag", in: ["food"] },
  ],
};
const TRANSPORT: Applicability = {
  any: [
    { field: "equipment", in: ["car", "forklift", "self_propelled"] },
    { field: "work", in: ["work_driving"] },
    { field: "flag", in: ["transport"] },
  ],
};
const WAREHOUSE: Applicability = {
  any: [
    { field: "profession", in: ["loader", "storekeeper", "picker", "receiver", "packer", "stacker_driver", "forklift_driver"] },
    { field: "work", in: ["work_stacking"] },
    { field: "flag", in: ["warehouse"] },
  ],
};
const TOOLS: Applicability = {
  any: [
    { field: "equipment", in: ["angle_grinder", "drill"] },
    { field: "flag", in: ["powerTools"] },
  ],
};
const HAZARDOUS: Applicability = {
  any: [
    { field: "condition", in: ["cond_height", "cond_confined", "cond_hot_zone", "cond_explosive"] },
    { field: "equipment", in: ["gas_cylinder", "ladder"] },
    { field: "work", in: ["work_gas_cutting", "work_slinging"] },
    { field: "flag", in: ["hazardousWork"] },
  ],
};
const PPE: Applicability = { any: [{ field: "ppe", present: true }, { field: "flag", in: ["ppe"] }] };
const MEDICAL: Applicability = { any: [{ field: "flag", in: ["medical"] }] };
const SOUT_DONE: Applicability = { any: [{ field: "flag", in: ["sout"] }] };
const HAS_PROFESSIONS: Applicability = { any: [{ field: "profession", present: true }, { field: "custom_profession", present: true }] };

function doc(init: {
  code: string;
  name: string;
  category: DocumentModule["category"];
  shape: DocumentModule["shape"];
  applicability: Applicability;
  commercialLevel?: DocumentModule["commercialLevel"];
  generator?: DocumentModule["generator"];
  optional?: boolean;
  normativeBasis?: string;
  professionId?: string;
  moduleId?: string;
  version?: string;
  status?: DocumentModule["status"];
}): DocumentModule {
  return {
    id: init.code,
    version: init.version ?? "1.0.0",
    status: init.status ?? "active",
    dependencies: [],
    template: null,
    generator: init.generator ?? "none",
    commercialLevel: init.commercialLevel ?? "PACKAGE",
    optional: init.optional ?? false,
    moduleId: init.moduleId ?? "core",
    normativeBasis: init.normativeBasis ?? CHECK,
    code: init.code,
    name: init.name,
    category: init.category,
    shape: init.shape,
    applicability: init.applicability,
    professionId: init.professionId,
  };
}

/** Организационные документы — данные, не зашитый отраслевой пакет. */
export function organizationDocuments(): DocumentModule[] {
  return [
    doc({ code: "policy_suot", name: "Положение о системе управления охраной труда", category: "organization", shape: "policy", applicability: {} }),
    doc({ code: "policy_instructions", name: "Положение о порядке разработки и учёта инструкций по охране труда", category: "organization", shape: "policy", applicability: {} }),
    doc({ code: "order_responsible", name: "Приказ о возложении обязанностей по охране труда", category: "organization", shape: "order", applicability: {} }),
    doc({ code: "order_training", name: "Приказ об организации обучения по охране труда", category: "training", shape: "order", applicability: {} }),
    doc({ code: "order_sout", name: "Приказ об организации специальной оценки условий труда", category: "organization", shape: "order", applicability: {} }),
    doc({ code: "order_instructions", name: "Приказ об утверждении инструкций по охране труда", category: "instructions", shape: "order", applicability: HAS_PROFESSIONS }),
    doc({ code: "program_intro", name: "Программа вводного инструктажа", category: "training", shape: "program", applicability: {} }),
    doc({ code: "program_first_aid", name: "Программа обучения оказанию первой помощи", category: "training", shape: "program", applicability: {} }),
    doc({ code: "program_workplace", name: "Программа первичного инструктажа на рабочем месте", category: "training", shape: "program", applicability: HAS_PROFESSIONS }),
    doc({ code: "journal_intro", name: "Журнал регистрации вводного инструктажа", category: "journals", shape: "journal", applicability: {} }),
    doc({ code: "journal_workplace", name: "Журнал регистрации инструктажа на рабочем месте", category: "journals", shape: "journal", applicability: HAS_PROFESSIONS }),
    doc({ code: "journal_issue", name: "Журнал учёта выдачи инструкций", category: "journals", shape: "journal", applicability: HAS_PROFESSIONS }),
    doc({ code: "list_instructions", name: "Перечень инструкций по охране труда", category: "lists", shape: "list", applicability: HAS_PROFESSIONS }),
    doc({ code: "list_positions", name: "Перечень профессий и должностей", category: "lists", shape: "list", applicability: HAS_PROFESSIONS }),
    doc({ code: "risk_policy", name: "Положение об управлении профессиональными рисками", category: "risk", shape: "policy", applicability: {}, commercialLevel: "PRO" }),
    doc({ code: "risk_cards", name: "Карты оценки профессиональных рисков", category: "risk", shape: "card", applicability: HAS_PROFESSIONS, commercialLevel: "PRO" }),
    doc({ code: "order_height", name: "Приказ об организации работ на высоте", category: "hazardous", shape: "order", applicability: HEIGHT }),
    doc({ code: "program_height", name: "Программа обучения безопасным методам работ на высоте", category: "training", shape: "program", applicability: HEIGHT, commercialLevel: "PRO" }),
    doc({ code: "list_height", name: "Перечень работников, допускаемых к работам на высоте", category: "lists", shape: "list", applicability: HEIGHT }),
    doc({ code: "order_electrical", name: "Приказ о назначении ответственного за электрохозяйство", category: "hazardous", shape: "order", applicability: ELECTRICAL }),
    doc({ code: "program_electrical", name: "Программа обучения по электробезопасности", category: "training", shape: "program", applicability: ELECTRICAL, commercialLevel: "PRO" }),
    doc({ code: "order_food", name: "Приказ об организации работы пищеблока", category: "extra", shape: "order", applicability: FOOD_RULE }),
    doc({ code: "order_transport", name: "Приказ об организации эксплуатации транспорта", category: "extra", shape: "order", applicability: TRANSPORT }),
    doc({ code: "journal_pretrip", name: "Журнал предрейсового контроля", category: "journals", shape: "journal", applicability: TRANSPORT, commercialLevel: "PRO" }),
    doc({ code: "order_warehouse", name: "Приказ об организации складских работ", category: "extra", shape: "order", applicability: WAREHOUSE }),
    doc({ code: "order_tools", name: "Приказ о допуске к работе с электроинструментом", category: "hazardous", shape: "order", applicability: TOOLS }),
    doc({ code: "order_hazardous", name: "Приказ об организации работ повышенной опасности", category: "hazardous", shape: "order", applicability: HAZARDOUS }),
    doc({ code: "list_hazardous", name: "Перечень работ повышенной опасности", category: "lists", shape: "list", applicability: HAZARDOUS }),
    doc({ code: "order_ppe", name: "Приказ об обеспечении работников СИЗ", category: "ppe", shape: "order", applicability: PPE }),
    doc({ code: "ppe_norms", name: "Нормы выдачи СИЗ", category: "ppe", shape: "card", applicability: PPE, commercialLevel: "PRO" }),
    doc({ code: "ppe_cards", name: "Личные карточки учёта выдачи СИЗ", category: "ppe", shape: "card", applicability: PPE }),
    doc({ code: "journal_ppe", name: "Журнал учёта выдачи СИЗ", category: "journals", shape: "journal", applicability: PPE }),
    doc({ code: "list_ppe", name: "Перечень СИЗ", category: "lists", shape: "list", applicability: PPE }),
    doc({ code: "order_medical", name: "Приказ об организации медицинских осмотров", category: "medical", shape: "order", applicability: MEDICAL }),
    doc({ code: "list_medical", name: "Список контингента на медицинский осмотр", category: "medical", shape: "list", applicability: MEDICAL, commercialLevel: "PRO" }),
    doc({ code: "sout_materials", name: "Материалы специальной оценки условий труда", category: "extra", shape: "card", applicability: SOUT_DONE, commercialLevel: "PRO" }),
    doc({
      code: "expert_review",
      name: "Экспертная проверка пакета специалистом",
      category: "extra",
      shape: "other",
      applicability: {},
      commercialLevel: "EXPERT",
      optional: true,
    }),
  ];
}

/** Инструкция не копирует каталог профессий: это ссылка на уже существующий id. */
export function instructionDocuments(): DocumentModule[] {
  return professions.map((profession) =>
    doc({
      code: `iot_${profession.meta.id}`,
      name: `Инструкция по охране труда: ${profession.meta.title}`,
      category: "instructions",
      shape: "instruction",
      applicability: { any: [{ field: "profession", in: [profession.meta.id] }] },
      commercialLevel: "FREE",
      generator: "instruction",
      normativeBasis: BASIS_IOT,
      professionId: profession.meta.id,
    }),
  );
}

export function customInstructionDocument(title: string): DocumentModule {
  const code = `iot_custom_${Array.from(title.trim().toLowerCase())
    .map((char) => (/[a-z0-9а-яё]/i.test(char) ? char : "-"))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)}`;
  return doc({
    code,
    name: `Инструкция по охране труда: ${title.trim()}`,
    category: "instructions",
    shape: "instruction",
    applicability: {},
    commercialLevel: "FREE",
    generator: "instruction",
    normativeBasis: BASIS_IOT,
  });
}
