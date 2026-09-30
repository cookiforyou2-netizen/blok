import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleProfileGet } = await import("@/domain/package/server-host");
        return handleProfileGet(request);
      },
      PUT: async ({ request }) => {
        const { handleProfilePut } = await import("@/domain/package/server-host");
        return handleProfilePut(request);
      },
    },
  },
});
