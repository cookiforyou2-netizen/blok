import type { Applicability, DocumentModule, PackageExtension } from "../types";
import { SHARED_REQUISITES } from "../requisites";

const CHECK = "Нормативное основание требует проверки";

const HAS_PROFESSIONS: Applicability = {
  any: [{ field: "profession", present: true }, { field: "custom_profession", present: true }],
};

/** УШМ, дрель и признак «электроинструмент» — тот же resolver фактов. Генератор это правило не читает. */
const POWER_TOOLS: Applicability = {
  any: [
    { field: "equipment", in: ["angle_grinder", "drill"] },
    { field: "flag", in: ["powerTools"] },
  ],
};

function doc(init: {
  code: string;
  name: string;
  category: DocumentModule["category"];
  shape: DocumentModule["shape"];
  applicability: Applicability;
}): DocumentModule {
  return {
    id: init.code,
    code: init.code,
    name: init.name,
    category: init.category,
    shape: init.shape,
    version: "1.0.0",
    status: "active",
    applicability: init.applicability,
    dependencies: [],
    normativeBasis: CHECK,
    template: `tpl_${init.code}`,
    templateId: `tpl_${init.code}`,
    generator: "none",
    generatorId: init.code,
    requiredData: SHARED_REQUISITES,
    commercialLevel: "PACKAGE",
    optional: false,
    moduleId: "core_osh",
    normativeStatus: "needs_review",
  };
}

/** Базовый модуль организации охраны труда. Не отраслевой пресет и не полный контур ОТ. */
export const CORE_OSH_DOCUMENTS: DocumentModule[] = [
  doc({
    code: "osh_order_responsible",
    name: "Приказ о возложении обязанностей по охране труда",
    category: "organization",
    shape: "order",
    applicability: {},
  }),
  doc({
    code: "osh_policy_suot",
    name: "Положение о системе управления охраной труда",
    category: "organization",
    shape: "policy",
    applicability: {},
  }),
  doc({
    code: "osh_order_approve",
    name: "Приказ об утверждении инструкций по охране труда",
    category: "instructions",
    shape: "order",
    applicability: HAS_PROFESSIONS,
  }),
  doc({
    code: "osh_list_instructions",
    name: "Перечень инструкций по охране труда",
    category: "lists",
    shape: "list",
    applicability: HAS_PROFESSIONS,
  }),
  doc({
    code: "osh_list_positions",
    name: "Перечень профессий и должностей",
    category: "lists",
    shape: "list",
    applicability: HAS_PROFESSIONS,
  }),
  doc({
    code: "osh_program_intro",
    name: "Программа вводного инструктажа",
    category: "training",
    shape: "program",
    applicability: {},
  }),
  doc({
    code: "osh_order_training",
    name: "Приказ об организации обучения по охране труда",
    category: "training",
    shape: "order",
    applicability: {},
  }),
  doc({
    code: "osh_order_power_tools",
    name: "Приказ о допуске к работе с электроинструментом",
    category: "hazardous",
    shape: "order",
    applicability: POWER_TOOLS,
  }),
];

export const coreOshModule: PackageExtension = {
  id: "core_osh",
  title: "Базовая организация охраны труда",
  version: "1.0.0",
  status: "active",
  documents: CORE_OSH_DOCUMENTS,
};
