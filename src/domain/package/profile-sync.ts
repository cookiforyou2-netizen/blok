import { useApp } from "../store";
import { normalizeProfile } from "./profile";

function localEmpty() {
  const profile = useApp.getState().profile;
  return profile.facts.length === 0 && !profile.name && profile.professionIds.length === 0 && profile.instructionIds.length === 0;
}

/** Если сервер хранит профили на диске, браузерная копия остаётся запасной. Ошибка сети ничего не стирает. */
export function startProfileSync(): () => void {
  let server = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const push = () => {
    if (!server) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      void fetch("/api/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(useApp.getState().profile),
      }).catch(() => undefined);
    }, 400);
  };
  const unsub = useApp.subscribe((state, prev) => {
    if (state.profile !== prev.profile) push();
  });
  void (async () => {
    try {
      const response = await fetch("/api/profile", { credentials: "same-origin" });
      if (!response.ok) return;
      const body = (await response.json()) as { mode?: string; profile?: unknown };
      if (body.mode !== "server" || !body.profile) return;
      server = true;
      const remote = normalizeProfile(body.profile);
      const remoteHas = remote.facts.length > 0 || Boolean(remote.name) || remote.professionIds.length > 0 || remote.instructionIds.length > 0;
      if (localEmpty() && remoteHas) useApp.setState({ profile: remote });
      else push();
    } catch {
      server = false;
    }
  })();
  return () => {
    server = false;
    unsub();
    clearTimeout(timer);
  };
}
