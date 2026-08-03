import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  completeGithubOAuth,
  connectGithubToken,
  disconnectGithub,
  getGithubAuthorizeUrl,
  getGithubStatus,
} from "@/lib/github.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ScaleCheck" },
      { name: "description", content: "Connect GitHub and manage your ScaleCheck account." },
      { property: "og:title", content: "Settings — ScaleCheck" },
      { property: "og:description", content: "Connect GitHub and manage your ScaleCheck account." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const status = useServerFn(getGithubStatus);
  const authorize = useServerFn(getGithubAuthorizeUrl);
  const complete = useServerFn(completeGithubOAuth);
  const withToken = useServerFn(connectGithubToken);
  const disconnect = useServerFn(disconnectGithub);
  const qc = useQueryClient();
  const [pat, setPat] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({ queryKey: ["github-status"], queryFn: () => status() });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    void complete({ data: { code, redirectUri: window.location.origin + "/settings" } })
      .then(async (res) => {
        toast.success(`Connected as ${res.login}`);
        await qc.invalidateQueries({ queryKey: ["github-status"] });
      })
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "GitHub connection failed."),
      )
      .finally(() => window.history.replaceState({}, "", "/settings"));
  }, [complete, qc]);

  async function startOAuth() {
    try {
      const { url } = await authorize({
        data: { redirectUri: window.location.origin + "/settings", state: crypto.randomUUID() },
      });
      window.location.href = url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "GitHub OAuth is unavailable.");
    }
  }

  async function savePat() {
    setBusy(true);
    try {
      const res = await withToken({ data: { token: pat } });
      setPat("");
      toast.success(`Connected as ${res.login}`);
      await qc.invalidateQueries({ queryKey: ["github-status"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify that token.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connect a code source to audit repositories.</p>
      </div>

      <div className="panel space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Github className="size-5" />
          <h2 className="font-medium">GitHub</h2>
        </div>

        {data?.connected ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-muted-foreground">
              connected as {data.login} ({data.authKind})
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await disconnect();
                await qc.invalidateQueries({ queryKey: ["github-status"] });
                toast.success("GitHub disconnected");
              }}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {data?.oauthAvailable && (
              <Button onClick={() => void startOAuth()}>
                <Github className="size-4" /> Connect with GitHub
              </Button>
            )}
            <div className="space-y-2">
              <Label htmlFor="pat">Personal access token</Label>
              <Input
                id="pat"
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_…"
                className="font-mono text-xs"
              />
              <p className="font-mono text-[11px] text-muted-foreground">
                Needs the <span className="text-foreground">repo</span> scope for private repositories.
              </p>
              <Button size="sm" onClick={() => void savePat()} disabled={busy || pat.length < 20}>
                Save token
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
