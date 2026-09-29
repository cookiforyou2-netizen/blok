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

export async function downloadGeneratedDocx(doc: GeneratedDocument) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
  const font = "Times New Roman";
  const children = doc.blocks.map(
    (block) =>
      new Paragraph({
        heading: block.kind === "heading" ? HeadingLevel.HEADING_1 : undefined,
        alignment: block.kind === "right" ? AlignmentType.RIGHT : block.kind === "heading" ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: block.kind === "heading" ? 200 : 120 },
        children: [new TextRun({ text: block.text, font, bold: block.bold || block.kind === "heading", size: block.kind === "heading" ? 28 : 22 })],
      }),
  );
  const file = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(file);
  saveBlob(blob, `${doc.filename}.docx`);
}
