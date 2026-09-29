import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { buildCatalog, professionsUsingModule } from "@/domain/engine";
import { useApp } from "@/domain/store";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const instructions = useApp((state) => state.instructions);
  const overrides = useApp((state) => state.overrides);
  const catalog = buildCatalog(overrides);
  const full = catalog.professions.filter((item) => item.depth === "full");
  const grinderUsers = professionsUsingModule(catalog, "angle_grinder");

  return (
    <AppShell>
      <section className="md:grid md:grid-cols-[1.3fr_0.7fr] md:items-center md:gap-8">
        <div>
          <div className="flex items-center gap-3">
            <img src="/brand/ychy-logo.jpg" alt="" className="size-14 rounded-full object-cover md:hidden" />
            <p className="text-sm font-bold uppercase tracking-wide text-primary">ychy-pro.ru</p>
          </div>
          <h1 className="mt-2 max-w-xl text-3xl font-extrabold leading-tight text-ink md:text-5xl">
            Конструктор инструкций по охране труда
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
            Инструкция собирается по фактическим работам, оборудованию, опасностям и условиям труда.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/wizard" search={{ scenario: undefined, profession: undefined }} className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-ink">
              Собрать инструкцию
            </Link>
            <Link to="/package" className="rounded-full border border-primary bg-surface px-5 py-3 text-sm font-bold text-primary">
              Сформировать пакет документов
            </Link>
            <Link to="/catalog" className="rounded-full border border-line bg-surface px-5 py-3 text-sm font-bold text-ink">
              100 профессий
            </Link>
          </div>
        </div>
        <img src="/brand/ychy-logo.jpg" alt="" className="mx-auto hidden size-64 rounded-full object-cover md:block" />
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-extrabold">Формула сборки</h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-ink">
          Профессия → работы → опасности → риски → оборудование → инструмент → условия → меры → ИОТ
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Link to="/wizard" search={{ scenario: "shop", profession: undefined }} className="rounded-xl bg-soft p-4">
            <span className="block text-sm font-extrabold">Сварщик в цехе</span>
            <span className="mt-1 block text-sm text-muted">Ручная дуговая сварка, подготовка металла, УШМ, помещение.</span>
          </Link>
          <Link to="/wizard" search={{ scenario: "site", profession: undefined }} className="rounded-xl bg-soft p-4">
            <span className="block text-sm font-extrabold">Сварщик на монтаже</span>
            <span className="mt-1 block text-sm text-muted">Дуга, газовая резка, баллоны, высота, открытая площадка. Без УШМ.</span>
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-extrabold">Инструмент учитывается только если он есть</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Угловая шлифовальная машина попадает в инструкцию только когда она подтверждена. Сейчас она предложена таким профессиям:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {grinderUsers.map((item) => (
            <span key={item.meta.id} className="rounded-full bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
              {item.meta.title}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-extrabold">Примеры профессий</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {full.map((item) => (
            <Link key={item.meta.id} to="/wizard" search={{ profession: item.meta.id, scenario: undefined }} className="rounded-xl border border-line bg-surface p-4">
              <span className="block font-extrabold">{item.meta.title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted">{item.summary}</span>
            </Link>
          ))}
        </div>
      </section>

      {instructions.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-extrabold">Сформированные инструкции</h2>
          <div className="mt-3 grid gap-2">
            {instructions.slice(0, 5).map((item) => (
              <Link key={item.id} to="/instruction/$id" params={{ id: item.id }} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <span className="text-sm font-bold">{item.professionTitle}</span>
                <span className={`text-sm font-semibold ${item.qualityPassed ? "text-accent" : "text-danger"}`}>
                  {item.qualityPassed ? "Готова" : "Не прошла проверку"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
