import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generatedDocxBytes } from "./generate/docx";
import { fileStem, packageFolderName, packageZipBytes } from "./generate/zip";
import type { GeneratedDocument, InstructionRef } from "./generate/template";
import type { DocumentShape } from "./types";
import { normalizeProfile } from "./profile";
import { logServerError } from "./server-log";
import { ServerProfileStorage, USER_ID_PATTERN, filesDirPath } from "./server-storage";

const COOKIE = "ychy_uid";
const MAX_PROFILE = 1_000_000;
const MAX_EXPORT = 2_000_000;

export function dataDir(): string | null {
  const value = process.env.YCHY_DATA_DIR?.trim();
  return value || null;
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function resolveUser(request: Request): { userId: string; fresh: boolean } {
  if (process.env.YCHY_TRUST_USER_HEADER === "1") {
    const header = request.headers.get("x-ychy-user")?.trim() ?? "";
    if (USER_ID_PATTERN.test(header)) return { userId: header, fresh: false };
  }
  const cookie = readCookie(request, COOKIE) ?? "";
  if (USER_ID_PATTERN.test(cookie)) return { userId: cookie, fresh: false };
  return { userId: randomBytes(16).toString("hex"), fresh: true };
}

function cookieHeader(userId: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const parts = [`${COOKIE}=${userId}`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=31536000"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function json(body: unknown, request: Request, user: { userId: string; fresh: boolean }, status = 200): Response {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  if (user.fresh) headers.append("set-cookie", cookieHeader(user.userId, request));
  return new Response(JSON.stringify(body), { status, headers });
}

export async function handleProfileGet(request: Request): Promise<Response> {
  const root = dataDir();
  if (!root) return Response.json({ mode: "browser" });
  const user = resolveUser(request);
  try {
    const profile = new ServerProfileStorage(root, user.userId).loadProfile();
    return json({ mode: "server", profile }, request, user);
  } catch (error) {
    logServerError("profile.get", error, root);
    return json({ mode: "browser" }, request, user, 500);
  }
}

export async function handleProfilePut(request: Request): Promise<Response> {
  const root = dataDir();
  if (!root) return Response.json({ mode: "browser" });
  const user = resolveUser(request);
  try {
    const text = await request.text();
    if (text.length > MAX_PROFILE) return json({ mode: "server", error: "too_large" }, request, user, 413);
    const profile = normalizeProfile(JSON.parse(text));
    new ServerProfileStorage(root, user.userId).saveProfile(profile);
    return json({ mode: "server", ok: true }, request, user);
  } catch (error) {
    logServerError("profile.put", error, root);
    return json({ mode: "server", error: "failed" }, request, user, 500);
  }
}

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function isDocument(value: unknown): value is GeneratedDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as GeneratedDocument;
  return typeof doc.filename === "string" && typeof doc.title === "string" && Array.isArray(doc.blocks);
}

function storeBytes(root: string, userId: string, filename: string, bytes: Uint8Array) {
  const dir = filesDirPath(root, userId);
  mkdirSync(dir, { recursive: true });
  const target = join(dir, fileStem(filename, "file"));
  writeFileSync(target, bytes);
}

export async function handleExport(request: Request): Promise<Response> {
  const root = dataDir();
  const user = root ? resolveUser(request) : null;
  try {
    const text = await request.text();
    if (text.length > MAX_EXPORT) return new Response("too large", { status: 413 });
    const body = JSON.parse(text) as {
      kind?: string;
      document?: GeneratedDocument;
      orgName?: string;
      documents?: Array<{ document: GeneratedDocument; shape: DocumentShape }>;
      instructions?: InstructionRef[];
    };
    let bytes: Uint8Array;
    let filename: string;
    let type: string;
    if (body.kind === "docx" && isDocument(body.document)) {
      bytes = await generatedDocxBytes(body.document);
      filename = `${fileStem(body.document.filename, "document")}.docx`;
      type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (body.kind === "zip" && Array.isArray(body.documents)) {
      const orgName = typeof body.orgName === "string" ? body.orgName : "";
      bytes = await packageZipBytes(orgName, body.documents, Array.isArray(body.instructions) ? body.instructions : []);
      filename = `${packageFolderName(orgName)}.zip`;
      type = "application/zip";
    } else {
      return new Response("bad request", { status: 400 });
    }
    if (root && user) storeBytes(root, user.userId, filename, bytes);
    const headers = new Headers({
      "content-type": type,
      "content-disposition": contentDisposition(filename),
      "x-ychy-storage": root ? "server" : "browser",
    });
    if (user?.fresh) headers.append("set-cookie", cookieHeader(user.userId, request));
    return new Response(new Blob([new Uint8Array(bytes)]), { status: 200, headers });
  } catch (error) {
    logServerError("export", error, root ?? undefined);
    return new Response("export failed", { status: 500 });
  }
}
