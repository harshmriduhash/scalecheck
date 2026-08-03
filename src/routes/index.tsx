import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, Github, Terminal, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISSUE_CATALOG } from "@/lib/audit-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScaleCheck — Find scale-killers before production" },
      {
        name: "description",
        content:
          "Audit your code for N+1 queries, memory leaks and connection pool exhaustion. Get a scale readiness score in under a minute.",
      },
      { property: "og:title", content: "ScaleCheck — Find scale-killers before production" },
      {
        property: "og:description",
        content:
          "Audit your code for N+1 queries, memory leaks and connection pool exhaustion. Get a scale readiness score in under a minute.",
      },
    ],
  }),
  component: Landing,
});

const GROUPS = Array.from(new Set(ISSUE_CATALOG.map((i) => i.group)));

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold">
            <Terminal className="size-4 text-primary" />
            scalecheck
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="px-3 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Button asChild size="sm">
              <Link to="/auth">Start auditing</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid-bg border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary">
            <Zap className="size-3" /> {ISSUE_CATALOG.length} scale-issue detectors
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Your code works at 100 users.
            <br />
            <span className="text-primary">It dies at 10,000.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            ScaleCheck reads your code the way production traffic does — hunting N+1 queries,
            unbounded memory, blocking loops and pool exhaustion before your launch does it for you.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Run a free audit</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">See plans</Link>
            </Button>
          </div>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            5 free audits every month · code never stored
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-2xl font-semibold tracking-tight">Three ways in</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Terminal,
              title: "Paste code",
              body: "Drop a file's worth of code and get findings in seconds.",
            },
            {
              icon: Upload,
              title: "Upload files",
              body: "Send up to 20 source files from your service at once.",
            },
            {
              icon: Github,
              title: "Connect GitHub",
              body: "Audit a whole repository branch on demand.",
            },
          ].map((c) => (
            <div key={c.title} className="panel p-6">
              <c.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-medium">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-2xl font-semibold tracking-tight">What we look for</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every finding comes with the failure mode, the line, and a before/after fix.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GROUPS.map((group) => (
              <div key={group} className="panel p-5">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                  <AlertTriangle className="size-3.5" />
                  {group}
                </div>
                <ul className="mt-3 space-y-2">
                  {ISSUE_CATALOG.filter((i) => i.group === group).map((issue) => (
                    <li key={issue.type} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {issue.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Find it before your users do</h2>
        <p className="mt-3 text-muted-foreground">
          One audit takes about a minute. Fixing a production outage takes a weekend.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth">Start free</Link>
        </Button>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-6xl px-4 font-mono text-xs text-muted-foreground">
          scalecheck — production code auditor
        </div>
      </footer>
    </div>
  );
}
