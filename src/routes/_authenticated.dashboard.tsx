import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, AlertOctagon, FileCode2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SeverityBadge } from "@/components/SeverityBadge";
import { getAccountOverview } from "@/lib/audits.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ScaleCheck" },
      {
        name: "description",
        content: "Your scale audit history, quota usage and critical issue counts.",
      },
      { property: "og:title", content: "Dashboard — ScaleCheck" },
      {
        property: "og:description",
        content: "Your scale audit history, quota usage and critical issue counts.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchOverview = useServerFn(getAccountOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["overview"],
    queryFn: () => fetchOverview(),
  });

  const stats = data?.stats;
  const pct = stats
    ? Math.min(100, Math.round((stats.thisMonth / Math.max(stats.allowance, 1)) * 100))
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scale readiness across everything you've audited.
          </p>
        </div>
        <Button asChild>
          <Link to="/new">
            <Plus className="size-4" /> New audit
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Audits run", value: stats?.totalAudits ?? 0, icon: Activity },
          { label: "Issues found", value: stats?.totalIssues ?? 0, icon: FileCode2 },
          { label: "Critical issues", value: stats?.criticalIssues ?? 0, icon: AlertOctagon },
          {
            label: "Used this month",
            value: `${stats?.thisMonth ?? 0}/${stats?.allowance ?? 5}`,
            icon: Activity,
          },
        ].map((card) => (
          <div key={card.label} className="panel p-5">
            <card.icon className="size-4 text-primary" />
            <div className="mt-3 font-mono text-2xl">{isLoading ? "—" : card.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between font-mono text-xs">
          <span className="uppercase tracking-widest text-muted-foreground">
            {data?.subscription?.plan_id ?? "free"} plan quota
          </span>
          <span>
            {stats?.thisMonth ?? 0} / {stats?.allowance ?? 5}
          </span>
        </div>
        <Progress value={pct} className="mt-3" />
        {pct >= 100 && (
          <p className="mt-3 font-mono text-xs text-high">
            You've hit this month's limit.{" "}
            <Link to="/pricing" className="underline">
              See plans
            </Link>
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight">Recent audits</h2>
        <div className="mt-4 space-y-2">
          {isLoading && (
            <div className="panel p-5 font-mono text-xs text-muted-foreground">loading…</div>
          )}
          {!isLoading && !data?.recent.length && (
            <div className="panel p-8 text-center">
              <p className="text-sm text-muted-foreground">No audits yet.</p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/new">Run your first audit</Link>
              </Button>
            </div>
          )}
          {data?.recent.map((audit) => (
            <Link
              key={audit.id}
              to="/audits/$id"
              params={{ id: audit.id }}
              className="panel flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-primary/50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{audit.name}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {audit.source_type} · {new Date(audit.created_at).toLocaleString()}
                </div>
              </div>
              {audit.status === "completed" ? (
                <div className="flex items-center gap-2">
                  {audit.critical_count > 0 && <SeverityBadge severity="critical" />}
                  <span className="font-mono text-sm">
                    {audit.critical_count + audit.high_count + audit.medium_count + audit.low_count}{" "}
                    issues
                  </span>
                  <span className="font-mono text-sm text-primary">
                    {audit.health_score ?? "—"}/100
                  </span>
                </div>
              ) : (
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {audit.status}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
