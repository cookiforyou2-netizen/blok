/** Уровни будущего коммерческого контура. Оплата не подключается. */
export type CommercialLevel = "FREE" | "PACKAGE" | "PRO" | "EXPERT";

export type DocumentCategory =
  | "organization"
  | "instructions"
  | "training"
  | "ppe"
  | "medical"
  | "risk"
  | "hazardous"
  | "journals"
  | "lists"
  | "extra";

export type DocumentShape = "order" | "instruction" | "policy" | "program" | "list" | "journal" | "card" | "other";

export type DocumentStatus = "draft" | "active" | "deprecated";

export type Tri = boolean | null;

export const FLAG_KEYS = [
  "height",
  "electrical",
  "food",
  "warehouse",
  "production",
  "transport",
  "hazardousWork",
  "sout",
  "medical",
  "powerTools",
  "ppe",
] as const;

export type FlagKey = (typeof FLAG_KEYS)[number];

export const FLAG_LABELS: Record<FlagKey, string> = {
  height: "высотные работы",
  electrical: "электроустановки",
  food: "пищеблок",
  warehouse: "склад",
  production: "производственные помещения",
  transport: "транспорт",
  hazardousWork: "работы повышенной опасности",
  sout: "СОУТ проведена",
  medical: "обязательные медосмотры",
  powerTools: "электроинструмент",
  ppe: "выдача СИЗ",
};

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  organization: "Организация охраны труда",
  instructions: "Инструкции",
  training: "Обучение",
  ppe: "СИЗ",
  medical: "Медосмотры",
  risk: "Оценка рисков",
  hazardous: "Работы повышенной опасности",
  journals: "Журналы",
  lists: "Перечни",
  extra: "Дополнительные документы",
};

export const CATEGORY_ORDER: DocumentCategory[] = [
  "organization",
  "instructions",
  "training",
  "ppe",
  "medical",
  "risk",
  "hazardous",
  "journals",
  "lists",
  "extra",
];

/** Откуда взялся факт. Пресет — только предложение, не решение организации. */
export type FactSourceKind = "instruction" | "user" | "preset" | "system" | "import";

/** inferred — ещё не подтверждён; confirmed — принят; rejected — явно отвергнут. */
export type FactStatus = "inferred" | "confirmed" | "rejected";

/**
 * Единый перечень полей Profile Fact.
 * Признак `flag` (в том числе powerTools) — такое же поле, как profession или equipment.
 * Отдельного механизма признаков нет: applicability читает только эти поля через facts/resolver.
 */
export const FACT_FIELDS = [
  "profession",
  "custom_profession",
  "work",
  "equipment",
  "condition",
  "hazard",
  "material",
  "ppe",
  "position",
  "department",
  "flag",
  "industry",
  "activity",
  "name",
  "inn",
  "headcount",
  "director",
  "address",
  "responsible",
  "approval_date",
] as const;

export type FactField = (typeof FACT_FIELDS)[number];

export const PROFILE_SCHEMA_VERSION = 1;

export type FactValue = boolean | string | number;

/** Одно наблюдение факта. У одного признака может быть несколько источников. */
export interface FactSource {
  source: FactSourceKind;
  sourceId: string;
  status: FactStatus;
  value: FactValue;
  createdAt: string;
  updatedAt: string;
}

/**
 * Один признак организации.
 * Отсутствие записи — UNKNOWN, а не false.
 * value наружу берётся из победившего источника, сами источники не схлопываются.
 */
export interface ProfileFact {
  id: string;
  field: FactField;
  key: string;
  sources: FactSource[];
}

export interface FactInput {
  field: FactField;
  key: string;
  value: FactValue;
  source: FactSourceKind;
  sourceId: string;
  status: FactStatus;
}

/** Профиль для мастера: списки — проекция фактов, чтобы текущий экран не переписывать. */
export interface OrganizationProfile {
  schemaVersion: number;
  name: string;
  inn: string;
  activity: string;
  industry: string;
  headcount: number | null;
  departments: string[];
  professionIds: string[];
  customProfessions: string[];
  positions: string[];
  workIds: string[];
  gearIds: string[];
  conditionIds: string[];
  hazardIds: string[];
  materialIds: string[];
  ppeIds: string[];
  flags: Record<FlagKey, Tri>;
  instructionIds: string[];
  presetId: string | null;
  facts: ProfileFact[];
}

/**
 * Условие применимости. Список `in` — ИЛИ.
 * Несколько атомов внутри all — И, внутри any — ИЛИ, внутри none — ни одно не должно выполняться.
 * Группы all, any и none между собой складываются через И.
 * `field` — только FactField, включая flag.
 */
export interface ApplicabilityAtom {
  field: FactField;
  in?: string[];
  eq?: FactValue;
  min?: number;
  /** Есть подтверждающий факт поля. Пустое поле — неизвестно, а не «нет». */
  present?: boolean;
}

export interface Applicability {
  all?: ApplicabilityAtom[];
  any?: ApplicabilityAtom[];
  none?: ApplicabilityAtom[];
}

/** Какое поле нужно, чтобы сформировать документ. Уже известный факт повторно не спрашивается. */
export interface DataRequirement {
  id: string;
  label: string;
  field: FactField;
  key: string;
}

export interface DocumentModule {
  id: string;
  code: string;
  name: string;
  category: DocumentCategory;
  shape: DocumentShape;
  version: string;
  status: DocumentStatus;
  applicability: Applicability;
  dependencies: string[];
  normativeBasis: string;
  /** Устаревшее имя templateId. Новые документы заполняют оба одинаково. */
  template: string | null;
  templateId?: string | null;
  /** Устаревшее имя generatorId для уже существующих инструкций. */
  generator: "instruction" | "none";
  generatorId?: string | null;
  requiredData?: DataRequirement[];
  commercialLevel: CommercialLevel;
  optional: boolean;
  /** Какой отраслевой пакет зарегистрировал документ. Ядро каталога — «core». */
  moduleId: string;
  /** Ссылка на профессию каталога, если документ — бесплатная инструкция. */
  professionId?: string;
}

/** Пресет только предлагает факты. Списка документов в нём нет. */
export interface IndustryPreset {
  id: string;
  title: string;
  industry: string;
  activity: string;
  professionIds: string[];
  workIds: string[];
  gearIds: string[];
  conditionIds: string[];
  flags: Partial<Record<FlagKey, boolean>>;
}

export interface PackageExtension {
  id: string;
  title: string;
  version?: string;
  status?: DocumentStatus;
  documents?: DocumentModule[];
  /** Предлагаемые факты. В профиль сами не записываются: ядро только хранит регистрацию. */
  facts?: FactInput[];
  dependencies?: string[];
}

export type Match = "yes" | "no" | "unknown";

export type DocResultStatus = "ready" | "clarify" | "optional" | "locked";

/** Состояние документа первого коммерческого модуля на экране пакета. */
export type WorkflowStatus = "defined" | "clarify" | "needs_data" | "ready_to_generate" | "formed";

export type TraceResult = "YES" | "NO" | "UNKNOWN";

export interface MatchedRule {
  group: "all" | "any" | "none";
  field: FactField;
  op: "in" | "eq" | "min" | "present";
  keys: string[];
}

/** Почему документ включён, отклонён или ещё не определён. */
export interface DecisionTrace {
  result: TraceResult;
  matchedRules: MatchedRule[];
  facts: string[];
  sources: string[];
  missing: string[];
}

export interface ApplicabilityDecision {
  applicable: Match;
  reasons: string[];
  sources: string[];
  missing: string[];
  trace: DecisionTrace;
}

export interface PackageItem {
  document: DocumentModule;
  match: Match;
  status: DocResultStatus;
  reason: string;
  reasons: string[];
  sources: string[];
  missing: string[];
  trace: DecisionTrace;
}

export interface PackageComposition {
  items: PackageItem[];
  included: PackageItem[];
  clarifications: PackageItem[];
  optional: PackageItem[];
  counts: {
    orders: number;
    instructions: number;
    policies: number;
    programs: number;
    lists: number;
    journals: number;
    ppe: number;
    medical: number;
    total: number;
  };
}

/** Состав, зафиксированный в момент начала формирования. Это не архив. */
export interface PackageSnapshot {
  createdAt: string;
  profileVersion: number;
  documents: Array<{
    id: string;
    code: string;
    name: string;
    moduleId: string;
    match: Match;
    result: TraceResult;
  }>;
}