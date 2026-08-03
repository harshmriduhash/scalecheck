import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AuditReport } from "@/components/AuditReport";
import { getAudit, setAuditShare, setIssueStatus } from "@/lib/audits.functions";

export const Route = createFileRoute("/_authenticated/audits/$id")({
  head: () => ({
    meta: [
      { title: "Audit report — ScaleCheck" },
      {
        name: "description",
        content: "Scale readiness report with severity breakdown and before/after fixes.",
      },
      { property: "og:title", content: "Audit report — ScaleCheck" },
      {
        property: "og:description",
        content: "Scale readiness report with severity breakdown and before/after fixes.",
      },
    ],
  }),
  component: AuditDetail,
});

function AuditDetail() {
  const { id } = Route.useParams();
  const fetchAudit = useServerFn(getAudit);
  const share = useServerFn(setAuditShare);
  const updateIssue = useServerFn(setIssueStatus);
  const qc = useQueryClient();
  const [sharing, setSharing] = useState(false);

  const { data } = useQuery({
    queryKey: ["audit", id],
    queryFn: () => fetchAudit({ data: { id } }),
    refetchInterval: (query) => (query.state.data?.audit.status === "processing" ? 2500 : false),
  });

  const audit = data?.audit;
  const shareUrl = useMemo(
    () =>
      audit?.share_token && typeof window !== "undefined"
        ? `${window.location.origin}/share/${audit.share_token}`
        : null,
    [audit?.share_token],
  );

  async function toggleShare() {
    if (!audit) return;
    setSharing(true);
    try {
      const { shareToken } = await share({ data: { id, enabled: !audit.share_token } });
      await qc.invalidateQueries({ queryKey: ["audit", id] });
      toast.success(shareToken ? "Share link created" : "Sharing disabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update sharing.");
    } finally {
      setSharing(false);
    }
  }

  async function changeIssue(issueId: string, status: "open" | "resolved" | "ignored") {
    await updateIssue({ data: { id: issueId, status } });
    await qc.invalidateQueries({ queryKey: ["audit", id] });
  }

  if (!audit) {
    return <p className="font-mono text-xs text-muted-foreground">loading audit…</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/audits"
        className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> back to history
      </Link>

      {audit.status === "processing" && (
        <div className="panel p-6">
          <div className="flex items-center justify-between font-mono text-xs">
            <span>{audit.progress_label ?? "Analysing…"}</span>
            <span>{audit.progress ?? 0}%</span>
          </div>
          <Progress value={audit.progress ?? 0} className="mt-3" />
        </div>
      )}

      {audit.status === "failed" && (
        <div className="panel border-critical/50 p-6">
          <h2 className="font-medium text-critical">Audit failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{audit.error_message}</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link to="/new">Try again</Link>
          </Button>
        </div>
      )}

      {audit.status === "completed" && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void toggleShare()}
              disabled={sharing}
            >
              <Share2 className="size-4" />
              {audit.share_token ? "Disable sharing" : "Create share link"}
            </Button>
            {shareUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied");
                }}
              >
                <Copy className="size-4" /> Copy link
              </Button>
            )}
          </div>
          <AuditReport
            audit={audit}
            issues={data.issues}
            onStatusChange={changeIssue}
            previous={data.previous}
          />
        </>
      )}
    </div>
  );
}
