import { i as __toESM } from "../_runtime.mjs";
import { a as FLAG_LABELS, b as verdictOf, d as findFact, g as resolvedValue, i as FLAG_KEYS, n as CATEGORY_LABELS, r as CATEGORY_ORDER, x as winningSource } from "./storage-CpKdOROv.mjs";
import { X as require_react, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as professions, i as PRESETS, n as AppShell, o as buildCatalog, r as Choice, u as useApp } from "./shell-DDLoBrBg.mjs";
import { n as GEAR_KIND } from "./types--OpmHAgC.mjs";
import { n as downloadPackageZip, t as downloadGeneratedDocx } from "./zip-OCt8LjfX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/package-D8BYIDXg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Общие реквизиты пакета. Спрашиваются один раз и читаются всеми генераторами. */
var SHARED_REQUISITES = [
	{
		id: "organization.name",
		label: "Полное название организации",
		field: "name",
		key: "value"
	},
	{
		id: "organization.shortName",
		label: "Сокращённое название",
		field: "short_name",
		key: "value"
	},
	{
		id: "organization.city",
		label: "Город",
		field: "city",
		key: "value"
	},
	{
		id: "organization.address",
		label: "Адрес",
		field: "address",
		key: "value"
	},
	{
		id: "organization.director",
		label: "ФИО руководителя",
		field: "director",
		key: "value"
	},
	{
		id: "organization.directorTitle",
		label: "Должность руководителя",
		field: "director_title",
		key: "value"
	},
	{
		id: "responsiblePerson",
		label: "Ответственное лицо за охрану труда",
		field: "responsible",
		key: "value"
	},
	{
		id: "responsibleTitle",
		label: "Должность ответственного",
		field: "responsible_title",
		key: "value"
	},
	{
		id: "approvalDate",
		label: "Дата",
		field: "approval_date",
		key: "value"
	}
];
var CHECK$1 = "Нормативное основание требует проверки";
var HAS_PROFESSIONS$1 = { any: [{
	field: "profession",
	present: true
}, {
	field: "custom_profession",
	present: true
}] };
/** УШМ, дрель и признак «электроинструмент» — тот же resolver фактов. Генератор это правило не читает. */
var POWER_TOOLS$1 = { any: [{
	field: "equipment",
	in: ["angle_grinder", "drill"]
}, {
	field: "flag",
	in: ["powerTools"]
}] };
function doc$1(init) {
	return {
		id: init.code,
		code: init.code,
		name: init.name,
		category: init.category,
		shape: init.shape,
		version: "1.0.0",
		status: "active",
		applicability: init.applicability,
		dependencies: [],
		normativeBasis: CHECK$1,
		template: `tpl_${init.code}`,
		templateId: `tpl_${init.code}`,
		generator: "none",
		generatorId: init.code,
		requiredData: SHARED_REQUISITES,
		commercialLevel: "PACKAGE",
		optional: false,
		moduleId: "core_osh",
		normativeStatus: "needs_review"
	};
}
/** Базовый модуль организации охраны труда. Не отраслевой пресет и не полный контур ОТ. */
var CORE_OSH_DOCUMENTS = [
	doc$1({
		code: "osh_order_responsible",
		name: "Приказ о возложении обязанностей по охране труда",
		category: "organization",
		shape: "order",
		applicability: {}
	}),
	doc$1({
		code: "osh_policy_suot",
		name: "Положение о системе управления охраной труда",
		category: "organization",
		shape: "policy",
		applicability: {}
	}),
	doc$1({
		code: "osh_order_approve",
		name: "Приказ об утверждении инструкций по охране труда",
		category: "instructions",
		shape: "order",
		applicability: HAS_PROFESSIONS$1
	}),
	doc$1({
		code: "osh_list_instructions",
		name: "Перечень инструкций по охране труда",
		category: "lists",
		shape: "list",
		applicability: HAS_PROFESSIONS$1
	}),
	doc$1({
		code: "osh_list_positions",
		name: "Перечень профессий и должностей",
		category: "lists",
		shape: "list",
		applicability: HAS_PROFESSIONS$1
	}),
	doc$1({
		code: "osh_program_intro",
		name: "Программа вводного инструктажа",
		category: "training",
		shape: "program",
		applicability: {}
	}),
	doc$1({
		code: "osh_order_training",
		name: "Приказ об организации обучения по охране труда",
		category: "training",
		shape: "order",
		applicability: {}
	}),
	doc$1({
		code: "osh_order_power_tools",
		name: "Приказ о допуске к работе с электроинструментом",
		category: "hazardous",
		shape: "order",
		applicability: POWER_TOOLS$1
	})
];
var coreOshModule = {
	id: "core_osh",
	title: "Базовая организация охраны труда",
	version: "1.0.0",
	status: "active",
	documents: CORE_OSH_DOCUMENTS
};
function requirementValue(profile, requirement) {
	const value = resolvedValue(profile, requirement.field, requirement.key);
	if (typeof value !== "string") return "";
	return value.trim();
}
function missingRequirements(profile, document) {
	return (document.requiredData ?? []).filter((requirement) => requirementValue(profile, requirement).length === 0);
}
function knownRequirements(profile, document) {
	return (document.requiredData ?? []).filter((requirement) => requirementValue(profile, requirement).length > 0);
}
/** Поля, которых не хватает применимым документам. Уже известные факты в список не попадают. */
function missingForItems(profile, items) {
	const missing = [];
	const seen = /* @__PURE__ */ new Set();
	for (const item of items) {
		if (item.document.moduleId !== "core_osh" || item.match !== "yes") continue;
		for (const requirement of missingRequirements(profile, item.document)) {
			if (seen.has(requirement.id)) continue;
			seen.add(requirement.id);
			missing.push(requirement);
		}
	}
	return missing;
}
function generatorIdOf(document) {
	const id = document.generatorId;
	if (!id || id === "none" || id === "instruction") return null;
	return id;
}
function workflowOf(item, profile, formedIds) {
	if (item.document.moduleId !== "core_osh") return null;
	if (item.match === "unknown" || item.status === "clarify") return "clarify";
	if (item.match !== "yes") return null;
	if (formedIds.includes(item.document.id)) return "formed";
	if (missingRequirements(profile, item.document).length > 0) return "needs_data";
	if (generatorIdOf(item.document)) return "ready_to_generate";
	return "defined";
}
function packageReadiness(items, profile, formedIds) {
	const rows = items.filter((item) => item.document.moduleId === "core_osh").map((item) => ({
		item,
		workflow: workflowOf(item, profile, formedIds)
	}));
	return {
		ready: rows.filter((row) => row.workflow === "ready_to_generate" || row.workflow === "formed"),
		clarify: rows.filter((row) => row.workflow === "clarify"),
		needsData: rows.filter((row) => row.workflow === "needs_data")
	};
}
function createPackageSnapshot(profile, composition, createdAt = (/* @__PURE__ */ new Date()).toISOString()) {
	return {
		createdAt,
		profileVersion: profile.schemaVersion,
		documents: composition.items.map((item) => ({
			id: item.document.id,
			code: item.document.code,
			name: item.document.name,
			moduleId: item.document.moduleId,
			match: item.match,
			result: item.trace.result
		}))
	};
}
function formatRequirement(requirement, value) {
	if (requirement.field === "approval_date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split("-");
		return `${day}.${month}.${year}`;
	}
	return value;
}
function requirementValues(profile, requirements) {
	const values = {};
	for (const requirement of requirements) {
		const value = requirementValue(profile, requirement);
		if (value) values[requirement.id] = formatRequirement(requirement, value);
	}
	return values;
}
function fill(text, values) {
	return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key) => values[key] || "не указано");
}
/** Шаблон не решает применимость: только подставляет уже собранные значения. */
function fillTemplate(template, values) {
	return {
		templateId: template.id,
		title: fill(template.title, values),
		filename: template.filename,
		blocks: template.blocks.map((block) => ({
			...block,
			text: fill(block.text, values)
		})),
		normativeStatus: "needs_review"
	};
}
function block(kind, text, bold = false) {
	return {
		kind,
		text,
		bold
	};
}
var POWER_TOOLS = [["angle_grinder", "угловая шлифовальная машина (УШМ)"], ["drill", "электродрель"]];
var REVIEW = "Нормативное основание этого проекта ещё не проверено специалистом и в текст не включено. Формулировки нужно сверить до утверждения.";
function fallbackContext(reason = "") {
	return {
		instructions: [],
		professionTitle: (id) => id,
		gearTitle: (id) => id,
		reason,
		formedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function header(values, title) {
	return [
		block("right", values["organization.name"] || "не указано", true),
		block("right", values["organization.shortName"] || ""),
		block("right", [values["organization.city"], values["organization.address"]].filter(Boolean).join(", ") || "не указано"),
		block("right", "УТВЕРЖДАЮ", true),
		block("right", values["organization.directorTitle"] || "Руководитель"),
		block("right", values["organization.director"] || "не указано"),
		block("right", values.approvalDate || "не указано"),
		block("heading", title, true)
	].filter((item) => item.text.trim().length > 0);
}
function signature(values) {
	return [
		block("body", `${values["organization.directorTitle"] || "Руководитель"} ${values["organization.director"] || "не указано"}`),
		block("body", `${values.responsibleTitle || "Ответственный за охрану труда"} ${values.responsiblePerson || "не указано"}`),
		block("body", REVIEW)
	];
}
function professionTitles(profile, context) {
	const titles = [
		...profile.professionIds.map((id) => context.professionTitle(id)),
		...profile.customProfessions,
		...profile.positions
	];
	return [...new Set(titles.map((item) => item.trim()).filter(Boolean))];
}
function professionBlocks(profile, context) {
	const titles = professionTitles(profile, context);
	if (titles.length === 0) return [block("body", "В профиле организации пока нет подтверждённых профессий и должностей.")];
	return titles.map((title, index) => block("body", `${index + 1}. ${title}`));
}
function instructionBlocks(profile, context) {
	const lines = [];
	const covered = /* @__PURE__ */ new Set();
	for (const item of context.instructions) {
		if (item.professionId) covered.add(item.professionId);
		covered.add(item.professionTitle);
		lines.push(`${item.number}. Инструкция по охране труда: ${item.professionTitle}. Дата сборки: ${item.date}.`);
	}
	for (const id of profile.professionIds) {
		if (covered.has(id)) continue;
		const title = context.professionTitle(id);
		if (covered.has(title)) continue;
		lines.push(`Инструкция по охране труда: ${title}. В конструкторе ещё не собрана, в перечень включена по профилю организации.`);
	}
	for (const title of profile.customProfessions) {
		if (covered.has(title)) continue;
		lines.push(`Инструкция по охране труда: ${title}. В конструкторе ещё не собрана, в перечень включена по профилю организации.`);
	}
	if (lines.length === 0) return [block("body", "Подтверждённых инструкций и профессий пока нет.")];
	return lines.map((line, index) => block("body", `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`));
}
function toolLines(profile, context) {
	const named = POWER_TOOLS.filter(([id]) => profile.gearIds.includes(id)).map(([id, fallback]) => context.gearTitle(id) || fallback);
	if (profile.flags.powerTools === true && named.length === 0) named.push("электроинструмент подтверждён без отдельного наименования в перечне оборудования");
	return named;
}
function bodyFor(code, profile, context, values) {
	const org = values["organization.name"] || "организации";
	const short = values["organization.shortName"] || org;
	const responsible = values.responsiblePerson || "не указано";
	const responsibleTitle = values.responsibleTitle || "ответственного за охрану труда";
	const city = values["organization.city"] || "";
	if (code === "osh_order_responsible") return [
		block("body", `В целях организации работы по охране труда в ${org}${city ? ` (${city})` : ""}`),
		block("body", "ПРИКАЗЫВАЮ:", true),
		block("body", `1. Возложить обязанности по охране труда на ${responsible}, ${responsibleTitle}.`),
		block("body", `2. ${responsible} обеспечить учёт инструкций по охране труда, проведение вводного инструктажа и инструктажа на рабочем месте, а также доведение требований охраны труда до работников ${short}.`),
		block("body", "3. Контроль исполнения настоящего приказа оставляю за собой.")
	];
	if (code === "osh_policy_suot") return [
		block("body", "1. Общие положения", true),
		block("body", `Настоящее положение описывает, как в ${org} распределяются обязанности по охране труда, как учитываются инструкции и как работник получает информацию об опасностях своей работы.`),
		block("body", "2. Распределение обязанностей", true),
		block("body", `Руководитель ${values["organization.director"] || ""} организует охрану труда и утверждает локальные документы. ${responsibleTitle} ${responsible} ведёт учёт инструкций, инструктажей и перечень профессий.`),
		block("body", "3. Инструкции и инструктажи", true),
		block("body", "Инструкция собирается по фактической профессии, работам, оборудованию и условиям. Работник знакомится с инструкцией до допуска к самостоятельной работе. Повторное ознакомление проводится при изменении работ или оборудования."),
		block("body", "4. Действия работников", true),
		block("body", "Работник выполняет работу в пределах порученного, применяет выданные средства защиты и сообщает руководителю о неисправности оборудования и об опасности, которую нельзя устранить самостоятельно.")
	];
	if (code === "osh_order_approve") return [
		block("body", `Для применения в ${org} утвердить инструкции по охране труда согласно перечню.`),
		block("body", "ПРИКАЗЫВАЮ:", true),
		block("body", "1. Утвердить следующие инструкции:"),
		...instructionBlocks(profile, context),
		block("body", `2. ${responsible} организовать ознакомление работников с инструкциями по их профессиям до начала самостоятельной работы.`),
		block("body", "3. Инструкцию, которая ещё не собрана в конструкторе, ввести в действие после сборки и повторного утверждения.")
	];
	if (code === "osh_list_instructions") return [block("body", `Перечень составлен по профессиям ${org} и по уже собранным инструкциям. Отдельный список профессий для этого документа не заводится.`), ...instructionBlocks(profile, context)];
	if (code === "osh_list_positions") return [block("body", `Перечень профессий и должностей ${org}, по которым ведутся инструкции и инструктажи.`), ...professionBlocks(profile, context)];
	if (code === "osh_program_intro") return [
		block("body", `Программа вводного инструктажа для работников ${org}.`),
		block("body", "Тема 1. Обязанности работника и работодателя в пределах этой организации, порядок обращения к руководителю и к ответственному за охрану труда.", true),
		block("body", "Тема 2. Основные опасности по подтверждённым профессиям, оборудованию и условиям работы. Конкретные меры берутся из инструкции по профессии, а не из общего перечня.", true),
		block("body", "Тема 3. Порядок допуска: инструкция, инструктаж на рабочем месте, исправность инструмента и применение выданных средств защиты.", true),
		block("body", "Тема 4. Действия при неисправности, травме и пожаре: прекратить работу, сообщить руководителю, не приступать снова, пока опасность не снята.", true),
		block("body", `Инструктаж проводит ${responsibleTitle} ${responsible}. Продолжительность и состав тем уточняются по фактическим профессиям организации.`)
	];
	if (code === "osh_order_training") return [
		block("body", `Для организации обучения и инструктажей в ${org}`),
		block("body", "ПРИКАЗЫВАЮ:", true),
		block("body", `1. Проводить вводный инструктаж по программе организации. Ответственный: ${responsible}, ${responsibleTitle}.`),
		block("body", "2. Первичный инструктаж на рабочем месте проводить по инструкции соответствующей профессии до допуска к самостоятельной работе."),
		block("body", "3. Повторный инструктаж проводить при изменении профессии, работ, оборудования или условий."),
		block("body", "4. Учёт инструктажей вести в журналах организации. Работник, не прошедший инструктаж по своей инструкции, к самостоятельной работе не допускается.")
	];
	const tools = toolLines(profile, context);
	return [
		block("body", `В ${org} применяются следующие электроинструменты:`),
		...tools.length > 0 ? tools.map((title, index) => block("body", `${index + 1}. ${title}`)) : [block("body", "Наименования электроинструмента в профиле не подтверждены.")],
		block("body", "ПРИКАЗЫВАЮ:", true),
		block("body", "1. Допустить к работе с указанным электроинструментом работников, чья профессия и инструкция учитывают этот инструмент."),
		block("body", "2. Перед работой осмотреть корпус, кабель, вилку и рабочий орган. Неисправный инструмент не применять."),
		block("body", `3. Учёт допуска и ознакомление с инструкцией возложить на ${responsible}, ${responsibleTitle}.`),
		block("body", "4. Если электроинструмент в организации не применяется, настоящий приказ не издаётся.")
	];
}
var FILENAME = {
	osh_order_responsible: "prikaz-obyazannosti-ot",
	osh_policy_suot: "polozhenie-suot",
	osh_order_approve: "prikaz-utverzhdenie-instrukcij",
	osh_list_instructions: "perechen-instrukcij",
	osh_list_positions: "perechen-professij",
	osh_program_intro: "programma-vvodnogo-instruktazha",
	osh_order_training: "prikaz-obuchenie-ot",
	osh_order_power_tools: "prikaz-elektroinstrument"
};
/** Общий сборщик восьми документов. Не проверяет, нужен ли документ организации. */
function renderCoreDocument(profile, document, context) {
	const current = context ?? fallbackContext();
	const values = requirementValues(profile, document.requiredData?.length ? document.requiredData : SHARED_REQUISITES);
	const blocks = [
		...header(values, document.name),
		...bodyFor(document.code, profile, current, values),
		...signature(values)
	];
	return {
		...fillTemplate({
			id: document.templateId || `tpl_${document.code}`,
			title: document.name,
			filename: FILENAME[document.code] || document.code,
			blocks
		}, values),
		inclusionReason: current.reason,
		formedAt: current.formedAt,
		normativeStatus: "needs_review"
	};
}
var templates = /* @__PURE__ */ new Map();
var generators = /* @__PURE__ */ new Map();
function registerTemplate(template) {
	templates.set(template.id, template);
}
function registerGenerator(generator) {
	generators.set(generator.id, generator);
}
function generateById(id, profile, document, context) {
	const generator = generators.get(id);
	if (!generator) throw new Error(`Генератор не зарегистрирован: ${id}`);
	return generator.generate(profile, document, context);
}
for (const document of CORE_OSH_DOCUMENTS) {
	const templateId = document.templateId || `tpl_${document.code}`;
	registerTemplate({
		id: templateId,
		title: document.name,
		filename: document.code,
		blocks: []
	});
	registerGenerator({
		id: document.generatorId || document.code,
		templateId,
		generate(profile, current, context) {
			return renderCoreDocument(profile, current.generatorId ? current : document, context);
		}
	});
}
var FIELD_LABEL = {
	profession: "профессия",
	custom_profession: "своя должность",
	work: "вид работ",
	equipment: "оборудование",
	condition: "условие",
	hazard: "опасность",
	material: "материал",
	ppe: "СИЗ",
	position: "должность",
	department: "подразделение",
	flag: "признак",
	industry: "отрасль",
	activity: "деятельность",
	name: "название",
	inn: "ИНН",
	headcount: "численность",
	director: "руководитель",
	director_title: "должность руководителя",
	address: "адрес",
	responsible: "ответственный",
	responsible_title: "должность ответственного",
	approval_date: "дата",
	short_name: "краткое название",
	city: "город"
};
function prettyKey(field, key) {
	if (field === "flag") return FLAG_LABELS[key] ?? key;
	return key;
}
function sourceIds(profile, field, key) {
	const winner = winningSource(findFact(profile, field, key));
	return winner ? [winner.sourceId] : [];
}
function factIdOf(field, key) {
	return `${field}:${key}`;
}
function hit(group, atom, op, keys) {
	return {
		group,
		field: atom.field,
		op,
		keys
	};
}
function blank(verdict, extra) {
	return {
		verdict,
		reasons: [],
		sources: [],
		missing: [],
		rules: [],
		facts: [],
		...extra
	};
}
function atomResult(profile, atom, group) {
	if (atom.present) {
		const facts = profile.facts.filter((fact) => fact.field === atom.field);
		if (facts.length === 0) return blank("unknown", { missing: [`${atom.field}:*`] });
		const yes = facts.filter((fact) => verdictOf(fact) === "yes");
		if (yes.length > 0) {
			const ids = yes.map((fact) => fact.id);
			return blank("yes", {
				reasons: [`${FIELD_LABEL[atom.field]}: ${yes.map((fact) => prettyKey(atom.field, fact.key)).join(", ")}`],
				sources: yes.flatMap((fact) => sourceIds(profile, atom.field, fact.key)),
				rules: [hit(group, atom, "present", yes.map((fact) => fact.key))],
				facts: ids
			});
		}
		const unknown = facts.filter((fact) => verdictOf(fact) === "unknown");
		if (unknown.length > 0) return blank("unknown", {
			sources: unknown.flatMap((fact) => sourceIds(profile, atom.field, fact.key)),
			missing: unknown.map((fact) => fact.id)
		});
		return blank("no", {
			reasons: [`${FIELD_LABEL[atom.field]} отклонены`],
			rules: [hit(group, atom, "present", [])]
		});
	}
	if (atom.min != null || atom.field === "headcount") {
		const fact = findFact(profile, "headcount", "value");
		const verdict = verdictOf(fact);
		const winner = winningSource(fact);
		if (verdict !== "yes" || !winner || typeof winner.value !== "number") return blank(verdict === "no" ? "no" : "unknown", { missing: verdict === "no" ? [] : ["headcount:value"] });
		const enough = atom.min == null || winner.value >= atom.min;
		const rule = hit(group, {
			...atom,
			field: "headcount"
		}, "min", [String(atom.min ?? winner.value)]);
		return enough ? blank("yes", {
			reasons: [`численность: ${winner.value}`],
			sources: [winner.sourceId],
			rules: [rule],
			facts: ["headcount:value"]
		}) : blank("no", {
			reasons: [`численность ${winner.value} меньше ${atom.min}`],
			sources: [winner.sourceId],
			rules: [rule],
			facts: ["headcount:value"]
		});
	}
	if (atom.eq !== void 0) {
		const key = "value";
		const fact = findFact(profile, atom.field, key);
		const verdict = verdictOf(fact);
		const winner = winningSource(fact);
		if (!winner || verdict === "unknown") return blank("unknown", { missing: [factIdOf(atom.field, key)] });
		const rule = hit(group, atom, "eq", [String(atom.eq)]);
		if (winner.value === atom.eq && verdict === "yes") return blank("yes", {
			reasons: [`${FIELD_LABEL[atom.field]}: ${String(atom.eq)}`],
			sources: [winner.sourceId],
			rules: [rule],
			facts: [factIdOf(atom.field, key)]
		});
		return blank("no", {
			reasons: [`${FIELD_LABEL[atom.field]} не равно ${String(atom.eq)}`],
			sources: [winner.sourceId],
			rules: [rule],
			facts: [factIdOf(atom.field, key)]
		});
	}
	const keys = atom.in ?? [];
	if (keys.length === 0) return blank("no");
	const yes = [];
	const missing = [];
	const sources = [];
	const facts = [];
	let rejected = 0;
	for (const key of keys) {
		const fact = findFact(profile, atom.field, key);
		const verdict = verdictOf(fact);
		if (verdict === "yes") {
			yes.push(prettyKey(atom.field, key));
			sources.push(...sourceIds(profile, atom.field, key));
			facts.push(factIdOf(atom.field, key));
		} else if (verdict === "no") rejected += 1;
		else missing.push(factIdOf(atom.field, key));
	}
	if (yes.length > 0) return blank("yes", {
		reasons: [`${FIELD_LABEL[atom.field]}: ${yes.join(", ")}`],
		sources,
		rules: [hit(group, atom, "in", keys.filter((key) => facts.includes(factIdOf(atom.field, key))))],
		facts
	});
	if (missing.length > 0) return blank("unknown", { missing });
	if (rejected === keys.length) return blank("no", {
		reasons: [`${FIELD_LABEL[atom.field]}: ${keys.map((key) => prettyKey(atom.field, key)).join(", ")} — нет`],
		rules: [hit(group, atom, "in", keys)],
		facts: keys.map((key) => factIdOf(atom.field, key))
	});
	return blank("unknown", { missing: keys.map((key) => factIdOf(atom.field, key)) });
}
function combineOr(parts) {
	if (parts.length === 0) return "skip";
	const yes = parts.filter((part) => part.verdict === "yes");
	if (yes.length > 0) return blank("yes", {
		reasons: yes.flatMap((part) => part.reasons),
		sources: [...new Set(yes.flatMap((part) => part.sources))],
		rules: yes.flatMap((part) => part.rules),
		facts: [...new Set(yes.flatMap((part) => part.facts))]
	});
	const unknown = parts.filter((part) => part.verdict === "unknown");
	if (unknown.length > 0) return blank("unknown", {
		sources: [...new Set(unknown.flatMap((part) => part.sources))],
		missing: [...new Set(unknown.flatMap((part) => part.missing))]
	});
	return blank("no", {
		reasons: parts.flatMap((part) => part.reasons),
		rules: parts.flatMap((part) => part.rules),
		facts: [...new Set(parts.flatMap((part) => part.facts))]
	});
}
function combineAnd(parts) {
	if (parts.length === 0) return "skip";
	if (parts.some((part) => part.verdict === "no")) {
		const blocked = parts.filter((part) => part.verdict === "no");
		return blank("no", {
			reasons: blocked.flatMap((part) => part.reasons),
			rules: blocked.flatMap((part) => part.rules),
			facts: [...new Set(blocked.flatMap((part) => part.facts))]
		});
	}
	if (parts.some((part) => part.verdict === "unknown")) {
		const unknown = parts.filter((part) => part.verdict === "unknown");
		return blank("unknown", {
			sources: [...new Set(unknown.flatMap((part) => part.sources))],
			missing: [...new Set(unknown.flatMap((part) => part.missing))]
		});
	}
	return blank("yes", {
		reasons: parts.flatMap((part) => part.reasons),
		sources: [...new Set(parts.flatMap((part) => part.sources))],
		rules: parts.flatMap((part) => part.rules),
		facts: [...new Set(parts.flatMap((part) => part.facts))]
	});
}
function combineNone(parts) {
	if (parts.length === 0) return "skip";
	const held = parts.filter((part) => part.verdict === "yes");
	if (held.length > 0) return blank("no", {
		reasons: held.flatMap((part) => part.reasons.map((reason) => `запрещающее условие: ${reason}`)),
		sources: [...new Set(held.flatMap((part) => part.sources))],
		rules: held.flatMap((part) => part.rules),
		facts: [...new Set(held.flatMap((part) => part.facts))]
	});
	const unknown = parts.filter((part) => part.verdict === "unknown");
	if (unknown.length > 0) return blank("unknown", { missing: [...new Set(unknown.flatMap((part) => part.missing))] });
	return blank("yes");
}
function asResult(value) {
	return value === "skip" ? null : value;
}
function traceResult(match) {
	if (match === "yes") return "YES";
	if (match === "no") return "NO";
	return "UNKNOWN";
}
function toTrace(result) {
	return {
		result: traceResult(result.verdict),
		matchedRules: result.verdict === "unknown" ? [] : result.rules,
		facts: result.verdict === "unknown" ? [] : [...new Set(result.facts)],
		sources: [...new Set(result.sources)],
		missing: [...new Set(result.missing)]
	};
}
function decisionFrom(result) {
	return {
		applicable: result.verdict,
		reasons: result.reasons,
		sources: [...new Set(result.sources)],
		missing: [...new Set(result.missing)],
		trace: toTrace(result)
	};
}
/** ALL + ANY + NONE. Пустое правило — документ нужен организации в целом. */
function evaluateApplicability(profile, applicability) {
	const groups = [
		asResult(combineAnd((applicability.all ?? []).map((atom) => atomResult(profile, atom, "all")))),
		asResult(combineOr((applicability.any ?? []).map((atom) => atomResult(profile, atom, "any")))),
		asResult(combineNone((applicability.none ?? []).map((atom) => atomResult(profile, atom, "none"))))
	].filter((group) => group != null);
	if (groups.length === 0) return {
		applicable: "yes",
		reasons: ["Требуется для организации в целом"],
		sources: [],
		missing: [],
		trace: {
			result: "YES",
			matchedRules: [],
			facts: [],
			sources: [],
			missing: []
		}
	};
	const folded = combineAnd(groups);
	if (folded === "skip") return {
		applicable: "yes",
		reasons: ["Требуется для организации в целом"],
		sources: [],
		missing: [],
		trace: {
			result: "YES",
			matchedRules: [],
			facts: [],
			sources: [],
			missing: []
		}
	};
	const decision = decisionFrom(folded);
	if (decision.applicable === "yes" && decision.reasons.length === 0) decision.reasons = ["Требуется для организации в целом"];
	return decision;
}
function explain(decision) {
	if (decision.applicable === "yes") return decision.reasons.length > 0 ? `Документ включён, потому что ${decision.reasons.join("; ")}.` : "Документ включён.";
	if (decision.applicable === "unknown") {
		const labels = decision.missing.map((id) => {
			const [field, key] = id.split(":");
			if (!key || key === "*") return FIELD_LABEL[field] ?? id;
			return prettyKey(field, key);
		});
		return labels.length > 0 ? `Нужно уточнить: ${labels.join(", ")}.` : "Нужно уточнить.";
	}
	return decision.reasons.length > 0 ? `Документ не включён: ${decision.reasons.join("; ")}.` : "Документ не включён.";
}
function resolveStatus(document, match) {
	if (match === "no") return "exclude";
	if (match === "unknown") return "clarify";
	if (document.optional) return "optional";
	if (document.commercialLevel === "FREE") return "ready";
	return "locked";
}
function composePackage(profile, documents) {
	const items = [];
	for (const document of documents) {
		if (document.status === "deprecated") continue;
		const decision = evaluateApplicability(profile, document.applicability);
		const status = resolveStatus(document, decision.applicable);
		if (status === "exclude") continue;
		items.push({
			document,
			match: decision.applicable,
			status,
			reason: explain(decision),
			reasons: decision.reasons,
			sources: decision.sources,
			missing: decision.missing,
			trace: decision.trace
		});
	}
	const included = items.filter((item) => item.status === "ready" || item.status === "locked");
	const clarifications = items.filter((item) => item.status === "clarify");
	const optional = items.filter((item) => item.status === "optional");
	const countShape = (shape) => included.filter((item) => item.document.shape === shape).length;
	return {
		items,
		included,
		clarifications,
		optional,
		counts: {
			orders: countShape("order"),
			instructions: countShape("instruction"),
			policies: countShape("policy"),
			programs: countShape("program"),
			lists: countShape("list"),
			journals: countShape("journal"),
			ppe: included.filter((item) => item.document.category === "ppe" && item.document.shape !== "order").length,
			medical: included.filter((item) => item.document.category === "medical" && item.document.shape !== "order").length,
			total: included.length
		}
	};
}
var CHECK = "Нормативное основание требует проверки";
var BASIS_IOT = "Структура инструкции соответствует приказу Минтруда России от 29.10.2021 № 772н. Иные нормативные основания требуют проверки.";
var FOOD = [
	"cook",
	"confectioner",
	"baker",
	"food_line",
	"butcher",
	"dishwasher"
];
var HEIGHT = { any: [
	{
		field: "condition",
		in: ["cond_height"]
	},
	{
		field: "equipment",
		in: ["ladder"]
	},
	{
		field: "hazard",
		in: ["fall_height"]
	},
	{
		field: "flag",
		in: ["height"]
	}
] };
var ELECTRICAL = { any: [
	{
		field: "work",
		in: ["work_electrical_install", "work_electrical_maint"]
	},
	{
		field: "condition",
		in: ["cond_live"]
	},
	{
		field: "equipment",
		in: ["voltage_indicator", "insulated_tools"]
	},
	{
		field: "flag",
		in: ["electrical"]
	}
] };
var FOOD_RULE = { any: [
	{
		field: "profession",
		in: FOOD
	},
	{
		field: "work",
		in: ["work_kitchen"]
	},
	{
		field: "condition",
		in: ["cond_hot_kitchen"]
	},
	{
		field: "flag",
		in: ["food"]
	}
] };
var TRANSPORT = { any: [
	{
		field: "equipment",
		in: [
			"car",
			"forklift",
			"self_propelled"
		]
	},
	{
		field: "work",
		in: ["work_driving"]
	},
	{
		field: "flag",
		in: ["transport"]
	}
] };
var WAREHOUSE = { any: [
	{
		field: "profession",
		in: [
			"loader",
			"storekeeper",
			"picker",
			"receiver",
			"packer",
			"stacker_driver",
			"forklift_driver"
		]
	},
	{
		field: "work",
		in: ["work_stacking"]
	},
	{
		field: "flag",
		in: ["warehouse"]
	}
] };
/** powerTools — факт поля flag, тот же resolver, что у equipment. Отдельного списка признаков нет. */
var TOOLS = { any: [{
	field: "equipment",
	in: ["angle_grinder", "drill"]
}, {
	field: "flag",
	in: ["powerTools"]
}] };
var HAZARDOUS = { any: [
	{
		field: "condition",
		in: [
			"cond_height",
			"cond_confined",
			"cond_hot_zone",
			"cond_explosive"
		]
	},
	{
		field: "equipment",
		in: ["gas_cylinder", "ladder"]
	},
	{
		field: "work",
		in: ["work_gas_cutting", "work_slinging"]
	},
	{
		field: "flag",
		in: ["hazardousWork"]
	}
] };
var PPE = { any: [{
	field: "ppe",
	present: true
}, {
	field: "flag",
	in: ["ppe"]
}] };
var MEDICAL = { any: [{
	field: "flag",
	in: ["medical"]
}] };
var SOUT_DONE = { any: [{
	field: "flag",
	in: ["sout"]
}] };
var HAS_PROFESSIONS = { any: [{
	field: "profession",
	present: true
}, {
	field: "custom_profession",
	present: true
}] };
function doc(init) {
	return {
		id: init.code,
		version: init.version ?? "1.0.0",
		status: init.status ?? "active",
		dependencies: [],
		template: null,
		generator: init.generator ?? "none",
		commercialLevel: init.commercialLevel ?? "PACKAGE",
		optional: init.optional ?? false,
		moduleId: init.moduleId ?? "core",
		normativeBasis: init.normativeBasis ?? CHECK,
		code: init.code,
		name: init.name,
		category: init.category,
		shape: init.shape,
		applicability: init.applicability,
		professionId: init.professionId
	};
}
/** Организационные документы — данные, не зашитый отраслевой пакет. */
function organizationDocuments() {
	return [
		doc({
			code: "policy_suot",
			name: "Положение о системе управления охраной труда",
			category: "organization",
			shape: "policy",
			applicability: {}
		}),
		doc({
			code: "policy_instructions",
			name: "Положение о порядке разработки и учёта инструкций по охране труда",
			category: "organization",
			shape: "policy",
			applicability: {}
		}),
		doc({
			code: "order_responsible",
			name: "Приказ о возложении обязанностей по охране труда",
			category: "organization",
			shape: "order",
			applicability: {}
		}),
		doc({
			code: "order_training",
			name: "Приказ об организации обучения по охране труда",
			category: "training",
			shape: "order",
			applicability: {}
		}),
		doc({
			code: "order_sout",
			name: "Приказ об организации специальной оценки условий труда",
			category: "organization",
			shape: "order",
			applicability: {}
		}),
		doc({
			code: "order_instructions",
			name: "Приказ об утверждении инструкций по охране труда",
			category: "instructions",
			shape: "order",
			applicability: HAS_PROFESSIONS
		}),
		doc({
			code: "program_intro",
			name: "Программа вводного инструктажа",
			category: "training",
			shape: "program",
			applicability: {}
		}),
		doc({
			code: "program_first_aid",
			name: "Программа обучения оказанию первой помощи",
			category: "training",
			shape: "program",
			applicability: {}
		}),
		doc({
			code: "program_workplace",
			name: "Программа первичного инструктажа на рабочем месте",
			category: "training",
			shape: "program",
			applicability: HAS_PROFESSIONS
		}),
		doc({
			code: "journal_intro",
			name: "Журнал регистрации вводного инструктажа",
			category: "journals",
			shape: "journal",
			applicability: {}
		}),
		doc({
			code: "journal_workplace",
			name: "Журнал регистрации инструктажа на рабочем месте",
			category: "journals",
			shape: "journal",
			applicability: HAS_PROFESSIONS
		}),
		doc({
			code: "journal_issue",
			name: "Журнал учёта выдачи инструкций",
			category: "journals",
			shape: "journal",
			applicability: HAS_PROFESSIONS
		}),
		doc({
			code: "list_instructions",
			name: "Перечень инструкций по охране труда",
			category: "lists",
			shape: "list",
			applicability: HAS_PROFESSIONS
		}),
		doc({
			code: "list_positions",
			name: "Перечень профессий и должностей",
			category: "lists",
			shape: "list",
			applicability: HAS_PROFESSIONS
		}),
		doc({
			code: "risk_policy",
			name: "Положение об управлении профессиональными рисками",
			category: "risk",
			shape: "policy",
			applicability: {},
			commercialLevel: "PRO"
		}),
		doc({
			code: "risk_cards",
			name: "Карты оценки профессиональных рисков",
			category: "risk",
			shape: "card",
			applicability: HAS_PROFESSIONS,
			commercialLevel: "PRO"
		}),
		doc({
			code: "order_height",
			name: "Приказ об организации работ на высоте",
			category: "hazardous",
			shape: "order",
			applicability: HEIGHT
		}),
		doc({
			code: "program_height",
			name: "Программа обучения безопасным методам работ на высоте",
			category: "training",
			shape: "program",
			applicability: HEIGHT,
			commercialLevel: "PRO"
		}),
		doc({
			code: "list_height",
			name: "Перечень работников, допускаемых к работам на высоте",
			category: "lists",
			shape: "list",
			applicability: HEIGHT
		}),
		doc({
			code: "order_electrical",
			name: "Приказ о назначении ответственного за электрохозяйство",
			category: "hazardous",
			shape: "order",
			applicability: ELECTRICAL
		}),
		doc({
			code: "program_electrical",
			name: "Программа обучения по электробезопасности",
			category: "training",
			shape: "program",
			applicability: ELECTRICAL,
			commercialLevel: "PRO"
		}),
		doc({
			code: "order_food",
			name: "Приказ об организации работы пищеблока",
			category: "extra",
			shape: "order",
			applicability: FOOD_RULE
		}),
		doc({
			code: "order_transport",
			name: "Приказ об организации эксплуатации транспорта",
			category: "extra",
			shape: "order",
			applicability: TRANSPORT
		}),
		doc({
			code: "journal_pretrip",
			name: "Журнал предрейсового контроля",
			category: "journals",
			shape: "journal",
			applicability: TRANSPORT,
			commercialLevel: "PRO"
		}),
		doc({
			code: "order_warehouse",
			name: "Приказ об организации складских работ",
			category: "extra",
			shape: "order",
			applicability: WAREHOUSE
		}),
		doc({
			code: "order_tools",
			name: "Приказ о допуске к работе с электроинструментом",
			category: "hazardous",
			shape: "order",
			applicability: TOOLS
		}),
		doc({
			code: "order_hazardous",
			name: "Приказ об организации работ повышенной опасности",
			category: "hazardous",
			shape: "order",
			applicability: HAZARDOUS
		}),
		doc({
			code: "list_hazardous",
			name: "Перечень работ повышенной опасности",
			category: "lists",
			shape: "list",
			applicability: HAZARDOUS
		}),
		doc({
			code: "order_ppe",
			name: "Приказ об обеспечении работников СИЗ",
			category: "ppe",
			shape: "order",
			applicability: PPE
		}),
		doc({
			code: "ppe_norms",
			name: "Нормы выдачи СИЗ",
			category: "ppe",
			shape: "card",
			applicability: PPE,
			commercialLevel: "PRO"
		}),
		doc({
			code: "ppe_cards",
			name: "Личные карточки учёта выдачи СИЗ",
			category: "ppe",
			shape: "card",
			applicability: PPE
		}),
		doc({
			code: "journal_ppe",
			name: "Журнал учёта выдачи СИЗ",
			category: "journals",
			shape: "journal",
			applicability: PPE
		}),
		doc({
			code: "list_ppe",
			name: "Перечень СИЗ",
			category: "lists",
			shape: "list",
			applicability: PPE
		}),
		doc({
			code: "order_medical",
			name: "Приказ об организации медицинских осмотров",
			category: "medical",
			shape: "order",
			applicability: MEDICAL
		}),
		doc({
			code: "list_medical",
			name: "Список контингента на медицинский осмотр",
			category: "medical",
			shape: "list",
			applicability: MEDICAL,
			commercialLevel: "PRO"
		}),
		doc({
			code: "sout_materials",
			name: "Материалы специальной оценки условий труда",
			category: "extra",
			shape: "card",
			applicability: SOUT_DONE,
			commercialLevel: "PRO"
		}),
		doc({
			code: "expert_review",
			name: "Экспертная проверка пакета специалистом",
			category: "extra",
			shape: "other",
			applicability: {},
			commercialLevel: "EXPERT",
			optional: true
		})
	];
}
/** Инструкция не копирует каталог профессий: это ссылка на уже существующий id. */
function instructionDocuments() {
	return professions.map((profession) => doc({
		code: `iot_${profession.meta.id}`,
		name: `Инструкция по охране труда: ${profession.meta.title}`,
		category: "instructions",
		shape: "instruction",
		applicability: { any: [{
			field: "profession",
			in: [profession.meta.id]
		}] },
		commercialLevel: "FREE",
		generator: "instruction",
		normativeBasis: BASIS_IOT,
		professionId: profession.meta.id
	}));
}
function customInstructionDocument(title) {
	return doc({
		code: `iot_custom_${Array.from(title.trim().toLowerCase()).map((char) => /[a-z0-9а-яё]/i.test(char) ? char : "-").join("").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`,
		name: `Инструкция по охране труда: ${title.trim()}`,
		category: "instructions",
		shape: "instruction",
		applicability: {},
		commercialLevel: "FREE",
		generator: "instruction",
		normativeBasis: BASIS_IOT
	});
}
/**
* Реестр документов. Новый отраслевой модуль вызывает registerPackageModule
* и не меняет ни применимость, ни мастер. У модуля есть id, version и status.
* Профессии и оборудование по-прежнему живут в каталоге конструктора.
*/
var extensions = /* @__PURE__ */ new Map();
function registerPackageModule(extension) {
	const documents = (extension.documents ?? []).map((document) => ({
		...document,
		id: document.id || document.code,
		version: document.version || "1.0.0",
		status: document.status || "active",
		moduleId: extension.id
	}));
	extensions.set(extension.id, {
		...extension,
		version: extension.version ?? "1.0.0",
		status: extension.status ?? "active",
		documents,
		facts: extension.facts ?? [],
		dependencies: extension.dependencies ?? []
	});
}
function listPackageExtensions() {
	return [...extensions.values()];
}
function documentsFor(profile) {
	const base = [
		...organizationDocuments(),
		...instructionDocuments(),
		...listPackageExtensions().flatMap((item) => item.documents ?? [])
	];
	const known = new Set(base.map((item) => item.code));
	const custom = profile.customProfessions.map((title) => customInstructionDocument(title)).filter((item) => !known.has(item.code));
	return [...base, ...custom].filter((document) => document.status !== "deprecated");
}
function buildPackage(profile) {
	return composePackage(profile, documentsFor(profile));
}
registerPackageModule(coreOshModule);
var STEPS = [
	"Организация",
	"Сотрудники и профессии",
	"Работы и оборудование",
	"Опасности и условия",
	"Проверка данных",
	"Состав пакета"
];
var WORKFLOW_LABEL = {
	defined: "Документ требуется",
	clarify: "Нужно уточнить",
	needs_data: "Нужны данные",
	ready_to_generate: "Готов к формированию",
	formed: "Сформирован"
};
var STATUS_LABEL = {
	ready: "Система уже знает",
	clarify: "Нужно уточнить",
	optional: "Дополнительный документ",
	locked: "Полный пакет"
};
function PackagePage() {
	const profile = useApp((state) => state.profile);
	const step = useApp((state) => state.packageStep);
	const overrides = useApp((state) => state.overrides);
	const instructions = useApp((state) => state.instructions);
	const setPackageStep = useApp((state) => state.setPackageStep);
	const patchProfile = useApp((state) => state.patchProfile);
	const toggleProfile = useApp((state) => state.toggleProfile);
	const setProfileFlag = useApp((state) => state.setProfileFlag);
	const applyIndustryPreset = useApp((state) => state.applyIndustryPreset);
	const addProfileCustomProfession = useApp((state) => state.addProfileCustomProfession);
	const removeProfileCustomProfession = useApp((state) => state.removeProfileCustomProfession);
	const setProfileValues = useApp((state) => state.setProfileValues);
	const packageSnapshot = useApp((state) => state.packageSnapshot);
	const formedDocuments = useApp((state) => state.formedDocuments);
	const rememberSnapshot = useApp((state) => state.rememberSnapshot);
	const rememberFormed = useApp((state) => state.rememberFormed);
	const catalog = (0, import_react.useMemo)(() => buildCatalog(overrides), [overrides]);
	const pack = (0, import_react.useMemo)(() => buildPackage(profile), [profile]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [customName, setCustomName] = (0, import_react.useState)("");
	const [department, setDepartment] = (0, import_react.useState)("");
	const [previewId, setPreviewId] = (0, import_react.useState)(null);
	const formedIds = Object.keys(formedDocuments);
	const coreItems = pack.items.filter((item) => item.document.moduleId === "core_osh");
	const missing = missingForItems(profile, coreItems);
	const readiness = packageReadiness(pack.items, profile, formedIds);
	const titleOf = (kind, id) => {
		if (kind === "profession") return catalog.professions.find((item) => item.meta.id === id)?.meta.title ?? id;
		if (kind === "work") return catalog.works.find((item) => item.meta.id === id)?.meta.title ?? id;
		if (kind === "gear") return catalog.gears.find((item) => item.meta.id === id)?.meta.title ?? id;
		return catalog.conditions.find((item) => item.meta.id === id)?.meta.title ?? id;
	};
	const filtered = catalog.professions.filter((item) => `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
	const speak = (reason) => {
		const titles = {};
		for (const item of catalog.professions) titles[item.meta.id] = item.meta.title;
		for (const item of catalog.works) titles[item.meta.id] = item.meta.title;
		for (const item of catalog.gears) titles[item.meta.id] = item.meta.title;
		for (const item of catalog.conditions) titles[item.meta.id] = item.meta.title;
		for (const key of FLAG_KEYS) titles[key] = FLAG_LABELS[key];
		let text = reason.replaceAll("Документ включён, потому что", "Документ требуется:").replaceAll("Документ не включён:", "Документ не применяется:").replaceAll("Документ не включён", "Документ не применяется").replaceAll("Требуется для организации в целом", "документ нужен организации в целом");
		for (const [id, title] of Object.entries(titles).sort((left, right) => right[0].length - left[0].length)) text = text.split(id).join(title);
		return text;
	};
	const makeContext = (item) => ({
		instructions: instructions.map((entry) => ({
			id: entry.id,
			professionId: entry.professionId,
			professionTitle: entry.professionTitle,
			number: entry.number,
			date: entry.snapshot.date,
			plain: entry.snapshot.plain
		})),
		professionTitle: (id) => titleOf("profession", id),
		gearTitle: (id) => titleOf("gear", id),
		reason: speak(item.reason),
		formedAt: (/* @__PURE__ */ new Date()).toISOString()
	});
	const formOne = (item) => {
		const generatorId = generatorIdOf(item.document);
		if (!generatorId) return;
		if (!packageSnapshot) rememberSnapshot(createPackageSnapshot(profile, pack));
		rememberFormed(item.document.id, generateById(generatorId, profile, item.document, makeContext(item)));
		setPreviewId(item.document.id);
	};
	const formPackage = async () => {
		if (readiness.needsData.length > 0 || readiness.ready.length === 0) return;
		if (!packageSnapshot) rememberSnapshot(createPackageSnapshot(profile, pack));
		const produced = [];
		for (const row of readiness.ready) {
			const generatorId = generatorIdOf(row.item.document);
			if (!generatorId) continue;
			const generated = generateById(generatorId, profile, row.item.document, makeContext(row.item));
			rememberFormed(row.item.document.id, generated);
			produced.push({
				document: generated,
				shape: row.item.document.shape
			});
		}
		await downloadPackageZip(profile.name || "Организация", produced, instructions.map((entry) => ({
			id: entry.id,
			professionId: entry.professionId,
			professionTitle: entry.professionTitle,
			number: entry.number,
			date: entry.snapshot.date,
			plain: entry.snapshot.plain
		})));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm font-bold uppercase tracking-wide text-primary",
			children: [
				"Шаг ",
				step + 1,
				" из 6"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 text-3xl font-extrabold text-ink",
			children: STEPS[step]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-3xl text-sm leading-relaxed text-muted",
			children: "Система определит нужные документы по профессиям, работам, оборудованию и условиям. Бесплатные инструкции собираются без ограничений."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 h-2 overflow-hidden rounded-full bg-soft",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full bg-primary",
				style: { width: `${(step + 1) / STEPS.length * 100}%` }
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
			className: "mt-3 md:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
				className: "cursor-pointer py-2 text-sm font-semibold",
				children: "Все этапы"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-2 grid gap-2",
				children: STEPS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setPackageStep(index),
					className: `w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${index === step ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`,
					children: [
						index + 1,
						". ",
						label
					]
				}) }, label))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 hidden flex-wrap gap-2 md:flex",
			children: STEPS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setPackageStep(index),
				className: `rounded-full px-3 py-2 text-sm font-semibold ${index === step ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`,
				children: [
					index + 1,
					". ",
					label
				]
			}) }, label))
		}),
		step === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 grid gap-4",
			children: [
				(profile.instructionIds.length > 0 || profile.professionIds.length > 0 || profile.gearIds.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-line bg-surface px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-bold",
							children: "Система уже знает"
						}),
						profile.instructionIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-muted",
							children: "Из собранных инструкций уже взяты сведения. Повторять их не нужно."
						}),
						profile.professionIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm leading-relaxed text-muted",
							children: [
								"Профессии: ",
								profile.professionIds.map((id) => titleOf("profession", id)).join(", "),
								"."
							]
						}),
						profile.gearIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm leading-relaxed text-muted",
							children: [
								"Оборудование и инструмент: ",
								profile.gearIds.map((id) => titleOf("gear", id)).join(", "),
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-3 min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
							onClick: () => setPackageStep(5),
							children: "Перейти к составу пакета"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm font-bold",
					children: ["Название организации", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium",
						value: profile.name,
						onChange: (event) => patchProfile({ name: event.target.value })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm font-bold",
						children: ["ИНН", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium",
							value: profile.inn,
							onChange: (event) => patchProfile({ inn: event.target.value })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm font-bold",
						children: ["Численность", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: 0,
							className: "mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium",
							value: profile.headcount ?? "",
							onChange: (event) => patchProfile({ headcount: event.target.value === "" ? null : Number(event.target.value) })
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm font-bold",
					children: ["Вид деятельности", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium",
						value: profile.activity,
						onChange: (event) => patchProfile({ activity: event.target.value })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-sm font-bold",
					children: ["Отрасль", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium",
						value: profile.industry,
						onChange: (event) => patchProfile({ industry: event.target.value })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-bold",
						children: "Подразделение"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium",
							value: department,
							onChange: (event) => setDepartment(event.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-xl bg-soft px-4 text-sm font-bold",
							onClick: () => {
								const name = department.trim();
								if (!name || profile.departments.includes(name)) return;
								patchProfile({ departments: [...profile.departments, name] });
								setDepartment("");
							},
							children: "Добавить"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: profile.departments.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "rounded-full bg-soft px-3 py-2 text-sm font-semibold",
							onClick: () => patchProfile({ departments: profile.departments.filter((name) => name !== item) }),
							children: [item, " ×"]
						}, item))
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-extrabold",
						children: "Отраслевой старт"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm leading-relaxed text-muted",
						children: "Отраслевой старт только предлагает профессии и условия. Лишнее можно снять. Состав документов он не назначает."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid gap-2 md:grid-cols-2",
						children: PRESETS.map((preset) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => applyIndustryPreset(preset.id),
							className: `rounded-xl border px-3 py-3 text-left ${profile.presetId === preset.id ? "border-primary bg-soft" : "border-line bg-surface"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-bold",
								children: preset.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-sm text-muted",
								children: preset.activity
							})]
						}, preset.id))
					})
				] })
			]
		}),
		step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm",
					placeholder: "Найти профессию",
					value: query,
					onChange: (event) => setQuery(event.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-2",
					children: filtered.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						checked: profile.professionIds.includes(item.meta.id),
						title: item.meta.title,
						onToggle: () => toggleProfile("professionIds", item.meta.id)
					}, item.meta.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm",
						placeholder: "Должность, которой нет в каталоге",
						value: customName,
						onChange: (event) => setCustomName(event.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-xl bg-soft px-4 text-sm font-bold",
						onClick: () => {
							addProfileCustomProfession(customName);
							setCustomName("");
						},
						children: "Добавить"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: profile.customProfessions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "rounded-full bg-soft px-3 py-2 text-sm font-semibold",
						onClick: () => removeProfileCustomProfession(item),
						children: [item, " ×"]
					}, item))
				})
			]
		}),
		step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 grid gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-extrabold",
				children: "Работы"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2",
				children: catalog.works.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					checked: profile.workIds.includes(item.meta.id),
					title: item.meta.title,
					text: item.summary,
					onToggle: () => toggleProfile("workIds", item.meta.id)
				}, item.meta.id))
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-extrabold",
				children: "Оборудование и инструмент"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2",
				children: catalog.gears.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					checked: profile.gearIds.includes(item.meta.id),
					title: item.meta.title,
					text: GEAR_KIND[item.kind],
					onToggle: () => toggleProfile("gearIds", item.meta.id)
				}, item.meta.id))
			})] })]
		}),
		step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 grid gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-extrabold",
				children: "Условия"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2",
				children: catalog.conditions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
					checked: profile.conditionIds.includes(item.meta.id),
					title: item.meta.title,
					text: item.summary,
					onToggle: () => toggleProfile("conditionIds", item.meta.id)
				}, item.meta.id))
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-extrabold",
					children: "Признаки организации"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "«Не задано» оставляет документ в состоянии «Нужно уточнить». «Нет» исключает его, если нет другого подтверждения."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid gap-3",
					children: FLAG_KEYS.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriRow, {
						label: FLAG_LABELS[key],
						value: profile.flags[key],
						onChange: (value) => setProfileFlag(key, value)
					}, key))
				})
			] })]
		}),
		step === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 grid gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Организация",
					text: profile.name || "не указана"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Отрасль и деятельность",
					text: [profile.industry, profile.activity].filter(Boolean).join(" · ") || "не указаны"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Численность",
					text: profile.headcount == null ? "не указана" : String(profile.headcount)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Профессии",
					text: [...profile.professionIds.map((id) => titleOf("profession", id)), ...profile.customProfessions].join(", ") || "не выбраны"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Работы",
					text: profile.workIds.map((id) => titleOf("work", id)).join(", ") || "не выбраны"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Оборудование и инструмент",
					text: profile.gearIds.map((id) => titleOf("gear", id)).join(", ") || "не выбраны"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Условия",
					text: profile.conditionIds.map((id) => titleOf("condition", id)).join(", ") || "не выбраны"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fact, {
					title: "Признаки",
					text: FLAG_KEYS.map((key) => `${FLAG_LABELS[key]}: ${profile.flags[key] == null ? "не задано" : profile.flags[key] ? "да" : "нет"}`).join("; ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-relaxed text-muted",
					children: [
						"Инструкций уже учтено: ",
						instructions.length,
						". Если что-то указано лишнее, вернитесь и снимите отметку."
					]
				})
			]
		}),
		step === 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-2 mt-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-extrabold",
							children: "Определено автоматически"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-3 grid gap-2 text-sm font-semibold md:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.orders,
									label: "приказов"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.instructions,
									label: "инструкций"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.policies,
									label: "положений"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.programs,
									label: "программ обучения"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.lists,
									label: "перечней"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.journals,
									label: "журналов"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.ppe,
									label: "документов по СИЗ"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
									n: pack.counts.medical,
									label: "документов по медосмотрам"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm font-bold",
							children: [
								"Всего: ",
								pack.counts.total,
								"."
							]
						}),
						pack.clarifications.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 rounded-xl border border-line bg-soft px-4 py-3 text-sm leading-relaxed",
							children: [
								"Нужно уточнить: ",
								pack.clarifications.length,
								". Пока ответа нет, документ не входит в состав и не отбрасывается.",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ml-2 font-bold text-primary",
									onClick: () => setPackageStep(3),
									children: "Уточнить признаки"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-1 rounded-2xl border border-line bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-extrabold",
							children: "Базовая организация охраны труда"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-relaxed text-muted",
							children: "Бесплатный разбор состава уже сделан. Отметка «Полный пакет» не требует оплаты: можно заполнить реквизиты, открыть предпросмотр и скачать файлы."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-3 grid gap-2 text-sm font-semibold sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-xl bg-accent-soft px-3 py-2 text-accent",
									children: ["Готово: ", readiness.ready.length]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-xl bg-soft px-3 py-2",
									children: ["Нужно уточнить: ", readiness.clarify.length]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "rounded-xl bg-soft px-3 py-2",
									children: ["Нужны данные: ", readiness.needsData.length]
								})
							]
						}),
						packageSnapshot && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 rounded-xl bg-soft px-3 py-2 text-sm leading-relaxed",
							children: [
								"Состав пакета зафиксирован ",
								new Date(packageSnapshot.createdAt).toLocaleString("ru-RU"),
								". Документов в составе: ",
								packageSnapshot.documents.length,
								"."
							]
						}),
						coreItems[0] && knownRequirements(profile, coreItems[0].document).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 rounded-xl border border-line px-3 py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold",
								children: "Система уже знает"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-2 grid gap-1 text-sm text-muted",
								children: [
									knownRequirements(profile, coreItems[0].document).map((requirement) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
										requirement.label,
										": ",
										requirementValue(profile, requirement)
									] }, requirement.id)),
									profile.professionIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Профессии: ", profile.professionIds.map((id) => titleOf("profession", id)).join(", ")] }),
									profile.gearIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["Оборудование и инструмент: ", profile.gearIds.map((id) => titleOf("gear", id)).join(", ")] })
								]
							})]
						}),
						missing.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MissingForm, {
							requirements: missing,
							onSave: (values) => setProfileValues(missing.map((requirement) => ({
								field: requirement.field,
								key: requirement.key,
								value: values[requirement.id] ?? ""
							})))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-3 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-50",
							disabled: readiness.ready.length === 0 || readiness.needsData.length > 0,
							onClick: () => void formPackage(),
							children: "Сформировать пакет"
						}),
						readiness.needsData.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "Сначала заполните общие реквизиты. Неготовые документы в архив не попадут."
						}),
						readiness.needsData.length === 0 && readiness.clarify.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted",
							children: "В архив войдут только готовые документы. То, что нужно уточнить, не формируется."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2",
							children: coreItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CoreCard, {
								item,
								workflow: workflowOf(item, profile, formedIds),
								formed: formedDocuments[item.document.id]?.document,
								previewOpen: previewId === item.document.id,
								reason: speak(item.reason),
								onGenerate: () => formOne(item),
								onTogglePreview: () => setPreviewId((current) => current === item.document.id ? null : item.document.id),
								onDownload: (document) => void downloadGeneratedDocx(document)
							}, item.document.code))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "order-3 mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "min-h-11 cursor-pointer py-3 text-sm font-bold",
						children: "Другие документы, пока без файла"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [CATEGORY_ORDER.map((category) => {
							const rows = pack.items.filter((item) => item.document.category === category && item.document.moduleId !== "core_osh");
							if (rows.length === 0) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-base font-extrabold",
									children: CATEGORY_LABELS[category]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 grid gap-2",
									children: rows.map((item) => {
										const made = item.document.professionId ? instructions.find((entry) => entry.professionId === item.document.professionId) : void 0;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
											className: "rounded-xl border border-line bg-surface px-4 py-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-start justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "text-sm font-bold",
														children: item.document.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `text-sm font-semibold ${item.status === "ready" ? "text-accent" : item.status === "clarify" ? "text-danger" : "text-muted"}`,
														children: STATUS_LABEL[item.status]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1 text-sm text-muted",
													children: speak(item.reason)
												}),
												item.status === "ready" && item.document.generator === "instruction" && item.document.professionId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-2",
													children: made ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
														to: "/instruction/$id",
														params: { id: made.id },
														className: "text-sm font-bold text-primary",
														children: "Открыть сформированную инструкцию"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
														to: "/wizard",
														search: {
															profession: item.document.professionId,
															scenario: void 0
														},
														className: "text-sm font-bold text-primary",
														children: "Собрать в конструкторе"
													})
												})
											]
										}, item.document.code);
									})
								})]
							}, category);
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-6 text-sm leading-relaxed text-muted",
							children: "Эти документы в файл пока не собираются. Оплата не нужна. Инструкции по охране труда по-прежнему собираются бесплатно и без ограничений."
						})]
					})] })
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 flex gap-2",
			children: [step > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "rounded-full border border-line bg-surface px-5 py-3 text-sm font-bold",
				onClick: () => setPackageStep(step - 1),
				children: "Назад"
			}), step < 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-ink",
				onClick: () => setPackageStep(step + 1),
				children: "Далее"
			})]
		})
	] });
}
function MissingForm({ requirements, onSave }) {
	const [values, setValues] = (0, import_react.useState)({});
	const complete = requirements.every((requirement) => (values[requirement.id] ?? "").trim().length > 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-3 rounded-xl bg-soft px-3 py-3",
		onSubmit: (event) => {
			event.preventDefault();
			if (complete) onSave(values);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-bold",
				children: "Общие реквизиты пакета"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Эти сведения спрашиваются один раз и подставляются во все документы. Уже известное повторять не нужно."
			}),
			requirements.map((requirement) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm font-bold",
				children: [requirement.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					required: true,
					type: requirement.field === "approval_date" ? "date" : "text",
					className: "mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium",
					value: values[requirement.id] ?? "",
					onChange: (event) => setValues((current) => ({
						...current,
						[requirement.id]: event.target.value
					}))
				})]
			}, requirement.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				disabled: !complete,
				className: "mt-3 min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-50",
				children: "Сохранить данные"
			})
		]
	});
}
function CoreCard({ item, workflow, formed, previewOpen, reason, onGenerate, onTogglePreview, onDownload }) {
	const tone = workflow === "formed" || workflow === "ready_to_generate" || workflow === "defined" ? "text-accent" : workflow === "clarify" || workflow === "needs_data" ? "text-danger" : "text-muted";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-xl border border-line px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "text-sm font-bold",
					children: item.document.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `text-sm font-semibold ${tone}`,
					children: workflow ? WORKFLOW_LABEL[workflow] : STATUS_LABEL[item.status]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 flex w-fit rounded-full bg-soft px-3 py-1 text-xs font-bold text-primary",
				children: "Полный пакет"
			}),
			reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "mt-2 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "min-h-11 cursor-pointer py-2 font-semibold text-ink",
					children: item.match === "no" ? "Документ не применяется" : item.match === "unknown" ? "Что нужно уточнить" : "Почему включён"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1",
					children: reason
				})]
			}),
			workflow === "ready_to_generate" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
				onClick: onGenerate,
				children: "Сформировать"
			}),
			workflow === "formed" && formed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 rounded-full bg-soft px-4 py-3 text-sm font-bold",
						onClick: onTogglePreview,
						children: previewOpen ? "Скрыть предпросмотр" : "Предпросмотр"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
						onClick: () => onDownload(formed),
						children: "Скачать DOCX"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 rounded-full border border-line px-4 py-3 text-sm font-bold",
						onClick: onGenerate,
						children: "Сформировать заново"
					})
				]
			}),
			previewOpen && formed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-bold",
						children: formed.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: ["Почему включён: ", formed.inclusionReason || reason]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: ["Дата формирования: ", formed.formedAt ? new Date(formed.formedAt).toLocaleString("ru-RU") : "только что"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "print-sheet mt-3 overflow-x-auto rounded-xl border border-line bg-surface px-4 py-4 text-sm leading-relaxed text-ink",
						style: { fontFamily: "var(--font-doc)" },
						children: formed.blocks.map((block, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: block.kind === "heading" ? "text-center text-base font-bold" : block.kind === "right" ? "text-right" : "mt-2 text-left",
							children: block.text
						}, `${block.kind}-${index}`))
					})
				]
			})
		]
	});
}
function TriRow({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm font-bold",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "flex gap-1",
			children: [
				[true, "Да"],
				[false, "Нет"],
				[null, "Не задано"]
			].map(([option, title]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onChange(option),
				className: `min-h-11 rounded-full px-3 py-2 text-sm font-semibold ${value === option ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`,
				children: title
			}, title))
		})]
	});
}
function Fact({ title, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-line bg-surface px-4 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-bold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm leading-relaxed text-muted",
			children: text
		})]
	});
}
function Count({ n, label }) {
	if (n === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "rounded-xl bg-accent-soft px-3 py-2 text-accent",
		children: [
			n,
			" ",
			label
		]
	});
}
//#endregion
export { PackagePage as component };
