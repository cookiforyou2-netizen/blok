import type { InstructionRecord } from "../types";
import { emptyFlags, emptyProfile, factId, findFact, mergeFacts, mergeFactList, projectProfile, removeFact, winningSource } from "./facts";
import type { FactField, FactInput, FlagKey, IndustryPreset, OrganizationProfile } from "./types";
import { FLAG_KEYS } from "./types";

export { emptyFlags, emptyProfile, projectProfile as inferProfile };

const USER = "user-profile";

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function legacyInputs(field: FactField, keys: string[], value: boolean, status: "confirmed" | "rejected"): FactInput[] {
  return keys.map((key) => ({ field, key, value, source: "user", sourceId: "legacy-profile", status }));
}

function isFact(value: unknown): value is OrganizationProfile["facts"][number] {
  if (!value || typeof value !== "object") return false;
  const fact = value as { id?: unknown; field?: unknown; key?: unknown; sources?: unknown };
  return typeof fact.id === "string" && typeof fact.field === "string" && typeof fact.key === "string" && Array.isArray(fact.sources);
}

/** Старый профиль без фактов превращается в подтверждённые пользовательские факты и не теряет ответы «нет». */
export function normalizeProfile(raw: unknown): OrganizationProfile {
  const source = raw && typeof raw === "object" ? (raw as Partial<OrganizationProfile> & { facts?: unknown }) : {};
  const instructionIds = asStrings(source.instructionIds);
  const presetId = typeof source.presetId === "string" ? source.presetId : null;
  if (Array.isArray(source.facts) && source.facts.some(isFact)) {
    return projectProfile({
      ...emptyProfile(),
      instructionIds,
      presetId,
      facts: source.facts.filter(isFact),
    });
  }
  const flags = emptyFlags();
  const savedFlags: Partial<Record<FlagKey, boolean | null>> = source.flags ?? {};
  for (const key of FLAG_KEYS) {
    const value = savedFlags[key];
    flags[key] = value === true || value === false ? value : null;
  }
  const inputs: FactInput[] = [
    ...legacyInputs("profession", asStrings(source.professionIds), true, "confirmed"),
    ...legacyInputs("custom_profession", asStrings(source.customProfessions), true, "confirmed"),
    ...legacyInputs("position", asStrings(source.positions), true, "confirmed"),
    ...legacyInputs("work", asStrings(source.workIds), true, "confirmed"),
    ...legacyInputs("equipment", asStrings(source.gearIds), true, "confirmed"),
    ...legacyInputs("condition", asStrings(source.conditionIds), true, "confirmed"),
    ...legacyInputs("hazard", asStrings(source.hazardIds), true, "confirmed"),
    ...legacyInputs("material", asStrings(source.materialIds), true, "confirmed"),
    ...legacyInputs("ppe", asStrings(source.ppeIds), true, "confirmed"),
    ...legacyInputs("department", asStrings(source.departments), true, "confirmed"),
  ];
  for (const key of FLAG_KEYS) {
    if (flags[key] === true) inputs.push({ field: "flag", key, value: true, source: "user", sourceId: "legacy-profile", status: "confirmed" });
    if (flags[key] === false) inputs.push({ field: "flag", key, value: false, source: "user", sourceId: "legacy-profile", status: "rejected" });
  }
  const text: Array<[FactField, string]> = [
    ["name", typeof source.name === "string" ? source.name : ""],
    ["inn", typeof source.inn === "string" ? source.inn : ""],
    ["activity", typeof source.activity === "string" ? source.activity : ""],
    ["industry", typeof source.industry === "string" ? source.industry : ""],
  ];
  for (const [field, value] of text) {
    if (value.trim()) inputs.push({ field, key: "value", value, source: "user", sourceId: "legacy-profile", status: "confirmed" });
  }
  if (typeof source.headcount === "number" && Number.isFinite(source.headcount)) {
    inputs.push({ field: "headcount", key: "value", value: source.headcount, source: "user", sourceId: "legacy-profile", status: "confirmed" });
  }
  return projectProfile({ ...mergeFactList(emptyProfile(), inputs), instructionIds, presetId });
}

function suggest(field: FactField, keys: string[], presetId: string, value: boolean = true): FactInput[] {
  return keys.map((key) => ({ field, key, value, source: "preset", sourceId: presetId, status: "inferred" }));
}

/** Пресет добавляет источники inferred и не затирает уже принятое пользователем решение. */
export function applyPreset(profile: OrganizationProfile, preset: IndustryPreset): OrganizationProfile {
  const inputs: FactInput[] = [
    ...suggest("profession", preset.professionIds, preset.id),
    ...suggest("work", preset.workIds, preset.id),
    ...suggest("equipment", preset.gearIds, preset.id),
    ...suggest("condition", preset.conditionIds, preset.id),
  ];
  for (const key of FLAG_KEYS) {
    if (preset.flags[key] === true) inputs.push({ field: "flag", key, value: true, source: "preset", sourceId: preset.id, status: "inferred" });
  }
  if (!profile.industry.trim()) inputs.push({ field: "industry", key: "value", value: preset.industry, source: "preset", sourceId: preset.id, status: "inferred" });
  if (!profile.activity.trim()) inputs.push({ field: "activity", key: "value", value: preset.activity, source: "preset", sourceId: preset.id, status: "inferred" });
  return projectProfile({ ...mergeFactList(profile, inputs), presetId: preset.id });
}

function snapshotInputs(record: InstructionRecord): FactInput[] {
  const snap = record.snapshot;
  const inputs: FactInput[] = [];
  const add = (field: FactField, key: string) => {
    if (!key) return;
    inputs.push({ field, key, value: true, source: "instruction", sourceId: record.id, status: "inferred" });
  };
  if (record.professionId) add("profession", record.professionId);
  else if (record.professionTitle) add("custom_profession", record.professionTitle);
  if (record.professionTitle) add("position", record.professionTitle);
  for (const item of snap.works) add("work", item.id);
  for (const item of snap.gears) add("equipment", item.id);
  for (const item of snap.conditions) add("condition", item.id);
  for (const item of snap.hazards) add("hazard", item.id);
  for (const item of snap.ppe) add("ppe", item.id);
  for (const item of snap.gears) {
    if (item.kind === "material") add("material", item.id);
  }
  if (snap.sout.length > 0) add("flag", "sout");
  return inputs;
}

/** Повтор той же инструкции не плодит факты: источник с тем же id обновляется на месте. */
export function absorbInstruction(profile: OrganizationProfile, record: InstructionRecord): OrganizationProfile {
  if (profile.instructionIds.includes(record.id)) return profile;
  const inputs = snapshotInputs(record);
  const name = profile.name.trim() || (record.orgName && record.orgName !== "Организация не указана" ? record.orgName : "");
  if (name && !profile.name.trim()) {
    inputs.push({ field: "name", key: "value", value: name, source: "instruction", sourceId: record.id, status: "inferred" });
  }
  return projectProfile({
    ...mergeFactList(profile, inputs),
    instructionIds: [...profile.instructionIds, record.id],
  });
}

export function absorbAll(profile: OrganizationProfile, records: InstructionRecord[]): OrganizationProfile {
  return records.reduce((next, record) => absorbInstruction(next, record), profile);
}

function setText(profile: OrganizationProfile, field: FactField, value: string): OrganizationProfile {
  if (!value.trim()) return removeFact(profile, factId(field, "value"), { source: "user", sourceId: USER });
  return mergeFacts(profile, [{ field, key: "value", value, source: "user", sourceId: USER, status: "confirmed" }]);
}

export function patchOrganization(profile: OrganizationProfile, patch: Partial<OrganizationProfile>): OrganizationProfile {
  let next = profile;
  if (typeof patch.name === "string") next = setText(next, "name", patch.name);
  if (typeof patch.inn === "string") next = setText(next, "inn", patch.inn);
  if (typeof patch.activity === "string") next = setText(next, "activity", patch.activity);
  if (typeof patch.industry === "string") next = setText(next, "industry", patch.industry);
  if (patch.headcount === null) next = removeFact(next, factId("headcount", "value"), { source: "user", sourceId: USER });
  else if (typeof patch.headcount === "number" && Number.isFinite(patch.headcount)) {
    next = mergeFacts(next, [{ field: "headcount", key: "value", value: patch.headcount, source: "user", sourceId: USER, status: "confirmed" }]);
  }
  if (patch.departments) {
    for (const name of next.departments) {
      if (!patch.departments.includes(name)) next = removeFact(next, factId("department", name));
    }
    next = mergeFacts(
      next,
      patch.departments.map((key) => ({ field: "department" as const, key, value: true, source: "user" as const, sourceId: USER, status: "confirmed" as const })),
    );
  }
  return next;
}

const LIST_FIELD = {
  professionIds: "profession",
  workIds: "work",
  gearIds: "equipment",
  conditionIds: "condition",
  hazardIds: "hazard",
  ppeIds: "ppe",
} as const;

export function toggleListedFact(profile: OrganizationProfile, field: keyof typeof LIST_FIELD, id: string): OrganizationProfile {
  const selected = profile[field].includes(id);
  return mergeFacts(profile, [
    {
      field: LIST_FIELD[field],
      key: id,
      value: !selected,
      source: "user",
      sourceId: USER,
      status: selected ? "rejected" : "confirmed",
    },
  ]);
}

export function setFlagFact(profile: OrganizationProfile, key: FlagKey, value: boolean | null): OrganizationProfile {
  if (value === null) return removeFact(profile, factId("flag", key), { source: "user", sourceId: USER });
  return mergeFacts(profile, [
    { field: "flag", key, value, source: "user", sourceId: USER, status: value ? "confirmed" : "rejected" },
  ]);
}

export function addCustomProfession(profile: OrganizationProfile, title: string): OrganizationProfile {
  const name = title.trim();
  if (name.length < 2 || profile.customProfessions.includes(name)) return profile;
  return mergeFacts(profile, [
    { field: "custom_profession", key: name, value: true, source: "user", sourceId: USER, status: "confirmed" },
    { field: "position", key: name, value: true, source: "user", sourceId: USER, status: "confirmed" },
  ]);
}

export function removeCustomProfession(profile: OrganizationProfile, title: string): OrganizationProfile {
  return removeFact(profile, factId("custom_profession", title));
}

export function userRejected(profile: OrganizationProfile, field: FactField, key: string): boolean {
  const winner = winningSource(findFact(profile, field, key));
  return winner?.source === "user" && (winner.status === "rejected" || winner.value === false);
}
