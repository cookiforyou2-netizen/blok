import type { DocumentModule, OrganizationProfile } from "../types";
import { CORE_OSH_DOCUMENTS } from "../modules/core-osh";
import { renderCoreDocument } from "./core-render";
import { fillTemplate, type DocTemplate, type GenerateContext, type GeneratedDocument } from "./template";

/**
 * Генератор не смотрит, нужен ли документ.
 * Следующий документ: шаблон или сборщик текста, registerGenerator(id),
 * в карточке — templateId и generatorId. Экран пакета остаётся тем же.
 */
export interface DocumentGenerator {
  id: string;
  templateId: string;
  generate(profile: OrganizationProfile, document: DocumentModule, context?: GenerateContext): GeneratedDocument;
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

export function generateById(id: string, profile: OrganizationProfile, document: DocumentModule, context?: GenerateContext): GeneratedDocument {
  const generator = generators.get(id);
  if (!generator) throw new Error(`Генератор не зарегистрирован: ${id}`);
  return generator.generate(profile, document, context);
}

for (const document of CORE_OSH_DOCUMENTS) {
  const templateId = document.templateId || `tpl_${document.code}`;
  registerTemplate({ id: templateId, title: document.name, filename: document.code, blocks: [] });
  registerGenerator({
    id: document.generatorId || document.code,
    templateId,
    generate(profile, current, context) {
      return renderCoreDocument(profile, current.generatorId ? current : document, context);
    },
  });
}

export function registerDemoGenerator() {
  registerGenerator({
    id: "demo_next",
    templateId: "tpl_demo_next",
    generate() {
      return fillTemplate({ id: "tpl_demo_next", title: "Следующий документ", filename: "next", blocks: [{ kind: "body", text: "подключён" }] }, {});
    },
  });
}
