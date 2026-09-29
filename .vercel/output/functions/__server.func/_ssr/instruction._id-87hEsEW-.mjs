import { w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useApp, l as SECTION_LABEL, n as AppShell, t as APPROVAL_LINES } from "./shell-DGAyvdZq.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as Route } from "./router-CcjaMekW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/instruction._id-87hEsEW-.js
var import_jsx_runtime = require_jsx_runtime();
var TRANSLIT = {
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ё: "e",
	ж: "zh",
	з: "z",
	и: "i",
	й: "y",
	к: "k",
	л: "l",
	м: "m",
	н: "n",
	о: "o",
	п: "p",
	р: "r",
	с: "s",
	т: "t",
	у: "u",
	ф: "f",
	х: "h",
	ц: "ts",
	ч: "ch",
	ш: "sh",
	щ: "shch",
	ъ: "",
	ы: "y",
	ь: "",
	э: "e",
	ю: "yu",
	я: "ya"
};
function fileBase(doc) {
	let slug = "";
	for (const char of doc.professionTitle.toLowerCase()) if (TRANSLIT[char] !== void 0) slug += TRANSLIT[char];
	else if (/[a-z0-9]/.test(char)) slug += char;
	else slug += "-";
	slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "") || "instruction";
	return `IOT-${slug}`.slice(0, 80);
}
function saveBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function downloadDocx(doc, passed) {
	const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("../_libs/docx.mjs").then((n) => n.t);
	const font = "Times New Roman";
	const children = [];
	const add = (text, opts) => {
		children.push(new Paragraph({
			heading: opts?.heading,
			alignment: opts?.align,
			spacing: { after: 120 },
			children: [new TextRun({
				text,
				font,
				bold: opts?.bold,
				color: opts?.color,
				size: opts?.heading ? 28 : 22
			})]
		}));
	};
	for (const line of APPROVAL_LINES) add(line, {
		bold: line === "УТВЕРЖДАЮ",
		align: AlignmentType.RIGHT
	});
	if (!passed) add("ПРОЕКТ НЕ ГОТОВ: QUALITY GATE НЕ ПРОЙДЕН", {
		bold: true,
		color: "A3262C"
	});
	add(doc.orgName, { bold: true });
	add(doc.title, { heading: HeadingLevel.HEADING_1 });
	add(`Номер: ${doc.number}`);
	add(`Дата: ${doc.date}. Сформировано конструктором ychy-pro.ru`);
	add(doc.basis);
	add(doc.disclaimer);
	Object.keys(SECTION_LABEL).forEach((key) => {
		add(SECTION_LABEL[key], { heading: HeadingLevel.HEADING_2 });
		let n = 1;
		for (const block of doc.sections[key]) {
			if (block.heading && (key === "during" || key === "emergency")) add(block.heading, { bold: true });
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
	saveBlob(await Packer.toBlob(file), `${fileBase(doc)}.docx`);
}
async function downloadPdf(doc, passed) {
	const { PDFDocument, rgb } = await import("../_libs/pdf-lib.mjs").then((n) => n.t);
	const fontkit = (await import("../_libs/pako+pdf-lib__fontkit.mjs").then((n) => n.t)).default;
	const pdf = await PDFDocument.create();
	pdf.registerFontkit(fontkit);
	const regular = await pdf.embedFont(await (await fetch("/fonts/DejaVuSans.ttf")).arrayBuffer());
	const bold = await pdf.embedFont(await (await fetch("/fonts/DejaVuSans-Bold.ttf")).arrayBuffer());
	const pageWidth = 595;
	const pageHeight = 842;
	const margin = 48;
	const maxWidth = 499;
	let page = pdf.addPage([pageWidth, pageHeight]);
	let y = 794;
	const ensure = (size) => {
		if (y < margin + size) {
			page = pdf.addPage([pageWidth, pageHeight]);
			y = 794;
		}
	};
	const write = (text, size, useBold = false) => {
		const face = useBold ? bold : regular;
		const words = text.split(/\s+/).filter(Boolean);
		let line = "";
		const lines = [];
		for (const word of words.length ? words : [""]) {
			const next = line ? `${line} ${word}` : word;
			if (face.widthOfTextAtSize(next, size) > maxWidth && line) {
				lines.push(line);
				line = word;
			} else line = next;
		}
		if (line) lines.push(line);
		for (const row of lines) {
			ensure(size);
			page.drawText(row, {
				x: margin,
				y,
				size,
				font: face,
				color: rgb(.08, .13, .2)
			});
			y -= size + 4;
		}
		y -= 4;
	};
	const writeRight = (text, size, useBold = false) => {
		const face = useBold ? bold : regular;
		const width = face.widthOfTextAtSize(text, size);
		ensure(size);
		page.drawText(text, {
			x: Math.max(margin, 547 - width),
			y,
			size,
			font: face,
			color: rgb(.08, .13, .2)
		});
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
	Object.keys(SECTION_LABEL).forEach((key) => {
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
function InstructionPage() {
	const { id } = Route.useParams();
	const record = useApp((state) => state.instructions.find((item) => item.id === id));
	if (!record) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "text-2xl font-extrabold",
		children: "Инструкция не найдена"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/wizard",
		search: {
			scenario: void 0,
			profession: void 0
		},
		className: "mt-4 inline-block rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
		children: "Открыть мастер"
	})] });
	const doc = record.snapshot;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print flex flex-wrap items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `rounded-full px-3 py-2 text-sm font-bold ${record.qualityPassed ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger"}`,
					children: record.qualityPassed ? "Проверка пройдена" : "Не готово: проверка не пройдена"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
					onClick: () => void downloadDocx(doc, record.qualityPassed),
					children: "DOCX"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
					onClick: () => void downloadPdf(doc, record.qualityPassed),
					children: "PDF"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold",
					onClick: () => window.print(),
					children: "Печать"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold",
					onClick: () => void navigator.clipboard.writeText(doc.plain).then(() => toast("Текст скопирован")),
					children: "Копировать"
				})
			]
		}),
		!record.qualityPassed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "no-print mt-4 grid gap-2",
			children: record.issues.map((issue) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger",
				children: issue.message
			}, issue.code + issue.message))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "print-sheet mt-4 rounded-2xl border border-line bg-surface px-5 py-6 font-doc text-ink md:px-10",
			children: [
				!record.qualityPassed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4 text-sm font-bold text-danger",
					children: "ПРОЕКТ НЕ ГОТОВ — ПРОВЕРКА НЕ ПРОЙДЕНА"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4 flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-right text-sm leading-relaxed",
						children: APPROVAL_LINES.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: line === "УТВЕРЖДАЮ" ? "font-semibold" : void 0,
							children: line
						}, line))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold",
					children: doc.orgName
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-2xl font-semibold leading-tight",
					children: doc.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm",
					children: [
						"№ ",
						doc.number,
						" · ",
						doc.date,
						" · ychy-pro.ru"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-relaxed",
					children: doc.basis
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-relaxed",
					children: doc.disclaimer
				}),
				Object.keys(SECTION_LABEL).map((key) => {
					let cursor = 1;
					const blocks = doc.sections[key].map((block) => {
						const start = cursor;
						cursor += block.points.length;
						return {
							block,
							start
						};
					});
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold",
							children: SECTION_LABEL[key]
						}), blocks.map(({ block, start }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3",
							children: [
								(key === "during" || key === "emergency") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: block.heading
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
									start,
									className: "mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed",
									children: block.points.map((point) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: point.text }, point.id))
								}),
								block.normativeNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xs text-muted",
									children: block.normativeNote
								}) : null
							]
						}, block.moduleId + block.heading))]
					}, key);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mt-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-semibold",
						children: "Версии модулей"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-2 space-y-1 text-sm",
						children: doc.moduleVersions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							item.title,
							" — ",
							item.version,
							", ",
							item.status
						] }, item.id))
					})]
				})
			]
		})
	] });
}
//#endregion
export { InstructionPage as component };
