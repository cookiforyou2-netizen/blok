import { i as __toESM } from "../_runtime.mjs";
import { S as useNavigate, X as require_react, w as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Choice, d as professionTitle, m as useApp, n as AppShell, u as buildCatalog } from "./shell-D6xK9ynY.mjs";
import { n as GEAR_KIND, t as CATEGORIES } from "./types--OpmHAgC.mjs";
import { r as Route$1 } from "./router-CK9Oav6R.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wizard-B9nIeQdu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STEPS = [
	"Профессия",
	"Работы",
	"Оборудование",
	"Условия",
	"Опасности",
	"СОУТ",
	"СИЗ",
	"Предпросмотр",
	"Формирование"
];
function WizardPage() {
	const search = Route$1.useSearch();
	const navigate = useNavigate();
	const draft = useApp((state) => state.draft);
	const step = useApp((state) => state.step);
	const overrides = useApp((state) => state.overrides);
	const setStep = useApp((state) => state.setStep);
	const patchDraft = useApp((state) => state.patchDraft);
	const selectProfession = useApp((state) => state.selectProfession);
	const toggle = useApp((state) => state.toggle);
	const refreshHazards = useApp((state) => state.refreshHazards);
	const refreshPpe = useApp((state) => state.refreshPpe);
	const addSout = useApp((state) => state.addSout);
	const patchSout = useApp((state) => state.patchSout);
	const removeSout = useApp((state) => state.removeSout);
	const addCustom = useApp((state) => state.addCustom);
	const patchCustom = useApp((state) => state.patchCustom);
	const addCustomHazard = useApp((state) => state.addCustomHazard);
	const patchCustomHazard = useApp((state) => state.patchCustomHazard);
	const addCustomPpe = useApp((state) => state.addCustomPpe);
	const formInstruction = useApp((state) => state.formInstruction);
	const [query, setQuery] = (0, import_react.useState)("");
	const [ppeDraft, setPpeDraft] = (0, import_react.useState)("");
	const [showAll, setShowAll] = (0, import_react.useState)(false);
	const catalog = (0, import_react.useMemo)(() => buildCatalog(overrides), [overrides]);
	(0, import_react.useEffect)(() => {
		let live = true;
		Promise.resolve(useApp.persist.rehydrate()).then(() => {
			if (!live) return;
			if (search.scenario === "shop" || search.scenario === "site") useApp.getState().applyScenario(search.scenario);
			else if (search.profession) useApp.getState().selectProfession(search.profession);
		});
		return () => {
			live = false;
		};
	}, [search.scenario, search.profession]);
	(0, import_react.useEffect)(() => {
		if (step === 4) refreshHazards();
		if (step === 6) refreshPpe();
	}, [
		step,
		refreshHazards,
		refreshPpe
	]);
	const title = professionTitle(catalog, draft);
	const canLeaveProfession = Boolean(draft.professionId || draft.customProfession.trim().length > 2);
	const canLeaveWorks = draft.workIds.length > 0 || draft.customWorks.some((item) => item.title.trim() && item.measure.trim().length >= 20);
	const canLeaveGear = draft.gearIds.length > 0 || draft.customGear.some((item) => item.title.trim() && item.measure.trim().length >= 20);
	const blocked = step === 0 && !canLeaveProfession || step === 1 && !canLeaveWorks || step === 2 && !canLeaveGear;
	const filteredProfessions = catalog.professions.filter((item) => {
		return `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
	});
	const goNext = () => {
		if (step < 8) setStep(step + 1);
		else {
			const record = formInstruction();
			navigate({
				to: "/instruction/$id",
				params: { id: record.id }
			});
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm font-bold text-primary",
			children: [
				"Шаг ",
				step + 1,
				" из 9 · ",
				STEPS[step]
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 text-2xl font-extrabold",
			children: title
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 h-2 overflow-hidden rounded-full bg-soft",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full bg-primary",
				style: { width: `${(step + 1) / 9 * 100}%` }
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid gap-3",
			children: [
				step === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1 text-sm font-semibold",
						children: ["Организация", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "rounded-xl border border-line bg-surface px-3 py-3",
							value: draft.orgName,
							onChange: (event) => patchDraft({ orgName: event.target.value }),
							placeholder: "Наименование работодателя"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1 text-sm font-semibold",
						children: ["Номер инструкции", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "rounded-xl border border-line bg-surface px-3 py-3",
							value: draft.docNumber,
							onChange: (event) => patchDraft({ docNumber: event.target.value }),
							placeholder: "ИОТ-01"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "rounded-xl border border-line bg-surface px-3 py-3",
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: "Поиск профессии"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid max-h-96 gap-2 overflow-auto",
						children: filteredProfessions.slice(0, 30).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							checked: draft.professionId === item.meta.id,
							title: item.meta.title,
							text: `${CATEGORIES.find((category) => category.id === item.category)?.title} · ${item.depth === "full" ? "полная модель" : "каталог"} · ${item.summary}`,
							onToggle: () => selectProfession(item.meta.id)
						}, item.meta.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "grid gap-1 text-sm font-semibold",
						children: ["Или новая профессия", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "rounded-xl border border-line bg-surface px-3 py-3",
							value: draft.customProfession,
							onChange: (event) => patchDraft({
								customProfession: event.target.value,
								professionId: event.target.value.trim() ? null : draft.professionId
							}),
							placeholder: "Введите должность, которой нет в каталоге"
						})]
					})
				] }),
				step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModulePick, {
					note: "Снимите работы, которые фактически не выполняются. Предложения — не обязательный набор.",
					items: catalog.works.map((item) => ({
						id: item.meta.id,
						title: item.meta.title,
						text: item.summary,
						suggested: catalog.professions.find((profession) => profession.meta.id === draft.professionId)?.suggestedWorkIds.includes(item.meta.id) ?? false
					})),
					selected: draft.workIds,
					onToggle: (id) => toggle("workIds", id),
					showAll,
					setShowAll
				}),
				step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomList, {
					field: "customWorks",
					title: "Своя работа",
					items: draft.customWorks,
					add: () => addCustom("customWorks"),
					patch: (id, patch) => patchCustom("customWorks", id, patch)
				}),
				step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModulePick, {
					note: "Оборудование и инструмент попадают в инструкцию только после отметки.",
					items: catalog.gears.map((item) => ({
						id: item.meta.id,
						title: item.meta.title,
						text: `${GEAR_KIND[item.kind]}. ${item.summary}`,
						suggested: catalog.professions.find((profession) => profession.meta.id === draft.professionId)?.suggestedGearIds.includes(item.meta.id) ?? false
					})),
					selected: draft.gearIds,
					onToggle: (id) => toggle("gearIds", id),
					showAll,
					setShowAll
				}),
				step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomList, {
					field: "customGear",
					title: "Своё оборудование",
					items: draft.customGear,
					add: () => addCustom("customGear"),
					patch: (id, patch) => patchCustom("customGear", id, patch)
				}),
				step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-2",
					children: catalog.conditions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						checked: draft.conditionIds.includes(item.meta.id),
						title: item.meta.title,
						text: item.summary,
						onToggle: () => toggle("conditionIds", item.meta.id)
					}, item.meta.id))
				}),
				step === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: "Опасность → источник → возможное событие. Список собран из отмеченных работ, оборудования и условий."
					}),
					catalog.hazards.filter((item) => deriveShown(draft.hazardIds, item.meta.id) || draft.hazardIds.includes(item.meta.id)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
						checked: draft.hazardIds.includes(item.meta.id),
						title: item.meta.title,
						text: `Источник: ${item.source}. Событие: ${item.event}.`,
						onToggle: () => toggle("hazardIds", item.meta.id)
					}, item.meta.id)),
					catalog.hazards.filter((item) => !draft.hazardIds.includes(item.meta.id)).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
						className: "rounded-xl border border-line bg-surface p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
							className: "cursor-pointer text-sm font-bold",
							children: "Добавить опасность из библиотеки"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2",
							children: catalog.hazards.filter((item) => !draft.hazardIds.includes(item.meta.id)).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
								checked: false,
								title: item.meta.title,
								text: item.source,
								onToggle: () => toggle("hazardIds", item.meta.id)
							}, item.meta.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-full border border-line px-4 py-3 text-sm font-bold",
						onClick: addCustomHazard,
						children: "Своя опасность"
					}),
					draft.customHazards.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 rounded-xl border border-line bg-surface p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Опасность",
								value: item.title,
								onChange: (event) => patchCustomHazard(item.id, { title: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Источник",
								value: item.source,
								onChange: (event) => patchCustomHazard(item.id, { source: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Возможное событие",
								value: item.event,
								onChange: (event) => patchCustomHazard(item.id, { event: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "min-h-24 rounded-lg border border-line px-3 py-2",
								placeholder: "Конкретная мера безопасности",
								value: item.measure,
								onChange: (event) => patchCustomHazard(item.id, { measure: event.target.value })
							})
						]
					}, item.id))
				] }),
				step === 5 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: "СОУТ и профессиональные риски хранятся раздельно. Здесь только карта условий труда, без подмены оценки рисков."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-full bg-soft px-4 py-3 text-sm font-bold",
						onClick: addSout,
						children: "Добавить фактор СОУТ"
					}),
					draft.sout.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 rounded-xl border border-line bg-surface p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Фактор",
								value: row.factor,
								onChange: (event) => patchSout(row.id, { factor: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Класс условий, например 3.1",
								value: row.laborClass,
								onChange: (event) => patchSout(row.id, { laborClass: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Источник",
								value: row.source,
								onChange: (event) => patchSout(row.id, { source: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "rounded-lg border border-line px-3 py-2",
								placeholder: "Примечание",
								value: row.note,
								onChange: (event) => patchSout(row.id, { note: event.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-left text-sm font-semibold text-danger",
								onClick: () => removeSout(row.id),
								children: "Удалить строку"
							})
						]
					}, row.id))
				] }),
				step === 6 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: "Список предложен по опасностям и оборудованию. Это не юридическое заключение о нормах выдачи СИЗ."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-2",
						children: catalog.ppe.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
							checked: draft.ppeIds.includes(item.meta.id),
							title: item.meta.title,
							text: item.purpose,
							onToggle: () => toggle("ppeIds", item.meta.id)
						}, item.meta.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "min-w-0 flex-1 rounded-xl border border-line px-3 py-3",
							placeholder: "Своё СИЗ",
							value: ppeDraft,
							onChange: (event) => setPpeDraft(event.target.value)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
							onClick: () => {
								addCustomPpe(ppeDraft);
								setPpeDraft("");
							},
							children: "Добавить"
						})]
					})
				] }),
				step === 7 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Preview, { catalogTitle: title }),
				step === 8 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border border-line bg-surface p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-extrabold",
						children: "Проверка и сборка"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: "Перед выдачей сработает Quality Gate: пять разделов, опасности, риски, учёт только выбранного оборудования, отсутствие выдуманных пунктов нормативных актов и связь «опасность → мера». Если проверка не пройдена, документ останется проектом и не будет помечен как готовый."
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print sticky bottom-3 mt-6 flex gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold",
				disabled: step === 0,
				onClick: () => setStep(Math.max(0, step - 1)),
				children: "Назад"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: blocked,
				className: "flex-1 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-40",
				onClick: goNext,
				children: step === 8 ? "Сформировать инструкцию" : "Дальше"
			})]
		})
	] });
}
function deriveShown(ids, id) {
	return ids.includes(id);
}
function ModulePick({ note, items, selected, onToggle, showAll, setShowAll }) {
	const suggested = items.filter((item) => item.suggested || selected.includes(item.id));
	const rest = items.filter((item) => !suggested.some((item2) => item2.id === item.id));
	const visible = showAll ? items : suggested.length ? suggested : items.slice(0, 8);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm leading-relaxed text-muted",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-2",
			children: visible.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Choice, {
				checked: selected.includes(item.id),
				title: item.title,
				text: item.text,
				onToggle: () => onToggle(item.id)
			}, item.id))
		}),
		rest.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "text-sm font-bold text-primary",
			onClick: () => setShowAll(!showAll),
			children: showAll ? "Скрыть остальную библиотеку" : "Показать всю библиотеку модулей"
		})
	] });
}
function CustomList({ title, items, add, patch }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "rounded-full border border-line px-4 py-3 text-left text-sm font-bold",
			onClick: add,
			children: title
		}), items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-2 rounded-xl border border-line bg-surface p-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "rounded-lg border border-line px-3 py-2",
				placeholder: "Название",
				value: item.title,
				onChange: (event) => patch(item.id, { title: event.target.value })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "min-h-20 rounded-lg border border-line px-3 py-2",
				placeholder: "Конкретная мера, не общая фраза",
				value: item.measure,
				onChange: (event) => patch(item.id, { measure: event.target.value })
			})]
		}, item.id))]
	});
}
function Preview({ catalogTitle }) {
	const draft = useApp((state) => state.draft);
	const catalog = buildCatalog(useApp((state) => state.overrides));
	const name = (ids, source) => ids.map((id) => source.find((item) => item.meta.id === id)?.meta.title ?? id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Профессия:" }),
				" ",
				catalogTitle
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Работы:" }),
				" ",
				name(draft.workIds, catalog.works).join("; ") || "не выбраны"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Оборудование и инструмент:" }),
				" ",
				name(draft.gearIds, catalog.gears).join("; ") || "не выбраны"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Условия:" }),
				" ",
				name(draft.conditionIds, catalog.conditions).join("; ") || "не выбраны"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Опасности:" }),
				" ",
				name(draft.hazardIds, catalog.hazards).join("; ") || "не выбраны"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "СОУТ:" }),
				" ",
				draft.sout.length ? draft.sout.map((row) => row.factor).join("; ") : "не внесена"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "СИЗ:" }),
				" ",
				name(draft.ppeIds, catalog.ppe).concat(draft.customPpe).join("; ") || "не выбраны"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Нормативная рамка структуры:" }), " приказ Минтруда России от 29.10.2021 № 772н. Меры модулей без ссылки получат пометку «Нормативное основание требует проверки»."] })
		]
	});
}
//#endregion
export { WizardPage as component };
