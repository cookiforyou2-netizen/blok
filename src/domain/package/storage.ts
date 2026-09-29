import { emptyProfile, mergeFacts, removeFact } from "./facts";
import { normalizeProfile } from "./profile";
import type { FactInput, FactSource, OrganizationProfile, ProfileFact } from "./types";

/**
 * Граница хранения профиля. Package Engine и мастер знают только эти методы.
 * Сейчас пишет браузер. ServerProfileStorage позже реализует тот же контракт.
 */
export interface ProfileStorage {
  loadProfile(): OrganizationProfile;
  saveProfile(profile: OrganizationProfile): void;
  setFact(profile: OrganizationProfile, fact: FactInput): OrganizationProfile;
  mergeFacts(profile: OrganizationProfile, facts: FactInput[]): OrganizationProfile;
  getFact(factId: string, profile?: OrganizationProfile): ProfileFact | undefined;
  removeFact(profile: OrganizationProfile, factId: string, source?: { source: FactSource["source"]; sourceId: string }): OrganizationProfile;
}

export type ProfileRepository = ProfileStorage;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class BrowserProfileStorage implements ProfileStorage {
  private readonly bucket: KeyValueStorage;
  private readonly storageKey: string;

  constructor(bucket?: KeyValueStorage, storageKey = "ychy-iot-profile-v1") {
    this.bucket = bucket ?? browserStorage();
    this.storageKey = storageKey;
  }

  loadProfile(): OrganizationProfile {
    try {
      const raw = this.bucket.getItem(this.storageKey);
      if (!raw) return emptyProfile();
      return normalizeProfile(JSON.parse(raw));
    } catch {
      return emptyProfile();
    }
  }

  saveProfile(profile: OrganizationProfile): void {
    this.bucket.setItem(this.storageKey, JSON.stringify(profile));
  }

  mergeFacts(profile: OrganizationProfile, facts: FactInput[]): OrganizationProfile {
    const next = mergeFacts(profile, facts);
    this.saveProfile(next);
    return next;
  }

  setFact(profile: OrganizationProfile, fact: FactInput): OrganizationProfile {
    return this.mergeFacts(profile, [fact]);
  }

  getFact(factId: string, profile?: OrganizationProfile): ProfileFact | undefined {
    return (profile ?? this.loadProfile()).facts.find((fact) => fact.id === factId);
  }

  removeFact(profile: OrganizationProfile, factId: string, source?: { source: FactSource["source"]; sourceId: string }): OrganizationProfile {
    const next = removeFact(profile, factId, source);
    this.saveProfile(next);
    return next;
  }
}

export function createProfileRepository(storage: KeyValueStorage, storageKey = "ychy-iot-profile-v1"): ProfileStorage {
  return new BrowserProfileStorage(storage, storageKey);
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
export const profileRepository: ProfileStorage = new BrowserProfileStorage();
