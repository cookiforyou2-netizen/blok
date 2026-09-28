import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyUpdateStep, buildCatalog, blankCustom, blankHazard, blankSout, createInstruction, deriveHazardIds, derivePpeIds, emptyDraft, emptyOverrides, ppeKey, selectionKey, type Overrides, type UpdateStepResult } from "./engine";
import { absorbAll, absorbInstruction, applyPreset, emptyProfile, inferProfile, normalizeProfile } from "./package/profile";
import { presetById } from "./package/presets";
import type { FlagKey, OrganizationProfile } from "./package/types";
import type { Draft, InstructionRecord, Profession, SoutRow } from "./types";

type ProfileList = "professionIds" | "workIds" | "gearIds" | "conditionIds" | "hazardIds" | "ppeIds";

interface AppState {
  draft: Draft;
  step: number;
  instructions: InstructionRecord[];
  overrides: Overrides;
  profile: OrganizationProfile;
  packageStep: number;
  setStep: (step: number) => void;
  patchDraft: (patch: Partial<Draft>) => void;
  selectProfession: (id: string | null) => void;
  toggle: (field: "workIds" | "gearIds" | "conditionIds" | "hazardIds" | "ppeIds", id: string) => void;
  applyScenario: (scenario: "shop" | "site") => void;
  refreshHazards: () => void;
  refreshPpe: () => void;
  addSout: () => void;
  patchSout: (id: string, patch: Partial<SoutRow>) => void;
  removeSout: (id: string) => void;
  addCustom: (field: "customGear" | "customWorks") => void;
  patchCustom: (field: "customGear" | "customWorks", id: string, patch: { title?: string; measure?: string }) => void;
  addCustomHazard: () => void;
  patchCustomHazard: (id: string, patch: Partial<{ title: string; source: string; event: string; measure: string }>) => void;
  addCustomPpe: (title: string) => void;
  formInstruction: () => InstructionRecord;
  setModuleStatus: (id: string, status: Overrides["moduleStatus"][string]) => void;
  setRegulationStatus: (id: string, status: Overrides["regulationStatus"][string]) => void;
  advanceUpdate: (id: string, review?: { name: string; comment: string }) => UpdateStepResult;
  addProfession: (title: string, category: Profession["category"]) => void;
  setPackageStep: (step: number) => void;
  patchProfile: (patch: Partial<OrganizationProfile>) => void;
  toggleProfile: (field: ProfileList, id: string) => void;
  setProfileFlag: (key: FlagKey, value: boolean | null) => void;
  applyIndustryPreset: (id: string) => void;
  addProfileCustomProfession: (title: string) => void;
  removeProfileCustomProfession: (title: string) => void;
  syncProfile: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      draft: emptyDraft(),
      step: 0,
      instructions: [],
      overrides: emptyOverrides(),
      profile: emptyProfile(),
      packageStep: 0,
      setStep: (step) => set({ step }),
      patchDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      selectProfession: (id) => {
        const catalog = buildCatalog(get().overrides);
        const profession = catalog.professions.find((item) => item.meta.id === id);
        set({
          draft: {
            ...get().draft,
            professionId: id,
            customProfession: id ? "" : get().draft.customProfession,
            workIds: profession?.suggestedWorkIds ?? [],
            gearIds: profession?.suggestedGearIds ?? [],
            conditionIds: profession?.suggestedConditionIds ?? [],
            hazardIds: [],
            hazardKey: "",
            ppeIds: [],
            ppeKey: "",
          },
        });
      },
      toggle: (field, id) => {
        const current = get().draft[field];
        const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        set({ draft: { ...get().draft, [field]: next } });
      },
      applyScenario: (scenario) => {
        const shop = scenario === "shop";
        set({
          step: 1,
          draft: {
            ...emptyDraft(),
            orgName: "ООО «Пример»",
            docNumber: shop ? "ИОТ-СВ-01" : "ИОТ-СВ-02",
            professionId: "electrogas_welder",
            workIds: shop
              ? ["work_manual_arc", "work_metal_prep", "work_weld_clean"]
              : ["work_manual_arc", "work_gas_cutting", "work_moving_parts"],
            gearIds: shop
              ? ["welding_machine", "angle_grinder", "hand_tools"]
              : ["welding_machine", "gas_cylinder", "hand_tools"],
            conditionIds: shop ? ["cond_indoor", "cond_hot_zone"] : ["cond_outdoor", "cond_height", "cond_hot_zone"],
          },
        });
      },
      refreshHazards: () => {
        const draft = get().draft;
        const key = selectionKey(draft);
        if (draft.hazardKey === key) return;
        const ids = deriveHazardIds(buildCatalog(get().overrides), draft);
        set({ draft: { ...draft, hazardIds: ids, hazardKey: key, ppeKey: "" } });
      },
      refreshPpe: () => {
        const draft = get().draft;
        const key = ppeKey(draft);
        if (draft.ppeKey === key) return;
        const ids = derivePpeIds(buildCatalog(get().overrides), draft);
        set({ draft: { ...draft, ppeIds: ids, ppeKey: key } });
      },
      addSout: () => set({ draft: { ...get().draft, sout: [...get().draft.sout, blankSout()] } }),
      patchSout: (id, patch) =>
        set({
          draft: {
            ...get().draft,
            sout: get().draft.sout.map((row) => (row.id === id ? { ...row, ...patch } : row)),
          },
        }),
      removeSout: (id) => set({ draft: { ...get().draft, sout: get().draft.sout.filter((row) => row.id !== id) } }),
      addCustom: (field) =>
        set({ draft: { ...get().draft, [field]: [...get().draft[field], blankCustom(field)] } }),
      patchCustom: (field, id, patch) =>
        set({
          draft: {
            ...get().draft,
            [field]: get().draft[field].map((item) => (item.id === id ? { ...item, ...patch } : item)),
          },
        }),
      addCustomHazard: () => set({ draft: { ...get().draft, customHazards: [...get().draft.customHazards, blankHazard()] } }),
      patchCustomHazard: (id, patch) =>
        set({
          draft: {
            ...get().draft,
            customHazards: get().draft.customHazards.map((item) => (item.id === id ? { ...item, ...patch } : item)),
          },
        }),
      addCustomPpe: (title) => {
        const name = title.trim();
        if (!name) return;
        set({ draft: { ...get().draft, customPpe: [...get().draft.customPpe, name] } });
      },
      formInstruction: () => {
        const state = get();
        const catalog = buildCatalog(state.overrides);
        let draft = state.draft;
        const key = selectionKey(draft);
        if (draft.hazardKey !== key) {
          draft = { ...draft, hazardIds: deriveHazardIds(catalog, draft), hazardKey: key };
        }
        const pk = ppeKey(draft);
        if (draft.ppeKey !== pk) draft = { ...draft, ppeIds: derivePpeIds(catalog, draft), ppeKey: pk };
        const record = createInstruction(catalog, draft);
        const profile = absorbInstruction(state.profile ?? emptyProfile(), record);
        set({ draft, instructions: [record, ...state.instructions].slice(0, 40), profile });
        return record;
      },
      setModuleStatus: (id, status) =>
        set({ overrides: { ...get().overrides, moduleStatus: { ...get().overrides.moduleStatus, [id]: status } } }),
      setRegulationStatus: (id, status) =>
        set({
          overrides: {
            ...get().overrides,
            regulationStatus: { ...get().overrides.regulationStatus, [id]: status },
          },
        }),
      advanceUpdate: (id, review) => {
        const result = applyUpdateStep(get().overrides, id, review);
        if (result.status === "ok") set({ overrides: result.overrides });
        return result.status;
      },
      addProfession: (title, category) => {
        const name = title.trim();
        if (name.length < 2) return;
        const id = `custom_${Date.now().toString(36)}`;
        const profession: Profession = {
          meta: {
            id,
            title: name,
            version: "0.1.0",
            createdAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString().slice(0, 10),
            status: "draft",
            regulationIds: [],
            verifiedAt: null,
            author: "администратор",
            changelog: [{ version: "0.1.0", date: new Date().toISOString().slice(0, 10), note: "Добавлена в каталог", author: "администратор" }],
          },
          category,
          aliases: [],
          depth: "catalog",
          summary: "Добавлена администратором. Характерные модули отмечаются в мастере из общей библиотеки.",
          workerRequirements: [],
          admission: [],
          hygiene: [],
          extras: [],
          suggestedWorkIds: [],
          suggestedGearIds: [],
          suggestedConditionIds: [],
        };
        set({ overrides: { ...get().overrides, customProfessions: [...get().overrides.customProfessions, profession] } });
      },
      setPackageStep: (packageStep) => set({ packageStep }),
      patchProfile: (patch) => {
        const current = get().profile;
        set({
          profile: inferProfile({
            ...current,
            ...patch,
            flags: { ...current.flags, ...(patch.flags ?? {}) },
          }),
        });
      },
      toggleProfile: (field, id) => {
        const current = get().profile[field];
        const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        set({ profile: inferProfile({ ...get().profile, [field]: next }) });
      },
      setProfileFlag: (key, value) => {
        const current = get().profile;
        set({ profile: { ...current, flags: { ...current.flags, [key]: value } } });
      },
      applyIndustryPreset: (id) => {
        const preset = presetById(id);
        if (!preset) return;
        set({ profile: applyPreset(get().profile, preset) });
      },
      addProfileCustomProfession: (title) => {
        const name = title.trim();
        if (name.length < 2 || get().profile.customProfessions.includes(name)) return;
        const current = get().profile;
        set({
          profile: inferProfile({
            ...current,
            customProfessions: [...current.customProfessions, name],
            positions: current.positions.includes(name) ? current.positions : [...current.positions, name],
          }),
        });
      },
      removeProfileCustomProfession: (title) => {
        const current = get().profile;
        set({
          profile: inferProfile({
            ...current,
            customProfessions: current.customProfessions.filter((item) => item !== title),
          }),
        });
      },
      syncProfile: () => set({ profile: absorbAll(normalizeProfile(get().profile), get().instructions) }),
    }),
    {
      name: "ychy-iot-v1",
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        const savedOverrides = saved.overrides;
        return {
          ...current,
          draft: { ...emptyDraft(), ...(saved.draft ?? {}) },
          step: typeof saved.step === "number" ? saved.step : 0,
          instructions: saved.instructions ?? [],
          overrides: {
            ...emptyOverrides(),
            ...(savedOverrides ?? {}),
            updateReview: savedOverrides?.updateReview ?? {},
            customProfessions: savedOverrides?.customProfessions ?? [],
          },
          profile: normalizeProfile(saved.profile),
          packageStep: typeof saved.packageStep === "number" ? saved.packageStep : 0,
        };
      },
    },
  ),
);
