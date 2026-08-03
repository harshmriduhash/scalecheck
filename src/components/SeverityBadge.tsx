import { severityClasses } from "@/lib/audit-types";

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${severityClasses(
        severity,
      )}`}
    >
      {severity}
    </span>
  );
}

export function CountPill({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${severityClasses(tone)}`}>
      <div className="font-mono text-xl leading-none">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest opacity-80">{label}</div>
    </div>
  );
}
