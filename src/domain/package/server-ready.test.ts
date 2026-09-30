import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { emptyProfile, mergeFacts } from "./facts.ts";
import { generatedDocxBytes } from "./generate/docx.ts";
import { packageZipBytes } from "./generate/zip.ts";
import { handleExport, handleProfileGet, handleProfilePut } from "./server-host.ts";
import { logServerError } from "./server-log.ts";
import { ServerProfileStorage } from "./server-storage.ts";
import type { FactInput } from "./types.ts";

const USER_A = "user-a-aaaaaaaaaa";
const USER_B = "user-b-bbbbbbbbbb";

function fact(value: string): FactInput {
  return { field: "name", key: "value", value, source: "user", sourceId: "user-profile", status: "confirmed" };
}

describe("серверное хранение и файлы", () => {
  it("профили пользователей не смешиваются и переживают новый экземпляр", () => {
    const root = mkdtempSync(join(tmpdir(), "ychy-"));
    try {
      const first = new ServerProfileStorage(root, USER_A);
      first.saveProfile(mergeFacts(emptyProfile(), [fact("ООО «Ромашка»")]));
      const other = new ServerProfileStorage(root, USER_B);
      other.saveProfile(mergeFacts(emptyProfile(), [fact("ООО «Василёк»")]));
      const restarted = new ServerProfileStorage(root, USER_A);
      assert.equal(restarted.loadProfile().name, "ООО «Ромашка»");
      assert.equal(new ServerProfileStorage(root, USER_B).loadProfile().name, "ООО «Василёк»");
      assert.throws(() => new ServerProfileStorage(root, "../etc/passwd"));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("ошибка пишется в logs/app.log", () => {
    const root = mkdtempSync(join(tmpdir(), "ychy-log-"));
    try {
      logServerError("test", new Error("диск недоступен"), root);
      const text = readFileSync(join(root, "logs", "app.log"), "utf8");
      assert.match(text, /диск недоступен/);
      assert.match(text, /"scope":"test"/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("DOCX и ZIP собираются без браузера, кириллица остаётся в именах и тексте", async () => {
    const bytes = await generatedDocxBytes({
      blocks: [{ kind: "body", text: "ООО «Ромашка». Электрогазосварщик." }],
    });
    const { default: JSZip } = await import("jszip");
    const doc = await JSZip.loadAsync(bytes);
    const xml = await doc.file("word/document.xml")!.async("string");
    assert.match(xml, /Ромашка/);
    assert.match(xml, /Электрогазосварщик/);

    const zipBytes = await packageZipBytes(
      "ООО «Ромашка»",
      [
        {
          shape: "order",
          document: {
            templateId: "tpl",
            title: "Приказ",
            filename: "prikaz-obyazannosti-ot",
            blocks: [{ kind: "body", text: "Приказ для ООО «Ромашка»" }],
          },
        },
      ],
      [
        {
          id: "iot-1",
          professionId: "electrogas_welder",
          professionTitle: "Электрогазосварщик",
          number: "ИОТ-СВ-01",
          date: "29.09.2026",
          plain: "Инструкция электрогазосварщика",
        },
      ],
    );
    const zip = await JSZip.loadAsync(zipBytes);
    const names = Object.keys(zip.files);
    assert.ok(names.some((name) => name.startsWith("Пакет_ОТ_ООО_Ромашка/01_Приказы/")));
    assert.ok(names.some((name) => name.includes("05_Инструкции/ИОТ-СВ-01-")));
  });

  it("без каталога данных сервер не подменяет браузер, с каталогом профили разделены", async () => {
    const previous = process.env.YCHY_DATA_DIR;
    delete process.env.YCHY_DATA_DIR;
    try {
      const idle = await handleProfileGet(new Request("http://127.0.0.1/api/profile"));
      assert.equal((await idle.json()).mode, "browser");
    } finally {
      if (previous === undefined) delete process.env.YCHY_DATA_DIR;
      else process.env.YCHY_DATA_DIR = previous;
    }

    const root = mkdtempSync(join(tmpdir(), "ychy-api-"));
    process.env.YCHY_DATA_DIR = root;
    try {
      const created = await handleProfilePut(
        new Request("http://127.0.0.1/api/profile", {
          method: "PUT",
          body: JSON.stringify(mergeFacts(emptyProfile(), [fact("ООО «Ромашка»")])),
        }),
      );
      const cookie = created.headers.get("set-cookie") ?? "";
      assert.match(cookie, /ychy_uid=/);
      const again = new ServerProfileStorage(root, cookie.split("ychy_uid=")[1]!.split(";")[0]!);
      assert.equal(again.loadProfile().name, "ООО «Ромашка»");

      const other = await handleProfilePut(
        new Request("http://127.0.0.1/api/profile", {
          method: "PUT",
          headers: { cookie: "ychy_uid=second-user-bbbbbb" },
          body: JSON.stringify(mergeFacts(emptyProfile(), [fact("ООО «Василёк»")])),
        }),
      );
      assert.equal(other.status, 200);
      assert.equal(new ServerProfileStorage(root, "second-user-bbbbbb").loadProfile().name, "ООО «Василёк»");
      assert.equal(again.loadProfile().name, "ООО «Ромашка»");

      const exported = await handleExport(
        new Request("http://127.0.0.1/api/export", {
          method: "POST",
          headers: { cookie: "ychy_uid=second-user-bbbbbb" },
          body: JSON.stringify({
            kind: "docx",
            document: { templateId: "t", title: "Приказ", filename: "Приказ-ОТ", blocks: [{ kind: "body", text: "Текст приказа" }] },
          }),
        }),
      );
      assert.equal(exported.status, 200);
      assert.match(exported.headers.get("content-disposition") ?? "", /UTF-8''/);
      assert.match(decodeURIComponent(exported.headers.get("content-disposition") ?? ""), /Приказ-ОТ/);
      const saved = readFileSync(join(root, "files", "second-user-bbbbbb", "Приказ-ОТ.docx"));
      assert.ok(saved.byteLength > 100);
    } finally {
      if (previous === undefined) delete process.env.YCHY_DATA_DIR;
      else process.env.YCHY_DATA_DIR = previous;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
