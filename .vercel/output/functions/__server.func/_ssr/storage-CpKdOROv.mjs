//#region node_modules/.nitro/vite/services/ssr/assets/storage-CpKdOROv.js
var FLAG_KEYS = [
	"height",
	"electrical",
	"food",
	"warehouse",
	"production",
	"transport",
	"hazardousWork",
	"sout",
	"medical",
	"powerTools",
	"ppe"
];
var FLAG_LABELS = {
	height: "высотные работы",
	electrical: "электроустановки",
	food: "пищеблок",
	warehouse: "склад",
	production: "производственные помещения",
	transport: "транспорт",
	hazardousWork: "работы повышенной опасности",
	sout: "СОУТ проведена",
	medical: "обязательные медосмотры",
	powerTools: "электроинструмент",
	ppe: "выдача СИЗ"
};
var CATEGORY_LABELS = {
	organization: "Организация охраны труда",
	instructions: "Инструкции",
	training: "Обучение",
	ppe: "СИЗ",
	medical: "Медосмотры",
	risk: "Оценка рисков",
	hazardous: "Работы повышенной опасности",
	journals: "Журналы",
	lists: "Перечни",
	extra: "Дополнительные документы"
};
var CATEGORY_ORDER = [
	"organization",
	"instructions",
	"training",
	"ppe",
	"medical",
	"risk",
	"hazardous",
	"journals",
	"lists",
	"extra"
];
var MATERIAL_GEAR = /* @__PURE__ */ new Set(["cleaning_agents"]);
var FOOD_PROFESSIONS = /* @__PURE__ */ new Set([
	"cook",
	"confectioner",
	"baker",
	"food_line",
	"butcher",
	"dishwasher"
]);
var WAREHOUSE_PROFESSIONS = /* @__PURE__ */ new Set([
	"loader",
	"storekeeper",
	"picker",
	"receiver",
	"packer",
	"stacker_driver",
	"rigger",
	"marker"
]);
var TRANSPORT_GEAR = /* @__PURE__ */ new Set([
	"car",
	"forklift",
	"self_propelled"
]);
var ELECTRICAL_WORKS = /* @__PURE__ */ new Set(["work_electrical_install", "work_electrical_maint"]);
var clock = () => (/* @__PURE__ */ new Date()).toISOString();
function factId(field, key) {
	return `${field}:${key}`;
}
function emptyFlags() {
	return {
		height: null,
		electrical: null,
		food: null,
		warehouse: null,
		production: null,
		transport: null,
		hazardousWork: null,
		sout: null,
		medical: null,
		powerTools: null,
		ppe: null
	};
}
function emptyProfile() {
	return {
		schemaVersion: 1,
		name: "",
		inn: "",
		activity: "",
		industry: "",
		headcount: null,
		departments: [],
		professionIds: [],
		customProfessions: [],
		positions: [],
		workIds: [],
		gearIds: [],
		conditionIds: [],
		hazardIds: [],
		materialIds: [],
		ppeIds: [],
		flags: emptyFlags(),
		instructionIds: [],
		presetId: null,
		facts: []
	};
}
/**
* 1 — явное решение пользователя;
* 2 — подтверждённый профиль (confirmed/rejected не от пресета);
* 3 — инструкция, импорт и системный вывод из них;
* 4 — отраслевой пресет.
* Пресет никогда не побеждает более высокий источник.
* При равном ранге побеждает более позднее наблюдение: последнее явное решение пользователя.
*/
function sourceRank(source) {
	if (source.source === "user" && (source.status === "confirmed" || source.status === "rejected")) return 400;
	if (source.status === "confirmed" || source.status === "rejected") return 300;
	if (source.source === "instruction" || source.source === "import" || source.source === "system") return 200;
	if (source.source === "preset") return 100;
	return 0;
}
function winningSource(fact) {
	if (!fact || fact.sources.length === 0) return null;
	return fact.sources.reduce((best, source) => {
		if (!best) return source;
		const rank = sourceRank(source) - sourceRank(best);
		if (rank !== 0) return rank > 0 ? source : best;
		return source.updatedAt >= best.updatedAt ? source : best;
	}, null);
}
/** Для применимости пресет-only не доказательство: это UNKNOWN, а не YES. */
function verdictOf(fact) {
	const winner = winningSource(fact);
	if (!winner) return "unknown";
	if (winner.status === "rejected" || winner.value === false) return "no";
	if (winner.source === "preset" && winner.status !== "confirmed") return "unknown";
	if (winner.value === true) return "yes";
	if (typeof winner.value === "string") return winner.value.trim() ? "yes" : "unknown";
	if (typeof winner.value === "number") return Number.isFinite(winner.value) ? "yes" : "unknown";
	return "unknown";
}
/** Что показать в мастере: предложение пресета видно и снимается, отказ пользователя скрывает пункт. */
function displayed(fact) {
	const winner = winningSource(fact);
	if (!winner || winner.status === "rejected" || winner.value === false) return false;
	return winner.value === true;
}
function findFact(profile, field, key) {
	const id = factId(field, key);
	return profile.facts.find((fact) => fact.id === id);
}
function cloneFact(fact) {
	return {
		...fact,
		sources: fact.sources.map((source) => ({ ...source }))
	};
}
function sameDecision(source, input) {
	return source.source === input.source && source.sourceId === input.sourceId && source.status === input.status && source.value === input.value;
}
function mergeFactList(profile, inputs, now = clock()) {
	const facts = profile.facts.map(cloneFact);
	for (const input of inputs) {
		const id = factId(input.field, input.key);
		let fact = facts.find((item) => item.id === id);
		if (!fact) {
			fact = {
				id,
				field: input.field,
				key: input.key,
				sources: []
			};
			facts.push(fact);
		}
		const existing = fact.sources.find((source) => sameDecision(source, input));
		if (existing) {
			existing.updatedAt = now;
			const index = fact.sources.indexOf(existing);
			if (index >= 0 && index < fact.sources.length - 1) {
				fact.sources.splice(index, 1);
				fact.sources.push(existing);
			}
		} else fact.sources.push({
			source: input.source,
			sourceId: input.sourceId,
			status: input.status,
			value: input.value,
			createdAt: now,
			updatedAt: now
		});
	}
	return {
		...profile,
		facts
	};
}
function removeFactList(profile, id, source) {
	const facts = profile.facts.flatMap((fact) => {
		if (fact.id !== id) return [cloneFact(fact)];
		if (!source) return [];
		const sources = fact.sources.filter((item) => !(item.source === source.source && item.sourceId === source.sourceId));
		if (sources.length === 0) return [];
		return [{
			...fact,
			sources
		}];
	});
	return {
		...profile,
		facts
	};
}
function confirmingKeys(profile, field) {
	const keys = /* @__PURE__ */ new Set();
	for (const fact of profile.facts) if (fact.field === field) {
		if (verdictOf(fact) === "yes") keys.add(fact.key);
	}
	return keys;
}
function deriveInputs(profile) {
	const equipment = confirmingKeys(profile, "equipment");
	const works = confirmingKeys(profile, "work");
	const conditions = confirmingKeys(profile, "condition");
	const hazards = confirmingKeys(profile, "hazard");
	const professions = confirmingKeys(profile, "profession");
	const ppe = confirmingKeys(profile, "ppe");
	const custom = confirmingKeys(profile, "custom_profession");
	const inputs = [];
	const flag = (key, on) => {
		if (!on) return;
		inputs.push({
			field: "flag",
			key,
			value: true,
			source: "system",
			sourceId: `derive:${key}`,
			status: "inferred"
		});
	};
	flag("height", conditions.has("cond_height") || equipment.has("ladder") || hazards.has("fall_height"));
	flag("electrical", conditions.has("cond_live") || [...works].some((id) => ELECTRICAL_WORKS.has(id)) || equipment.has("voltage_indicator") || equipment.has("insulated_tools"));
	flag("food", conditions.has("cond_hot_kitchen") || works.has("work_kitchen") || [...professions].some((id) => FOOD_PROFESSIONS.has(id)));
	flag("warehouse", works.has("work_stacking") || [...professions].some((id) => WAREHOUSE_PROFESSIONS.has(id)));
	flag("production", conditions.has("cond_hot_zone") || conditions.has("cond_hot_metal") || works.has("work_manual_arc") || works.has("work_locksmith"));
	flag("transport", works.has("work_driving") || conditions.has("cond_traffic") || [...equipment].some((id) => TRANSPORT_GEAR.has(id)));
	flag("hazardousWork", [
		"cond_height",
		"cond_confined",
		"cond_hot_zone",
		"cond_explosive"
	].some((id) => conditions.has(id)) || equipment.has("ladder") || equipment.has("gas_cylinder") || works.has("work_gas_cutting") || works.has("work_slinging"));
	flag("powerTools", equipment.has("angle_grinder") || equipment.has("drill"));
	flag("ppe", ppe.size > 0 || professions.size > 0 || custom.size > 0);
	return inputs;
}
function stripSystem(profile) {
	const facts = profile.facts.flatMap((fact) => {
		const sources = fact.sources.filter((source) => source.source !== "system");
		if (sources.length === 0) return [];
		return [{
			...fact,
			sources: sources.map((source) => ({ ...source }))
		}];
	});
	return {
		...profile,
		facts
	};
}
function previousSystem(profile, id, sourceId) {
	return profile.facts.find((fact) => fact.id === id)?.sources.find((source) => source.source === "system" && source.sourceId === sourceId);
}
function readIds(profile, field) {
	return profile.facts.filter((fact) => fact.field === field && displayed(fact)).map((fact) => fact.key);
}
function readString(profile, field) {
	const winner = winningSource(findFact(profile, field, "value"));
	if (!winner || winner.status === "rejected" || typeof winner.value !== "string") return "";
	return winner.value;
}
function readNumber(profile, field) {
	const winner = winningSource(findFact(profile, field, "value"));
	if (!winner || winner.status === "rejected" || typeof winner.value !== "number" || !Number.isFinite(winner.value)) return null;
	return winner.value;
}
function readFlags(profile) {
	const flags = emptyFlags();
	for (const key of FLAG_KEYS) {
		const winner = winningSource(findFact(profile, "flag", key));
		if (!winner) continue;
		if (winner.status === "rejected" || winner.value === false) flags[key] = false;
		else if (winner.source === "preset") flags[key] = null;
		else if (winner.value === true) flags[key] = true;
	}
	return flags;
}
/** Собирает списки мастера из фактов и заново выводит системные признаки только из подтверждённых источников. */
function projectProfile(profile) {
	const stripped = stripSystem(profile);
	const merged = mergeFactList(stripped, deriveInputs(stripped));
	const facts = merged.facts.map((fact) => ({
		...fact,
		sources: fact.sources.map((source) => {
			if (source.source !== "system") return source;
			const previous = previousSystem(profile, fact.id, source.sourceId);
			if (previous && previous.value === source.value && previous.status === source.status) return { ...previous };
			return source;
		})
	}));
	const next = {
		...merged,
		facts,
		schemaVersion: profile.schemaVersion || 1
	};
	const gearIds = readIds(next, "equipment");
	return {
		...next,
		schemaVersion: next.schemaVersion || 1,
		name: readString(next, "name"),
		inn: readString(next, "inn"),
		activity: readString(next, "activity"),
		industry: readString(next, "industry"),
		headcount: readNumber(next, "headcount"),
		departments: readIds(next, "department"),
		professionIds: readIds(next, "profession"),
		customProfessions: readIds(next, "custom_profession"),
		positions: readIds(next, "position"),
		workIds: readIds(next, "work"),
		gearIds,
		conditionIds: readIds(next, "condition"),
		hazardIds: readIds(next, "hazard"),
		materialIds: [.../* @__PURE__ */ new Set([...readIds(next, "material"), ...gearIds.filter((id) => MATERIAL_GEAR.has(id))])],
		ppeIds: readIds(next, "ppe"),
		flags: readFlags(next),
		instructionIds: profile.instructionIds,
		presetId: profile.presetId
	};
}
function mergeFacts(profile, inputs) {
	return projectProfile(mergeFactList(profile, inputs));
}
function removeFact(profile, id, source) {
	return projectProfile(removeFactList(profile, id, source));
}
function resolvedValue(profile, field, key) {
	const winner = winningSource(findFact(profile, field, key));
	if (!winner || winner.status === "rejected") return winner?.value === false ? false : null;
	return winner.value;
}
var USER = "user-profile";
function asStrings(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((item) => typeof item === "string");
}
function readSchemaVersion(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : 1;
}
function legacyInputs(field, keys, value, status) {
	return keys.map((key) => ({
		field,
		key,
		value,
		source: "user",
		sourceId: "legacy-profile",
		status
	}));
}
function isFact(value) {
	if (!value || typeof value !== "object") return false;
	const fact = value;
	return typeof fact.id === "string" && typeof fact.field === "string" && typeof fact.key === "string" && Array.isArray(fact.sources);
}
/** Старый профиль без фактов превращается в подтверждённые пользовательские факты и не теряет ответы «нет». */
function normalizeProfile(raw) {
	const source = raw && typeof raw === "object" ? raw : {};
	const instructionIds = asStrings(source.instructionIds);
	const presetId = typeof source.presetId === "string" ? source.presetId : null;
	const schemaVersion = readSchemaVersion(source.schemaVersion);
	if (Array.isArray(source.facts) && source.facts.some(isFact)) return projectProfile({
		...emptyProfile(),
		schemaVersion,
		instructionIds,
		presetId,
		facts: source.facts.filter(isFact)
	});
	const flags = emptyFlags();
	const savedFlags = source.flags ?? {};
	for (const key of FLAG_KEYS) {
		const value = savedFlags[key];
		flags[key] = value === true || value === false ? value : null;
	}
	const inputs = [
		...legacyInputs("profession", asStrings(source.professionIds), true, "confirmed"),
		...legacyInputs("custom_profession", asStrings(source.customProfessions), true, "confirmed"),
		...legacyInputs("position", asStrings(source.positions), true, "confirmed"),
		...legacyInputs("work", asStrings(source.workIds), true, "confirmed"),
		...legacyInputs("equipment", asStrings(source.gearIds), true, "confirmed"),
		...legacyInputs("condition", asStrings(source.conditionIds), true, "confirmed"),
		...legacyInputs("hazard", asStrings(source.hazardIds), true, "confirmed"),
		...legacyInputs("material", asStrings(source.materialIds), true, "confirmed"),
		...legacyInputs("ppe", asStrings(source.ppeIds), true, "confirmed"),
		...legacyInputs("department", asStrings(source.departments), true, "confirmed")
	];
	for (const key of FLAG_KEYS) {
		if (flags[key] === true) inputs.push({
			field: "flag",
			key,
			value: true,
			source: "user",
			sourceId: "legacy-profile",
			status: "confirmed"
		});
		if (flags[key] === false) inputs.push({
			field: "flag",
			key,
			value: false,
			source: "user",
			sourceId: "legacy-profile",
			status: "rejected"
		});
	}
	const text = [
		["name", typeof source.name === "string" ? source.name : ""],
		["inn", typeof source.inn === "string" ? source.inn : ""],
		["activity", typeof source.activity === "string" ? source.activity : ""],
		["industry", typeof source.industry === "string" ? source.industry : ""]
	];
	for (const [field, value] of text) if (value.trim()) inputs.push({
		field,
		key: "value",
		value,
		source: "user",
		sourceId: "legacy-profile",
		status: "confirmed"
	});
	if (typeof source.headcount === "number" && Number.isFinite(source.headcount)) inputs.push({
		field: "headcount",
		key: "value",
		value: source.headcount,
		source: "user",
		sourceId: "legacy-profile",
		status: "confirmed"
	});
	return projectProfile({
		...mergeFactList(emptyProfile(), inputs),
		schemaVersion,
		instructionIds,
		presetId
	});
}
function suggest(field, keys, presetId, value = true) {
	return keys.map((key) => ({
		field,
		key,
		value,
		source: "preset",
		sourceId: presetId,
		status: "inferred"
	}));
}
/** Пресет добавляет источники inferred и не затирает уже принятое пользователем решение. */
function applyPreset(profile, preset) {
	const inputs = [
		...suggest("profession", preset.professionIds, preset.id),
		...suggest("work", preset.workIds, preset.id),
		...suggest("equipment", preset.gearIds, preset.id),
		...suggest("condition", preset.conditionIds, preset.id)
	];
	for (const key of FLAG_KEYS) if (preset.flags[key] === true) inputs.push({
		field: "flag",
		key,
		value: true,
		source: "preset",
		sourceId: preset.id,
		status: "inferred"
	});
	if (!profile.industry.trim()) inputs.push({
		field: "industry",
		key: "value",
		value: preset.industry,
		source: "preset",
		sourceId: preset.id,
		status: "inferred"
	});
	if (!profile.activity.trim()) inputs.push({
		field: "activity",
		key: "value",
		value: preset.activity,
		source: "preset",
		sourceId: preset.id,
		status: "inferred"
	});
	return projectProfile({
		...mergeFactList(profile, inputs),
		presetId: preset.id
	});
}
function snapshotInputs(record) {
	const snap = record.snapshot;
	const inputs = [];
	const add = (field, key) => {
		if (!key) return;
		inputs.push({
			field,
			key,
			value: true,
			source: "instruction",
			sourceId: record.id,
			status: "inferred"
		});
	};
	if (record.professionId) add("profession", record.professionId);
	else if (record.professionTitle) add("custom_profession", record.professionTitle);
	if (record.professionTitle) add("position", record.professionTitle);
	for (const item of snap.works) add("work", item.id);
	for (const item of snap.gears) add("equipment", item.id);
	for (const item of snap.conditions) add("condition", item.id);
	for (const item of snap.hazards) add("hazard", item.id);
	for (const item of snap.ppe) add("ppe", item.id);
	for (const item of snap.gears) if (item.kind === "material") add("material", item.id);
	if (snap.sout.length > 0) add("flag", "sout");
	return inputs;
}
/** Повтор той же инструкции не плодит факты: источник с тем же id обновляется на месте. */
function absorbInstruction(profile, record) {
	if (profile.instructionIds.includes(record.id)) return profile;
	const inputs = snapshotInputs(record);
	const name = profile.name.trim() || (record.orgName && record.orgName !== "Организация не указана" ? record.orgName : "");
	if (name && !profile.name.trim()) inputs.push({
		field: "name",
		key: "value",
		value: name,
		source: "instruction",
		sourceId: record.id,
		status: "inferred"
	});
	return projectProfile({
		...mergeFactList(profile, inputs),
		instructionIds: [...profile.instructionIds, record.id]
	});
}
function absorbAll(profile, records) {
	return records.reduce((next, record) => absorbInstruction(next, record), profile);
}
/** Записывает текстовый факт пользователя. Пустая строка снимает только пользовательский источник. */
function setTextFact(profile, field, key, value) {
	if (!value.trim()) return removeFact(profile, factId(field, key), {
		source: "user",
		sourceId: USER
	});
	return mergeFacts(profile, [{
		field,
		key,
		value: value.trim(),
		source: "user",
		sourceId: USER,
		status: "confirmed"
	}]);
}
function setText(profile, field, value) {
	return setTextFact(profile, field, "value", value);
}
function patchOrganization(profile, patch) {
	let next = profile;
	if (typeof patch.name === "string") next = setText(next, "name", patch.name);
	if (typeof patch.inn === "string") next = setText(next, "inn", patch.inn);
	if (typeof patch.activity === "string") next = setText(next, "activity", patch.activity);
	if (typeof patch.industry === "string") next = setText(next, "industry", patch.industry);
	if (patch.headcount === null) next = removeFact(next, factId("headcount", "value"), {
		source: "user",
		sourceId: USER
	});
	else if (typeof patch.headcount === "number" && Number.isFinite(patch.headcount)) next = mergeFacts(next, [{
		field: "headcount",
		key: "value",
		value: patch.headcount,
		source: "user",
		sourceId: USER,
		status: "confirmed"
	}]);
	if (patch.departments) {
		for (const name of next.departments) if (!patch.departments.includes(name)) next = removeFact(next, factId("department", name));
		next = mergeFacts(next, patch.departments.map((key) => ({
			field: "department",
			key,
			value: true,
			source: "user",
			sourceId: USER,
			status: "confirmed"
		})));
	}
	return next;
}
var LIST_FIELD = {
	professionIds: "profession",
	workIds: "work",
	gearIds: "equipment",
	conditionIds: "condition",
	hazardIds: "hazard",
	ppeIds: "ppe"
};
function toggleListedFact(profile, field, id) {
	const selected = profile[field].includes(id);
	return mergeFacts(profile, [{
		field: LIST_FIELD[field],
		key: id,
		value: !selected,
		source: "user",
		sourceId: USER,
		status: selected ? "rejected" : "confirmed"
	}]);
}
function setFlagFact(profile, key, value) {
	if (value === null) return removeFact(profile, factId("flag", key), {
		source: "user",
		sourceId: USER
	});
	return mergeFacts(profile, [{
		field: "flag",
		key,
		value,
		source: "user",
		sourceId: USER,
		status: value ? "confirmed" : "rejected"
	}]);
}
function addCustomProfession(profile, title) {
	const name = title.trim();
	if (name.length < 2 || profile.customProfessions.includes(name)) return profile;
	return mergeFacts(profile, [{
		field: "custom_profession",
		key: name,
		value: true,
		source: "user",
		sourceId: USER,
		status: "confirmed"
	}, {
		field: "position",
		key: name,
		value: true,
		source: "user",
		sourceId: USER,
		status: "confirmed"
	}]);
}
function removeCustomProfession(profile, title) {
	return removeFact(profile, factId("custom_profession", title));
}
var BrowserProfileStorage = class {
	bucket;
	storageKey;
	constructor(bucket, storageKey = "ychy-iot-profile-v1") {
		this.bucket = bucket ?? browserStorage();
		this.storageKey = storageKey;
	}
	loadProfile() {
		try {
			const raw = this.bucket.getItem(this.storageKey);
			if (!raw) return emptyProfile();
			return normalizeProfile(JSON.parse(raw));
		} catch {
			return emptyProfile();
		}
	}
	saveProfile(profile) {
		this.bucket.setItem(this.storageKey, JSON.stringify(profile));
	}
	mergeFacts(profile, facts) {
		const next = mergeFacts(profile, facts);
		this.saveProfile(next);
		return next;
	}
	setFact(profile, fact) {
		return this.mergeFacts(profile, [fact]);
	}
	getFact(factId, profile) {
		return (profile ?? this.loadProfile()).facts.find((fact) => fact.id === factId);
	}
	removeFact(profile, factId, source) {
		const next = removeFact(profile, factId, source);
		this.saveProfile(next);
		return next;
	}
};
function memoryStorage() {
	const data = /* @__PURE__ */ new Map();
	return {
		getItem: (key) => data.get(key) ?? null,
		setItem: (key, value) => {
			data.set(key, value);
		},
		removeItem: (key) => {
			data.delete(key);
		}
	};
}
function browserStorage() {
	if (typeof localStorage !== "undefined") return localStorage;
	return memoryStorage();
}
/** Текущая реализация. Мастер и applicability к localStorage не обращаются. */
var profileRepository = new BrowserProfileStorage();
//#endregion
export { setFlagFact as _, FLAG_LABELS as a, verdictOf as b, addCustomProfession as c, findFact as d, normalizeProfile as f, resolvedValue as g, removeCustomProfession as h, FLAG_KEYS as i, applyPreset as l, profileRepository as m, CATEGORY_LABELS as n, absorbAll as o, patchOrganization as p, CATEGORY_ORDER as r, absorbInstruction as s, BrowserProfileStorage as t, emptyProfile as u, setTextFact as v, winningSource as x, toggleListedFact as y };
