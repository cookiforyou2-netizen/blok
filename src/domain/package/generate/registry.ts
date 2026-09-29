import type { DocumentModule, OrganizationProfile } from "../types";
import { orderResponsibleTemplate } from "./order-responsible";
import { fillTemplate, requirementValues, type DocTemplate, type GeneratedDocument } from "./template";

/**
 * Генератор не смотрит на applicability и не решает, нужен ли документ.
 * Следующий документ подключается так: шаблон, функция generate, registerGenerator(id),
 * в карточке PackageDocument — templateId и generatorId. Экран пакета остаётся тем же.
 */
export interface DocumentGenerator {
  id: string;
  templateId: string;
  generate(profile: OrganizationProfile, document: DocumentModule): GeneratedDocument;
}

const templates = new Map<string, DocTemplate>();
const generators = new Map<string, DocumentGenerator>();

export function registerTemplate(template: DocTemplate) {
  templates.set(template.id, template);
}

export function registerGenerator(generator: DocumentGenerator) {
  generators.set(generator.id, generator);
}

export function listGeneratorIds(): string[] {
  return [...generators.keys()];
}

export function templateById(id: string): DocTemplate | undefined {
  return templates.get(id);
}

export function generateById(id: string, profile: OrganizationProfile, document: DocumentModule): GeneratedDocument {
  const generator = generators.get(id);
  if (!generator) throw new Error(`Генератор не зарегистрирован: ${id}`);
  return generator.generate(profile, document);
}

const orderResponsibleGenerator: DocumentGenerator = {
  id: "osh_order_responsible",
  templateId: orderResponsibleTemplate.id,
  generate(profile, document) {
    const template = templates.get(document.templateId || orderResponsibleTemplate.id) ?? orderResponsibleTemplate;
    return fillTemplate(template, requirementValues(profile, document.requiredData ?? []));
  },
};

registerTemplate(orderResponsibleTemplate);
registerGenerator(orderResponsibleGenerator);
