import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { parseJSON, streamAI } from "@/lib/ai-client";
import { logActivity, uid, useLocal } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — Workplace AI Assistant" },
      { name: "description", content: "Turn tasks, deadlines and priorities into an organized AI schedule." },
      { property: "og:title", content: "Task Planner — Workplace AI Assistant" },
      { property: "og:description", content: "Turn tasks into an organized AI schedule." },
    ],
  }),
  component: PlannerPage,
});

type Priority = "High" | "Medium" | "Low";
type InputTask = { id: string; name: string; deadline: string; priority: Priority };
export type PlanItem = { id: string; day: string; time: string; title: string; priority: Priority; done: boolean };

const SYSTEM = `You are a productivity planner. Build a realistic schedule from the user's tasks respecting deadlines, priorities and available hours per day. Split large tasks into blocks when useful. Respond ONLY with JSON: {"items":[{"day":"Monday, Oct 26","time":"09:00-10:30","title":"...","priority":"High|Medium|Low"}]}`;

const prioStyle: Record<Priority, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-chart-3/15 text-foreground border-chart-3/30",
  Low: "bg-accent text-accent-foreground border-transparent",
};

function PlannerPage() {
  const [tasks, setTasks] = useLocal<InputTask[]>("wa.planner.tasks", [
    { id: "t1", name: "", deadline: "", priority: "Medium" },
  ]);
  const [hours, setHours] = useLocal("wa.planner.hours", 6);
  const [range, setRange] = useLocal<"daily" | "weekly">("wa.planner.range", "weekly");
  const [items, setItems] = useLocal<PlanItem[]>("wa.planner.items", []);
  const [loading, setLoading] = useState(false);

  const update = (id: string, patch: Partial<InputTask>) => setTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  async function generate() {
    const valid = tasks.filter((t) => t.name.trim());
    if (!valid.length) return toast.error("Add at least one task.");
    setLoading(true);
    try {
      const today = new Date().toDateString();
      const prompt = `Today is ${today}. Plan type: ${range} (${range === "daily" ? "today only" : "the next 5 working days"}). Available hours per day: ${hours}.\nTasks:\n${valid
        .map((t) => `- ${t.name} | priority: ${t.priority} | deadline: ${t.deadline || "none"}`)
        .join("\n")}`;
      const text = await streamAI(SYSTEM, [{ role: "user", content: prompt }]);
      const data = parseJSON<{ items: Omit<PlanItem, "id" | "done">[] }>(text);
      setItems(data.items.map((i) => ({ ...i, id: uid(), done: false })));
      logActivity("plan", `${range === "daily" ? "Daily" : "Weekly"} plan with ${valid.length} tasks`);
      toast.success("Schedule ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const days = [...new Set(items.map((i) => i.day))];
  const doneCount = items.filter((i) => i.done).length;
  const editItem = (id: string, patch: Partial<PlanItem>) => setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div>
      <PageHeader title="AI Task Planner" description="List your tasks and let AI organize your day or week." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="shadow-card lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            {tasks.map((t, i) => (
              <div key={t.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex gap-2">
                  <Input placeholder={`Task ${i + 1}`} value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} />
                  <Button variant="ghost" size="icon" aria-label="Remove task" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))} disabled={tasks.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input type="date" value={t.deadline} onChange={(e) => update(t.id, { deadline: e.target.value })} />
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={t.priority}
                    onChange={(e) => update(t.id, { priority: e.target.value as Priority })}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setTasks([...tasks, { id: uid(), name: "", deadline: "", priority: "Medium" }])}>
              <Plus className="h-4 w-4" /> Add task
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hours / day</Label>
                <Input type="number" min={1} max={16} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} />
              </div>
              <div className="space-y-1.5">
                <Label>Schedule</Label>
                <div className="flex gap-1">
                  {(["daily", "weekly"] as const).map((r) => (
                    <Button key={r} size="sm" className="flex-1 capitalize" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
              Generate schedule
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-display text-lg">Your schedule</CardTitle>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {doneCount}/{items.length} done
              </span>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your AI-generated schedule will appear here.</p>
            ) : (
              <div className="space-y-6">
                {days.map((day) => (
                  <div key={day}>
                    <h3 className="mb-2 text-sm font-semibold text-primary">{day}</h3>
                    <ul className="space-y-2">
                      {items.filter((i) => i.day === day).map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-2.5 sm:flex-nowrap">
                          <Checkbox checked={i.done} onCheckedChange={(v) => editItem(i.id, { done: !!v })} aria-label="Mark complete" />
                          <Input className="h-8 w-28 shrink-0 text-xs" value={i.time} onChange={(e) => editItem(i.id, { time: e.target.value })} />
                          <Input
                            className={`h-8 min-w-0 flex-1 ${i.done ? "text-muted-foreground line-through" : ""}`}
                            value={i.title}
                            onChange={(e) => editItem(i.id, { title: e.target.value })}
                          />
                          <Badge variant="outline" className={prioStyle[i.priority] ?? prioStyle.Low}>
                            {i.priority}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete item" onClick={() => setItems(items.filter((x) => x.id !== i.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
