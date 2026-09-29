import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Choice } from "@/components/shell";
import { buildCatalog, professionTitle } from "@/domain/engine";
import { CATEGORIES, GEAR_KIND } from "@/domain/types";
import { useApp } from "@/domain/store";

const STEPS = [
  "Профессия",
  "Работы",
  "Оборудование",
  "Условия",
  "Опасности",
  "СОУТ",
  "СИЗ",
  "Предпросмотр",
  "Формирование",
];

export const Route = createFileRoute("/wizard")({
  validateSearch: (search: Record<string, unknown>) => ({
    scenario: search.scenario === "shop" || search.scenario === "site" ? search.scenario : undefined,
    profession: typeof search.profession === "string" ? search.profession : undefined,
  }),
  component: WizardPage,
});

function WizardPage() {
  const search = Route.useSearch();
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
  const [query, setQuery] = useState("");
  const [ppeDraft, setPpeDraft] = useState("");
  const [showAll, setShowAll] = useState(false);
  const catalog = useMemo(() => buildCatalog(overrides), [overrides]);

  useEffect(() => {
    let live = true;
    void Promise.resolve(useApp.persist.rehydrate()).then(() => {
      if (!live) return;
      if (search.scenario === "shop" || search.scenario === "site") useApp.getState().applyScenario(search.scenario);
      else if (search.profession) useApp.getState().selectProfession(search.profession);
    });
    return () => {
      live = false;
    };
  }, [search.scenario, search.profession]);

  useEffect(() => {
    if (step === 4) refreshHazards();
    if (step === 6) refreshPpe();
  }, [step, refreshHazards, refreshPpe]);

  const title = professionTitle(catalog, draft);
  const canLeaveProfession = Boolean(draft.professionId || draft.customProfession.trim().length > 2);
  const canLeaveWorks = draft.workIds.length > 0 || draft.customWorks.some((item) => item.title.trim() && item.measure.trim().length >= 20);
  const canLeaveGear = draft.gearIds.length > 0 || draft.customGear.some((item) => item.title.trim() && item.measure.trim().length >= 20);
  const blocked = (step === 0 && !canLeaveProfession) || (step === 1 && !canLeaveWorks) || (step === 2 && !canLeaveGear);

  const filteredProfessions = catalog.professions.filter((item) => {
    const hay = `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const goNext = () => {
    if (step < 8) setStep(step + 1);
    else {
      const record = formInstruction();
      void navigate({ to: "/instruction/$id", params: { id: record.id } });
    }
  };

  return (
    <AppShell>
      <p className="text-sm font-bold text-primary">Шаг {step + 1} из 9 · {STEPS[step]}</p>
      <h1 className="mt-1 text-2xl font-extrabold">{title}</h1>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
        <div className="h-full bg-primary" style={{ width: `${((step + 1) / 9) * 100}%` }} />
      </div>

      <div className="mt-6 grid gap-3">
        {step === 0 && (
          <>
            <label className="grid gap-1 text-sm font-semibold">
              Организация
              <input className="rounded-xl border border-line bg-surface px-3 py-3" value={draft.orgName} onChange={(event) => patchDraft({ orgName: event.target.value })} placeholder="Наименование работодателя" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Номер инструкции
              <input className="rounded-xl border border-line bg-surface px-3 py-3" value={draft.docNumber} onChange={(event) => patchDraft({ docNumber: event.target.value })} placeholder="ИОТ-01" />
            </label>
            <input className="rounded-xl border border-line bg-surface px-3 py-3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск профессии" />
            <div className="grid max-h-96 gap-2 overflow-auto">
              {filteredProfessions.slice(0, 30).map((item) => (
                <Choice
                  key={item.meta.id}
                  checked={draft.professionId === item.meta.id}
                  title={item.meta.title}
                  text={`${CATEGORIES.find((category) => category.id === item.category)?.title ?? ""}${item.summary ? ` · ${item.summary}` : ""}`}
                  onToggle={() => selectProfession(item.meta.id)}
                />
              ))}
            </div>
            <label className="grid gap-1 text-sm font-semibold">
              Или новая профессия
              <input
                className="rounded-xl border border-line bg-surface px-3 py-3"
                value={draft.customProfession}
                onChange={(event) => patchDraft({ customProfession: event.target.value, professionId: event.target.value.trim() ? null : draft.professionId })}
                placeholder="Введите должность, которой нет в каталоге"
              />
            </label>
          </>
        )}

        {step === 1 && (
          <ModulePick
            note="Снимите работы, которые фактически не выполняются. Предложения — не обязательный набор."
            items={catalog.works.map((item) => ({ id: item.meta.id, title: item.meta.title, text: item.summary, suggested: catalog.professions.find((profession) => profession.meta.id === draft.professionId)?.suggestedWorkIds.includes(item.meta.id) ?? false }))}
            selected={draft.workIds}
            onToggle={(id) => toggle("workIds", id)}
            showAll={showAll}
            setShowAll={setShowAll}
          />
        )}
        {step === 1 && <CustomList field="customWorks" title="Своя работа" items={draft.customWorks} add={() => addCustom("customWorks")} patch={(id, patch) => patchCustom("customWorks", id, patch)} />}

        {step === 2 && (
          <ModulePick
            note="Оборудование и инструмент попадают в инструкцию только после отметки."
            items={catalog.gears.map((item) => ({ id: item.meta.id, title: item.meta.title, text: `${GEAR_KIND[item.kind]}. ${item.summary}`, suggested: catalog.professions.find((profession) => profession.meta.id === draft.professionId)?.suggestedGearIds.includes(item.meta.id) ?? false }))}
            selected={draft.gearIds}
            onToggle={(id) => toggle("gearIds", id)}
            showAll={showAll}
            setShowAll={setShowAll}
          />
        )}
        {step === 2 && <CustomList field="customGear" title="Своё оборудование" items={draft.customGear} add={() => addCustom("customGear")} patch={(id, patch) => patchCustom("customGear", id, patch)} />}

        {step === 3 && (
          <div className="grid gap-2">
            {catalog.conditions.map((item) => (
              <Choice key={item.meta.id} checked={draft.conditionIds.includes(item.meta.id)} title={item.meta.title} text={item.summary} onToggle={() => toggle("conditionIds", item.meta.id)} />
            ))}
          </div>
        )}

        {step === 4 && (
          <>
            <p className="text-sm leading-relaxed text-muted">Опасность → источник → возможное событие. Список собран из отмеченных работ, оборудования и условий.</p>
            {catalog.hazards.filter((item) => deriveShown(draft.hazardIds, item.meta.id) || draft.hazardIds.includes(item.meta.id)).map((item) => (
              <Choice key={item.meta.id} checked={draft.hazardIds.includes(item.meta.id)} title={item.meta.title} text={`Источник: ${item.source}. Событие: ${item.event}.`} onToggle={() => toggle("hazardIds", item.meta.id)} />
            ))}
            {catalog.hazards.filter((item) => !draft.hazardIds.includes(item.meta.id)).length > 0 && (
              <details className="rounded-xl border border-line bg-surface p-3">
                <summary className="cursor-pointer text-sm font-bold">Добавить опасность из библиотеки</summary>
                <div className="mt-3 grid gap-2">
                  {catalog.hazards.filter((item) => !draft.hazardIds.includes(item.meta.id)).map((item) => (
                    <Choice key={item.meta.id} checked={false} title={item.meta.title} text={item.source} onToggle={() => toggle("hazardIds", item.meta.id)} />
                  ))}
                </div>
              </details>
            )}
            <button type="button" className="rounded-full border border-line px-4 py-3 text-sm font-bold" onClick={addCustomHazard}>Своя опасность</button>
            {draft.customHazards.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-xl border border-line bg-surface p-3">
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Опасность" value={item.title} onChange={(event) => patchCustomHazard(item.id, { title: event.target.value })} />
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Источник" value={item.source} onChange={(event) => patchCustomHazard(item.id, { source: event.target.value })} />
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Возможное событие" value={item.event} onChange={(event) => patchCustomHazard(item.id, { event: event.target.value })} />
                <textarea className="min-h-24 rounded-lg border border-line px-3 py-2" placeholder="Конкретная мера безопасности" value={item.measure} onChange={(event) => patchCustomHazard(item.id, { measure: event.target.value })} />
              </div>
            ))}
          </>
        )}

        {step === 5 && (
          <>
            <p className="text-sm leading-relaxed text-muted">СОУТ и профессиональные риски хранятся раздельно. Здесь только карта условий труда, без подмены оценки рисков.</p>
            <button type="button" className="rounded-full bg-soft px-4 py-3 text-sm font-bold" onClick={addSout}>Добавить фактор СОУТ</button>
            {draft.sout.map((row) => (
              <div key={row.id} className="grid gap-2 rounded-xl border border-line bg-surface p-3">
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Фактор" value={row.factor} onChange={(event) => patchSout(row.id, { factor: event.target.value })} />
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Класс условий, например 3.1" value={row.laborClass} onChange={(event) => patchSout(row.id, { laborClass: event.target.value })} />
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Источник" value={row.source} onChange={(event) => patchSout(row.id, { source: event.target.value })} />
                <input className="rounded-lg border border-line px-3 py-2" placeholder="Примечание" value={row.note} onChange={(event) => patchSout(row.id, { note: event.target.value })} />
                <button type="button" className="text-left text-sm font-semibold text-danger" onClick={() => removeSout(row.id)}>Удалить строку</button>
              </div>
            ))}
          </>
        )}

        {step === 6 && (
          <>
            <p className="text-sm leading-relaxed text-muted">Список предложен по опасностям и оборудованию. Это не юридическое заключение о нормах выдачи СИЗ.</p>
            <div className="grid gap-2">
              {catalog.ppe.map((item) => (
                <Choice key={item.meta.id} checked={draft.ppeIds.includes(item.meta.id)} title={item.meta.title} text={item.purpose} onToggle={() => toggle("ppeIds", item.meta.id)} />
              ))}
            </div>
            <div className="flex gap-2">
              <input className="min-w-0 flex-1 rounded-xl border border-line px-3 py-3" placeholder="Своё СИЗ" value={ppeDraft} onChange={(event) => setPpeDraft(event.target.value)} />
              <button type="button" className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={() => { addCustomPpe(ppeDraft); setPpeDraft(""); }}>Добавить</button>
            </div>
          </>
        )}

        {step === 7 && <Preview catalogTitle={title} />}
        {step === 8 && (
          <div className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-lg font-extrabold">Проверка и сборка</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Перед выдачей проверяется, что инструкция полная: пять разделов, опасности, меры и только выбранное оборудование. Нормы, которые не проверены, в текст не добавляются. Если проверка не пройдена, инструкция останется проектом.
            </p>
          </div>
        )}
      </div>

      <div className="no-print sticky bottom-3 mt-6 flex gap-2">
        <button type="button" className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>
          Назад
        </button>
        <button type="button" disabled={blocked} className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-40" onClick={goNext}>
          {step === 8 ? "Сформировать инструкцию" : "Дальше"}
        </button>
      </div>
    </AppShell>
  );
}

function deriveShown(ids: string[], id: string) {
  return ids.includes(id);
}

function ModulePick({
  note,
  items,
  selected,
  onToggle,
  showAll,
  setShowAll,
}: {
  note: string;
  items: { id: string; title: string; text: string; suggested: boolean }[];
  selected: string[];
  onToggle: (id: string) => void;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
}) {
  const suggested = items.filter((item) => item.suggested || selected.includes(item.id));
  const rest = items.filter((item) => !suggested.some((item2) => item2.id === item.id));
  const visible = showAll ? items : suggested.length ? suggested : items.slice(0, 8);
  return (
    <>
      <p className="text-sm leading-relaxed text-muted">{note}</p>
      <div className="grid gap-2">
        {visible.map((item) => (
          <Choice key={item.id} checked={selected.includes(item.id)} title={item.title} text={item.text} onToggle={() => onToggle(item.id)} />
        ))}
      </div>
      {rest.length > 0 && (
        <button type="button" className="text-sm font-bold text-primary" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Скрыть остальной список" : "Показать весь список"}
        </button>
      )}
    </>
  );
}

function CustomList({
  title,
  items,
  add,
  patch,
}: {
  field: string;
  title: string;
  items: { id: string; title: string; measure: string }[];
  add: () => void;
  patch: (id: string, patch: { title?: string; measure?: string }) => void;
}) {
  return (
    <div className="grid gap-2">
      <button type="button" className="rounded-full border border-line px-4 py-3 text-left text-sm font-bold" onClick={add}>{title}</button>
      {items.map((item) => (
        <div key={item.id} className="grid gap-2 rounded-xl border border-line bg-surface p-3">
          <input className="rounded-lg border border-line px-3 py-2" placeholder="Название" value={item.title} onChange={(event) => patch(item.id, { title: event.target.value })} />
          <textarea className="min-h-20 rounded-lg border border-line px-3 py-2" placeholder="Конкретная мера, не общая фраза" value={item.measure} onChange={(event) => patch(item.id, { measure: event.target.value })} />
        </div>
      ))}
    </div>
  );
}

function Preview({ catalogTitle }: { catalogTitle: string }) {
  const draft = useApp((state) => state.draft);
  const catalog = buildCatalog(useApp((state) => state.overrides));
  const name = (ids: string[], source: { meta: { id: string; title: string } }[]) =>
    ids.map((id) => source.find((item) => item.meta.id === id)?.meta.title ?? id);
  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed">
      <p><b>Профессия:</b> {catalogTitle}</p>
      <p><b>Работы:</b> {name(draft.workIds, catalog.works).join("; ") || "не выбраны"}</p>
      <p><b>Оборудование и инструмент:</b> {name(draft.gearIds, catalog.gears).join("; ") || "не выбраны"}</p>
      <p><b>Условия:</b> {name(draft.conditionIds, catalog.conditions).join("; ") || "не выбраны"}</p>
      <p><b>Опасности:</b> {name(draft.hazardIds, catalog.hazards).join("; ") || "не выбраны"}</p>
      <p><b>СОУТ:</b> {draft.sout.length ? draft.sout.map((row) => row.factor).join("; ") : "не внесена"}</p>
      <p><b>СИЗ:</b> {name(draft.ppeIds, catalog.ppe).concat(draft.customPpe).join("; ") || "не выбраны"}</p>
      <p><b>Нормативная рамка структуры:</b> приказ Минтруда России от 29.10.2021 № 772н. Меры модулей без ссылки получат пометку «Нормативное основание требует проверки».</p>
    </div>
  );
}
