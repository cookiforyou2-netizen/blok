import type { AssembledInstruction } from "./types";
import { APPROVAL_LINES, SECTION_LABEL } from "./engine";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function fileBase(doc: Pick<AssembledInstruction, "professionTitle">) {
  let slug = "";
  for (const char of doc.professionTitle.toLowerCase()) {
    if (TRANSLIT[char] !== undefined) slug += TRANSLIT[char];
    else if (/[a-z0-9]/.test(char)) slug += char;
    else slug += "-";
  }
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "") || "instruction";
  return `IOT-${slug}`.slice(0, 80);
}

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

export async function downloadDocx(doc: AssembledInstruction, passed: boolean) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");
  const font = "Times New Roman";
  const children: InstanceType<typeof Paragraph>[] = [];
  const add = (text: string, opts?: { bold?: boolean; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; color?: string; align?: (typeof AlignmentType)[keyof typeof AlignmentType] }) => {
    children.push(
      new Paragraph({
        heading: opts?.heading,
        alignment: opts?.align,
        spacing: { after: 120 },
        children: [new TextRun({ text, font, bold: opts?.bold, color: opts?.color, size: opts?.heading ? 28 : 22 })],
      }),
    );
  };
  for (const line of APPROVAL_LINES) add(line, { bold: line === "УТВЕРЖДАЮ", align: AlignmentType.RIGHT });
  if (!passed) add("ПРОЕКТ НЕ ГОТОВ: QUALITY GATE НЕ ПРОЙДЕН", { bold: true, color: "A3262C" });
  add(doc.orgName, { bold: true });
  add(doc.title, { heading: HeadingLevel.HEADING_1 });
  add(`Номер: ${doc.number}`);
  add(`Дата: ${doc.date}. Сформировано конструктором ychy-pro.ru`);
  add(doc.basis);
  add(doc.disclaimer);
  (Object.keys(SECTION_LABEL) as (keyof typeof SECTION_LABEL)[]).forEach((key) => {
    add(SECTION_LABEL[key], { heading: HeadingLevel.HEADING_2 });
    let n = 1;
    for (const block of doc.sections[key]) {
      if (block.heading && (key === "during" || key === "emergency")) {
        add(block.heading, { bold: true });
      }
      for (const point of block.points) {
        add(`${n}. ${point.text}`);
        n += 1;
      }
      if (block.normativeNote) add(block.normativeNote);
    }
  });
  add("Версии модулей", { heading: HeadingLevel.HEADING_2 });
  for (const item of doc.moduleVersions) add(`${item.title} — ${item.version}, ${item.status}`);
  const file = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(file);
  saveBlob(blob, `${fileBase(doc)}.docx`);
}

export async function downloadPdf(doc: AssembledInstruction, passed: boolean) {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(await (await fetch("/fonts/DejaVuSans.ttf")).arrayBuffer());
  const bold = await pdf.embedFont(await (await fetch("/fonts/DejaVuSans-Bold.ttf")).arrayBuffer());
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensure = (size: number) => {
    if (y < margin + size) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  const write = (text: string, size: number, useBold = false) => {
    const face = useBold ? bold : regular;
    const words = text.split(/\s+/).filter(Boolean);
    let line = "";
    const lines: string[] = [];
    for (const word of words.length ? words : [""]) {
      const next = line ? `${line} ${word}` : word;
      if (face.widthOfTextAtSize(next, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    for (const row of lines) {
      ensure(size);
      page.drawText(row, { x: margin, y, size, font: face, color: rgb(0.08, 0.13, 0.2) });
      y -= size + 4;
    }
    y -= 4;
  };

  const writeRight = (text: string, size: number, useBold = false) => {
    const face = useBold ? bold : regular;
    const width = face.widthOfTextAtSize(text, size);
    ensure(size);
    page.drawText(text, { x: Math.max(margin, pageWidth - margin - width), y, size, font: face, color: rgb(0.08, 0.13, 0.2) });
    y -= size + 4;
  };

  for (const line of APPROVAL_LINES) writeRight(line, 11, line === "УТВЕРЖДАЮ");
  y -= 6;
  if (!passed) write("ПРОЕКТ НЕ ГОТОВ: QUALITY GATE НЕ ПРОЙДЕН", 12, true);
  write(doc.orgName, 12, true);
  write(doc.title, 14, true);
  write(`Номер: ${doc.number}. Дата: ${doc.date}. ychy-pro.ru`, 10);
  write(doc.basis, 10);
  write(doc.disclaimer, 9);
  (Object.keys(SECTION_LABEL) as (keyof typeof SECTION_LABEL)[]).forEach((key) => {
    write(SECTION_LABEL[key], 12, true);
    let n = 1;
    for (const block of doc.sections[key]) {
      if (block.heading && (key === "during" || key === "emergency")) write(block.heading, 11, true);
      for (const point of block.points) {
        write(`${n}. ${point.text}`, 10);
        n += 1;
      }
      if (block.normativeNote) write(block.normativeNote, 9);
    }
  });
  write("Версии модулей", 12, true);
  for (const item of doc.moduleVersions) write(`${item.title} — ${item.version}, ${item.status}`, 9);
  const bytes = await pdf.save();
  saveBlob(new Blob([Uint8Array.from(bytes)], { type: "application/pdf" }), `${fileBase(doc)}.pdf`);
}
