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
      <h1 className="text-2xl font-extrabold">Каталог профессий</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        В каталоге {catalog.professions.length} профессий. Пять имеют полную модель. Остальные готовы к отраслевым пакетам и уже могут подключать общие модули: УШМ, строповку, автомобиль, самоходную машину, кухню, уборку.
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
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold">{item.meta.title}</span>
              <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.depth === "full" ? "bg-accent-soft text-accent" : "bg-soft text-primary"}`}>
                {item.depth === "full" ? "полная модель" : "каталог"}
              </span>
            </span>
            <span className="mt-1 block text-sm text-muted">
              {CATEGORIES.find((category) => category.id === item.category)?.title}. Модулей в предложении: {item.suggestedWorkIds.length + item.suggestedGearIds.length}. Версия {item.meta.version}.
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
