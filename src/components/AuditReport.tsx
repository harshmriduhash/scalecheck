import { useState } from "react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { SEVERITIES, type Severity } from "@/lib/audit-types";

type Issue = {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  impact_description: string | null;
  file_path: string | null;
  line_number: number | null;
  code_snippet: string | null;
  recommendation: string | null;
  fix_code_before: string | null;
  fix_code_after: string | null;
  status?: string;
};

type Audit = {
  name: string;
  source_type: string;
  language: string | null;
  file_count: number | null;
  line_count: number | null;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  health_score: number | null;
  verdict: string | null;
  created_at: string;
};

export function AuditReport({
  audit,
  issues,
  onStatusChange,
  previous,
}: {
  audit: Audit;
  issues: Issue[];
  onStatusChange?: (id: string, status: "open" | "resolved" | "ignored") => Promise<void> | void;
  previous?: { critical_count: number; high_count: number; medium_count: number; low_count: number } | null;
}) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const counts: Record<Severity, number> = {
    critical: audit.critical_count,
    high: audit.high_count,
    medium: audit.medium_count,
    low: audit.low_count,
  };
  const total = SEVERITIES.reduce((n, s) => n + counts[s], 0);
  const prevTotal = previous
    ? previous.critical_count + previous.high_count + previous.medium_count + previous.low_count
    : null;

  const visible = issues.filter((i) => filter === "all" || i.severity === filter);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{audit.name}</h1>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {audit.source_type} · {audit.language ?? "mixed"} · {audit.file_count ?? 0} files ·{" "}
              {audit.line_count ?? 0} lines · {new Date(audit.created_at).toLocaleString()}
            </p>
            {audit.verdict && <p className="mt-4 max-w-xl text-sm text-muted-foreground">{audit.verdict}</p>}
            {prevTotal !== null && (
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                previous run: {prevTotal} issues ({total - prevTotal >= 0 ? "+" : ""}
                {total - prevTotal})
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="font-mono text-5xl text-primary">{audit.health_score ?? "—"}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              scale score
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SEVERITIES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={`rounded-lg border p-3 text-left transition-opacity ${
                filter !== "all" && filter !== s ? "opacity-40" : ""
              } ${
                s === "critical"
                  ? "border-critical/40 bg-critical/10 text-critical"
                  : s === "high"
                    ? "border-high/40 bg-high/10 text-high"
                    : s === "medium"
                      ? "border-medium/40 bg-medium/10 text-medium"
                      : "border-low/40 bg-low/10 text-low"
              }`}
            >
              <div className="font-mono text-2xl leading-none">{counts[s]}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-80">{s}</div>
            </button>
          ))}
        </div>
      </div>

      {total === 0 && (
        <div className="panel p-10 text-center">
          <p className="font-mono text-sm text-primary">No scale-killers detected.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This code looks ready for load. Re-audit after your next big change.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((issue) => (
          <div key={issue.id} className="panel p-5">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityBadge severity={issue.severity} />
              <h3 className="flex-1 font-medium">{issue.title}</h3>
              {onStatusChange && (
                <div className="flex gap-1">
                  <Button
                    variant={issue.status === "resolved" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => void onStatusChange(issue.id, issue.status === "resolved" ? "open" : "resolved")}
                  >
                    Resolved
                  </Button>
                  <Button
                    variant={issue.status === "ignored" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => void onStatusChange(issue.id, issue.status === "ignored" ? "open" : "ignored")}
                  >
                    Ignore
                  </Button>
                </div>
              )}
            </div>

            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {issue.file_path ?? "unknown"}
              {issue.line_number ? `:${issue.line_number}` : ""} · {issue.type}
            </p>

            {issue.description && <p className="mt-3 text-sm text-muted-foreground">{issue.description}</p>}
            {issue.impact_description && (
              <p className="mt-2 text-sm text-high">At scale: {issue.impact_description}</p>
            )}

            {issue.code_snippet && (
              <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-secondary/40 p-3 font-mono text-[11px]">
                {issue.code_snippet}
              </pre>
            )}

            {issue.recommendation && (
              <p className="mt-4 text-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">fix</span>{" "}
                {issue.recommendation}
              </p>
            )}

            {(issue.fix_code_before || issue.fix_code_after) && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {issue.fix_code_before && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-critical">before</div>
                    <pre className="mt-1 overflow-x-auto rounded-md border border-critical/30 bg-critical/5 p-3 font-mono text-[11px]">
                      {issue.fix_code_before}
                    </pre>
                  </div>
                )}
                {issue.fix_code_after && (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary">after</div>
                    <pre className="mt-1 overflow-x-auto rounded-md border border-primary/30 bg-primary/5 p-3 font-mono text-[11px]">
                      {issue.fix_code_after}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
