import type { GeneratedDocument } from "./template";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function generatedDocxBlob(doc: Pick<GeneratedDocument, "blocks">): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
  const font = "Times New Roman";
  const children = doc.blocks
    .filter((block) => block.text.trim().length > 0)
    .map(
      (block) =>
        new Paragraph({
          heading: block.kind === "heading" ? HeadingLevel.HEADING_1 : undefined,
          alignment: block.kind === "right" ? AlignmentType.RIGHT : block.kind === "heading" ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { after: block.kind === "heading" ? 200 : 120 },
          children: [new TextRun({ text: block.text, font, bold: block.bold || block.kind === "heading", size: block.kind === "heading" ? 28 : 22 })],
        }),
    );
  const file = new Document({ sections: [{ children }] });
  return Packer.toBlob(file);
}

export async function plainDocxBlob(title: string, text: string): Promise<Blob> {
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return generatedDocxBlob({
    blocks: [{ kind: "heading", text: title, bold: true }, ...paragraphs.map((line) => ({ kind: "body" as const, text: line }))],
  });
}

export async function downloadGeneratedDocx(doc: GeneratedDocument) {
  const blob = await generatedDocxBlob(doc);
  saveBlob(blob, `${doc.filename}.docx`);
}
