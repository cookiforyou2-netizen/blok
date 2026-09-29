import { emptyProfile, mergeFacts, removeFact } from "./facts";
import { normalizeProfile } from "./profile";
import type { FactInput, FactSource, OrganizationProfile } from "./types";

/**
 * Бизнес-логика профиля говорит только с этим контрактом.
 * Сейчас данные лежат в браузере. Позже ту же границу закроет серверное хранилище.
 */
export interface ProfileRepository {
  loadProfile(): OrganizationProfile;
  saveProfile(profile: OrganizationProfile): void;
  mergeFacts(profile: OrganizationProfile, facts: FactInput[]): OrganizationProfile;
  setFact(profile: OrganizationProfile, fact: FactInput): OrganizationProfile;
  removeFact(profile: OrganizationProfile, factId: string, source?: { source: FactSource["source"]; sourceId: string }): OrganizationProfile;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createProfileRepository(storage: KeyValueStorage, storageKey = "ychy-iot-profile-v1"): ProfileRepository {
  return {
    loadProfile() {
      try {
        const raw = storage.getItem(storageKey);
        if (!raw) return emptyProfile();
        return normalizeProfile(JSON.parse(raw));
      } catch {
        return emptyProfile();
      }
    },
    saveProfile(profile) {
      storage.setItem(storageKey, JSON.stringify(profile));
    },
    mergeFacts(profile, facts) {
      const next = mergeFacts(profile, facts);
      this.saveProfile(next);
      return next;
    },
    setFact(profile, fact) {
      return this.mergeFacts(profile, [fact]);
    },
    removeFact(profile, factId, source) {
      const next = removeFact(profile, factId, source);
      this.saveProfile(next);
      return next;
    },
  };
}

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function browserStorage(): KeyValueStorage {
  if (typeof localStorage !== "undefined") return localStorage;
  return memoryStorage();
}

/** Текущая реализация. Мастер и applicability к localStorage не обращаются. */
export const profileRepository: ProfileRepository = createProfileRepository(browserStorage());
