import { professions } from "../professions";
import type { Applicability, DocumentModule } from "./types";

const CHECK = "Нормативное основание требует проверки";
const BASIS_IOT =
  "Структура инструкции соответствует приказу Минтруда России от 29.10.2021 № 772н. Иные нормативные основания требуют проверки.";

const FOOD = ["cook", "confectioner", "baker", "food_line", "butcher", "dishwasher"];
const HEIGHT: Applicability = {
  anyOf: [{ conditionIds: ["cond_height"] }, { gearIds: ["ladder"] }, { hazardIds: ["fall_height"] }, { flags: { height: true } }],
};
const ELECTRICAL: Applicability = {
  anyOf: [
    { workIds: ["work_electrical_install", "work_electrical_maint"] },
    { conditionIds: ["cond_live"] },
    { gearIds: ["voltage_indicator", "insulated_tools"] },
    { flags: { electrical: true } },
  ],
};
const FOOD_RULE: Applicability = {
  anyOf: [{ professionIds: FOOD }, { workIds: ["work_kitchen"] }, { conditionIds: ["cond_hot_kitchen"] }, { flags: { food: true } }],
};
const TRANSPORT: Applicability = {
  anyOf: [{ gearIds: ["car", "forklift", "self_propelled"] }, { workIds: ["work_driving"] }, { flags: { transport: true } }],
};
const WAREHOUSE: Applicability = {
  anyOf: [
    { professionIds: ["loader", "storekeeper", "picker", "receiver", "packer", "stacker_driver", "forklift_driver"] },
    { workIds: ["work_stacking"] },
    { flags: { warehouse: true } },
  ],
};
const TOOLS: Applicability = {
  anyOf: [{ gearIds: ["angle_grinder", "drill"] }, { flags: { powerTools: true } }],
};
const HAZARDOUS: Applicability = {
  anyOf: [
    { conditionIds: ["cond_height", "cond_confined", "cond_hot_zone", "cond_explosive"] },
    { gearIds: ["gas_cylinder", "ladder"] },
    { workIds: ["work_gas_cutting", "work_slinging"] },
    { flags: { hazardousWork: true } },
  ],
};
const PPE: Applicability = { anyOf: [{ requires: ["ppe"] }, { flags: { ppe: true } }] };
const MEDICAL: Applicability = { anyOf: [{ flags: { medical: true } }] };
const SOUT_DONE: Applicability = { anyOf: [{ flags: { sout: true } }] };
const HAS_PROFESSIONS: Applicability = { anyOf: [{ requires: ["professions"] }] };

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
}): DocumentModule {
  return {
    version: "1.0.0",
    status: "active",
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
    doc({ code: "policy_suot", name: "Положение о системе управления охраной труда", category: "organization", shape: "policy", applicability: { always: true } }),
    doc({ code: "policy_instructions", name: "Положение о порядке разработки и учёта инструкций по охране труда", category: "organization", shape: "policy", applicability: { always: true } }),
    doc({ code: "order_responsible", name: "Приказ о возложении обязанностей по охране труда", category: "organization", shape: "order", applicability: { always: true } }),
    doc({ code: "order_training", name: "Приказ об организации обучения по охране труда", category: "training", shape: "order", applicability: { always: true } }),
    doc({ code: "order_sout", name: "Приказ об организации специальной оценки условий труда", category: "organization", shape: "order", applicability: { always: true } }),
    doc({ code: "order_instructions", name: "Приказ об утверждении инструкций по охране труда", category: "instructions", shape: "order", applicability: HAS_PROFESSIONS }),
    doc({ code: "program_intro", name: "Программа вводного инструктажа", category: "training", shape: "program", applicability: { always: true } }),
    doc({ code: "program_first_aid", name: "Программа обучения оказанию первой помощи", category: "training", shape: "program", applicability: { always: true } }),
    doc({ code: "program_workplace", name: "Программа первичного инструктажа на рабочем месте", category: "training", shape: "program", applicability: HAS_PROFESSIONS }),
    doc({ code: "journal_intro", name: "Журнал регистрации вводного инструктажа", category: "journals", shape: "journal", applicability: { always: true } }),
    doc({ code: "journal_workplace", name: "Журнал регистрации инструктажа на рабочем месте", category: "journals", shape: "journal", applicability: HAS_PROFESSIONS }),
    doc({ code: "journal_issue", name: "Журнал учёта выдачи инструкций", category: "journals", shape: "journal", applicability: HAS_PROFESSIONS }),
    doc({ code: "list_instructions", name: "Перечень инструкций по охране труда", category: "lists", shape: "list", applicability: HAS_PROFESSIONS }),
    doc({ code: "list_positions", name: "Перечень профессий и должностей", category: "lists", shape: "list", applicability: HAS_PROFESSIONS }),
    doc({ code: "risk_policy", name: "Положение об управлении профессиональными рисками", category: "risk", shape: "policy", applicability: { always: true }, commercialLevel: "PRO" }),
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
      applicability: { always: true },
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
      applicability: { anyOf: [{ professionIds: [profession.meta.id] }] },
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
    applicability: { always: true },
    commercialLevel: "FREE",
    generator: "instruction",
    normativeBasis: BASIS_IOT,
  });
}
