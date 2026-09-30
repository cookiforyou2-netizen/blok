import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { BrowserProfileStorage, type KeyValueStorage, type ProfileStorage } from "./storage";
import { logServerError } from "./server-log";

/** Идентификатор каталога пользователя. Путь снаружи не принимается. */
export const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{16,64}$/;

export function assertUserId(userId: string): string {
  if (!USER_ID_PATTERN.test(userId)) throw new Error("Некорректный идентификатор пользователя");
  return userId;
}

export function profileFilePath(root: string, userId: string): string {
  return join(resolve(root), "profiles", assertUserId(userId), "profile.json");
}

export function filesDirPath(root: string, userId: string): string {
  return join(resolve(root), "files", assertUserId(userId));
}

function atomicJsonBucket(file: string): KeyValueStorage {
  const read = (): Record<string, string> => {
    try {
      if (!existsSync(file)) return {};
      const parsed = JSON.parse(readFileSync(file, "utf8")) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      const data: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") data[key] = value;
      }
      return data;
    } catch (error) {
      logServerError("profile.read", error);
      return {};
    }
  };
  const write = (data: Record<string, string>) => {
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
    },
  };
}

/**
 * Тот же контракт, что у браузерного хранилища, но файл на диске и свой каталог на пользователя.
 * Новый экземпляр после перезапуска читает тот же файл.
 */
export class ServerProfileStorage implements ProfileStorage {
  private readonly inner: BrowserProfileStorage;

  constructor(root: string, userId: string) {
    if (!root.trim()) throw new Error("Каталог данных не задан");
    this.inner = new BrowserProfileStorage(atomicJsonBucket(profileFilePath(root, userId)), "profile");
  }

  loadProfile() {
    return this.inner.loadProfile();
  }

  saveProfile(profile: Parameters<ProfileStorage["saveProfile"]>[0]) {
    this.inner.saveProfile(profile);
  }

  setFact(profile: Parameters<ProfileStorage["setFact"]>[0], fact: Parameters<ProfileStorage["setFact"]>[1]) {
    return this.inner.setFact(profile, fact);
  }

  mergeFacts(profile: Parameters<ProfileStorage["mergeFacts"]>[0], facts: Parameters<ProfileStorage["mergeFacts"]>[1]) {
    return this.inner.mergeFacts(profile, facts);
  }

  getFact(factId: string, profile?: Parameters<ProfileStorage["getFact"]>[1]) {
    return this.inner.getFact(factId, profile);
  }

  removeFact(profile: Parameters<ProfileStorage["removeFact"]>[0], factId: string, source?: Parameters<ProfileStorage["removeFact"]>[2]) {
    return this.inner.removeFact(profile, factId, source);
  }
}
