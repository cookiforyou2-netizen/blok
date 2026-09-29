import { resolvedValue } from "./facts";
import type {
  DataRequirement,
  DocumentModule,
  OrganizationProfile,
  PackageComposition,
  PackageItem,
  PackageSnapshot,
  WorkflowStatus,
} from "./types";

export function requirementValue(profile: OrganizationProfile, requirement: DataRequirement): string {
  const value = resolvedValue(profile, requirement.field, requirement.key);
  if (typeof value !== "string") return "";
  return value.trim();
}

export function missingRequirements(profile: OrganizationProfile, document: DocumentModule): DataRequirement[] {
  return (document.requiredData ?? []).filter((requirement) => requirementValue(profile, requirement).length === 0);
}

export function knownRequirements(profile: OrganizationProfile, document: DocumentModule): DataRequirement[] {
  return (document.requiredData ?? []).filter((requirement) => requirementValue(profile, requirement).length > 0);
}

/** Поля, которых не хватает применимым документам. Уже известные факты в список не попадают. */
export function missingForItems(profile: OrganizationProfile, items: PackageItem[]): DataRequirement[] {
  const missing: DataRequirement[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (item.document.moduleId !== "core_osh" || item.match !== "yes") continue;
    for (const requirement of missingRequirements(profile, item.document)) {
      if (seen.has(requirement.id)) continue;
      seen.add(requirement.id);
      missing.push(requirement);
    }
  }
  return missing;
}

export function generatorIdOf(document: DocumentModule): string | null {
  const id = document.generatorId;
  if (!id || id === "none" || id === "instruction") return null;
  return id;
}

export function workflowOf(item: PackageItem, profile: OrganizationProfile, formedIds: readonly string[]): WorkflowStatus | null {
  if (item.document.moduleId !== "core_osh") return null;
  if (item.match === "unknown" || item.status === "clarify") return "clarify";
  if (item.match !== "yes") return null;
  if (formedIds.includes(item.document.id)) return "formed";
  if (missingRequirements(profile, item.document).length > 0) return "needs_data";
  if (generatorIdOf(item.document)) return "ready_to_generate";
  return "defined";
}

export function createPackageSnapshot(
  profile: OrganizationProfile,
  composition: PackageComposition,
  createdAt = new Date().toISOString(),
): PackageSnapshot {
  return {
    createdAt,
    profileVersion: profile.schemaVersion,
    documents: composition.items.map((item) => ({
      id: item.document.id,
      code: item.document.code,
      name: item.document.name,
      moduleId: item.document.moduleId,
      match: item.match,
      result: item.trace.result,
    })),
  };
}
