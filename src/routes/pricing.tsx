import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ScaleCheck Code Auditor" },
      {
        name: "description",
        content:
          "Free scale audits every month, with Pro and Enterprise tiers for teams shipping at volume.",
      },
      { property: "og:title", content: "Pricing — ScaleCheck Code Auditor" },
      {
        property: "og:description",
        content:
          "Free scale audits every month, with Pro and Enterprise tiers for teams shipping at volume.",
      },
    ],
  }),
  component: Pricing,
});

const TIERS = [
  {
    name: "Free",
    price: "$0",
    unit: "/month",
    features: ["5 audits per month", "Paste & file upload", "All 25+ detectors", "Audit history"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$199",
    unit: "/month",
    features: [
      "50 audits per month",
      "GitHub repository audits",
      "Shareable audit reports",
      "Before/after fix snippets",
      "Priority analysis queue",
    ],
    cta: "Join the waitlist",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "",
    features: ["Unlimited audits", "Team workspaces", "SSO", "Dedicated support"],
    cta: "Talk to us",
    highlight: false,
  },
];

function Pricing() {
  return (
    <div className="grid-bg min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-mono text-sm font-semibold">
            <Terminal className="size-4 text-primary" />
            scalecheck
          </Link>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Start free. Paid tiers open as we scale capacity — join the list and we'll reach out.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`panel flex flex-col p-6 ${tier.highlight ? "border-primary/60 shadow-[0_0_40px_-20px_var(--color-primary)]" : ""}`}
            >
              <div className="font-mono text-xs uppercase tracking-widest text-primary">
                {tier.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">{tier.price}</span>
                <span className="text-sm text-muted-foreground">{tier.unit}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8" variant={tier.highlight ? "default" : "outline"}>
                <Link to="/auth">{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
