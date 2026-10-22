import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "AI is not configured." }, { status: 500 });
        let body: { system?: string; messages?: { role: "user" | "assistant"; content: string }[] };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const messages = (body.messages ?? [])
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-30)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }));
        if (!messages.length) return Response.json({ error: "Empty request" }, { status: 400 });
        const { streamAi } = await import("@/server/ai");
        const system =
          (body.system ?? "").slice(0, 4000) ||
          "You are a helpful, concise workplace assistant.";
        const result = streamAi(request, apiKey, system, messages);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const part of result.fullStream) {
                if (part.type === "text-delta") controller.enqueue(encoder.encode(part.text));
                if (part.type === "error") {
                  const err = part.error as { statusCode?: number; message?: string };
                  controller.enqueue(
                    encoder.encode(`\n\u0000ERROR:${err?.statusCode ?? 500}:${err?.message ?? "AI request failed"}`),
                  );
                }
              }
            } catch (e) {
              const err = e as { statusCode?: number; message?: string };
              controller.enqueue(encoder.encode(`\n\u0000ERROR:${err?.statusCode ?? 500}:${err?.message ?? "AI request failed"}`));
            }
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" },
        });
      },
    },
  },
});
