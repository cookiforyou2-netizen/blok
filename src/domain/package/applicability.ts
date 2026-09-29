import { findFact, verdictOf, winningSource } from "./facts";
import type {
  Applicability,
  ApplicabilityAtom,
  ApplicabilityDecision,
  DecisionTrace,
  DocumentModule,
  FactField,
  Match,
  MatchedRule,
  OrganizationProfile,
  PackageComposition,
  PackageItem,
  TraceResult,
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
  director: "руководитель",
  director_title: "должность руководителя",
  address: "адрес",
  responsible: "ответственный",
  responsible_title: "должность ответственного",
  approval_date: "дата",
  short_name: "краткое название",
  city: "город",
};

interface AtomResult {
  verdict: Match;
  reasons: string[];
  sources: string[];
  missing: string[];
  rules: MatchedRule[];
  facts: string[];
}

function prettyKey(field: FactField, key: string): string {
  if (field === "flag") return FLAG_LABELS[key as keyof typeof FLAG_LABELS] ?? key;
  return key;
}

function sourceIds(profile: OrganizationProfile, field: FactField, key: string): string[] {
  const winner = winningSource(findFact(profile, field, key));
  return winner ? [winner.sourceId] : [];
}

function factIdOf(field: FactField, key: string): string {
  return `${field}:${key}`;
}

function hit(group: MatchedRule["group"], atom: ApplicabilityAtom, op: MatchedRule["op"], keys: string[]): MatchedRule {
  return { group, field: atom.field, op, keys };
}

function blank(verdict: Match, extra?: Partial<AtomResult>): AtomResult {
  return { verdict, reasons: [], sources: [], missing: [], rules: [], facts: [], ...extra };
}

function atomResult(profile: OrganizationProfile, atom: ApplicabilityAtom, group: MatchedRule["group"]): AtomResult {
  if (atom.present) {
    const facts = profile.facts.filter((fact) => fact.field === atom.field);
    if (facts.length === 0) {
      return blank("unknown", { missing: [`${atom.field}:*`] });
    }
    const yes = facts.filter((fact) => verdictOf(fact) === "yes");
    if (yes.length > 0) {
      const ids = yes.map((fact) => fact.id);
      return blank("yes", {
        reasons: [`${FIELD_LABEL[atom.field]}: ${yes.map((fact) => prettyKey(atom.field, fact.key)).join(", ")}`],
        sources: yes.flatMap((fact) => sourceIds(profile, atom.field, fact.key)),
        rules: [hit(group, atom, "present", yes.map((fact) => fact.key))],
        facts: ids,
      });
    }
    const unknown = facts.filter((fact) => verdictOf(fact) === "unknown");
    if (unknown.length > 0) {
      return blank("unknown", {
        sources: unknown.flatMap((fact) => sourceIds(profile, atom.field, fact.key)),
        missing: unknown.map((fact) => fact.id),
      });
    }
    return blank("no", {
      reasons: [`${FIELD_LABEL[atom.field]} отклонены`],
      rules: [hit(group, atom, "present", [])],
    });
  }

  if (atom.min != null || atom.field === "headcount") {
    const fact = findFact(profile, "headcount", "value");
    const verdict = verdictOf(fact);
    const winner = winningSource(fact);
    if (verdict !== "yes" || !winner || typeof winner.value !== "number") {
      return blank(verdict === "no" ? "no" : "unknown", { missing: verdict === "no" ? [] : ["headcount:value"] });
    }
    const enough = atom.min == null || winner.value >= atom.min;
    const rule = hit(group, { ...atom, field: "headcount" }, "min", [String(atom.min ?? winner.value)]);
    return enough
      ? blank("yes", { reasons: [`численность: ${winner.value}`], sources: [winner.sourceId], rules: [rule], facts: ["headcount:value"] })
      : blank("no", { reasons: [`численность ${winner.value} меньше ${atom.min}`], sources: [winner.sourceId], rules: [rule], facts: ["headcount:value"] });
  }

  if (atom.eq !== undefined) {
    const key = "value";
    const fact = findFact(profile, atom.field, key);
    const verdict = verdictOf(fact);
    const winner = winningSource(fact);
    if (!winner || verdict === "unknown") return blank("unknown", { missing: [factIdOf(atom.field, key)] });
    const rule = hit(group, atom, "eq", [String(atom.eq)]);
    if (winner.value === atom.eq && verdict === "yes") {
      return blank("yes", {
        reasons: [`${FIELD_LABEL[atom.field]}: ${String(atom.eq)}`],
        sources: [winner.sourceId],
        rules: [rule],
        facts: [factIdOf(atom.field, key)],
      });
    }
    return blank("no", {
      reasons: [`${FIELD_LABEL[atom.field]} не равно ${String(atom.eq)}`],
      sources: [winner.sourceId],
      rules: [rule],
      facts: [factIdOf(atom.field, key)],
    });
  }

  const keys = atom.in ?? [];
  if (keys.length === 0) return blank("no");
  const yes: string[] = [];
  const missing: string[] = [];
  const sources: string[] = [];
  const facts: string[] = [];
  let rejected = 0;
  for (const key of keys) {
    const fact = findFact(profile, atom.field, key);
    const verdict = verdictOf(fact);
    if (verdict === "yes") {
      yes.push(prettyKey(atom.field, key));
      sources.push(...sourceIds(profile, atom.field, key));
      facts.push(factIdOf(atom.field, key));
    } else if (verdict === "no") rejected += 1;
    else missing.push(factIdOf(atom.field, key));
  }
  if (yes.length > 0) {
    return blank("yes", {
      reasons: [`${FIELD_LABEL[atom.field]}: ${yes.join(", ")}`],
      sources,
      rules: [hit(group, atom, "in", keys.filter((key) => facts.includes(factIdOf(atom.field, key))))],
      facts,
    });
  }
  if (missing.length > 0) return blank("unknown", { missing });
  if (rejected === keys.length) {
    return blank("no", {
      reasons: [`${FIELD_LABEL[atom.field]}: ${keys.map((key) => prettyKey(atom.field, key)).join(", ")} — нет`],
      rules: [hit(group, atom, "in", keys)],
      facts: keys.map((key) => factIdOf(atom.field, key)),
    });
  }
  return blank("unknown", { missing: keys.map((key) => factIdOf(atom.field, key)) });
}

function combineOr(parts: AtomResult[]): AtomResult | "skip" {
  if (parts.length === 0) return "skip";
  const yes = parts.filter((part) => part.verdict === "yes");
  if (yes.length > 0) {
    return blank("yes", {
      reasons: yes.flatMap((part) => part.reasons),
      sources: [...new Set(yes.flatMap((part) => part.sources))],
      rules: yes.flatMap((part) => part.rules),
      facts: [...new Set(yes.flatMap((part) => part.facts))],
    });
  }
  const unknown = parts.filter((part) => part.verdict === "unknown");
  if (unknown.length > 0) {
    return blank("unknown", {
      sources: [...new Set(unknown.flatMap((part) => part.sources))],
      missing: [...new Set(unknown.flatMap((part) => part.missing))],
    });
  }
  return blank("no", {
    reasons: parts.flatMap((part) => part.reasons),
    rules: parts.flatMap((part) => part.rules),
    facts: [...new Set(parts.flatMap((part) => part.facts))],
  });
}

function combineAnd(parts: AtomResult[]): AtomResult | "skip" {
  if (parts.length === 0) return "skip";
  if (parts.some((part) => part.verdict === "no")) {
    const blocked = parts.filter((part) => part.verdict === "no");
    return blank("no", {
      reasons: blocked.flatMap((part) => part.reasons),
      rules: blocked.flatMap((part) => part.rules),
      facts: [...new Set(blocked.flatMap((part) => part.facts))],
    });
  }
  if (parts.some((part) => part.verdict === "unknown")) {
    const unknown = parts.filter((part) => part.verdict === "unknown");
    return blank("unknown", {
      sources: [...new Set(unknown.flatMap((part) => part.sources))],
      missing: [...new Set(unknown.flatMap((part) => part.missing))],
    });
  }
  return blank("yes", {
    reasons: parts.flatMap((part) => part.reasons),
    sources: [...new Set(parts.flatMap((part) => part.sources))],
    rules: parts.flatMap((part) => part.rules),
    facts: [...new Set(parts.flatMap((part) => part.facts))],
  });
}

function combineNone(parts: AtomResult[]): AtomResult | "skip" {
  if (parts.length === 0) return "skip";
  const held = parts.filter((part) => part.verdict === "yes");
  if (held.length > 0) {
    return blank("no", {
      reasons: held.flatMap((part) => part.reasons.map((reason) => `запрещающее условие: ${reason}`)),
      sources: [...new Set(held.flatMap((part) => part.sources))],
      rules: held.flatMap((part) => part.rules),
      facts: [...new Set(held.flatMap((part) => part.facts))],
    });
  }
  const unknown = parts.filter((part) => part.verdict === "unknown");
  if (unknown.length > 0) {
    return blank("unknown", { missing: [...new Set(unknown.flatMap((part) => part.missing))] });
  }
  return blank("yes");
}

function asResult(value: AtomResult | "skip"): AtomResult | null {
  return value === "skip" ? null : value;
}

function traceResult(match: Match): TraceResult {
  if (match === "yes") return "YES";
  if (match === "no") return "NO";
  return "UNKNOWN";
}

function toTrace(result: AtomResult): DecisionTrace {
  return {
    result: traceResult(result.verdict),
    matchedRules: result.verdict === "unknown" ? [] : result.rules,
    facts: result.verdict === "unknown" ? [] : [...new Set(result.facts)],
    sources: [...new Set(result.sources)],
    missing: [...new Set(result.missing)],
  };
}

function decisionFrom(result: AtomResult): ApplicabilityDecision {
  return {
    applicable: result.verdict,
    reasons: result.reasons,
    sources: [...new Set(result.sources)],
    missing: [...new Set(result.missing)],
    trace: toTrace(result),
  };
}

/** ALL + ANY + NONE. Пустое правило — документ нужен организации в целом. */
export function evaluateApplicability(profile: OrganizationProfile, applicability: Applicability): ApplicabilityDecision {
  const all = asResult(combineAnd((applicability.all ?? []).map((atom) => atomResult(profile, atom, "all"))));
  const any = asResult(combineOr((applicability.any ?? []).map((atom) => atomResult(profile, atom, "any"))));
  const none = asResult(combineNone((applicability.none ?? []).map((atom) => atomResult(profile, atom, "none"))));
  const groups = [all, any, none].filter((group): group is AtomResult => group != null);
  if (groups.length === 0) {
    return {
      applicable: "yes",
      reasons: ["Требуется для организации в целом"],
      sources: [],
      missing: [],
      trace: { result: "YES", matchedRules: [], facts: [], sources: [], missing: [] },
    };
  }
  const folded = combineAnd(groups);
  if (folded === "skip") {
    return {
      applicable: "yes",
      reasons: ["Требуется для организации в целом"],
      sources: [],
      missing: [],
      trace: { result: "YES", matchedRules: [], facts: [], sources: [], missing: [] },
    };
  }
  const decision = decisionFrom(folded);
  if (decision.applicable === "yes" && decision.reasons.length === 0) {
    decision.reasons = ["Требуется для организации в целом"];
  }
  return decision;
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
      trace: decision.trace,
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