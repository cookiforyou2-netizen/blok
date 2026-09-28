import type { InstructionRecord } from "../types";
import type { FlagKey, IndustryPreset, OrganizationProfile, Tri } from "./types";
import { FLAG_KEYS } from "./types";

const FOOD_PROFESSIONS = new Set(["cook", "confectioner", "baker", "food_line", "butcher", "dishwasher"]);
const WAREHOUSE_PROFESSIONS = new Set(["loader", "storekeeper", "picker", "receiver", "packer", "stacker_driver", "rigger", "marker"]);
const TRANSPORT_GEAR = new Set(["car", "forklift", "self_propelled"]);
const ELECTRICAL_WORKS = new Set(["work_electrical_install", "work_electrical_maint"]);
const MATERIAL_GEAR = new Set(["cleaning_agents"]);

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
  };
}

export function uniq(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const item = value.trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Достраивает новые поля старого профиля и не затирает уже отвеченные признаки. */
export function normalizeProfile(raw: unknown): OrganizationProfile {
  const source = raw && typeof raw === "object" ? (raw as Partial<OrganizationProfile>) : {};
  const flags = emptyFlags();
  const savedFlags: Partial<Record<FlagKey, Tri>> = source.flags ?? {};
  for (const key of FLAG_KEYS) {
    const value = savedFlags[key];
    flags[key] = value === true || value === false ? value : null;
  }
  return inferProfile({
    name: typeof source.name === "string" ? source.name : "",
    inn: typeof source.inn === "string" ? source.inn : "",
    activity: typeof source.activity === "string" ? source.activity : "",
    industry: typeof source.industry === "string" ? source.industry : "",
    headcount: typeof source.headcount === "number" && Number.isFinite(source.headcount) ? source.headcount : null,
    departments: asStrings(source.departments),
    professionIds: asStrings(source.professionIds),
    customProfessions: asStrings(source.customProfessions),
    positions: asStrings(source.positions),
    workIds: asStrings(source.workIds),
    gearIds: asStrings(source.gearIds),
    conditionIds: asStrings(source.conditionIds),
    hazardIds: asStrings(source.hazardIds),
    materialIds: asStrings(source.materialIds),
    ppeIds: asStrings(source.ppeIds),
    flags,
    instructionIds: asStrings(source.instructionIds),
    presetId: typeof source.presetId === "string" ? source.presetId : null,
  });
}

function yes(flags: Record<FlagKey, Tri>, key: FlagKey, on: boolean) {
  if (on && flags[key] === null) flags[key] = true;
}

/** Ставит «да» только там, где признак ещё не отвечен и факт уже есть в профиле. «Нет» не перетирается. */
export function inferFlags(profile: OrganizationProfile): Record<FlagKey, Tri> {
  const flags = { ...profile.flags };
  yes(flags, "height", profile.conditionIds.includes("cond_height") || profile.gearIds.includes("ladder") || profile.hazardIds.includes("fall_height"));
  yes(
    flags,
    "electrical",
    profile.conditionIds.includes("cond_live") ||
      profile.workIds.some((id) => ELECTRICAL_WORKS.has(id)) ||
      profile.gearIds.includes("voltage_indicator") ||
      profile.gearIds.includes("insulated_tools"),
  );
  yes(
    flags,
    "food",
    profile.conditionIds.includes("cond_hot_kitchen") ||
      profile.workIds.includes("work_kitchen") ||
      profile.professionIds.some((id) => FOOD_PROFESSIONS.has(id)),
  );
  yes(flags, "warehouse", profile.workIds.includes("work_stacking") || profile.professionIds.some((id) => WAREHOUSE_PROFESSIONS.has(id)));
  yes(
    flags,
    "production",
    profile.conditionIds.includes("cond_hot_zone") ||
      profile.conditionIds.includes("cond_hot_metal") ||
      profile.workIds.includes("work_manual_arc") ||
      profile.workIds.includes("work_locksmith"),
  );
  yes(
    flags,
    "transport",
    profile.workIds.includes("work_driving") ||
      profile.conditionIds.includes("cond_traffic") ||
      profile.gearIds.some((id) => TRANSPORT_GEAR.has(id)),
  );
  yes(
    flags,
    "hazardousWork",
    profile.conditionIds.some((id) => ["cond_height", "cond_confined", "cond_hot_zone", "cond_explosive"].includes(id)) ||
      profile.gearIds.includes("ladder") ||
      profile.gearIds.includes("gas_cylinder") ||
      profile.workIds.includes("work_gas_cutting") ||
      profile.workIds.includes("work_slinging"),
  );
  yes(flags, "powerTools", profile.gearIds.includes("angle_grinder") || profile.gearIds.includes("drill"));
  yes(flags, "ppe", profile.ppeIds.length > 0 || profile.professionIds.length > 0 || profile.customProfessions.length > 0);
  return flags;
}

export function inferProfile(profile: OrganizationProfile): OrganizationProfile {
  const materialIds = uniq([...profile.materialIds.filter((id) => !MATERIAL_GEAR.has(id)), ...profile.gearIds.filter((id) => MATERIAL_GEAR.has(id))]);
  const next = { ...profile, materialIds };
  return { ...next, flags: inferFlags(next) };
}

export function applyPreset(profile: OrganizationProfile, preset: IndustryPreset): OrganizationProfile {
  const flags = { ...profile.flags };
  for (const key of FLAG_KEYS) {
    const suggested = preset.flags[key];
    if (suggested !== undefined && flags[key] === null) flags[key] = suggested;
  }
  return inferProfile({
    ...profile,
    industry: profile.industry.trim() ? profile.industry : preset.industry,
    activity: profile.activity.trim() ? profile.activity : preset.activity,
    presetId: preset.id,
    professionIds: uniq([...profile.professionIds, ...preset.professionIds]),
    workIds: uniq([...profile.workIds, ...preset.workIds]),
    gearIds: uniq([...profile.gearIds, ...preset.gearIds]),
    conditionIds: uniq([...profile.conditionIds, ...preset.conditionIds]),
    flags,
  });
}

/** Идемпотентно переносит факты одной инструкции в профиль. Повтор того же id ничего не меняет. */
export function absorbInstruction(profile: OrganizationProfile, record: InstructionRecord): OrganizationProfile {
  if (profile.instructionIds.includes(record.id)) return profile;
  const snap = record.snapshot;
  const flags = { ...profile.flags };
  if (snap.sout.length > 0 && flags.sout === null) flags.sout = true;
  const professionIds = record.professionId ? uniq([...profile.professionIds, record.professionId]) : profile.professionIds;
  const customProfessions =
    !record.professionId && record.professionTitle ? uniq([...profile.customProfessions, record.professionTitle]) : profile.customProfessions;
  const name = profile.name.trim() || (record.orgName && record.orgName !== "Организация не указана" ? record.orgName : profile.name);
  return inferProfile({
    ...profile,
    name,
    professionIds,
    customProfessions,
    positions: uniq([...profile.positions, record.professionTitle]),
    workIds: uniq([...profile.workIds, ...snap.works.map((item) => item.id)]),
    gearIds: uniq([...profile.gearIds, ...snap.gears.map((item) => item.id)]),
    conditionIds: uniq([...profile.conditionIds, ...snap.conditions.map((item) => item.id)]),
    hazardIds: uniq([...profile.hazardIds, ...snap.hazards.map((item) => item.id)]),
    ppeIds: uniq([...profile.ppeIds, ...snap.ppe.map((item) => item.id)]),
    materialIds: uniq([...profile.materialIds, ...snap.gears.filter((item) => item.kind === "material").map((item) => item.id)]),
    flags,
    instructionIds: [...profile.instructionIds, record.id],
  });
}

export function absorbAll(profile: OrganizationProfile, records: InstructionRecord[]): OrganizationProfile {
  return records.reduce((next, record) => absorbInstruction(next, record), profile);
}
