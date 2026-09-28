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

/** Профиль копится из инструкций и мастера. Поля можно расширять, не ломая сохранённые данные. */
export interface OrganizationProfile {
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
}

/**
 * Списки внутри условия — ИЛИ (достаточно одного id).
 * Условия внутри anyOf — ИЛИ между собой.
 * Поля одного условия — И.
 * Признак null — «не задан», это не отказ.
 */
export interface ApplicabilityClause {
  professionIds?: string[];
  workIds?: string[];
  gearIds?: string[];
  conditionIds?: string[];
  hazardIds?: string[];
  materialIds?: string[];
  industries?: string[];
  flags?: Partial<Record<FlagKey, boolean>>;
  minHeadcount?: number;
  /** Пустой список в профиле означает «ещё не спрашивали», а не «нет». */
  requires?: Array<"professions" | "works" | "gears" | "ppe" | "hazards" | "positions">;
}

export interface Applicability {
  always?: boolean;
  anyOf?: ApplicabilityClause[];
}

export interface DocumentModule {
  code: string;
  name: string;
  category: DocumentCategory;
  shape: DocumentShape;
  version: string;
  status: "active" | "draft";
  applicability: Applicability;
  dependencies: string[];
  normativeBasis: string;
  template: string | null;
  generator: "instruction" | "none";
  commercialLevel: CommercialLevel;
  optional: boolean;
  /** Какой отраслевой пакет зарегистрировал документ. Ядро — «core». */
  moduleId: string;
  /** Ссылка на профессию каталога, если документ — бесплатная инструкция. */
  professionId?: string;
}

/** Пресет только заполняет профиль. Списка документов в нём нет. */
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
  documents?: DocumentModule[];
}

export type Match = "yes" | "no" | "unknown";

export type DocResultStatus = "ready" | "clarify" | "optional" | "locked";

export interface PackageItem {
  document: DocumentModule;
  match: Match;
  status: DocResultStatus;
  reason: string;
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
