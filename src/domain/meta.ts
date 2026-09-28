import type { ChangeNote, ModuleMeta, ModuleStatus, SafetyPoint } from "./types";

const DAY = "2026-09-26";

export function meta(p: {
  id: string;
  title: string;
  regulationIds?: string[];
  status?: ModuleStatus;
  version?: string;
}): ModuleMeta {
  const version = p.version ?? "1.0.0";
  const note: ChangeNote = {
    version,
    date: DAY,
    note: "Первичная публикация модуля в библиотеке ychy-pro.ru",
    author: "ychy-pro.ru",
  };
  return {
    id: p.id,
    title: p.title,
    version,
    createdAt: DAY,
    updatedAt: DAY,
    status: p.status ?? "active",
    regulationIds: p.regulationIds ?? [],
    verifiedAt: DAY,
    author: "ychy-pro.ru",
    changelog: [note],
  };
}

export function pts(moduleId: string, rows: [string, string[]][]): SafetyPoint[] {
  return rows.map(([text, hazardIds], index) => ({
    id: `${moduleId}.p${index + 1}`,
    text,
    hazardIds,
  }));
}
