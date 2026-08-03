import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { deleteAudit, listAudits } from "@/lib/audits.functions";

export const Route = createFileRoute("/_authenticated/audits/")({
  head: () => ({
    meta: [
      { title: "Audit history — ScaleCheck" },
      {
        name: "description",
        content: "Every scale audit you've run, with issue counts and health scores.",
      },
      { property: "og:title", content: "Audit history — ScaleCheck" },
      {
        property: "og:description",
        content: "Every scale audit you've run, with issue counts and health scores.",
      },
    ],
  }),
  component: History,
});

function History() {
  const fetchAudits = useServerFn(listAudits);
  const removeAudit = useServerFn(deleteAudit);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["audits"], queryFn: () => fetchAudits() });

  async function onDelete(id: string) {
    try {
      await removeAudit({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["audits"] });
      toast.success("Audit deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete audit.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit history</h1>
        <p className="mt-1 text-sm text-muted-foreground">All audits run on this account.</p>
      </div>

      {isLoading && (
        <div className="panel p-5 font-mono text-xs text-muted-foreground">loading…</div>
      )}
      {!isLoading && !data?.length && (
        <div className="panel p-8 text-center">
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/new">Run an audit</Link>
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {data?.map((audit) => (
          <div key={audit.id} className="panel flex flex-wrap items-center gap-4 p-4">
            <Link to="/audits/$id" params={{ id: audit.id }} className="min-w-0 flex-1">
              <div className="truncate font-medium">{audit.name}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {audit.source_type} · {audit.file_count} files ·{" "}
                {new Date(audit.created_at).toLocaleString()}
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {audit.status === "completed" ? (
                <>
                  {audit.critical_count > 0 && <SeverityBadge severity="critical" />}
                  {audit.high_count > 0 && <SeverityBadge severity="high" />}
                  <span className="font-mono text-sm text-primary">
                    {audit.health_score ?? "—"}/100
                  </span>
                </>
              ) : (
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {audit.status}
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={() => void onDelete(audit.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
