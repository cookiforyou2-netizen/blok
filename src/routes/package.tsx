import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Choice } from "@/components/shell";
import { buildCatalog } from "@/domain/engine";
import { downloadGeneratedDocx } from "@/domain/package/generate/docx";
import { generateById } from "@/domain/package/generate/registry";
import type { GenerateContext, GeneratedDocument } from "@/domain/package/generate/template";
import { downloadPackageZip } from "@/domain/package/generate/zip";
import { buildPackage } from "@/domain/package/registry";
import { PRESETS } from "@/domain/package/presets";
import { CATEGORY_LABELS, CATEGORY_ORDER, FLAG_KEYS, FLAG_LABELS, type DataRequirement, type DocResultStatus, type PackageItem, type WorkflowStatus } from "@/domain/package/types";
import { createPackageSnapshot, generatorIdOf, knownRequirements, missingForItems, packageReadiness, requirementValue, workflowOf } from "@/domain/package/workflow";
import { GEAR_KIND } from "@/domain/types";
import { useApp } from "@/domain/store";

const STEPS = ["Организация", "Сотрудники и профессии", "Работы и оборудование", "Опасности и условия", "Проверка данных", "Состав пакета"];

const WORKFLOW_LABEL: Record<WorkflowStatus, string> = {
  defined: "Документ требуется",
  clarify: "Нужно уточнить",
  needs_data: "Нужны данные",
  ready_to_generate: "Готов к формированию",
  formed: "Сформирован",
};

const STATUS_LABEL: Record<DocResultStatus, string> = {
  ready: "Система уже знает",
  clarify: "Нужно уточнить",
  optional: "Дополнительный документ",
  locked: "Полный пакет",
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
  const setProfileValues = useApp((state) => state.setProfileValues);
  const packageSnapshot = useApp((state) => state.packageSnapshot);
  const formedDocuments = useApp((state) => state.formedDocuments);
  const rememberSnapshot = useApp((state) => state.rememberSnapshot);
  const rememberFormed = useApp((state) => state.rememberFormed);
  const catalog = useMemo(() => buildCatalog(overrides), [overrides]);
  const pack = useMemo(() => buildPackage(profile), [profile]);
  const [query, setQuery] = useState("");
  const [customName, setCustomName] = useState("");
  const [department, setDepartment] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const formedIds = Object.keys(formedDocuments);
  const coreItems = pack.items.filter((item) => item.document.moduleId === "core_osh");
  const missing = missingForItems(profile, coreItems);
  const readiness = packageReadiness(pack.items, profile, formedIds);

  const titleOf = (kind: "profession" | "work" | "gear" | "condition", id: string) => {
    if (kind === "profession") return catalog.professions.find((item) => item.meta.id === id)?.meta.title ?? id;
    if (kind === "work") return catalog.works.find((item) => item.meta.id === id)?.meta.title ?? id;
    if (kind === "gear") return catalog.gears.find((item) => item.meta.id === id)?.meta.title ?? id;
    return catalog.conditions.find((item) => item.meta.id === id)?.meta.title ?? id;
  };

  const filtered = catalog.professions.filter((item) => `${item.meta.title} ${item.aliases.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));

  const speak = (reason: string) => {
    const titles: Record<string, string> = {};
    for (const item of catalog.professions) titles[item.meta.id] = item.meta.title;
    for (const item of catalog.works) titles[item.meta.id] = item.meta.title;
    for (const item of catalog.gears) titles[item.meta.id] = item.meta.title;
    for (const item of catalog.conditions) titles[item.meta.id] = item.meta.title;
    for (const key of FLAG_KEYS) titles[key] = FLAG_LABELS[key];
    let text = reason
      .replaceAll("Документ включён, потому что", "Документ требуется:")
      .replaceAll("Документ не включён:", "Документ не применяется:")
      .replaceAll("Документ не включён", "Документ не применяется")
      .replaceAll("Требуется для организации в целом", "документ нужен организации в целом");
    for (const [id, title] of Object.entries(titles).sort((left, right) => right[0].length - left[0].length)) text = text.split(id).join(title);
    return text;
  };

  const makeContext = (item: PackageItem): GenerateContext => ({
    instructions: instructions.map((entry) => ({
      id: entry.id,
      professionId: entry.professionId,
      professionTitle: entry.professionTitle,
      number: entry.number,
      date: entry.snapshot.date,
      plain: entry.snapshot.plain,
    })),
    professionTitle: (id) => titleOf("profession", id),
    gearTitle: (id) => titleOf("gear", id),
    reason: speak(item.reason),
    formedAt: new Date().toISOString(),
  });

  const formOne = (item: PackageItem) => {
    const generatorId = generatorIdOf(item.document);
    if (!generatorId) return;
    if (!packageSnapshot) rememberSnapshot(createPackageSnapshot(profile, pack));
    rememberFormed(item.document.id, generateById(generatorId, profile, item.document, makeContext(item)));
    setPreviewId(item.document.id);
  };

  const formPackage = async () => {
    if (readiness.needsData.length > 0 || readiness.ready.length === 0) return;
    if (!packageSnapshot) rememberSnapshot(createPackageSnapshot(profile, pack));
    const produced: Array<{ document: GeneratedDocument; shape: PackageItem["document"]["shape"] }> = [];
    for (const row of readiness.ready) {
      const generatorId = generatorIdOf(row.item.document);
      if (!generatorId) continue;
      const generated = generateById(generatorId, profile, row.item.document, makeContext(row.item));
      rememberFormed(row.item.document.id, generated);
      produced.push({ document: generated, shape: row.item.document.shape });
    }
    await downloadPackageZip(
      profile.name || "Организация",
      produced,
      instructions.map((entry) => ({
        id: entry.id,
        professionId: entry.professionId,
        professionTitle: entry.professionTitle,
        number: entry.number,
        date: entry.snapshot.date,
        plain: entry.snapshot.plain,
      })),
    );
  };

  return (
    <AppShell>
      <p className="text-sm font-bold uppercase tracking-wide text-primary">Шаг {step + 1} из 6</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink">{STEPS[step]}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
        Система определит нужные документы по профессиям, работам, оборудованию и условиям. Бесплатные инструкции собираются без ограничений.
      </p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft" aria-hidden="true">
        <div className="h-full bg-primary" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <details className="mt-3 md:hidden">
        <summary className="cursor-pointer py-2 text-sm font-semibold">Все этапы</summary>
        <ol className="mt-2 grid gap-2">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button type="button" onClick={() => setPackageStep(index)} className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold ${index === step ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`}>
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>
      </details>
      <ol className="mt-4 hidden flex-wrap gap-2 md:flex">
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
          {(profile.instructionIds.length > 0 || profile.professionIds.length > 0 || profile.gearIds.length > 0) && (
            <div className="rounded-xl border border-line bg-surface px-4 py-3">
              <p className="text-sm font-bold">Система уже знает</p>
              {profile.instructionIds.length > 0 && (
                <p className="mt-1 text-sm leading-relaxed text-muted">Из собранных инструкций уже взяты сведения. Повторять их не нужно.</p>
              )}
              {profile.professionIds.length > 0 && (
                <p className="mt-1 text-sm leading-relaxed text-muted">Профессии: {profile.professionIds.map((id) => titleOf("profession", id)).join(", ")}.</p>
              )}
              {profile.gearIds.length > 0 && (
                <p className="mt-1 text-sm leading-relaxed text-muted">Оборудование и инструмент: {profile.gearIds.map((id) => titleOf("gear", id)).join(", ")}.</p>
              )}
              <button type="button" className="mt-3 min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={() => setPackageStep(5)}>
                Перейти к составу пакета
              </button>
            </div>
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
            <p className="mt-1 text-sm leading-relaxed text-muted">Отраслевой старт только предлагает профессии и условия. Лишнее можно снять. Состав документов он не назначает.</p>
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
            <p className="mt-1 text-sm text-muted">«Не задано» оставляет документ в состоянии «Нужно уточнить». «Нет» исключает его, если нет другого подтверждения.</p>
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
            Инструкций уже учтено: {instructions.length}. Если что-то указано лишнее, вернитесь и снимите отметку.
          </p>
        </section>
      )}

      {step === 5 && (
        <section className="mt-6 flex flex-col">
          <div className="order-2 mt-6">
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
              Нужно уточнить: {pack.clarifications.length}. Пока ответа нет, документ не входит в состав и не отбрасывается.
              <button type="button" className="ml-2 font-bold text-primary" onClick={() => setPackageStep(3)}>
                Уточнить признаки
              </button>
            </p>
          )}
          </div>

          <div className="order-1 rounded-2xl border border-line bg-surface p-4">
            <h3 className="text-base font-extrabold">Базовая организация охраны труда</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Бесплатный разбор состава уже сделан. Отметка «Полный пакет» не требует оплаты: можно заполнить реквизиты, открыть предпросмотр и скачать файлы.
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold sm:grid-cols-3">
              <li className="rounded-xl bg-accent-soft px-3 py-2 text-accent">Готово: {readiness.ready.length}</li>
              <li className="rounded-xl bg-soft px-3 py-2">Нужно уточнить: {readiness.clarify.length}</li>
              <li className="rounded-xl bg-soft px-3 py-2">Нужны данные: {readiness.needsData.length}</li>
            </ul>
            {packageSnapshot && (
              <p className="mt-3 rounded-xl bg-soft px-3 py-2 text-sm leading-relaxed">
                Состав пакета зафиксирован {new Date(packageSnapshot.createdAt).toLocaleString("ru-RU")}. Документов в составе: {packageSnapshot.documents.length}.
              </p>
            )}
            {coreItems[0] && knownRequirements(profile, coreItems[0].document).length > 0 && (
              <div className="mt-3 rounded-xl border border-line px-3 py-3">
                <p className="text-sm font-bold">Система уже знает</p>
                <ul className="mt-2 grid gap-1 text-sm text-muted">
                  {knownRequirements(profile, coreItems[0].document).map((requirement) => (
                    <li key={requirement.id}>
                      {requirement.label}: {requirementValue(profile, requirement)}
                    </li>
                  ))}
                  {profile.professionIds.length > 0 && <li>Профессии: {profile.professionIds.map((id) => titleOf("profession", id)).join(", ")}</li>}
                  {profile.gearIds.length > 0 && <li>Оборудование и инструмент: {profile.gearIds.map((id) => titleOf("gear", id)).join(", ")}</li>}
                </ul>
              </div>
            )}
            {missing.length > 0 && (
              <MissingForm
                requirements={missing}
                onSave={(values) =>
                  setProfileValues(
                    missing.map((requirement) => ({
                      field: requirement.field,
                      key: requirement.key,
                      value: values[requirement.id] ?? "",
                    })),
                  )
                }
              />
            )}
            <button
              type="button"
              className="mt-3 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-50"
              disabled={readiness.ready.length === 0 || readiness.needsData.length > 0}
              onClick={() => void formPackage()}
            >
              Сформировать пакет
            </button>
            {readiness.needsData.length > 0 && <p className="mt-2 text-sm text-muted">Сначала заполните общие реквизиты. Неготовые документы в архив не попадут.</p>}
            {readiness.needsData.length === 0 && readiness.clarify.length > 0 && (
              <p className="mt-2 text-sm text-muted">В архив войдут только готовые документы. То, что нужно уточнить, не формируется.</p>
            )}
            <div className="mt-3 grid gap-2">
              {coreItems.map((item) => (
                <CoreCard
                  key={item.document.code}
                  item={item}
                  workflow={workflowOf(item, profile, formedIds)}
                  formed={formedDocuments[item.document.id]?.document}
                  previewOpen={previewId === item.document.id}
                  reason={speak(item.reason)}
                  onGenerate={() => formOne(item)}
                  onTogglePreview={() => setPreviewId((current) => (current === item.document.id ? null : item.document.id))}
                  onDownload={(document) => void downloadGeneratedDocx(document)}
                />
              ))}
            </div>
          </div>

          <div className="order-3 mt-6">
            <details>
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">Другие документы, пока без файла</summary>
              <div className="mt-3">
          {CATEGORY_ORDER.map((category) => {
            const rows = pack.items.filter((item) => item.document.category === category && item.document.moduleId !== "core_osh");
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
                            {STATUS_LABEL[item.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted">{speak(item.reason)}</p>
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
            Эти документы в файл пока не собираются. Оплата не нужна. Инструкции по охране труда по-прежнему собираются бесплатно и без ограничений.
          </p>
              </div>
            </details>
          </div>
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

function MissingForm({ requirements, onSave }: { requirements: DataRequirement[]; onSave: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const complete = requirements.every((requirement) => (values[requirement.id] ?? "").trim().length > 0);
  return (
    <form
      className="mt-3 rounded-xl bg-soft px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (complete) onSave(values);
      }}
    >
      <p className="text-sm font-bold">Общие реквизиты пакета</p>
      <p className="mt-1 text-sm text-muted">Эти сведения спрашиваются один раз и подставляются во все документы. Уже известное повторять не нужно.</p>
      {requirements.map((requirement) => (
        <label key={requirement.id} className="mt-3 block text-sm font-bold">
          {requirement.label}
          <input
            required
            type={requirement.field === "approval_date" ? "date" : "text"}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium"
            value={values[requirement.id] ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, [requirement.id]: event.target.value }))}
          />
        </label>
      ))}
      <button type="submit" disabled={!complete} className="mt-3 min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink disabled:opacity-50">
        Сохранить данные
      </button>
    </form>
  );
}

function CoreCard({
  item,
  workflow,
  formed,
  previewOpen,
  reason,
  onGenerate,
  onTogglePreview,
  onDownload,
}: {
  item: PackageItem;
  workflow: WorkflowStatus | null;
  formed?: GeneratedDocument;
  previewOpen: boolean;
  reason: string;
  onGenerate: () => void;
  onTogglePreview: () => void;
  onDownload: (document: GeneratedDocument) => void;
}) {
  const tone =
    workflow === "formed" || workflow === "ready_to_generate" || workflow === "defined"
      ? "text-accent"
      : workflow === "clarify" || workflow === "needs_data"
        ? "text-danger"
        : "text-muted";
  return (
    <article className="rounded-xl border border-line px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-bold">{item.document.name}</h4>
        <span className={`text-sm font-semibold ${tone}`}>{workflow ? WORKFLOW_LABEL[workflow] : STATUS_LABEL[item.status]}</span>
      </div>
      <span className="mt-2 flex w-fit rounded-full bg-soft px-3 py-1 text-xs font-bold text-primary">Полный пакет</span>
      {reason && (
        <details className="mt-2 text-sm text-muted">
          <summary className="min-h-11 cursor-pointer py-2 font-semibold text-ink">
            {item.match === "no" ? "Документ не применяется" : item.match === "unknown" ? "Что нужно уточнить" : "Почему включён"}
          </summary>
          <p className="mt-1">{reason}</p>
        </details>
      )}
      {workflow === "ready_to_generate" && (
        <button type="button" className="mt-3 min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={onGenerate}>
          Сформировать
        </button>
      )}
      {workflow === "formed" && formed && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 rounded-full bg-soft px-4 py-3 text-sm font-bold" onClick={onTogglePreview}>
            {previewOpen ? "Скрыть предпросмотр" : "Предпросмотр"}
          </button>
          <button type="button" className="min-h-11 rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={() => onDownload(formed)}>
            Скачать DOCX
          </button>
          <button type="button" className="min-h-11 rounded-full border border-line px-4 py-3 text-sm font-bold" onClick={onGenerate}>
            Сформировать заново
          </button>
        </div>
      )}
      {previewOpen && formed && (
        <div className="mt-3">
          <p className="text-sm font-bold">{formed.title}</p>
          <p className="mt-1 text-sm text-muted">Почему включён: {formed.inclusionReason || reason}</p>
          <p className="mt-1 text-sm text-muted">Дата формирования: {formed.formedAt ? new Date(formed.formedAt).toLocaleString("ru-RU") : "только что"}</p>
          <div className="print-sheet mt-3 overflow-x-auto rounded-xl border border-line bg-surface px-4 py-4 text-sm leading-relaxed text-ink" style={{ fontFamily: "var(--font-doc)" }}>
            {formed.blocks.map((block, index) => (
              <p key={`${block.kind}-${index}`} className={block.kind === "heading" ? "text-center text-base font-bold" : block.kind === "right" ? "text-right" : "mt-2 text-left"}>
                {block.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </article>
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
            className={`min-h-11 rounded-full px-3 py-2 text-sm font-semibold ${value === option ? "bg-primary text-primary-ink" : "bg-soft text-ink"}`}
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
      {n} {label}
    </li>
  );
}
