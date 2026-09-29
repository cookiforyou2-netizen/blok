import type { DocumentShape } from "../types";
import type { GeneratedDocument, InstructionRef } from "./template";
import { generatedDocxBlob, plainDocxBlob } from "./docx";

export function packageFolderName(orgName: string): string {
  const clean = orgName.replace(/[\\/:*?"<>|«»]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
  return `Пакет_ОТ_${clean || "Организация"}`;
}

export function folderForShape(shape: DocumentShape): string {
  if (shape === "order") return "01_Приказы";
  if (shape === "policy") return "02_Положения";
  if (shape === "program") return "03_Программы";
  if (shape === "list") return "04_Перечни";
  if (shape === "instruction") return "05_Инструкции";
  return "06_Прочее";
}

export function archivePath(orgName: string, shape: DocumentShape, filename: string): string {
  return `${packageFolderName(orgName)}/${folderForShape(shape)}/${filename}.docx`;
}

export async function packageZipBlob(
  orgName: string,
  documents: Array<{ document: GeneratedDocument; shape: DocumentShape }>,
  instructions: InstructionRef[] = [],
): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  const put = (path: string, blob: Blob) => {
    let name = path;
    let index = 2;
    while (used.has(name)) {
      name = path.replace(/\.docx$/, `-${index}.docx`);
      index += 1;
    }
    used.add(name);
    zip.file(name, blob);
  };
  for (const item of documents) {
    put(archivePath(orgName, item.shape, item.document.filename), await generatedDocxBlob(item.document));
  }
  for (const instruction of instructions) {
    const filename = `instrukciya-${instruction.id}`.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const text = instruction.plain?.trim() || `Инструкция по охране труда: ${instruction.professionTitle}. Номер ${instruction.number}. Дата ${instruction.date}.`;
    put(archivePath(orgName, "instruction", filename), await plainDocxBlob(instruction.professionTitle, text));
  }
  return zip.generateAsync({ type: "blob" });
}

export async function downloadPackageZip(
  orgName: string,
  documents: Array<{ document: GeneratedDocument; shape: DocumentShape }>,
  instructions: InstructionRef[] = [],
) {
  const blob = await packageZipBlob(orgName, documents, instructions);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${packageFolderName(orgName)}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
