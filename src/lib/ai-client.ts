export type ChatMsg = { role: "user" | "assistant"; content: string };

function friendly(status: number, msg: string) {
  if (status === 429) return "Too many requests right now. Please wait a moment and try again.";
  if (status === 402) return "AI credits have run out. Add credits to your workspace to continue.";
  return msg || "AI request failed.";
}

export async function streamAI(
  system: string,
  messages: ChatMsg[],
  onDelta?: (full: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error(friendly(res.status, j.error));
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    const idx = full.indexOf("\u0000ERROR:");
    if (idx >= 0) {
      const [, code, ...rest] = full.slice(idx + 1).split(":");
      throw new Error(friendly(Number(code), rest.join(":")));
    }
    onDelta?.(full);
  }
  return full.trim();
}

export function parseJSON<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("The AI returned an unexpected format. Please try again.");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
