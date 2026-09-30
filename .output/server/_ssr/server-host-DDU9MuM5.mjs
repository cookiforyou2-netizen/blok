import { f as normalizeProfile, t as BrowserProfileStorage } from "./storage-CpKdOROv.mjs";
import { a as packageFolderName, i as generatedDocxBytes, o as packageZipBytes, r as fileStem } from "./zip-OCt8LjfX.mjs";
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
//#region node_modules/.nitro/vite/services/ssr/assets/server-host-DDU9MuM5.js
/** Одна строка в журнал процесса и, если задан каталог данных, в logs/app.log. Без стека и секретов. */
function logServerError(scope, error, dir = process.env.YCHY_DATA_DIR) {
	const message = error instanceof Error ? error.message : String(error);
	const line = JSON.stringify({
		time: (/* @__PURE__ */ new Date()).toISOString(),
		scope,
		message
	});
	console.error(line);
	const root = dir?.trim();
	if (!root) return;
	try {
		const folder = join(root, "logs");
		mkdirSync(folder, { recursive: true });
		appendFileSync(join(folder, "app.log"), `${line}\n`, "utf8");
	} catch (writeError) {
		const nested = writeError instanceof Error ? writeError.message : String(writeError);
		console.error(JSON.stringify({
			time: (/* @__PURE__ */ new Date()).toISOString(),
			scope: "log",
			message: nested
		}));
	}
}
/** Идентификатор каталога пользователя. Путь снаружи не принимается. */
var USER_ID_PATTERN = /^[a-zA-Z0-9_-]{16,64}$/;
function assertUserId(userId) {
	if (!USER_ID_PATTERN.test(userId)) throw new Error("Некорректный идентификатор пользователя");
	return userId;
}
function profileFilePath(root, userId) {
	return join(resolve(root), "profiles", assertUserId(userId), "profile.json");
}
function filesDirPath(root, userId) {
	return join(resolve(root), "files", assertUserId(userId));
}
function atomicJsonBucket(file) {
	const read = () => {
		try {
			if (!existsSync(file)) return {};
			const parsed = JSON.parse(readFileSync(file, "utf8"));
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
			const data = {};
			for (const [key, value] of Object.entries(parsed)) if (typeof value === "string") data[key] = value;
			return data;
		} catch (error) {
			logServerError("profile.read", error);
			return {};
		}
	};
	const write = (data) => {
		mkdirSync(dirname(file), { recursive: true });
		const tmp = `${file}.${process.pid}.tmp`;
		writeFileSync(tmp, JSON.stringify(data), "utf8");
		renameSync(tmp, file);
	};
	return {
		getItem: (key) => read()[key] ?? null,
		setItem: (key, value) => {
			const data = read();
			data[key] = value;
			write(data);
		},
		removeItem: (key) => {
			const data = read();
			delete data[key];
			write(data);
		}
	};
}
/**
* Тот же контракт, что у браузерного хранилища, но файл на диске и свой каталог на пользователя.
* Новый экземпляр после перезапуска читает тот же файл.
*/
var ServerProfileStorage = class {
	inner;
	constructor(root, userId) {
		if (!root.trim()) throw new Error("Каталог данных не задан");
		this.inner = new BrowserProfileStorage(atomicJsonBucket(profileFilePath(root, userId)), "profile");
	}
	loadProfile() {
		return this.inner.loadProfile();
	}
	saveProfile(profile) {
		this.inner.saveProfile(profile);
	}
	setFact(profile, fact) {
		return this.inner.setFact(profile, fact);
	}
	mergeFacts(profile, facts) {
		return this.inner.mergeFacts(profile, facts);
	}
	getFact(factId, profile) {
		return this.inner.getFact(factId, profile);
	}
	removeFact(profile, factId, source) {
		return this.inner.removeFact(profile, factId, source);
	}
};
var COOKIE = "ychy_uid";
var MAX_PROFILE = 1e6;
var MAX_EXPORT = 2e6;
function dataDir() {
	return process.env.YCHY_DATA_DIR?.trim() || null;
}
function readCookie(request, name) {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return decodeURIComponent(rest.join("="));
	}
	return null;
}
function resolveUser(request) {
	if (process.env.YCHY_TRUST_USER_HEADER === "1") {
		const header = request.headers.get("x-ychy-user")?.trim() ?? "";
		if (USER_ID_PATTERN.test(header)) return {
			userId: header,
			fresh: false
		};
	}
	const cookie = readCookie(request, COOKIE) ?? "";
	if (USER_ID_PATTERN.test(cookie)) return {
		userId: cookie,
		fresh: false
	};
	return {
		userId: randomBytes(16).toString("hex"),
		fresh: true
	};
}
function cookieHeader(userId, request) {
	const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
	const parts = [
		`${COOKIE}=${userId}`,
		"Path=/",
		"HttpOnly",
		"SameSite=Lax",
		"Max-Age=31536000"
	];
	if (secure) parts.push("Secure");
	return parts.join("; ");
}
function json(body, request, user, status = 200) {
	const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
	if (user.fresh) headers.append("set-cookie", cookieHeader(user.userId, request));
	return new Response(JSON.stringify(body), {
		status,
		headers
	});
}
async function handleProfileGet(request) {
	const root = dataDir();
	if (!root) return Response.json({ mode: "browser" });
	const user = resolveUser(request);
	try {
		return json({
			mode: "server",
			profile: new ServerProfileStorage(root, user.userId).loadProfile()
		}, request, user);
	} catch (error) {
		logServerError("profile.get", error, root);
		return json({ mode: "browser" }, request, user, 500);
	}
}
async function handleProfilePut(request) {
	const root = dataDir();
	if (!root) return Response.json({ mode: "browser" });
	const user = resolveUser(request);
	try {
		const text = await request.text();
		if (text.length > MAX_PROFILE) return json({
			mode: "server",
			error: "too_large"
		}, request, user, 413);
		const profile = normalizeProfile(JSON.parse(text));
		new ServerProfileStorage(root, user.userId).saveProfile(profile);
		return json({
			mode: "server",
			ok: true
		}, request, user);
	} catch (error) {
		logServerError("profile.put", error, root);
		return json({
			mode: "server",
			error: "failed"
		}, request, user, 500);
	}
}
function contentDisposition(filename) {
	return `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
function isDocument(value) {
	if (!value || typeof value !== "object") return false;
	const doc = value;
	return typeof doc.filename === "string" && typeof doc.title === "string" && Array.isArray(doc.blocks);
}
function storeBytes(root, userId, filename, bytes) {
	const dir = filesDirPath(root, userId);
	mkdirSync(dir, { recursive: true });
	const target = join(dir, fileStem(filename, "file"));
	writeFileSync(target, bytes);
}
async function handleExport(request) {
	const root = dataDir();
	const user = root ? resolveUser(request) : null;
	try {
		const text = await request.text();
		if (text.length > MAX_EXPORT) return new Response("too large", { status: 413 });
		const body = JSON.parse(text);
		let bytes;
		let filename;
		let type;
		if (body.kind === "docx" && isDocument(body.document)) {
			bytes = await generatedDocxBytes(body.document);
			filename = `${fileStem(body.document.filename, "document")}.docx`;
			type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		} else if (body.kind === "zip" && Array.isArray(body.documents)) {
			const orgName = typeof body.orgName === "string" ? body.orgName : "";
			bytes = await packageZipBytes(orgName, body.documents, Array.isArray(body.instructions) ? body.instructions : []);
			filename = `${packageFolderName(orgName)}.zip`;
			type = "application/zip";
		} else return new Response("bad request", { status: 400 });
		if (root && user) storeBytes(root, user.userId, filename, bytes);
		const headers = new Headers({
			"content-type": type,
			"content-disposition": contentDisposition(filename),
			"x-ychy-storage": root ? "server" : "browser"
		});
		if (user?.fresh) headers.append("set-cookie", cookieHeader(user.userId, request));
		return new Response(new Blob([new Uint8Array(bytes)]), {
			status: 200,
			headers
		});
	} catch (error) {
		logServerError("export", error, root ?? void 0);
		return new Response("export failed", { status: 500 });
	}
}
//#endregion
export { handleExport, handleProfileGet, handleProfilePut };
