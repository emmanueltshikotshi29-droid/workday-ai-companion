import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, BookOpenText, CalendarCheck, Mail, MessagesSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocal, type Activity } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI Assistant" },
      { name: "description", content: "Your workplace productivity overview: stats, recent activity and AI tools." },
      { property: "og:title", content: "Dashboard — Workplace AI Assistant" },
      { property: "og:description", content: "Your workplace productivity overview: stats, recent activity and AI tools." },
    ],
  }),
  component: Dashboard,
});

const tools = [
  { to: "/email", title: "Email Generator", desc: "Draft polished emails in any tone.", icon: Mail, key: "email", stat: "Emails drafted" },
  { to: "/planner", title: "Task Planner", desc: "Turn your to-dos into a schedule.", icon: CalendarCheck, key: "plan", stat: "Plans created" },
  { to: "/research", title: "Research Assistant", desc: "Summaries, insights, takeaways.", icon: BookOpenText, key: "research", stat: "Research briefs" },
  { to: "/chat", title: "Workplace Chat", desc: "Brainstorm and get quick answers.", icon: MessagesSquare, key: "chat", stat: "Chat questions" },
] as const;

const icons = { email: Mail, plan: CalendarCheck, research: BookOpenText, chat: MessagesSquare };

function Dashboard() {
  const [stats, , ready] = useLocal<Record<string, number>>("wa.stats", {});
  const [activity] = useLocal<Activity[]>("wa.activity", []);
  const [tasks] = useLocal<{ done: boolean }[]>("wa.planner.items", []);
  const open = tasks.filter((t) => !t.done).length;

  return (
    <div>
      <div className="mb-8 rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
        <p className="text-sm opacity-80">Good to see you</p>
        <h1 className="mt-1 font-display text-2xl font-semibold md:text-3xl">What are we getting done today?</h1>
        <p className="mt-2 max-w-xl text-sm opacity-80">
          {open > 0 ? `You have ${open} open task${open === 1 ? "" : "s"} on your plan.` : "Pick a tool below to get started."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tools.map((t) => (
          <Card key={t.key} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">{t.stat}</span>
                <t.icon className="h-4 w-4" />
              </div>
              {ready ? (
                <div className="mt-2 font-display text-3xl font-semibold">{stats[t.key] ?? 0}</div>
              ) : (
                <Skeleton className="mt-2 h-9 w-12" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold">Quick launch</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map((t) => (
              <Link key={t.to} to={t.to} className="group">
                <Card className="h-full shadow-card transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="rounded-lg bg-accent p-2.5 text-accent-foreground">
                      <t.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-sm text-muted-foreground">{t.desc}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet. Your AI work will show up here.</p>
            ) : (
              <ul className="space-y-3">
                {activity.slice(0, 8).map((a) => {
                  const Icon = icons[a.type];
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{a.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(a.at, { addSuffix: true })}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
