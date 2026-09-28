import { i as __toESM } from "../_runtime.mjs";
import { X as require_react, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Choice, c as PRESETS, f as professions, i as CATEGORY_ORDER, m as useApp, n as AppShell, o as FLAG_KEYS, r as CATEGORY_LABELS, s as FLAG_LABELS, u as buildCatalog } from "./shell-D6xK9ynY.mjs";
import { n as GEAR_KIND } from "./types--OpmHAgC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/package-Dl7VBGmk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function listMatch(have, need) {
	if (!need || need.length === 0) return "skip";
	return need.some((id) => have.includes(id)) ? "yes" : "no";
}
function requiredList(profile, key) {
	if (key === "professions") return [...profile.professionIds, ...profile.customProfessions];
	if (key === "works") return profile.workIds;
	if (key === "gears") return profile.gearIds;
	if (key === "ppe") return profile.ppeIds;
	if (key === "hazards") return profile.hazardIds;
	return profile.positions;
}
/** Поля условия складываются через И. Пустое правило не считается совпадением. */
function matchClause(profile, clause) {
	const parts = [];
	const pairs = [
		[profile.professionIds, clause.professionIds],
		[profile.workIds, clause.workIds],
		[profile.gearIds, clause.gearIds],
		[profile.conditionIds, clause.conditionIds],
		[profile.hazardIds, clause.hazardIds],
		[profile.materialIds, clause.materialIds]
	];
	for (const [have, need] of pairs) {
		const hit = listMatch(have, need);
		if (hit !== "skip") parts.push(hit);
	}
	if (clause.industries && clause.industries.length > 0) parts.push(profile.industry && clause.industries.includes(profile.industry) ? "yes" : "no");
	if (clause.minHeadcount != null) parts.push(profile.headcount == null ? "unknown" : profile.headcount >= clause.minHeadcount ? "yes" : "no");
	for (const key of clause.requires ?? []) parts.push(requiredList(profile, key).length > 0 ? "yes" : "unknown");
	for (const [key, expected] of Object.entries(clause.flags ?? {})) {
		const actual = profile.flags[key];
		if (actual == null) parts.push("unknown");
		else parts.push(actual === expected ? "yes" : "no");
	}
	if (parts.length === 0) return "no";
	if (parts.some((item) => item === "no")) return "no";
	if (parts.some((item) => item === "unknown")) return "unknown";
	return "yes";
}
/** anyOf — ИЛИ. Хотя бы одно «да» включает документ. «Не знаю» не равно отказу. */
function matchApplicability(profile, applicability) {
	if (applicability.always) return "yes";
	const clauses = applicability.anyOf ?? [];
	if (clauses.length === 0) return "no";
	const results = clauses.map((clause) => matchClause(profile, clause));
	if (results.some((item) => item === "yes")) return "yes";
	if (results.some((item) => item === "unknown")) return "unknown";
	return "no";
}
function reason(profile, document, match) {
	if (document.applicability.always && match === "yes") return "Требуется для организации в целом";
	if (match === "unknown") {
		for (const clause of document.applicability.anyOf ?? []) {
			for (const key of Object.keys(clause.flags ?? {})) if (profile.flags[key] == null) return `Не задан признак: ${FLAG_LABELS[key]}`;
			if (clause.minHeadcount != null && profile.headcount == null) return "Не указана численность";
			if ((clause.requires ?? []).includes("professions") && profile.professionIds.length === 0 && profile.customProfessions.length === 0) return "Не указаны профессии";
		}
		return "Не хватает данных профиля";
	}
	if (match === "no") return "Условия организации не подходят";
	for (const clause of document.applicability.anyOf ?? []) {
		if (matchClause(profile, clause) !== "yes") continue;
		if (clause.professionIds?.some((id) => profile.professionIds.includes(id))) return "В профиле есть соответствующая профессия";
		if (clause.workIds?.some((id) => profile.workIds.includes(id))) return "В профиле есть соответствующий вид работ";
		if (clause.gearIds?.some((id) => profile.gearIds.includes(id))) return "В профиле есть соответствующее оборудование или инструмент";
		if (clause.conditionIds?.some((id) => profile.conditionIds.includes(id))) return "В профиле есть соответствующее условие";
		const flag = Object.keys(clause.flags ?? {})[0];
		if (flag) return `Признак профиля: ${FLAG_LABELS[flag]}`;
		if (clause.requires?.length) return "Нужные сведения в профиле уже есть";
	}
	return "Условия профиля совпали";
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
		const match = matchApplicability(profile, document.applicability);
		const status = resolveStatus(document, match);
		if (status === "exclude") continue;
		items.push({
			document,
			match,
			status,
			reason: reason(profile, document, match)
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
var HEIGHT = { anyOf: [
	{ conditionIds: ["cond_height"] },
	{ gearIds: ["ladder"] },
	{ hazardIds: ["fall_height"] },
	{ flags: { height: true } }
] };
var ELECTRICAL = { anyOf: [
	{ workIds: ["work_electrical_install", "work_electrical_maint"] },
	{ conditionIds: ["cond_live"] },
	{ gearIds: ["voltage_indicator", "insulated_tools"] },
	{ flags: { electrical: true } }
] };
var FOOD_RULE = { anyOf: [
	{ professionIds: FOOD },
	{ workIds: ["work_kitchen"] },
	{ conditionIds: ["cond_hot_kitchen"] },
	{ flags: { food: true } }
] };
var TRANSPORT = { anyOf: [
	{ gearIds: [
		"car",
		"forklift",
		"self_propelled"
	] },
	{ workIds: ["work_driving"] },
	{ flags: { transport: true } }
] };
var WAREHOUSE = { anyOf: [
	{ professionIds: [
		"loader",
		"storekeeper",
		"picker",
		"receiver",
		"packer",
		"stacker_driver",
		"forklift_driver"
	] },
	{ workIds: ["work_stacking"] },
	{ flags: { warehouse: true } }
] };
var TOOLS = { anyOf: [{ gearIds: ["angle_grinder", "drill"] }, { flags: { powerTools: true } }] };
var HAZARDOUS = { anyOf: [
	{ conditionIds: [
		"cond_height",
		"cond_confined",
		"cond_hot_zone",
		"cond_explosive"
	] },
	{ gearIds: ["gas_cylinder", "ladder"] },
	{ workIds: ["work_gas_cutting", "work_slinging"] },
	{ flags: { hazardousWork: true } }
] };
var PPE = { anyOf: [{ requires: ["ppe"] }, { flags: { ppe: true } }] };
var MEDICAL = { anyOf: [{ flags: { medical: true } }] };
var SOUT_DONE = { anyOf: [{ flags: { sout: true } }] };
var HAS_PROFESSIONS = { anyOf: [{ requires: ["professions"] }] };
function doc(init) {
	return {
		version: "1.0.0",
		status: "active",
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
			applicability: { always: true }
		}),
		doc({
			code: "policy_instructions",
			name: "Положение о порядке разработки и учёта инструкций по охране труда",
			category: "organization",
			shape: "policy",
			applicability: { always: true }
		}),
		doc({
			code: "order_responsible",
			name: "Приказ о возложении обязанностей по охране труда",
			category: "organization",
			shape: "order",
			applicability: { always: true }
		}),
		doc({
			code: "order_training",
			name: "Приказ об организации обучения по охране труда",
			category: "training",
			shape: "order",
			applicability: { always: true }
		}),
		doc({
			code: "order_sout",
			name: "Приказ об организации специальной оценки условий труда",
			category: "organization",
			shape: "order",
			applicability: { always: true }
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
			applicability: { always: true }
		}),
		doc({
			code: "program_first_aid",
			name: "Программа обучения оказанию первой помощи",
			category: "training",
			shape: "program",
			applicability: { always: true }
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
			applicability: { always: true }
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
			applicability: { always: true },
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
			applicability: { always: true },
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
		applicability: { anyOf: [{ professionIds: [profession.meta.id] }] },
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
		applicability: { always: true },
		commercialLevel: "FREE",
		generator: "instruction",
		normativeBasis: BASIS_IOT
	});
}
/**
* Реестр документов. Новый отраслевой модуль вызывает registerPackageModule
* и не меняет ни применимость, ни мастер. Профессии и оборудование по-прежнему
* живут в каталоге конструктора: документ только ссылается на их id.
*/
var extensions = /* @__PURE__ */ new Map();
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
	return [...base, ...custom];
}
function buildPackage(profile) {
	return composePackage(profile, documentsFor(profile));
}
var STEPS = [
	"Организация",
	"Сотрудники и профессии",
	"Работы и оборудование",
	"Опасности и условия",
	"Проверка данных",
	"Состав пакета"
];
var STATUS_LABEL = {
	ready: "данные определены",
	clarify: "необходимо уточнить",
	optional: "дополнительный модуль",
	locked: "генерация будет доступна в полном пакете"
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
	const catalog = (0, import_react.useMemo)(() => buildCatalog(overrides), [overrides]);
	const pack = (0, import_react.useMemo)(() => buildPackage(profile), [profile]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [customName, setCustomName] = (0, import_react.useState)("");
	const [department, setDepartment] = (0, import_react.useState)("");
	const titleOf = (kind, id) => {
		if (kind === "profession") return catalog.professions.find((item) => item.meta.id === id)?.meta.title ?? id;
		if (kind === "work") return catalog.works.find((item) => item.meta.id === id)?.meta.title ?? id;
		if (kind === "gear") return catalog.gears.find((item) => item.meta.id === id)?.meta.title ?? id;
		return catalog.conditions.find((item) => item.meta.id === id)?.meta.title ?? id;
	};
	const filtered = catalog.professions.filter((item) => `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
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
			children: "Пакет документов вашей организации"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-3xl text-sm leading-relaxed text-muted",
			children: "Система определит необходимые документы на основании деятельности, профессий, оборудования и условий работы. Бесплатный конструктор инструкций остаётся доступен без ограничений."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 flex flex-wrap gap-2",
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
				profile.instructionIds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent",
					children: [
						"Из уже сформированных инструкций взяты факты: ",
						profile.instructionIds.length,
						". Повторно их вводить не нужно."
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
						children: "Пресет только предлагает профессии и условия. Лишнее можно снять. Состав пакета он не назначает."
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
						text: item.depth === "full" ? "Полная модель конструктора" : "Профессия каталога",
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
					children: "«Не задано» оставляет документ в списке на уточнение. «Нет» исключает его, если нет другого подтверждённого факта."
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
						"Инструкций, из которых собран профиль: ",
						instructions.length,
						". Если факт лишний, вернитесь на предыдущий шаг и снимите отметку."
					]
				})
			]
		}),
		step === 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6",
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
						". Пока признак не задан, документ не входит в подтверждённый состав и не отбрасывается.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ml-2 font-bold text-primary",
							onClick: () => setPackageStep(3),
							children: "Уточнить признаки"
						})
					]
				}),
				CATEGORY_ORDER.map((category) => {
					const rows = pack.items.filter((item) => item.document.category === category);
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
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `text-sm font-semibold ${item.status === "ready" ? "text-accent" : item.status === "clarify" ? "text-danger" : "text-muted"}`,
												children: [
													item.status === "ready" ? "✓" : item.status === "clarify" ? "!" : item.status === "optional" ? "○" : "🔒",
													" ",
													STATUS_LABEL[item.status]
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-sm text-muted",
											children: item.reason
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
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-sm leading-relaxed text-muted",
					children: "Документы полного пакета, рисков, СИЗ, обучения и медосмотров сейчас не генерируются. Оплата не требуется. Инструкции по охране труда по-прежнему собираются бесплатно."
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
				className: `rounded-full px-3 py-2 text-sm font-semibold ${value === option ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`,
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
			"✓ ",
			n,
			" ",
			label
		]
	});
}
//#endregion
export { PackagePage as component };
