import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Choice } from "@/components/shell";
import { buildCatalog } from "@/domain/engine";
import { buildPackage } from "@/domain/package/registry";
import { PRESETS } from "@/domain/package/presets";
import { CATEGORY_LABELS, CATEGORY_ORDER, FLAG_KEYS, FLAG_LABELS, type DocResultStatus } from "@/domain/package/types";
import { GEAR_KIND } from "@/domain/types";
import { useApp } from "@/domain/store";

const STEPS = ["Организация", "Сотрудники и профессии", "Работы и оборудование", "Опасности и условия", "Проверка данных", "Состав пакета"];

const STATUS_LABEL: Record<DocResultStatus, string> = {
  ready: "данные определены",
  clarify: "необходимо уточнить",
  optional: "дополнительный модуль",
  locked: "генерация будет доступна в полном пакете",
};

export const Route = createFileRoute("/package")({
  component: PackagePage,
});

function PackagePage() {
  const profile = useApp((state) => state.profile);
  const step = useApp((state) => state.packageStep);
  const overrides = useApp((state) => state.overrides);
  const instructions = useApp((state) => state.instructions);
  const setPackageStep = useApp((state) => state.setPackageStep);
  const patchProfile = useApp((state) => state.patchProfile);
  const toggleProfile = useApp((state) => state.toggleProfile);
  const setProfileFlag = useApp((state) => state.setProfileFlag);
  const applyIndustryPreset = useApp((state) => state.applyIndustryPreset);
  const addProfileCustomProfession = useApp((state) => state.addProfileCustomProfession);
  const removeProfileCustomProfession = useApp((state) => state.removeProfileCustomProfession);
  const catalog = useMemo(() => buildCatalog(overrides), [overrides]);
  const pack = useMemo(() => buildPackage(profile), [profile]);
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [department, setDepartment] = useState("");

  const titleOf = (kind: "profession" | "work" | "gear" | "condition", id: string) => {
    if (kind === "profession") return catalog.professions.find((item) => item.meta.id === id)?.meta.title ?? id;
    if (kind === "work") return catalog.works.find((item) => item.meta.id === id)?.meta.title ?? id;
    if (kind === "gear") return catalog.gears.find((item) => item.meta.id === id)?.meta.title ?? id;
    return catalog.conditions.find((item) => item.meta.id === id)?.meta.title ?? id;
  };

  const filtered = catalog.professions.filter((item) => `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <AppShell>
      <p className="text-sm font-bold uppercase tracking-wide text-primary">Шаг {step + 1} из 6</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">Пакет документов вашей организации</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Система определит необходимые документы на основании деятельности, профессий, оборудования и условий работы. Бесплатный конструктор инструкций остаётся доступен без ограничений.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setPackageStep(index)}
              className={`rounded-full px-3 py-2 text-sm font-semibold ${index === step ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="mt-6 grid gap-4">
          {profile.instructionIds.length > 0 && (
            <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold text-accent">
              Из уже сформированных инструкций взяты факты: {profile.instructionIds.length}. Повторно их вводить не нужно.
            </p>
          )}
          <label className="block text-sm font-bold">
            Название организации
            <input className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium" value={profile.name} onChange={(event) => patchProfile({ name: event.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold">
              ИНН
              <input className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium" value={profile.inn} onChange={(event) => patchProfile({ inn: event.target.value })} />
            </label>
            <label className="block text-sm font-bold">
              Численность
              <input
                type="number"
                min={0}
                className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium"
                value={profile.headcount ?? ""}
                onChange={(event) => patchProfile({ headcount: event.target.value === "" ? null : Number(event.target.value) })}
              />
            </label>
          </div>
          <label className="block text-sm font-bold">
            Вид деятельности
            <input className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium" value={profile.activity} onChange={(event) => patchProfile({ activity: event.target.value })} />
          </label>
          <label className="block text-sm font-bold">
            Отрасль
            <input className="mt-2 w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium" value={profile.industry} onChange={(event) => patchProfile({ industry: event.target.value })} />
          </label>
          <div>
            <p className="text-sm font-bold">Подразделение</p>
            <div className="mt-2 flex gap-2">
              <input className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium" value={department} onChange={(event) => setDepartment(event.target.value)} />
              <button
                type="button"
                className="rounded-xl bg-soft px-4 text-sm font-bold"
                onClick={() => {
                  const name = department.trim();
                  if (!name || profile.departments.includes(name)) return;
                  patchProfile({ departments: [...profile.departments, name] });
                  setDepartment("");
                }}
              >
                Добавить
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.departments.map((item) => (
                <button key={item} type="button" className="rounded-full bg-soft px-3 py-2 text-sm font-semibold" onClick={() => patchProfile({ departments: profile.departments.filter((name) => name !== item) })}>
                  {item} ×
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Отраслевой старт</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">Пресет только предлагает профессии и условия. Лишнее можно снять. Состав пакета он не назначает.</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyIndustryPreset(preset.id)}
                  className={`rounded-xl border px-3 py-3 text-left ${profile.presetId === preset.id ? "border-primary bg-soft" : "border-line bg-surface"}`}
                >
                  <span className="block text-sm font-bold">{preset.title}</span>
                  <span className="mt-1 block text-sm text-muted">{preset.activity}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="mt-6">
          <input className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm" placeholder="Найти профессию" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-3 grid gap-2">
            {filtered.map((item) => (
              <Choice
                key={item.meta.id}
                checked={profile.professionIds.includes(item.meta.id)}
                title={item.meta.title}
                text={item.depth === "full" ? "Полная модель конструктора" : "Профессия каталога"}
                onToggle={() => toggleProfile("professionIds", item.meta.id)}
              />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm" placeholder="Должность, которой нет в каталоге" value={customName} onChange={(event) => setCustomName(event.target.value)} />
            <button
              type="button"
              className="rounded-xl bg-soft px-4 text-sm font-bold"
              onClick={() => {
                addProfileCustomProfession(customName);
                setCustomName("");
              }}
            >
              Добавить
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.customProfessions.map((item) => (
              <button key={item} type="button" className="rounded-full bg-soft px-3 py-2 text-sm font-semibold" onClick={() => removeProfileCustomProfession(item)}>
                {item} ×
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6 grid gap-6">
          <div>
            <h2 className="text-lg font-extrabold">Работы</h2>
            <div className="mt-3 grid gap-2">
              {catalog.works.map((item) => (
                <Choice key={item.meta.id} checked={profile.workIds.includes(item.meta.id)} title={item.meta.title} text={item.summary} onToggle={() => toggleProfile("workIds", item.meta.id)} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Оборудование и инструмент</h2>
            <div className="mt-3 grid gap-2">
              {catalog.gears.map((item) => (
                <Choice key={item.meta.id} checked={profile.gearIds.includes(item.meta.id)} title={item.meta.title} text={GEAR_KIND[item.kind]} onToggle={() => toggleProfile("gearIds", item.meta.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6 grid gap-6">
          <div>
            <h2 className="text-lg font-extrabold">Условия</h2>
            <div className="mt-3 grid gap-2">
              {catalog.conditions.map((item) => (
                <Choice key={item.meta.id} checked={profile.conditionIds.includes(item.meta.id)} title={item.meta.title} text={item.summary} onToggle={() => toggleProfile("conditionIds", item.meta.id)} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Признаки организации</h2>
            <p className="mt-1 text-sm text-muted">«Не задано» оставляет документ в списке на уточнение. «Нет» исключает его, если нет другого подтверждённого факта.</p>
            <div className="mt-3 grid gap-3">
              {FLAG_KEYS.map((key) => (
                <TriRow key={key} label={FLAG_LABELS[key]} value={profile.flags[key]} onChange={(value) => setProfileFlag(key, value)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="mt-6 grid gap-4">
          <Fact title="Организация" text={profile.name || "не указана"} />
          <Fact title="Отрасль и деятельность" text={[profile.industry, profile.activity].filter(Boolean).join(" · ") || "не указаны"} />
          <Fact title="Численность" text={profile.headcount == null ? "не указана" : String(profile.headcount)} />
          <Fact title="Профессии" text={[...profile.professionIds.map((id) => titleOf("profession", id)), ...profile.customProfessions].join(", ") || "не выбраны"} />
          <Fact title="Работы" text={profile.workIds.map((id) => titleOf("work", id)).join(", ") || "не выбраны"} />
          <Fact title="Оборудование и инструмент" text={profile.gearIds.map((id) => titleOf("gear", id)).join(", ") || "не выбраны"} />
          <Fact title="Условия" text={profile.conditionIds.map((id) => titleOf("condition", id)).join(", ") || "не выбраны"} />
          <Fact
            title="Признаки"
            text={FLAG_KEYS.map((key) => `${FLAG_LABELS[key]}: ${profile.flags[key] == null ? "не задано" : profile.flags[key] ? "да" : "нет"}`).join("; ")}
          />
          <p className="text-sm leading-relaxed text-muted">
            Инструкций, из которых собран профиль: {instructions.length}. Если факт лишний, вернитесь на предыдущий шаг и снимите отметку.
          </p>
        </section>
      )}

      {step === 5 && (
        <section className="mt-6">
          <h2 className="text-lg font-extrabold">Определено автоматически</h2>
          <ul className="mt-3 grid gap-2 text-sm font-semibold md:grid-cols-2">
            <Count n={pack.counts.orders} label="приказов" />
            <Count n={pack.counts.instructions} label="инструкций" />
            <Count n={pack.counts.policies} label="положений" />
            <Count n={pack.counts.programs} label="программ обучения" />
            <Count n={pack.counts.lists} label="перечней" />
            <Count n={pack.counts.journals} label="журналов" />
            <Count n={pack.counts.ppe} label="документов по СИЗ" />
            <Count n={pack.counts.medical} label="документов по медосмотрам" />
          </ul>
          <p className="mt-3 text-sm font-bold">Всего: {pack.counts.total}.</p>
          {pack.clarifications.length > 0 && (
            <p className="mt-3 rounded-xl border border-line bg-soft px-4 py-3 text-sm leading-relaxed">
              Нужно уточнить: {pack.clarifications.length}. Пока признак не задан, документ не входит в подтверждённый состав и не отбрасывается.
              <button type="button" className="ml-2 font-bold text-primary" onClick={() => setPackageStep(3)}>
                Уточнить признаки
              </button>
            </p>
          )}
          {CATEGORY_ORDER.map((category) => {
            const rows = pack.items.filter((item) => item.document.category === category);
            if (rows.length === 0) return null;
            return (
              <div key={category} className="mt-6">
                <h3 className="text-base font-extrabold">{CATEGORY_LABELS[category]}</h3>
                <div className="mt-2 grid gap-2">
                  {rows.map((item) => {
                    const made = item.document.professionId ? instructions.find((entry) => entry.professionId === item.document.professionId) : undefined;
                    return (
                      <article key={item.document.code} className="rounded-xl border border-line bg-surface px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="text-sm font-bold">{item.document.name}</h4>
                          <span className={`text-sm font-semibold ${item.status === "ready" ? "text-accent" : item.status === "clarify" ? "text-danger" : "text-muted"}`}>
                            {item.status === "ready" ? "✓" : item.status === "clarify" ? "!" : item.status === "optional" ? "○" : "🔒"} {STATUS_LABEL[item.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">{item.reason}</p>
                        {item.status === "ready" && item.document.generator === "instruction" && item.document.professionId && (
                          <div className="mt-2">
                            {made ? (
                              <Link to="/instruction/$id" params={{ id: made.id }} className="text-sm font-bold text-primary">
                                Открыть сформированную инструкцию
                              </Link>
                            ) : (
                              <Link to="/wizard" search={{ profession: item.document.professionId, scenario: undefined }} className="text-sm font-bold text-primary">
                                Собрать в конструкторе
                              </Link>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Документы полного пакета, рисков, СИЗ, обучения и медосмотров сейчас не генерируются. Оплата не требуется. Инструкции по охране труда по-прежнему собираются бесплатно.
          </p>
        </section>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button type="button" className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-bold" onClick={() => setPackageStep(step - 1)}>
            Назад
          </button>
        )}
        {step < 5 && (
          <button type="button" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-ink" onClick={() => setPackageStep(step + 1)}>
            Далее
          </button>
        )}
      </div>
    </AppShell>
  );
}

function TriRow({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean | null) => void }) {
  const options: Array<[boolean | null, string]> = [
    [true, "Да"],
    [false, "Нет"],
    [null, "Не задано"],
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-3">
      <span className="text-sm font-bold">{label}</span>
      <span className="flex gap-1">
        {options.map(([option, title]) => (
          <button
            key={title}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-2 text-sm font-semibold ${value === option ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`}
          >
            {title}
          </button>
        ))}
      </span>
    </div>
  );
}

function Fact({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
    </div>
  );
}

function Count({ n, label }: { n: number; label: string }) {
  if (n === 0) return null;
  return (
    <li className="rounded-xl bg-accent-soft px-3 py-2 text-accent">
      ✓ {n} {label}
    </li>
  );
}
