import { i as __toESM } from "../_runtime.mjs";
import { X as require_react, w as require_jsx_runtime, x as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as AppShell, o as buildCatalog, u as useApp } from "./shell-DDLoBrBg.mjs";
import { t as CATEGORIES } from "./types--OpmHAgC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/catalog-CmIoxJ6k.js
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
			children: "100 профессий"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-3xl text-sm leading-relaxed text-muted",
			children: "Выберите профессию. Инструкция будет собрана с учётом выполняемых работ, оборудования, инструмента и условий труда."
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-extrabold",
					children: item.meta.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-1 block text-sm text-muted",
					children: CATEGORIES.find((entry) => entry.id === item.category)?.title
				})]
			}, item.meta.id))
		})
	] });
}
//#endregion
export { CatalogPage as component };
