import { i as __toESM } from "../_runtime.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/zip-OCt8LjfX.js
function saveBlob(blob, filename) {
	if (typeof document === "undefined") throw new Error("Скачивание доступно только в браузере");
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function docxFile(doc) {
	const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("../_libs/docx.mjs").then((n) => n.t);
	const font = "Times New Roman";
	return new Document({ sections: [{ children: doc.blocks.filter((block) => block.text.trim().length > 0).map((block) => new Paragraph({
		heading: block.kind === "heading" ? HeadingLevel.HEADING_1 : void 0,
		alignment: block.kind === "right" ? AlignmentType.RIGHT : block.kind === "heading" ? AlignmentType.CENTER : AlignmentType.LEFT,
		spacing: { after: block.kind === "heading" ? 200 : 120 },
		children: [new TextRun({
			text: block.text,
			font,
			bold: block.bold || block.kind === "heading",
			size: block.kind === "heading" ? 28 : 22
		})]
	})) }] });
}
async function generatedDocxBlob(doc) {
	const { Packer } = await import("../_libs/docx.mjs").then((n) => n.t);
	return Packer.toBlob(await docxFile(doc));
}
/** Байты DOCX без DOM. Для сервера и записи на диск. */
async function generatedDocxBytes(doc) {
	const { Packer } = await import("../_libs/docx.mjs").then((n) => n.t);
	const buffer = await Packer.toBuffer(await docxFile(doc));
	return new Uint8Array(buffer);
}
async function plainDocxBlob(title, text) {
	const paragraphs = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
	return generatedDocxBlob({ blocks: [{
		kind: "heading",
		text: title,
		bold: true
	}, ...paragraphs.map((line) => ({
		kind: "body",
		text: line
	}))] });
}
async function downloadGeneratedDocx(doc) {
	saveBlob(await generatedDocxBlob(doc), `${doc.filename}.docx`);
}
function fileStem(value, fallback) {
	return value.replace(/[\\/:*?"<>|\u0000-\u001f«»]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^[._-]+|[._-]+$/g, "").slice(0, 80) || fallback;
}
function packageFolderName(orgName) {
	return `Пакет_ОТ_${orgName.replace(/[\\/:*?"<>|«»]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 60) || "Организация"}`;
}
function folderForShape(shape) {
	if (shape === "order") return "01_Приказы";
	if (shape === "policy") return "02_Положения";
	if (shape === "program") return "03_Программы";
	if (shape === "list") return "04_Перечни";
	if (shape === "instruction") return "05_Инструкции";
	return "06_Прочее";
}
function archivePath(orgName, shape, filename) {
	return `${packageFolderName(orgName)}/${folderForShape(shape)}/${filename}.docx`;
}
async function packageZipBlob(orgName, documents, instructions = []) {
	const { default: JSZip } = await import("../_libs/jszip+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const zip = new JSZip();
	const used = /* @__PURE__ */ new Set();
	const put = (path, blob) => {
		let name = path;
		let index = 2;
		while (used.has(name)) {
			name = path.replace(/\.docx$/, `-${index}.docx`);
			index += 1;
		}
		used.add(name);
		zip.file(name, blob);
	};
	for (const item of documents) put(archivePath(orgName, item.shape, item.document.filename), await generatedDocxBlob(item.document));
	for (const instruction of instructions) {
		const filename = fileStem(`${instruction.number}-${instruction.id}`, instruction.id || "instrukciya");
		const text = instruction.plain?.trim() || `Инструкция по охране труда: ${instruction.professionTitle}. Номер ${instruction.number}. Дата ${instruction.date}.`;
		put(archivePath(orgName, "instruction", filename), await plainDocxBlob(instruction.professionTitle, text));
	}
	return zip.generateAsync({ type: "blob" });
}
/** Байты архива без скачивания в браузере. Имена внутри архива остаются в Unicode. */
async function packageZipBytes(orgName, documents, instructions = []) {
	const blob = await packageZipBlob(orgName, documents, instructions);
	return new Uint8Array(await blob.arrayBuffer());
}
async function downloadPackageZip(orgName, documents, instructions = []) {
	if (typeof document === "undefined") throw new Error("Скачивание доступно только в браузере");
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
//#endregion
export { packageFolderName as a, generatedDocxBytes as i, downloadPackageZip as n, packageZipBytes as o, fileStem as r, downloadGeneratedDocx as t };
