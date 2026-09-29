import { requirementValue } from "../workflow";
import type { DataRequirement, OrganizationProfile } from "../types";

export interface GeneratedBlock {
  kind: "heading" | "right" | "body";
  text: string;
  bold?: boolean;
}

export interface DocTemplate {
  id: string;
  title: string;
  filename: string;
  blocks: GeneratedBlock[];
}

export interface GeneratedDocument {
  templateId: string;
  title: string;
  filename: string;
  blocks: GeneratedBlock[];
  inclusionReason?: string;
  formedAt?: string;
  normativeStatus?: "needs_review";
}

export interface InstructionRef {
  id: string;
  professionId: string | null;
  professionTitle: string;
  number: string;
  date: string;
  plain?: string;
}

/** Данные для текста. Применимость сюда не передаётся: её уже решил пакет. */
export interface GenerateContext {
  instructions: InstructionRef[];
  professionTitle: (id: string) => string;
  gearTitle: (id: string) => string;
  reason: string;
  formedAt: string;
}

export function formatRequirement(requirement: DataRequirement, value: string): string {
  if (requirement.field === "approval_date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }
  return value;
}

export function requirementValues(profile: OrganizationProfile, requirements: readonly DataRequirement[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const requirement of requirements) {
    const value = requirementValue(profile, requirement);
    if (value) values[requirement.id] = formatRequirement(requirement, value);
  }
  return values;
}

function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key: string) => values[key] || "не указано");
}

/** Шаблон не решает применимость: только подставляет уже собранные значения. */
export function fillTemplate(template: DocTemplate, values: Record<string, string>): GeneratedDocument {
  return {
    templateId: template.id,
    title: fill(template.title, values),
    filename: template.filename,
    blocks: template.blocks.map((block) => ({ ...block, text: fill(block.text, values) })),
    normativeStatus: "needs_review",
  };
}

export function block(kind: GeneratedBlock["kind"], text: string, bold = false): GeneratedBlock {
  return { kind, text, bold };
}
