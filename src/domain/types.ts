export type ModuleStatus = "draft" | "verified" | "active" | "outdated" | "archived";

export type CategoryId =
  | "construction"
  | "manufacturing"
  | "metal"
  | "warehouse"
  | "transport"
  | "housing"
  | "energy"
  | "repair"
  | "equipment"
  | "food"
  | "cleaning"
  | "agriculture"
  | "office";

export interface ChangeNote {
  version: string;
  date: string;
  note: string;
  author: string;
}

export interface ModuleMeta {
  id: string;
  title: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  status: ModuleStatus;
  regulationIds: string[];
  verifiedAt: string | null;
  author: string;
  changelog: ChangeNote[];
}

export interface SafetyPoint {
  id: string;
  text: string;
  hazardIds: string[];
  contradicts?: string[];
}

export interface WorkModule {
  meta: ModuleMeta;
  summary: string;
  hazardIds: string[];
  gearIds: string[];
  requiredGearIds: string[];
  mentions: string[];
  duringTitle: string;
  beforePoints: SafetyPoint[];
  duringPoints: SafetyPoint[];
  afterPoints: SafetyPoint[];
  emergencyIds: string[];
  ppeIds: string[];
}

export type GearKind = "equipment" | "tool" | "vehicle" | "material" | "mechanism";

export interface GearModule {
  meta: ModuleMeta;
  kind: GearKind;
  summary: string;
  hazardIds: string[];
  ppeIds: string[];
  mentions: string[];
  duringTitle: string;
  beforePoints: SafetyPoint[];
  duringPoints: SafetyPoint[];
  afterPoints: SafetyPoint[];
  emergencyIds: string[];
}

export interface ConditionModule {
  meta: ModuleMeta;
  summary: string;
  hazardIds: string[];
  mentions: string[];
  duringTitle: string;
  beforePoints: SafetyPoint[];
  duringPoints: SafetyPoint[];
  afterPoints: SafetyPoint[];
  emergencyIds: string[];
  workRest?: string;
  ppeIds: string[];
}

export interface Hazard {
  meta: ModuleMeta;
  source: string;
  event: string;
  factorKind: "harmful" | "dangerous";
  measures: SafetyPoint[];
  ppeIds: string[];
}

export interface Risk {
  meta: ModuleMeta;
  hazardId: string;
  consequence: string;
  level: "низкий" | "умеренный" | "высокий" | "критический";
  controls: string;
}

export interface PpeItem {
  meta: ModuleMeta;
  purpose: string;
}

export interface EmergencyScenario {
  meta: ModuleMeta;
  steps: string[];
  hazardIds: string[];
}

export interface Regulation {
  id: string;
  kind: string;
  number: string;
  date: string;
  title: string;
  publisher: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: ModuleStatus;
  officialSource: string;
  lastCheckedAt: string;
  changelog: ChangeNote[];
}

export interface Profession {
  meta: ModuleMeta;
  category: CategoryId;
  aliases: string[];
  depth: "full" | "catalog";
  summary: string;
  workerRequirements: string[];
  admission: string[];
  hygiene: string[];
  extras: string[];
  suggestedWorkIds: string[];
  suggestedGearIds: string[];
  suggestedConditionIds: string[];
  workRest?: string;
}

export type UpdateFlow = "DETECTED" | "ANALYZED" | "PROPOSED" | "HUMAN_VERIFIED" | "PUBLISHED" | "REJECTED";

export interface NormUpdate {
  id: string;
  code: string;
  title: string;
  targetModuleIds: string[];
  detectedAt: string;
  status: UpdateFlow;
  summary: string;
  proposedChange: string;
  pointId?: string;
  newPointText?: string;
  regulationId?: string;
}

export interface SoutRow {
  id: string;
  factor: string;
  laborClass: string;
  source: string;
  note: string;
}

export interface CustomHazard {
  id: string;
  title: string;
  source: string;
  event: string;
  measure: string;
}

export interface CustomItem {
  id: string;
  title: string;
  measure: string;
}

export interface Draft {
  orgName: string;
  docNumber: string;
  professionId: string | null;
  customProfession: string;
  workIds: string[];
  gearIds: string[];
  conditionIds: string[];
  hazardIds: string[];
  hazardKey: string;
  customHazards: CustomHazard[];
  customGear: CustomItem[];
  customWorks: CustomItem[];
  ppeIds: string[];
  ppeKey: string;
  customPpe: string[];
  sout: SoutRow[];
}

export interface Catalog {
  regulations: Regulation[];
  hazards: Hazard[];
  risks: Risk[];
  ppe: PpeItem[];
  emergencies: EmergencyScenario[];
  works: WorkModule[];
  gears: GearModule[];
  conditions: ConditionModule[];
  professions: Profession[];
  updates: NormUpdate[];
}

export interface DocBlock {
  moduleId: string;
  ownerProfessionId: string | null;
  heading: string;
  points: { id: string; text: string; hazardIds: string[] }[];
  normativeNote: string;
}

export interface AssembledInstruction {
  title: string;
  professionTitle: string;
  orgName: string;
  number: string;
  date: string;
  disclaimer: string;
  basis: string;
  sections: {
    general: DocBlock[];
    before: DocBlock[];
    during: DocBlock[];
    emergency: DocBlock[];
    after: DocBlock[];
  };
  hazards: { id: string; title: string; source: string; event: string; factorKind: string; measures: string[] }[];
  risks: { id: string; title: string; level: string; consequence: string; controls: string }[];
  sout: SoutRow[];
  ppe: { id: string; title: string; purpose: string }[];
  works: { id: string; title: string }[];
  gears: { id: string; title: string; kind: GearKind }[];
  conditions: { id: string; title: string }[];
  regulations: { id: string; label: string; status: ModuleStatus; needsCheck: boolean; officialSource: string }[];
  moduleVersions: { id: string; title: string; version: string; status: ModuleStatus }[];
  plain: string;
}

export interface QualityIssue {
  code: string;
  message: string;
}

export interface InstructionRecord {
  id: string;
  createdAt: string;
  professionTitle: string;
  professionId: string | null;
  orgName: string;
  number: string;
  qualityPassed: boolean;
  issues: QualityIssue[];
  moduleVersions: Record<string, string>;
  snapshot: AssembledInstruction;
}

export const CATEGORIES: { id: CategoryId; title: string }[] = [
  { id: "construction", title: "Строительство" },
  { id: "manufacturing", title: "Производство" },
  { id: "metal", title: "Металлообработка" },
  { id: "warehouse", title: "Склад" },
  { id: "transport", title: "Транспорт" },
  { id: "housing", title: "ЖКХ" },
  { id: "energy", title: "Энергетика" },
  { id: "repair", title: "Ремонт" },
  { id: "equipment", title: "Обслуживание оборудования" },
  { id: "food", title: "Пищевое производство" },
  { id: "cleaning", title: "Клининг" },
  { id: "agriculture", title: "Сельское хозяйство" },
  { id: "office", title: "Офисно-хозяйственные работы" },
];

export const GEAR_KIND: Record<GearKind, string> = {
  equipment: "Оборудование",
  tool: "Инструмент",
  vehicle: "Транспорт",
  material: "Материал",
  mechanism: "Механизм",
};
