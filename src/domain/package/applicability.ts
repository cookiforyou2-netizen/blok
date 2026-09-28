import type { Applicability, ApplicabilityClause, DocumentModule, Match, OrganizationProfile, PackageComposition, PackageItem } from "./types";
import { FLAG_LABELS } from "./types";

function listMatch(have: string[], need: string[] | undefined): Match | "skip" {
  if (!need || need.length === 0) return "skip";
  return need.some((id) => have.includes(id)) ? "yes" : "no";
}

function requiredList(profile: OrganizationProfile, key: NonNullable<ApplicabilityClause["requires"]>[number]): string[] {
  if (key === "professions") return [...profile.professionIds, ...profile.customProfessions];
  if (key === "works") return profile.workIds;
  if (key === "gears") return profile.gearIds;
  if (key === "ppe") return profile.ppeIds;
  if (key === "hazards") return profile.hazardIds;
  return profile.positions;
}

/** Поля условия складываются через И. Пустое правило не считается совпадением. */
export function matchClause(profile: OrganizationProfile, clause: ApplicabilityClause): Match {
  const parts: Match[] = [];
  const pairs: Array<[string[], string[] | undefined]> = [
    [profile.professionIds, clause.professionIds],
    [profile.workIds, clause.workIds],
    [profile.gearIds, clause.gearIds],
    [profile.conditionIds, clause.conditionIds],
    [profile.hazardIds, clause.hazardIds],
    [profile.materialIds, clause.materialIds],
  ];
  for (const [have, need] of pairs) {
    const hit = listMatch(have, need);
    if (hit !== "skip") parts.push(hit);
  }
  if (clause.industries && clause.industries.length > 0) {
    parts.push(profile.industry && clause.industries.includes(profile.industry) ? "yes" : "no");
  }
  if (clause.minHeadcount != null) {
    parts.push(profile.headcount == null ? "unknown" : profile.headcount >= clause.minHeadcount ? "yes" : "no");
  }
  for (const key of clause.requires ?? []) {
    parts.push(requiredList(profile, key).length > 0 ? "yes" : "unknown");
  }
  for (const [key, expected] of Object.entries(clause.flags ?? {})) {
    const actual = profile.flags[key as keyof OrganizationProfile["flags"]];
    if (actual == null) parts.push("unknown");
    else parts.push(actual === expected ? "yes" : "no");
  }
  if (parts.length === 0) return "no";
  if (parts.some((item) => item === "no")) return "no";
  if (parts.some((item) => item === "unknown")) return "unknown";
  return "yes";
}

/** anyOf — ИЛИ. Хотя бы одно «да» включает документ. «Не знаю» не равно отказу. */
export function matchApplicability(profile: OrganizationProfile, applicability: Applicability): Match {
  if (applicability.always) return "yes";
  const clauses = applicability.anyOf ?? [];
  if (clauses.length === 0) return "no";
  const results = clauses.map((clause) => matchClause(profile, clause));
  if (results.some((item) => item === "yes")) return "yes";
  if (results.some((item) => item === "unknown")) return "unknown";
  return "no";
}

function reason(profile: OrganizationProfile, document: DocumentModule, match: Match): string {
  if (document.applicability.always && match === "yes") return "Требуется для организации в целом";
  if (match === "unknown") {
    for (const clause of document.applicability.anyOf ?? []) {
      for (const key of Object.keys(clause.flags ?? {})) {
        if (profile.flags[key as keyof OrganizationProfile["flags"]] == null) {
          return `Не задан признак: ${FLAG_LABELS[key as keyof typeof FLAG_LABELS]}`;
        }
      }
      if (clause.minHeadcount != null && profile.headcount == null) return "Не указана численность";
      if ((clause.requires ?? []).includes("professions") && profile.professionIds.length === 0 && profile.customProfessions.length === 0) {
        return "Не указаны профессии";
      }
    }
    return "Не хватает данных профиля";
  }
  if (match === "no") return "Условия организации не подходят";
  for (const clause of document.applicability.anyOf ?? []) {
    if (matchClause(profile, clause) !== "yes") continue;
    if (clause.professionIds?.some((id) => profile.professionIds.includes(id))) return "В профиле есть соответствующая профессия";
    if (clause.workIds?.some((id) => profile.workIds.includes(id))) return "В профиле есть соответствующий вид работ";
    if (clause.gearIds?.some((id) => profile.gearIds.includes(id))) return "В профиле есть соответствующее оборудование или инструмент";
    if (clause.conditionIds?.some((id) => profile.conditionIds.includes(id))) return "В профиле есть соответствующее условие";
    const flag = Object.keys(clause.flags ?? {})[0];
    if (flag) return `Признак профиля: ${FLAG_LABELS[flag as keyof typeof FLAG_LABELS]}`;
    if (clause.requires?.length) return "Нужные сведения в профиле уже есть";
  }
  return "Условия профиля совпали";
}

export function resolveStatus(document: DocumentModule, match: Match): PackageItem["status"] | "exclude" {
  if (match === "no") return "exclude";
  if (match === "unknown") return "clarify";
  if (document.optional) return "optional";
  if (document.commercialLevel === "FREE") return "ready";
  return "locked";
}

export function composePackage(profile: OrganizationProfile, documents: DocumentModule[]): PackageComposition {
  const items: PackageItem[] = [];
  for (const document of documents) {
    const match = matchApplicability(profile, document.applicability);
    const status = resolveStatus(document, match);
    if (status === "exclude") continue;
    items.push({ document, match, status, reason: reason(profile, document, match) });
  }
  const included = items.filter((item) => item.status === "ready" || item.status === "locked");
  const clarifications = items.filter((item) => item.status === "clarify");
  const optional = items.filter((item) => item.status === "optional");
  const countShape = (shape: DocumentModule["shape"]) => included.filter((item) => item.document.shape === shape).length;
  return {
    items,
    included,
    clarifications,
    optional,
    counts: {
      orders: countShape("order"),
      instructions: countShape("instruction"),
      policies: countShape("policy"),
      programs: countShape("program"),
      lists: countShape("list"),
      journals: countShape("journal"),
      ppe: included.filter((item) => item.document.category === "ppe" && item.document.shape !== "order").length,
      medical: included.filter((item) => item.document.category === "medical" && item.document.shape !== "order").length,
      total: included.length,
    },
  };
}
