import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { buildCatalog, professionsUsingModule } from "@/domain/engine";
import { CATEGORIES, type CategoryId, type ModuleStatus, type NormUpdate } from "@/domain/types";
import { useApp } from "@/domain/store";

const TABS = ["Обновления", "Профессии", "Работы", "Оборудование", "Опасности", "Риски", "СИЗ", "Документы", "Аварии", "Инструкции"] as const;

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Обновления");
  const overrides = useApp((state) => state.overrides);
  const instructions = useApp((state) => state.instructions);
  const advanceUpdate = useApp((state) => state.advanceUpdate);
  const setRegulationStatus = useApp((state) => state.setRegulationStatus);
  const setModuleStatus = useApp((state) => state.setModuleStatus);
  const addProfession = useApp((state) => state.addProfession);
  const catalog = useMemo(() => buildCatalog(overrides), [overrides]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("repair");

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Администрирование</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Модуль меняется один раз. Инструкции, уже сформированные, хранят снимок версий. Новые сборки берут опубликованную версию. Нормативный текст не публикуется без шага «проверено человеком».
      </p>
      <label className="mt-4 block text-sm font-bold md:hidden">
        Раздел
        <select className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 font-semibold" value={tab} onChange={(event) => setTab(event.target.value as (typeof TABS)[number])}>
          {TABS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <div className="mt-4 hidden gap-2 overflow-x-auto pb-2 md:flex">
        {TABS.map((item) => (
          <button key={item} type="button" className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold ${tab === item ? "bg-primary text-primary-ink" : "bg-surface text-ink"}`} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {tab === "Обновления" && (
        <div className="mt-4 grid gap-3">
          {catalog.updates.map((item) => {
            const affected = item.targetModuleIds.flatMap((id) => professionsUsingModule(catalog, id));
            const unique = [...new Map(affected.map((profession) => [profession.meta.id, profession])).values()];
            return (
              <UpdateCard key={`${item.id}-${item.status}`} item={item} professions={unique.map((profession) => profession.meta.title)} review={overrides.updateReview?.[item.id]} onAdvance={advanceUpdate} />
            );
          })}
        </div>
      )}

      {tab === "Профессии" && (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-2 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_auto_auto]">
            <input className="rounded-xl border border-line px-3 py-3" placeholder="Новая профессия" value={title} onChange={(event) => setTitle(event.target.value)} />
            <select className="rounded-xl border border-line px-3 py-3" value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>
              {CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            <button type="button" className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={() => { addProfession(title, category); setTitle(""); }}>Добавить</button>
          </div>
          {catalog.professions.map((item) => (
            <Row key={item.meta.id} title={item.meta.title} meta={`${item.meta.version} · ${item.meta.status} · ${item.depth}`} onStatus={(status) => setModuleStatus(item.meta.id, status)} />
          ))}
        </div>
      )}

      {tab === "Работы" && <Cards items={catalog.works.map((item) => item.meta)} onStatus={setModuleStatus} />}
      {tab === "Оборудование" && <Cards items={catalog.gears.map((item) => item.meta)} onStatus={setModuleStatus} extra={catalog.gears.map((item) => `${item.meta.title}: ${professionsUsingModule(catalog, item.meta.id).length} профессий`)} />}
      {tab === "Опасности" && <Cards items={catalog.hazards.map((item) => item.meta)} onStatus={setModuleStatus} />}
      {tab === "Риски" && <Cards items={catalog.risks.map((item) => item.meta)} onStatus={setModuleStatus} />}
      {tab === "СИЗ" && <Cards items={catalog.ppe.map((item) => item.meta)} onStatus={setModuleStatus} />}
      {tab === "Аварии" && <Cards items={catalog.emergencies.map((item) => item.meta)} onStatus={setModuleStatus} />}

      {tab === "Документы" && (
        <div className="mt-4 grid gap-3">
          {catalog.regulations.map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-surface p-4">
              <h2 className="font-extrabold">{item.kind} № {item.number}</h2>
              <p className="mt-1 text-sm leading-relaxed">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.publisher}, от {item.date}. Действует с {item.effectiveFrom}{item.effectiveTo ? ` до ${item.effectiveTo}` : ""}. Статус: {item.status}. Проверен: {item.lastCheckedAt}.</p>
              <a className="mt-2 block text-sm font-semibold text-primary" href={item.officialSource}>{item.officialSource}</a>
              <p className="mt-2 text-sm text-muted">{item.changelog.map((note) => note.note).join(" ")}</p>
              <button type="button" className="mt-3 rounded-full bg-soft px-4 py-3 text-sm font-bold" onClick={() => setRegulationStatus(item.id, item.status === "outdated" ? "active" : "outdated")}>
                {item.status === "outdated" ? "Вернуть в действующие" : "Отметить утратившим силу"}
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === "Инструкции" && (
        <div className="mt-4 grid gap-2">
          {instructions.length === 0 && <p className="text-sm text-muted">Пока нет сформированных инструкций в этом браузере.</p>}
          {instructions.map((item) => (
            <Link key={item.id} to="/instruction/$id" params={{ id: item.id }} className="rounded-xl border border-line bg-surface px-4 py-3">
              <span className="font-extrabold">{item.professionTitle}</span>
              <span className="mt-1 block text-sm text-muted">{item.number} · {item.qualityPassed ? "готова" : "не прошла проверку"} · модулей {Object.keys(item.moduleVersions).length}</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function UpdateCard({
  item,
  professions,
  review,
  onAdvance,
}: {
  item: NormUpdate;
  professions: string[];
  review?: { name: string; comment: string };
  onAdvance: (id: string, review?: { name: string; comment: string }) => string;
}) {
  const [name, setName] = useState(review?.name ?? "");
  const [comment, setComment] = useState(review?.comment ?? "");
  const askReview = item.status === "PROPOSED" || item.status === "HUMAN_VERIFIED";
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{item.code}</p>
      <h2 className="mt-1 text-lg font-extrabold">{item.title}</h2>
      <p className="mt-2 text-sm font-semibold">Статус: {item.status}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{item.summary}</p>
      <p className="mt-2 text-sm leading-relaxed">{item.proposedChange}</p>
      <p className="mt-2 text-sm text-muted">Затронутые профессии через общий модуль: {professions.join(", ") || "появятся, когда модуль подтвердят в мастере"}.</p>
      {askReview && (
        <div className="mt-3 grid gap-2">
          <input className="rounded-xl border border-line px-3 py-3 text-sm" placeholder="ФИО проверившего" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="rounded-xl border border-line px-3 py-3 text-sm" placeholder="Комментарий проверки" value={comment} onChange={(event) => setComment(event.target.value)} />
        </div>
      )}
      <button
        type="button"
        className="mt-3 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-40"
        disabled={item.status === "PUBLISHED" || item.status === "REJECTED"}
        onClick={() => {
          const result = onAdvance(item.id, { name, comment });
          if (result === "need-review") toast("Укажите ФИО проверившего");
          else if (result === "no-change") toast("Публикация без изменения текста недоступна");
          else if (result === "blocked") toast("Шаг недоступен");
          else toast("Шаг мониторинга сохранён");
        }}
      >
        {item.status === "HUMAN_VERIFIED" ? "Опубликовать" : "Следующий шаг проверки"}
      </button>
    </article>
  );
}

function Cards({ items, onStatus, extra }: { items: { id: string; title: string; version: string; status: ModuleStatus }[]; onStatus: (id: string, status: ModuleStatus) => void; extra?: string[] }) {
  return (
    <div className="mt-4 grid gap-2">
      {extra && extra.length > 0 && <p className="rounded-xl bg-soft p-3 text-sm leading-relaxed text-ink">{extra.slice(0, 4).join(" · ")}</p>}
      {items.map((item) => (
        <Row key={item.id} title={item.title} meta={`${item.version} · ${item.status}`} onStatus={(status) => onStatus(item.id, status)} />
      ))}
    </div>
  );
}

function Row({ title, meta, onStatus }: { title: string; meta: string; onStatus: (status: ModuleStatus) => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-muted">{meta}</p>
      </div>
      <select className="rounded-lg border border-line px-2 py-2 text-sm" defaultValue="" onChange={(event) => { if (event.target.value) onStatus(event.target.value as ModuleStatus); }}>
        <option value="">Статус</option>
        {(["draft", "verified", "active", "outdated", "archived"] as ModuleStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
    </div>
  );
}
