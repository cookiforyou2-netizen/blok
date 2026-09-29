import { findFact, verdictOf, winningSource } from "./facts";
import type {
  Applicability,
  ApplicabilityAtom,
  ApplicabilityDecision,
  DocumentModule,
  FactField,
  Match,
  OrganizationProfile,
  PackageComposition,
  PackageItem,
} from "./types";
import { FLAG_LABELS } from "./types";

const FIELD_LABEL: Record<FactField, string> = {
  profession: "профессия",
  custom_profession: "своя должность",
  work: "вид работ",
  equipment: "оборудование",
  condition: "условие",
  hazard: "опасность",
  material: "материал",
  ppe: "СИЗ",
  position: "должность",
  department: "подразделение",
  flag: "признак",
  industry: "отрасль",
  activity: "деятельность",
  name: "название",
  inn: "ИНН",
  headcount: "численность",
};

interface AtomResult {
  verdict: Match;
  reasons: string[];
  sources: string[];
  missing: string[];
}

function prettyKey(field: FactField, key: string): string {
  if (field === "flag") return FLAG_LABELS[key as keyof typeof FLAG_LABELS] ?? key;
  return key;
}

function sourceIds(profile: OrganizationProfile, field: FactField, key: string): string[] {
  const winner = winningSource(findFact(profile, field, key));
  return winner ? [winner.sourceId] : [];
}

function atomResult(profile: OrganizationProfile, atom: ApplicabilityAtom): AtomResult {
  if (atom.present) {
    const facts = profile.facts.filter((fact) => fact.field === atom.field);
    if (facts.length === 0) {
      return { verdict: "unknown", reasons: [], sources: [], missing: [`${atom.field}:*`] };
    }
    const yes = facts.filter((fact) => verdictOf(fact) === "yes");
    if (yes.length > 0) {
      return {
        verdict: "yes",
        reasons: [`${FIELD_LABEL[atom.field]}: ${yes.map((fact) => prettyKey(atom.field, fact.key)).join(", ")}`],
        sources: yes.flatMap((fact) => sourceIds(profile, atom.field, fact.key)),
        missing: [],
      };
    }
    const unknown = facts.filter((fact) => verdictOf(fact) === "unknown");
    if (unknown.length > 0) {
      return {
        verdict: "unknown",
        reasons: [],
        sources: unknown.flatMap((fact) => sourceIds(profile, atom.field, fact.key)),
        missing: unknown.map((fact) => fact.id),
      };
    }
    return { verdict: "no", reasons: [`${FIELD_LABEL[atom.field]} отклонены`], sources: [], missing: [] };
  }

  if (atom.min != null || atom.field === "headcount") {
    const fact = findFact(profile, "headcount", "value");
    const verdict = verdictOf(fact);
    const winner = winningSource(fact);
    if (verdict !== "yes" || !winner || typeof winner.value !== "number") {
      return { verdict: verdict === "no" ? "no" : "unknown", reasons: [], sources: [], missing: verdict === "no" ? [] : ["headcount:value"] };
    }
    const enough = atom.min == null || winner.value >= atom.min;
    return enough
      ? { verdict: "yes", reasons: [`численность: ${winner.value}`], sources: [winner.sourceId], missing: [] }
      : { verdict: "no", reasons: [`численность ${winner.value} меньше ${atom.min}`], sources: [winner.sourceId], missing: [] };
  }

  if (atom.eq !== undefined) {
    const key = "value";
    const fact = findFact(profile, atom.field, key);
    const verdict = verdictOf(fact);
    const winner = winningSource(fact);
    if (!winner || verdict === "unknown") return { verdict: "unknown", reasons: [], sources: [], missing: [factIdOf(atom.field, key)] };
    if (winner.value === atom.eq && verdict === "yes") {
      return { verdict: "yes", reasons: [`${FIELD_LABEL[atom.field]}: ${String(atom.eq)}`], sources: [winner.sourceId], missing: [] };
    }
    return { verdict: "no", reasons: [`${FIELD_LABEL[atom.field]} не равно ${String(atom.eq)}`], sources: [winner.sourceId], missing: [] };
  }

  const keys = atom.in ?? [];
  if (keys.length === 0) return { verdict: "no", reasons: [], sources: [], missing: [] };
  const yes: string[] = [];
  const missing: string[] = [];
  const sources: string[] = [];
  let rejected = 0;
  for (const key of keys) {
    const fact = findFact(profile, atom.field, key);
    const verdict = verdictOf(fact);
    if (verdict === "yes") {
      yes.push(prettyKey(atom.field, key));
      sources.push(...sourceIds(profile, atom.field, key));
    } else if (verdict === "no") rejected += 1;
    else missing.push(factIdOf(atom.field, key));
  }
  if (yes.length > 0) {
    return { verdict: "yes", reasons: [`${FIELD_LABEL[atom.field]}: ${yes.join(", ")}`], sources, missing: [] };
  }
  if (missing.length > 0) return { verdict: "unknown", reasons: [], sources: [], missing };
  if (rejected === keys.length) {
    return { verdict: "no", reasons: [`${FIELD_LABEL[atom.field]}: ${keys.map((key) => prettyKey(atom.field, key)).join(", ")} — нет`], sources: [], missing: [] };
  }
  return { verdict: "unknown", reasons: [], sources: [], missing: keys.map((key) => factIdOf(atom.field, key)) };
}

function factIdOf(field: FactField, key: string): string {
  return `${field}:${key}`;
}

function combineOr(parts: AtomResult[]): AtomResult | "skip" {
  if (parts.length === 0) return "skip";
  const yes = parts.filter((part) => part.verdict === "yes");
  if (yes.length > 0) {
    return {
      verdict: "yes",
      reasons: yes.flatMap((part) => part.reasons),
      sources: [...new Set(yes.flatMap((part) => part.sources))],
      missing: [],
    };
  }
  const unknown = parts.filter((part) => part.verdict === "unknown");
  if (unknown.length > 0) {
    return {
      verdict: "unknown",
      reasons: [],
      sources: [...new Set(unknown.flatMap((part) => part.sources))],
      missing: [...new Set(unknown.flatMap((part) => part.missing))],
    };
  }
  return { verdict: "no", reasons: parts.flatMap((part) => part.reasons), sources: [], missing: [] };
}

function combineAnd(parts: AtomResult[]): AtomResult | "skip" {
  if (parts.length === 0) return "skip";
  if (parts.some((part) => part.verdict === "no")) {
    return { verdict: "no", reasons: parts.filter((part) => part.verdict === "no").flatMap((part) => part.reasons), sources: [], missing: [] };
  }
  if (parts.some((part) => part.verdict === "unknown")) {
    const unknown = parts.filter((part) => part.verdict === "unknown");
    return {
      verdict: "unknown",
      reasons: [],
      sources: [...new Set(unknown.flatMap((part) => part.sources))],
      missing: [...new Set(unknown.flatMap((part) => part.missing))],
    };
  }
  return {
    verdict: "yes",
    reasons: parts.flatMap((part) => part.reasons),
    sources: [...new Set(parts.flatMap((part) => part.sources))],
    missing: [],
  };
}

function combineNone(parts: AtomResult[]): AtomResult | "skip" {
  if (parts.length === 0) return "skip";
  const held = parts.filter((part) => part.verdict === "yes");
  if (held.length > 0) {
    return {
      verdict: "no",
      reasons: held.flatMap((part) => part.reasons.map((reason) => `запрещающее условие: ${reason}`)),
      sources: [...new Set(held.flatMap((part) => part.sources))],
      missing: [],
    };
  }
  const unknown = parts.filter((part) => part.verdict === "unknown");
  if (unknown.length > 0) {
    return {
      verdict: "unknown",
      reasons: [],
      sources: [],
      missing: [...new Set(unknown.flatMap((part) => part.missing))],
    };
  }
  return { verdict: "yes", reasons: [], sources: [], missing: [] };
}

function asResult(value: AtomResult | "skip"): AtomResult | null {
  return value === "skip" ? null : value;
}

/** ALL + ANY + NONE. Пустое правило — документ нужен организации в целом. */
export function evaluateApplicability(profile: OrganizationProfile, applicability: Applicability): ApplicabilityDecision {
  const all = asResult(combineAnd((applicability.all ?? []).map((atom) => atomResult(profile, atom))));
  const any = asResult(combineOr((applicability.any ?? []).map((atom) => atomResult(profile, atom))));
  const none = asResult(combineNone((applicability.none ?? []).map((atom) => atomResult(profile, atom))));
  const groups = [all, any, none].filter((group): group is AtomResult => group != null);
  if (groups.length === 0) {
    return { applicable: "yes", reasons: ["Требуется для организации в целом"], sources: [], missing: [] };
  }
  const folded = combineAnd(groups);
  if (folded === "skip") return { applicable: "yes", reasons: ["Требуется для организации в целом"], sources: [], missing: [] };
  return { applicable: folded.verdict, reasons: folded.reasons, sources: folded.sources, missing: folded.missing };
}

export function matchApplicability(profile: OrganizationProfile, applicability: Applicability): Match {
  return evaluateApplicability(profile, applicability).applicable;
}

function explain(decision: ApplicabilityDecision): string {
  if (decision.applicable === "yes") {
    return decision.reasons.length > 0 ? `Документ включён, потому что ${decision.reasons.join("; ")}.` : "Документ включён.";
  }
  if (decision.applicable === "unknown") {
    const labels = decision.missing.map((id) => {
      const [field, key] = id.split(":");
      if (!key || key === "*") return FIELD_LABEL[field as FactField] ?? id;
      return prettyKey(field as FactField, key);
    });
    return labels.length > 0 ? `Нужно уточнить: ${labels.join(", ")}.` : "Нужно уточнить.";
  }
  return decision.reasons.length > 0 ? `Документ не включён: ${decision.reasons.join("; ")}.` : "Документ не включён.";
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
    if (document.status === "deprecated") continue;
    const decision = evaluateApplicability(profile, document.applicability);
    const status = resolveStatus(document, decision.applicable);
    if (status === "exclude") continue;
    items.push({
      document,
      match: decision.applicable,
      status,
      reason: explain(decision),
      reasons: decision.reasons,
      sources: decision.sources,
      missing: decision.missing,
    });
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
