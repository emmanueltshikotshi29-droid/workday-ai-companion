import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton, PageHeader } from "@/components/page-header";
import { streamAI } from "@/lib/ai-client";
import { logActivity, uid, useLocal } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Workplace AI Assistant" },
      { name: "description", content: "Generate professional emails in formal, friendly, direct or persuasive tones." },
      { property: "og:title", content: "Email Generator — Workplace AI Assistant" },
      { property: "og:description", content: "Generate professional emails in any tone." },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Friendly", "Direct", "Persuasive"] as const;
type Draft = { id: string; recipient: string; purpose: string; body: string; tone: string; at: number };

const SYSTEM =
  "You write clear, professional workplace emails. Output only the email: a 'Subject:' line, a blank line, then the body with greeting and sign-off. No commentary, no markdown.";

function EmailPage() {
  const [form, setForm] = useLocal("wa.email.form", { recipient: "", purpose: "", points: "", tone: "Formal" });
  const [output, setOutput] = useLocal("wa.email.output", "");
  const [drafts, setDrafts] = useLocal<Draft[]>("wa.email.drafts", []);
  const [loading, setLoading] = useState(false);

  async function run(prompt: string, tone: string) {
    setLoading(true);
    setOutput("");
    try {
      const text = await streamAI(SYSTEM, [{ role: "user", content: prompt }], (t) => setOutput(t));
      setOutput(text);
      setDrafts((d) => [{ id: uid(), recipient: form.recipient, purpose: form.purpose, body: text, tone, at: Date.now() }, ...d].slice(0, 20));
      logActivity("email", `Email to ${form.recipient || "recipient"}: ${form.purpose.slice(0, 50)}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function generate() {
    if (!form.purpose.trim()) { toast.error("Please describe the purpose of the email."); return; }
    run(
      `Recipient: ${form.recipient || "(unspecified)"}\nPurpose: ${form.purpose}\nKey points:\n${form.points || "(none)"}\nTone: ${form.tone}`,
      form.tone,
    );
  }

  function adjust(tone: string) {
    if (!output) return;
    setForm({ ...form, tone });
    run(`Rewrite this email in a ${tone} tone, keeping the same content:\n\n${output}`, tone);
  }

  return (
    <div>
      <PageHeader title="Smart Email Generator" description="Describe what you need and get a ready-to-send draft." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label>Recipient</Label>
              <Input placeholder="e.g. Sarah, Head of Marketing" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Purpose</Label>
              <Input placeholder="e.g. Request a project deadline extension" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Key points</Label>
              <Textarea rows={5} placeholder="One per line" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TONES.map((t) => (
                  <Button key={t} type="button" variant={form.tone === t ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, tone: t })}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate email
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-lg">Draft</CardTitle>
            <CopyButton text={output} />
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && !output ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <Textarea rows={14} value={output} onChange={(e) => setOutput(e.target.value)} placeholder="Your generated email appears here. You can edit it freely." />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Adjust tone:</span>
              {TONES.map((t) => (
                <Button key={t} variant="secondary" size="sm" disabled={!output || loading} onClick={() => adjust(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {drafts.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Saved drafts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {drafts.map((d) => (
              <Card key={d.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button className="min-w-0 text-left" onClick={() => setOutput(d.body)}>
                      <div className="truncate text-sm font-medium">{d.purpose || "Untitled"}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.tone} · {d.recipient || "No recipient"} · {new Date(d.at).toLocaleDateString()}
                      </div>
                    </button>
                    <Button variant="ghost" size="icon" aria-label="Delete draft" onClick={() => setDrafts(drafts.filter((x) => x.id !== d.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
