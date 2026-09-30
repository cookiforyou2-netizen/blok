import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/export")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleExport } = await import("@/domain/package/server-host");
        return handleExport(request);
      },
    },
  },
});
