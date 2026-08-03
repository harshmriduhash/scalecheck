import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileCode2, Github, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAudit, runAudit } from "@/lib/audits.functions";
import { listGithubRepos } from "@/lib/github.functions";
import { AUDITABLE_EXTENSIONS, LANGUAGES, detectLanguage } from "@/lib/audit-types";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({
    meta: [
      { title: "New audit — ScaleCheck" },
      { name: "description", content: "Paste code, upload source files or scan a GitHub repository for scale issues." },
      { property: "og:title", content: "New audit — ScaleCheck" },
      { property: "og:description", content: "Paste code, upload source files or scan a GitHub repository for scale issues." },
    ],
  }),
  component: NewAudit,
});

const MAX_FILES = 20;

function NewAudit() {
  const navigate = useNavigate();
  const create = useServerFn(createAudit);
  const run = useServerFn(runAudit);
  const fetchRepos = useServerFn(listGithubRepos);

  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [filename, setFilename] = useState("service.js");
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [repo, setRepo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const repos = useQuery({ queryKey: ["repos"], queryFn: () => fetchRepos() });

  async function start(
    payload: Parameters<typeof create>[0] extends { data: infer D } ? D : never,
    analysisFiles?: { path: string; content: string }[],
  ) {
    setBusy(true);
    try {
      const { auditId } = await create({ data: payload });
      void run({ data: { auditId, files: analysisFiles } }).catch(() => {});
      await navigate({ to: "/audits/$id", params: { id: auditId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start the audit.");
      setBusy(false);
    }
  }

  async function onPaste() {
    if (code.trim().length < 40) {
      toast.error("Paste a bit more code — at least a full function.");
      return;
    }
    await start(
      {
        name: filename || "Pasted snippet",
        sourceType: "paste",
        language,
        filename: filename || "snippet.txt",
        fileCount: 1,
        lineCount: code.split("\n").length,
      },
      [{ path: filename || "snippet.txt", content: code }],
    );
  }

  async function onPickFiles(list: FileList | null) {
    if (!list) return;
    const accepted: { path: string; content: string }[] = [];
    for (const file of Array.from(list).slice(0, MAX_FILES)) {
      if (!AUDITABLE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) continue;
      if (file.size > 300_000) continue;
      accepted.push({ path: file.name, content: await file.text() });
    }
    if (!accepted.length) {
      toast.error("No supported source files found in that selection.");
      return;
    }
    setFiles(accepted);
  }

  async function onUpload() {
    if (!files.length) return;
    await start(
      {
        name: `${files.length} file${files.length > 1 ? "s" : ""} upload`,
        sourceType: "upload",
        language: detectLanguage(files[0]?.path ?? ""),
        fileCount: files.length,
        lineCount: files.reduce((n, f) => n + f.content.split("\n").length, 0),
      },
      files,
    );
  }

  async function onRepo() {
    const selected = repos.data?.find((r) => r.full_name === repo);
    if (!selected) {
      toast.error("Pick a repository first.");
      return;
    }
    await start({
      name: selected.full_name,
      sourceType: "github",
      language: selected.language ?? undefined,
      repoFullName: selected.full_name,
      repoBranch: selected.default_branch,
      fileCount: 25,
      lineCount: 0,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your code is analysed in memory and discarded once the report is written.
        </p>
      </div>

      <Tabs defaultValue="paste">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paste">
            <FileCode2 className="size-4" /> Paste
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="size-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="github">
            <Github className="size-4" /> GitHub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="panel mt-4 space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="filename">File name</Label>
              <Input id="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="code">Code</Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={16}
              spellCheck={false}
              className="font-mono text-xs"
              placeholder="// paste the service, route handler or worker you want audited"
            />
            <p className="font-mono text-[11px] text-muted-foreground">{code.split("\n").length} lines</p>
          </div>
          <Button onClick={() => void onPaste()} disabled={busy} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Run audit
          </Button>
        </TabsContent>

        <TabsContent value="upload" className="panel mt-4 space-y-4 p-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center transition-colors hover:border-primary/60"
          >
            <Upload className="size-6 text-primary" />
            <span className="text-sm">Choose up to {MAX_FILES} source files</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {AUDITABLE_EXTENSIONS.join(" ")}
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => void onPickFiles(e.target.files)}
          />
          {files.length > 0 && (
            <ul className="space-y-1 font-mono text-xs text-muted-foreground">
              {files.map((f) => (
                <li key={f.path}>· {f.path}</li>
              ))}
            </ul>
          )}
          <Button onClick={() => void onUpload()} disabled={busy || !files.length} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null} Audit {files.length || ""} files
          </Button>
        </TabsContent>

        <TabsContent value="github" className="panel mt-4 space-y-4 p-5">
          {repos.isLoading && <p className="font-mono text-xs text-muted-foreground">loading repositories…</p>}
          {!repos.isLoading && !repos.data?.length && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No GitHub connection yet. Connect your account to audit repositories.
              </p>
              <Button variant="outline" onClick={() => void navigate({ to: "/settings" })}>
                Connect GitHub
              </Button>
            </div>
          )}
          {!!repos.data?.length && (
            <>
              <div className="space-y-1.5">
                <Label>Repository</Label>
                <Select value={repo} onValueChange={setRepo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.data.map((r) => (
                      <SelectItem key={r.full_name} value={r.full_name}>
                        {r.full_name}
                        {r.private ? " (private)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                We scan the default branch and pick the largest source files, skipping tests and vendor
                directories.
              </p>
              <Button onClick={() => void onRepo()} disabled={busy || !repo} className="w-full">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null} Audit repository
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
