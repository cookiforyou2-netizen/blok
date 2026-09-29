import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/shell";
import { SECTION_LABEL, APPROVAL_LINES } from "@/domain/engine";
import { downloadDocx, downloadPdf } from "@/domain/export-doc";
import { useApp } from "@/domain/store";

export const Route = createFileRoute("/instruction/$id")({ component: InstructionPage });

function InstructionPage() {
  const { id } = Route.useParams();
  const record = useApp((state) => state.instructions.find((item) => item.id === id));
  if (!record) {
    return (
      <AppShell>
        <h1 className="text-2xl font-extrabold">Инструкция не найдена</h1>
        <Link to="/wizard" search={{ scenario: undefined, profession: undefined }} className="mt-4 inline-block rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink">Открыть мастер</Link>
      </AppShell>
    );
  }
  const doc = record.snapshot;
  return (
    <AppShell>
      <div className="no-print flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-2 text-sm font-bold ${record.qualityPassed ? "bg-accent-soft text-accent" : "bg-danger-soft text-danger"}`}>
          {record.qualityPassed ? "Проверка пройдена" : "Не готово: проверка не пройдена"}
        </span>
        <button type="button" className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={() => void downloadDocx(doc, record.qualityPassed)}>DOCX</button>
        <button type="button" className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-primary-ink" onClick={() => void downloadPdf(doc, record.qualityPassed)}>PDF</button>
        <button type="button" className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold" onClick={() => window.print()}>Печать</button>
        <button
          type="button"
          className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold"
          onClick={() => void navigator.clipboard.writeText(doc.plain).then(() => toast("Текст скопирован"))}
        >
          Копировать
        </button>
      </div>
      {!record.qualityPassed && (
        <ul className="no-print mt-4 grid gap-2">
          {record.issues.map((issue) => (
            <li key={issue.code + issue.message} className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{issue.message}</li>
          ))}
        </ul>
      )}
      <article className="print-sheet mt-4 rounded-2xl border border-line bg-surface px-5 py-6 font-doc text-ink md:px-10">
        {!record.qualityPassed && <p className="mb-4 text-sm font-bold text-danger">ПРОЕКТ НЕ ГОТОВ — ПРОВЕРКА НЕ ПРОЙДЕНА</p>}
        <div className="mb-4 flex justify-end">
          <div className="text-right text-sm leading-relaxed">
            {APPROVAL_LINES.map((line) => (
              <p key={line} className={line === "УТВЕРЖДАЮ" ? "font-semibold" : undefined}>{line}</p>
            ))}
          </div>
        </div>
        <p className="text-sm font-semibold">{doc.orgName}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">{doc.title}</h1>
        <p className="mt-2 text-sm">№ {doc.number} · {doc.date} · ychy-pro.ru</p>
        <p className="mt-4 text-sm leading-relaxed">{doc.basis}</p>
        <p className="mt-3 text-sm leading-relaxed">{doc.disclaimer}</p>
        {(Object.keys(SECTION_LABEL) as (keyof typeof SECTION_LABEL)[]).map((key) => {
          let cursor = 1;
          const blocks = doc.sections[key].map((block) => {
            const start = cursor;
            cursor += block.points.length;
            return { block, start };
          });
          return (
          <section key={key} className="mt-6">
            <h2 className="text-lg font-semibold">{SECTION_LABEL[key]}</h2>
            {blocks.map(({ block, start }) => (
              <div key={block.moduleId + block.heading} className="mt-3">
                {(key === "during" || key === "emergency") && <h3 className="font-semibold">{block.heading}</h3>}
                <ol start={start} className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {block.points.map((point) => <li key={point.id}>{point.text}</li>)}
                </ol>
                {block.normativeNote ? <p className="mt-2 text-xs text-muted">{block.normativeNote}</p> : null}
              </div>
            ))}
          </section>
          );
        })}
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Версии модулей</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {doc.moduleVersions.map((item) => (
              <li key={item.id}>{item.title} — {item.version}, {item.status}</li>
            ))}
          </ul>
        </section>
      </article>
    </AppShell>
  );
}
