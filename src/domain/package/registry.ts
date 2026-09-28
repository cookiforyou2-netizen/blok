import type { OrganizationProfile, PackageComposition, PackageExtension } from "./types";
import { composePackage } from "./applicability";
import { customInstructionDocument, instructionDocuments, organizationDocuments } from "./documents";

/**
 * Реестр документов. Новый отраслевой модуль вызывает registerPackageModule
 * и не меняет ни применимость, ни мастер. Профессии и оборудование по-прежнему
 * живут в каталоге конструктора: документ только ссылается на их id.
 */
const extensions = new Map<string, PackageExtension>();

export function registerPackageModule(extension: PackageExtension) {
  const documents = (extension.documents ?? []).map((document) => ({ ...document, moduleId: extension.id }));
  extensions.set(extension.id, { ...extension, documents });
}

export function listPackageExtensions(): PackageExtension[] {
  return [...extensions.values()];
}

export function documentsFor(profile: OrganizationProfile) {
  const base = [...organizationDocuments(), ...instructionDocuments(), ...listPackageExtensions().flatMap((item) => item.documents ?? [])];
  const known = new Set(base.map((item) => item.code));
  const custom = profile.customProfessions.map((title) => customInstructionDocument(title)).filter((item) => !known.has(item.code));
  return [...base, ...custom];
}

export function buildPackage(profile: OrganizationProfile): PackageComposition {
  return composePackage(profile, documentsFor(profile));
}
