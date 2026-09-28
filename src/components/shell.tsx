import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/domain/store";

const LINKS = [
  { to: "/", label: "Обзор" },
  { to: "/wizard", label: "Мастер" },
  { to: "/catalog", label: "Профессии" },
  { to: "/package", label: "Пакет" },
  { to: "/admin", label: "Администрирование" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    void Promise.resolve(useApp.persist.rehydrate()).then(() => {
      useApp.getState().syncProfile();
    });
  }, []);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src="/brand/ychy-logo.jpg" alt="Логотип ychy-pro.ru" className="size-11 rounded-full object-cover" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-tight text-ink">Конструктор ИОТ</span>
              <span className="block text-xs font-semibold text-primary">ychy-pro.ru</span>
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${path === item.to ? "bg-primary text-primary-ink" : "text-ink hover:bg-soft"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <button type="button" className="ml-auto rounded-full bg-soft px-3 py-2 text-sm font-semibold md:hidden" onClick={() => setOpen((value) => !value)}>
            Меню
          </button>
        </div>
        {open && (
          <div className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden">
            {LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-soft" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="no-print border-t border-line px-4 py-6 text-center text-sm text-muted">
        Конструктор инструкций по охране труда · <a className="font-semibold text-primary" href="https://ychy-pro.ru">ychy-pro.ru</a>
      </footer>
    </div>
  );
}

export function Choice({
  checked,
  title,
  text,
  onToggle,
}: {
  checked: boolean;
  title: string;
  text?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left ${checked ? "border-primary bg-soft" : "border-line bg-surface"}`}
    >
      <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border text-xs font-bold ${checked ? "border-primary bg-primary text-primary-ink" : "border-line text-transparent"}`}>
        ✓
      </span>
      <span>
        <span className="block text-sm font-bold text-ink">{title}</span>
        {text && <span className="mt-1 block text-sm leading-relaxed text-muted">{text}</span>}
      </span>
    </button>
  );
}
