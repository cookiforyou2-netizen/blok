import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell";
import { buildCatalog } from "@/domain/engine";
import { CATEGORIES } from "@/domain/types";
import { useApp } from "@/domain/store";

export const Route = createFileRoute("/catalog")({ component: CatalogPage });

function CatalogPage() {
  const overrides = useApp((state) => state.overrides);
  const catalog = useMemo(() => buildCatalog(overrides), [overrides]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const items = catalog.professions.filter((item) => {
    const text = `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (category === "all" || item.category === category);
  });

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">100 профессий</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Выберите профессию. Инструкция будет собрана с учётом выполняемых работ, оборудования, инструмента и условий труда.
      </p>
      <div className="mt-4 flex flex-col gap-2 md:flex-row">
        <input className="rounded-xl border border-line bg-surface px-3 py-3 md:flex-1" placeholder="Найти профессию" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="rounded-xl border border-line bg-surface px-3 py-3" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Все направления</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>{item.title}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <Link key={item.meta.id} to="/wizard" search={{ profession: item.meta.id, scenario: undefined }} className="rounded-xl border border-line bg-surface px-4 py-3">
            <span className="block font-extrabold">{item.meta.title}</span>
            <span className="mt-1 block text-sm text-muted">{CATEGORIES.find((entry) => entry.id === item.category)?.title}</span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
