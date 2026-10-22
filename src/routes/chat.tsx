import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, MessageSquarePlus, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/page-header";
import { streamAI, type ChatMsg } from "@/lib/ai-client";
import { logActivity, useLocal } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Workplace Chat — Workplace AI Assistant" },
      { name: "description", content: "Chat with an AI assistant for quick work questions, brainstorming and drafting." },
      { property: "og:title", content: "Workplace Chat — Workplace AI Assistant" },
      { property: "og:description", content: "Quick work answers, brainstorming and drafting." },
    ],
  }),
  component: ChatPage,
});

const SYSTEM =
  "You are a friendly, concise workplace assistant. Help with work questions, brainstorming, and drafting. Use short paragraphs and simple bullet lists ('- '). Avoid heavy markdown.";
const STARTERS = [
  "Brainstorm 5 ideas for a team offsite",
  "How do I give constructive feedback to a peer?",
  "Draft a Slack update announcing a new process",
  "Summarize the RACI model in plain terms",
];

function ChatPage() {
  const [messages, setMessages] = useLocal<ChatMsg[]>("wa.chat.messages", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const history: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);
    try {
      const reply = await streamAI(SYSTEM, history, (t) => setMessages([...history, { role: "assistant", content: t }]));
      setMessages([...history, { role: "assistant", content: reply }]);
      logActivity("chat", content.slice(0, 60));
    } catch (e) {
      toast.error((e as Error).message);
      setMessages(history);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[480px] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Workplace Chat</h1>
        <Button variant="outline" size="sm" onClick={() => setMessages([])} disabled={loading || !messages.length}>
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </Button>
      </div>
      <Card className="flex min-h-0 flex-1 flex-col shadow-card">
        <div className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-xl bg-accent p-3 text-accent-foreground">
                <Waypoints className="h-6 w-6" />
              </div>
              <p className="mt-3 font-medium">How can I help with work today?</p>
              <div className="mt-4 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-lg border p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Waypoints className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  {m.content ? (
                    <>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
                      {!(loading && i === messages.length - 1) && (
                        <div className="mt-2">
                          <CopyButton text={m.content} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>
        <form
          className="border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
              rows={1}
              className="max-h-40 min-h-11 resize-none"
              placeholder="Ask anything about work…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={loading || !input.trim()} aria-label="Send">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
