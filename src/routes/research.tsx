import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpenText, Lightbulb, ListChecks, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton, PageHeader } from "@/components/page-header";
import { parseJSON, streamAI } from "@/lib/ai-client";
import { logActivity, uid, useLocal } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — Workplace AI Assistant" },
      { name: "description", content: "Get executive summaries, key insights and actionable takeaways on any topic." },
      { property: "og:title", content: "Research Assistant — Workplace AI Assistant" },
      { property: "og:description", content: "Executive summaries, insights and takeaways." },
    ],
  }),
  component: ResearchPage,
});

type Brief = { summary: string; insights: string[]; takeaways: string[] };
type Saved = Brief & { id: string; query: string; at: number };

const SYSTEM = `You are a sharp business research analyst. Given a topic, questions, or pasted text, respond ONLY with JSON: {"summary":"3-5 sentence executive summary","insights":["5-7 key insights"],"takeaways":["4-6 concrete actionable takeaways"]}. Be specific; flag uncertainty when relevant.`;

function ResearchPage() {
  const [query, setQuery] = useLocal("wa.research.query", "");
  const [brief, setBrief] = useLocal<Brief | null>("wa.research.brief", null);
  const [history, setHistory] = useLocal<Saved[]>("wa.research.history", []);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!query.trim()) return toast.error("Enter a topic, question or text.");
    setLoading(true);
    try {
      const text = await streamAI(SYSTEM, [{ role: "user", content: query }]);
      const b = parseJSON<Brief>(text);
      setBrief(b);
      setHistory((h) => [{ ...b, id: uid(), query, at: Date.now() }, ...h].slice(0, 15));
      logActivity("research", `Research: ${query.slice(0, 60)}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const asText = brief
    ? `Executive summary\n${brief.summary}\n\nKey insights\n${brief.insights.map((i) => `• ${i}`).join("\n")}\n\nTakeaways\n${brief.takeaways.map((i) => `• ${i}`).join("\n")}`
    : "";

  const editList = (key: "insights" | "takeaways", idx: number, val: string) =>
    brief && setBrief({ ...brief, [key]: brief[key].map((x, i) => (i === idx ? val : x)) });

  return (
    <div>
      <PageHeader title="AI Research Assistant" description="Paste text or ask about a topic to get a decision-ready brief." />
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5">
          <Label>Topic, questions, or pasted text</Label>
          <Textarea rows={6} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. What are the pros and cons of a 4-day work week for a 50-person agency?" />
          <div className="flex justify-end">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenText className="h-4 w-4" />}
              Analyze
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 md:col-span-2" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      )}

      {!loading && brief && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="shadow-card md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-display text-lg">Executive summary</CardTitle>
              <CopyButton text={asText} label="Copy brief" />
            </CardHeader>
            <CardContent>
              <Textarea rows={5} value={brief.summary} onChange={(e) => setBrief({ ...brief, summary: e.target.value })} />
            </CardContent>
          </Card>
          {(
            [
              ["insights", "Key insights", Lightbulb],
              ["takeaways", "Actionable takeaways", ListChecks],
            ] as const
          ).map(([key, title, Icon]) => (
            <Card key={key} className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Icon className="h-5 w-5 text-primary" /> {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {brief[key].map((v, i) => (
                  <Textarea key={i} rows={2} className="min-h-0 text-sm" value={v} onChange={(e) => editList(key, i, e.target.value)} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Past briefs</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {history.map((h) => (
              <Card key={h.id} className="shadow-card">
                <CardContent className="flex items-start justify-between gap-2 p-4">
                  <button className="min-w-0 text-left" onClick={() => { setQuery(h.query); setBrief(h); }}>
                    <div className="line-clamp-2 text-sm font-medium">{h.query}</div>
                    <div className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString()}</div>
                  </button>
                  <Button variant="ghost" size="icon" aria-label="Delete brief" onClick={() => setHistory(history.filter((x) => x.id !== h.id))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
