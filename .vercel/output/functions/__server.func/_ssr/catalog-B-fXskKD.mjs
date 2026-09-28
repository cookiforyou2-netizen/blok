import { i as __toESM } from "../_runtime.mjs";
import { X as require_react, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as useApp, n as AppShell, u as buildCatalog } from "./shell-D6xK9ynY.mjs";
import { t as CATEGORIES } from "./types--OpmHAgC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog-B-fXskKD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CatalogPage() {
	const overrides = useApp((state) => state.overrides);
	const catalog = (0, import_react.useMemo)(() => buildCatalog(overrides), [overrides]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("all");
	const items = catalog.professions.filter((item) => {
		return `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()) && (category === "all" || item.category === category);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-extrabold",
			children: "Каталог профессий"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 max-w-3xl text-sm leading-relaxed text-muted",
			children: [
				"В каталоге ",
				catalog.professions.length,
				" профессий. Пять имеют полную модель. Остальные готовы к отраслевым пакетам и уже могут подключать общие модули: УШМ, строповку, автомобиль, самоходную машину, кухню, уборку."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-2 md:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "rounded-xl border border-line bg-surface px-3 py-3 md:flex-1",
				placeholder: "Найти профессию",
				value: query,
				onChange: (event) => setQuery(event.target.value)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				className: "rounded-xl border border-line bg-surface px-3 py-3",
				value: category,
				onChange: (event) => setCategory(event.target.value),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "all",
					children: "Все направления"
				}), CATEGORIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: item.id,
					children: item.title
				}, item.id))]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid gap-2",
			children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/wizard",
				search: {
					profession: item.meta.id,
					scenario: void 0
				},
				className: "rounded-xl border border-line bg-surface px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-extrabold",
						children: item.meta.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-2 py-1 text-xs font-bold ${item.depth === "full" ? "bg-accent-soft text-accent" : "bg-soft text-primary"}`,
						children: item.depth === "full" ? "полная модель" : "каталог"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-1 block text-sm text-muted",
					children: [
						CATEGORIES.find((category) => category.id === item.category)?.title,
						". Модулей в предложении: ",
						item.suggestedWorkIds.length + item.suggestedGearIds.length,
						". Версия ",
						item.meta.version,
						"."
					]
				})]
			}, item.meta.id))
		})
	] });
}
//#endregion
export { CatalogPage as component };
