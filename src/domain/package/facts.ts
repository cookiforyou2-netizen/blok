import type { FactField, FactInput, FactSource, FactValue, FlagKey, OrganizationProfile, ProfileFact, Tri } from "./types";
import { FLAG_KEYS, PROFILE_SCHEMA_VERSION } from "./types";

const MATERIAL_GEAR = new Set(["cleaning_agents"]);
const FOOD_PROFESSIONS = new Set(["cook", "confectioner", "baker", "food_line", "butcher", "dishwasher"]);
const WAREHOUSE_PROFESSIONS = new Set(["loader", "storekeeper", "picker", "receiver", "packer", "stacker_driver", "rigger", "marker"]);
const TRANSPORT_GEAR = new Set(["car", "forklift", "self_propelled"]);
const ELECTRICAL_WORKS = new Set(["work_electrical_install", "work_electrical_maint"]);

let clock = () => new Date().toISOString();

export function setFactClock(next: () => string) {
  clock = next;
}

export function factId(field: FactField, key: string): string {
  return `${field}:${key}`;
}

export function emptyFlags(): Record<FlagKey, Tri> {
  return {
    height: null,
    electrical: null,
    food: null,
    warehouse: null,
    production: null,
    transport: null,
    hazardousWork: null,
    sout: null,
    medical: null,
    powerTools: null,
    ppe: null,
  };
}

export function emptyProfile(): OrganizationProfile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    name: "",
    inn: "",
    activity: "",
    industry: "",
    headcount: null,
    departments: [],
    professionIds: [],
    customProfessions: [],
    positions: [],
    workIds: [],
    gearIds: [],
    conditionIds: [],
    hazardIds: [],
    materialIds: [],
    ppeIds: [],
    flags: emptyFlags(),
    instructionIds: [],
    presetId: null,
    facts: [],
  };
}

/**
 * 1 — явное решение пользователя;
 * 2 — подтверждённый профиль (confirmed/rejected не от пресета);
 * 3 — инструкция, импорт и системный вывод из них;
 * 4 — отраслевой пресет.
 * Пресет никогда не побеждает более высокий источник.
 * При равном ранге побеждает более позднее наблюдение: последнее явное решение пользователя.
 */
export function sourceRank(source: FactSource): number {
  if (source.source === "user" && (source.status === "confirmed" || source.status === "rejected")) return 400;
  if (source.status === "confirmed" || source.status === "rejected") return 300;
  if (source.source === "instruction" || source.source === "import" || source.source === "system") return 200;
  if (source.source === "preset") return 100;
  return 0;
}

export function winningSource(fact: ProfileFact | undefined): FactSource | null {
  if (!fact || fact.sources.length === 0) return null;
  return fact.sources.reduce((best, source) => {
    if (!best) return source;
    const rank = sourceRank(source) - sourceRank(best);
    if (rank !== 0) return rank > 0 ? source : best;
    return source.updatedAt >= best.updatedAt ? source : best;
  }, null as FactSource | null);
}

export type FactVerdict = "yes" | "no" | "unknown";

/** Для применимости пресет-only не доказательство: это UNKNOWN, а не YES. */
export function verdictOf(fact: ProfileFact | undefined): FactVerdict {
  const winner = winningSource(fact);
  if (!winner) return "unknown";
  if (winner.status === "rejected" || winner.value === false) return "no";
  if (winner.source === "preset" && winner.status !== "confirmed") return "unknown";
  if (winner.value === true) return "yes";
  if (typeof winner.value === "string") return winner.value.trim() ? "yes" : "unknown";
  if (typeof winner.value === "number") return Number.isFinite(winner.value) ? "yes" : "unknown";
  return "unknown";
}

/** Что показать в мастере: предложение пресета видно и снимается, отказ пользователя скрывает пункт. */
export function displayed(fact: ProfileFact | undefined): boolean {
  const winner = winningSource(fact);
  if (!winner || winner.status === "rejected" || winner.value === false) return false;
  return winner.value === true;
}

export function findFact(profile: OrganizationProfile, field: FactField, key: string): ProfileFact | undefined {
  const id = factId(field, key);
  return profile.facts.find((fact) => fact.id === id);
}

function cloneFact(fact: ProfileFact): ProfileFact {
  return { ...fact, sources: fact.sources.map((source) => ({ ...source })) };
}

function sameDecision(source: FactSource, input: FactInput): boolean {
  return source.source === input.source && source.sourceId === input.sourceId && source.status === input.status && source.value === input.value;
}

export function mergeFactList(profile: OrganizationProfile, inputs: FactInput[], now = clock()): OrganizationProfile {
  const facts = profile.facts.map(cloneFact);
  for (const input of inputs) {
    const id = factId(input.field, input.key);
    let fact = facts.find((item) => item.id === id);
    if (!fact) {
      fact = { id, field: input.field, key: input.key, sources: [] };
      facts.push(fact);
    }
    const existing = fact.sources.find((source) => sameDecision(source, input));
    if (existing) {
      existing.updatedAt = now;
      const index = fact.sources.indexOf(existing);
      if (index >= 0 && index < fact.sources.length - 1) {
        fact.sources.splice(index, 1);
        fact.sources.push(existing);
      }
    } else {
      fact.sources.push({
        source: input.source,
        sourceId: input.sourceId,
        status: input.status,
        value: input.value,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  return { ...profile, facts };
}

export function removeFactList(
  profile: OrganizationProfile,
  id: string,
  source?: { source: FactSource["source"]; sourceId: string },
): OrganizationProfile {
  const facts = profile.facts.flatMap((fact) => {
    if (fact.id !== id) return [cloneFact(fact)];
    if (!source) return [];
    const sources = fact.sources.filter((item) => !(item.source === source.source && item.sourceId === source.sourceId));
    if (sources.length === 0) return [];
    return [{ ...fact, sources }];
  });
  return { ...profile, facts };
}

function confirmingKeys(profile: OrganizationProfile, field: FactField): Set<string> {
  const keys = new Set<string>();
  for (const fact of profile.facts) {
    if (fact.field === field) {
      if (verdictOf(fact) === "yes") keys.add(fact.key);
    }
  }
  return keys;
}

function deriveInputs(profile: OrganizationProfile): FactInput[] {
  const equipment = confirmingKeys(profile, "equipment");
  const works = confirmingKeys(profile, "work");
  const conditions = confirmingKeys(profile, "condition");
  const hazards = confirmingKeys(profile, "hazard");
  const professions = confirmingKeys(profile, "profession");
  const ppe = confirmingKeys(profile, "ppe");
  const custom = confirmingKeys(profile, "custom_profession");
  const inputs: FactInput[] = [];
  const flag = (key: FlagKey, on: boolean) => {
    if (!on) return;
    inputs.push({ field: "flag", key, value: true, source: "system", sourceId: `derive:${key}`, status: "inferred" });
  };
  flag("height", conditions.has("cond_height") || equipment.has("ladder") || hazards.has("fall_height"));
  flag(
    "electrical",
    conditions.has("cond_live") ||
      [...works].some((id) => ELECTRICAL_WORKS.has(id)) ||
      equipment.has("voltage_indicator") ||
      equipment.has("insulated_tools"),
  );
  flag("food", conditions.has("cond_hot_kitchen") || works.has("work_kitchen") || [...professions].some((id) => FOOD_PROFESSIONS.has(id)));
  flag("warehouse", works.has("work_stacking") || [...professions].some((id) => WAREHOUSE_PROFESSIONS.has(id)));
  flag(
    "production",
    conditions.has("cond_hot_zone") || conditions.has("cond_hot_metal") || works.has("work_manual_arc") || works.has("work_locksmith"),
  );
  flag("transport", works.has("work_driving") || conditions.has("cond_traffic") || [...equipment].some((id) => TRANSPORT_GEAR.has(id)));
  flag(
    "hazardousWork",
    ["cond_height", "cond_confined", "cond_hot_zone", "cond_explosive"].some((id) => conditions.has(id)) ||
      equipment.has("ladder") ||
      equipment.has("gas_cylinder") ||
      works.has("work_gas_cutting") ||
      works.has("work_slinging"),
  );
  flag("powerTools", equipment.has("angle_grinder") || equipment.has("drill"));
  flag("ppe", ppe.size > 0 || professions.size > 0 || custom.size > 0);
  return inputs;
}

function stripSystem(profile: OrganizationProfile): OrganizationProfile {
  const facts = profile.facts.flatMap((fact) => {
    const sources = fact.sources.filter((source) => source.source !== "system");
    if (sources.length === 0) return [];
    return [{ ...fact, sources: sources.map((source) => ({ ...source })) }];
  });
  return { ...profile, facts };
}

function previousSystem(profile: OrganizationProfile, id: string, sourceId: string): FactSource | undefined {
  return profile.facts.find((fact) => fact.id === id)?.sources.find((source) => source.source === "system" && source.sourceId === sourceId);
}

function readIds(profile: OrganizationProfile, field: FactField): string[] {
  return profile.facts.filter((fact) => fact.field === field && displayed(fact)).map((fact) => fact.key);
}

function readString(profile: OrganizationProfile, field: FactField): string {
  const winner = winningSource(findFact(profile, field, "value"));
  if (!winner || winner.status === "rejected" || typeof winner.value !== "string") return "";
  return winner.value;
}

function readNumber(profile: OrganizationProfile, field: FactField): number | null {
  const winner = winningSource(findFact(profile, field, "value"));
  if (!winner || winner.status === "rejected" || typeof winner.value !== "number" || !Number.isFinite(winner.value)) return null;
  return winner.value;
}

function readFlags(profile: OrganizationProfile): Record<FlagKey, Tri> {
  const flags = emptyFlags();
  for (const key of FLAG_KEYS) {
    const winner = winningSource(findFact(profile, "flag", key));
    if (!winner) continue;
    if (winner.status === "rejected" || winner.value === false) flags[key] = false;
    else if (winner.source === "preset") flags[key] = null;
    else if (winner.value === true) flags[key] = true;
  }
  return flags;
}

/** Собирает списки мастера из фактов и заново выводит системные признаки только из подтверждённых источников. */
export function projectProfile(profile: OrganizationProfile): OrganizationProfile {
  const stripped = stripSystem(profile);
  const merged = mergeFactList(stripped, deriveInputs(stripped));
  const facts = merged.facts.map((fact) => ({
    ...fact,
    sources: fact.sources.map((source) => {
      if (source.source !== "system") return source;
      const previous = previousSystem(profile, fact.id, source.sourceId);
      if (previous && previous.value === source.value && previous.status === source.status) return { ...previous };
      return source;
    }),
  }));
  const next: OrganizationProfile = { ...merged, facts, schemaVersion: profile.schemaVersion || PROFILE_SCHEMA_VERSION };
  const gearIds = readIds(next, "equipment");
  return {
    ...next,
    schemaVersion: next.schemaVersion || PROFILE_SCHEMA_VERSION,
    name: readString(next, "name"),
    inn: readString(next, "inn"),
    activity: readString(next, "activity"),
    industry: readString(next, "industry"),
    headcount: readNumber(next, "headcount"),
    departments: readIds(next, "department"),
    professionIds: readIds(next, "profession"),
    customProfessions: readIds(next, "custom_profession"),
    positions: readIds(next, "position"),
    workIds: readIds(next, "work"),
    gearIds,
    conditionIds: readIds(next, "condition"),
    hazardIds: readIds(next, "hazard"),
    materialIds: [...new Set([...readIds(next, "material"), ...gearIds.filter((id) => MATERIAL_GEAR.has(id))])],
    ppeIds: readIds(next, "ppe"),
    flags: readFlags(next),
    instructionIds: profile.instructionIds,
    presetId: profile.presetId,
  };
}

export function mergeFacts(profile: OrganizationProfile, inputs: FactInput[]): OrganizationProfile {
  return projectProfile(mergeFactList(profile, inputs));
}

export function removeFact(
  profile: OrganizationProfile,
  id: string,
  source?: { source: FactSource["source"]; sourceId: string },
): OrganizationProfile {
  return projectProfile(removeFactList(profile, id, source));
}

export function resolvedValue(profile: OrganizationProfile, field: FactField, key: string): FactValue | null {
  const winner = winningSource(findFact(profile, field, key));
  if (!winner || winner.status === "rejected") return winner?.value === false ? false : null;
  return winner.value;
}