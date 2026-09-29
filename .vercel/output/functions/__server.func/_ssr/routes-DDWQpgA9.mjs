import { w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as useApp, m as professionsUsingModule, n as AppShell, u as buildCatalog } from "./shell-DGAyvdZq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DDWQpgA9.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	const instructions = useApp((state) => state.instructions);
	const overrides = useApp((state) => state.overrides);
	const catalog = buildCatalog(overrides);
	const full = catalog.professions.filter((item) => item.depth === "full");
	const grinderUsers = professionsUsingModule(catalog, "angle_grinder");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "md:grid md:grid-cols-[1.3fr_0.7fr] md:items-center md:gap-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/brand/ychy-logo.jpg",
						alt: "",
						className: "size-14 rounded-full object-cover md:hidden"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-bold uppercase tracking-wide text-primary",
						children: "ychy-pro.ru"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 max-w-xl text-3xl font-extrabold leading-tight text-ink md:text-5xl",
					children: "Конструктор инструкций по охране труда"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-base leading-relaxed text-muted",
					children: "Инструкция собирается по фактическим работам, оборудованию, опасностям и условиям труда."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/wizard",
							search: {
								scenario: void 0,
								profession: void 0
							},
							className: "rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-ink",
							children: "Собрать инструкцию"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/package",
							className: "rounded-full border border-primary bg-surface px-5 py-3 text-sm font-bold text-primary",
							children: "Сформировать пакет документов"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/catalog",
							className: "rounded-full border border-line bg-surface px-5 py-3 text-sm font-bold text-ink",
							children: "100 профессий"
						})
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/brand/ychy-logo.jpg",
				alt: "",
				className: "mx-auto hidden size-64 rounded-full object-cover md:block"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 rounded-2xl border border-line bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-extrabold",
					children: "Формула сборки"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm font-semibold leading-relaxed text-ink",
					children: "Профессия → работы → опасности → риски → оборудование → инструмент → условия → меры → ИОТ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-3 md:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/wizard",
						search: {
							scenario: "shop",
							profession: void 0
						},
						className: "rounded-xl bg-soft p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-extrabold",
							children: "Сварщик в цехе"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-sm text-muted",
							children: "Ручная дуговая сварка, подготовка металла, УШМ, помещение."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/wizard",
						search: {
							scenario: "site",
							profession: void 0
						},
						className: "rounded-xl bg-soft p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-extrabold",
							children: "Сварщик на монтаже"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-sm text-muted",
							children: "Дуга, газовая резка, баллоны, высота, открытая площадка. Без УШМ."
						})]
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6 rounded-2xl border border-line bg-surface p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-extrabold",
					children: "Инструмент учитывается только если он есть"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: "Угловая шлифовальная машина попадает в инструкцию только когда она подтверждена. Сейчас она предложена таким профессиям:"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex flex-wrap gap-2",
					children: grinderUsers.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-accent-soft px-3 py-2 text-sm font-semibold text-accent",
						children: item.meta.title
					}, item.meta.id))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-extrabold",
				children: "Примеры профессий"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-3 md:grid-cols-2",
				children: full.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/wizard",
					search: {
						profession: item.meta.id,
						scenario: void 0
					},
					className: "rounded-xl border border-line bg-surface p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-extrabold",
						children: item.meta.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-sm leading-relaxed text-muted",
						children: item.summary
					})]
				}, item.meta.id))
			})]
		}),
		instructions.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "mt-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-extrabold",
				children: "Сформированные инструкции"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 grid gap-2",
				children: instructions.slice(0, 5).map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/instruction/$id",
					params: { id: item.id },
					className: "flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold",
						children: item.professionTitle
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `text-sm font-semibold ${item.qualityPassed ? "text-accent" : "text-danger"}`,
						children: item.qualityPassed ? "Готова" : "Не прошла проверку"
					})]
				}, item.id))
			})]
		})
	] });
}
//#endregion
export { Home as component };
