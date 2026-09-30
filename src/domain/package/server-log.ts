import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** Одна строка в журнал процесса и, если задан каталог данных, в logs/app.log. Без стека и секретов. */
export function logServerError(scope: string, error: unknown, dir = process.env.YCHY_DATA_DIR): void {
  const message = error instanceof Error ? error.message : String(error);
  const line = JSON.stringify({ time: new Date().toISOString(), scope, message });
  console.error(line);
  const root = dir?.trim();
  if (!root) return;
  try {
    const folder = join(root, "logs");
    mkdirSync(folder, { recursive: true });
    appendFileSync(join(folder, "app.log"), `${line}\n`, "utf8");
  } catch (writeError) {
    const nested = writeError instanceof Error ? writeError.message : String(writeError);
    console.error(JSON.stringify({ time: new Date().toISOString(), scope: "log", message: nested }));
  }
}
