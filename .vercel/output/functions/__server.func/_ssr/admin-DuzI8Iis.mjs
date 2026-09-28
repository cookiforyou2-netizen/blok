import { i as __toESM } from "../_runtime.mjs";
import { X as require_react, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as useApp, n as AppShell, p as professionsUsingModule, u as buildCatalog } from "./shell-D6xK9ynY.mjs";
import { t as CATEGORIES } from "./types--OpmHAgC.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-DuzI8Iis.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	"Обновления",
	"Профессии",
	"Работы",
	"Оборудование",
	"Опасности",
	"Риски",
	"СИЗ",
	"Документы",
	"Аварии",
	"Инструкции"
];
function AdminPage() {
	const [tab, setTab] = (0, import_react.useState)("Обновления");
	const overrides = useApp((state) => state.overrides);
	const instructions = useApp((state) => state.instructions);
	const advanceUpdate = useApp((state) => state.advanceUpdate);
	const setRegulationStatus = useApp((state) => state.setRegulationStatus);
	const setModuleStatus = useApp((state) => state.setModuleStatus);
	const addProfession = useApp((state) => state.addProfession);
	const catalog = (0, import_react.useMemo)(() => buildCatalog(overrides), [overrides]);
	const [title, setTitle] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("repair");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-extrabold",
			children: "Администрирование"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-3xl text-sm leading-relaxed text-muted",
			children: "Модуль меняется один раз. Инструкции, уже сформированные, хранят снимок версий. Новые сборки берут опубликованную версию. Нормативный текст не публикуется без шага «проверено человеком»."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 flex gap-2 overflow-auto pb-2",
			children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: `shrink-0 rounded-full px-3 py-2 text-sm font-bold ${tab === item ? "bg-primary text-primary-ink" : "bg-surface text-ink"}`,
				onClick: () => setTab(item),
				children: item
			}, item))
		}),
		tab === "Обновления" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-3",
			children: catalog.updates.map((item) => {
				const affected = item.targetModuleIds.flatMap((id) => professionsUsingModule(catalog, id));
				const unique = [...new Map(affected.map((profession) => [profession.meta.id, profession])).values()];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpdateCard, {
					item,
					professions: unique.map((profession) => profession.meta.title),
					review: overrides.updateReview?.[item.id],
					onAdvance: advanceUpdate
				}, `${item.id}-${item.status}`);
			})
		}),
		tab === "Профессии" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_auto_auto]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "rounded-xl border border-line px-3 py-3",
						placeholder: "Новая профессия",
						value: title,
						onChange: (event) => setTitle(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "rounded-xl border border-line px-3 py-3",
						value: category,
						onChange: (event) => setCategory(event.target.value),
						children: CATEGORIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.id,
							children: item.title
						}, item.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink",
						onClick: () => {
							addProfession(title, category);
							setTitle("");
						},
						children: "Добавить"
					})
				]
			}), catalog.professions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
				title: item.meta.title,
				meta: `${item.meta.version} · ${item.meta.status} · ${item.depth}`,
				onStatus: (status) => setModuleStatus(item.meta.id, status)
			}, item.meta.id))]
		}),
		tab === "Работы" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cards, {
			items: catalog.works.map((item) => item.meta),
			onStatus: setModuleStatus
		}),
		tab === "Оборудование" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cards, {
			items: catalog.gears.map((item) => item.meta),
			onStatus: setModuleStatus,
			extra: catalog.gears.map((item) => `${item.meta.title}: ${professionsUsingModule(catalog, item.meta.id).length} профессий`)
		}),
		tab === "Опасности" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cards, {
			items: catalog.hazards.map((item) => item.meta),
			onStatus: setModuleStatus
		}),
		tab === "Риски" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cards, {
			items: catalog.risks.map((item) => item.meta),
			onStatus: setModuleStatus
		}),
		tab === "СИЗ" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cards, {
			items: catalog.ppe.map((item) => item.meta),
			onStatus: setModuleStatus
		}),
		tab === "Аварии" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cards, {
			items: catalog.emergencies.map((item) => item.meta),
			onStatus: setModuleStatus
		}),
		tab === "Документы" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-3",
			children: catalog.regulations.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl border border-line bg-surface p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "font-extrabold",
						children: [
							item.kind,
							" № ",
							item.number
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm leading-relaxed",
						children: item.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							item.publisher,
							", от ",
							item.date,
							". Действует с ",
							item.effectiveFrom,
							item.effectiveTo ? ` до ${item.effectiveTo}` : "",
							". Статус: ",
							item.status,
							". Проверен: ",
							item.lastCheckedAt,
							"."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "mt-2 block text-sm font-semibold text-primary",
						href: item.officialSource,
						children: item.officialSource
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: item.changelog.map((note) => note.note).join(" ")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-3 rounded-full bg-soft px-4 py-3 text-sm font-bold",
						onClick: () => setRegulationStatus(item.id, item.status === "outdated" ? "active" : "outdated"),
						children: item.status === "outdated" ? "Вернуть в действующие" : "Отметить утратившим силу"
					})
				]
			}, item.id))
		}),
		tab === "Инструкции" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-2",
			children: [instructions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Пока нет сформированных инструкций в этом браузере."
			}), instructions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/instruction/$id",
				params: { id: item.id },
				className: "rounded-xl border border-line bg-surface px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-extrabold",
					children: item.professionTitle
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-1 block text-sm text-muted",
					children: [
						item.number,
						" · ",
						item.qualityPassed ? "готова" : "не прошла проверку",
						" · модулей ",
						Object.keys(item.moduleVersions).length
					]
				})]
			}, item.id))]
		})
	] });
}
function UpdateCard({ item, professions, review, onAdvance }) {
	const [name, setName] = (0, import_react.useState)(review?.name ?? "");
	const [comment, setComment] = (0, import_react.useState)(review?.comment ?? "");
	const askReview = item.status === "PROPOSED" || item.status === "HUMAN_VERIFIED";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-2xl border border-line bg-surface p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-bold uppercase tracking-wide text-primary",
				children: item.code
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 text-lg font-extrabold",
				children: item.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm font-semibold",
				children: ["Статус: ", item.status]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-muted",
				children: item.summary
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed",
				children: item.proposedChange
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-muted",
				children: [
					"Затронутые профессии через общий модуль: ",
					professions.join(", ") || "появятся, когда модуль подтвердят в мастере",
					"."
				]
			}),
			askReview && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "rounded-xl border border-line px-3 py-3 text-sm",
					placeholder: "ФИО проверившего",
					value: name,
					onChange: (event) => setName(event.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "rounded-xl border border-line px-3 py-3 text-sm",
					placeholder: "Комментарий проверки",
					value: comment,
					onChange: (event) => setComment(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-40",
				disabled: item.status === "PUBLISHED" || item.status === "REJECTED",
				onClick: () => {
					const result = onAdvance(item.id, {
						name,
						comment
					});
					if (result === "need-review") toast("Укажите ФИО проверившего");
					else if (result === "no-change") toast("Публикация без изменения текста недоступна");
					else if (result === "blocked") toast("Шаг недоступен");
					else toast("Шаг мониторинга сохранён");
				},
				children: item.status === "HUMAN_VERIFIED" ? "Опубликовать" : "Следующий шаг проверки"
			})
		]
	});
}
function Cards({ items, onStatus, extra }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 grid gap-2",
		children: [extra && extra.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "rounded-xl bg-soft p-3 text-sm leading-relaxed text-ink",
			children: extra.slice(0, 4).join(" · ")
		}), items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
			title: item.title,
			meta: `${item.version} · ${item.status}`,
			onStatus: (status) => onStatus(item.id, status)
		}, item.id))]
	});
}
function Row({ title, meta, onStatus }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3 md:flex-row md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-bold",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: meta
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			className: "rounded-lg border border-line px-2 py-2 text-sm",
			defaultValue: "",
			onChange: (event) => {
				if (event.target.value) onStatus(event.target.value);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: "Статус"
			}), [
				"draft",
				"verified",
				"active",
				"outdated",
				"archived"
			].map((status) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: status,
				children: status
			}, status))]
		})]
	});
}
//#endregion
export { AdminPage as component };
