export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const LANGUAGES = [
  {
    value: "javascript",
    label: "JavaScript / TypeScript",
    ext: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
  },
  { value: "python", label: "Python", ext: [".py"] },
  { value: "go", label: "Go", ext: [".go"] },
  { value: "java", label: "Java", ext: [".java"] },
  { value: "ruby", label: "Ruby", ext: [".rb"] },
  { value: "php", label: "PHP", ext: [".php"] },
  { value: "csharp", label: "C#", ext: [".cs"] },
  { value: "sql", label: "SQL", ext: [".sql"] },
  { value: "other", label: "Other", ext: [] },
] as const;

export const AUDITABLE_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".java",
  ".rb",
  ".php",
  ".cs",
  ".sql",
  ".kt",
  ".rs",
  ".scala",
];

export function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  for (const lang of LANGUAGES) {
    if (lang.ext.some((e) => lower.endsWith(e))) return lang.value;
  }
  return "other";
}

/** The 25+ scale-issue checks the engine looks for. Used in the UI and in the prompt. */
export const ISSUE_CATALOG: { type: string; title: string; severity: Severity; group: string }[] = [
  { type: "n1_query", title: "N+1 query pattern", severity: "critical", group: "Database" },
  {
    type: "connection_leak",
    title: "Connection pool exhaustion",
    severity: "critical",
    group: "Resources",
  },
  {
    type: "unhandled_exception",
    title: "Unhandled exception on a critical path",
    severity: "critical",
    group: "Reliability",
  },
  {
    type: "memory_leak",
    title: "Memory leak / unbounded growth",
    severity: "critical",
    group: "Resources",
  },
  { type: "sql_injection", title: "SQL injection", severity: "critical", group: "Security" },
  {
    type: "unbounded_query",
    title: "Unbounded query (no LIMIT)",
    severity: "critical",
    group: "Database",
  },
  {
    type: "missing_index",
    title: "Query without a supporting index",
    severity: "high",
    group: "Database",
  },
  {
    type: "missing_cache",
    title: "Missing cache on an expensive path",
    severity: "high",
    group: "Performance",
  },
  {
    type: "inefficient_sort",
    title: "Large in-memory sort",
    severity: "high",
    group: "Performance",
  },
  {
    type: "no_pagination",
    title: "No pagination on a list endpoint",
    severity: "high",
    group: "Performance",
  },
  {
    type: "blocking_operation",
    title: "Blocking synchronous operation",
    severity: "high",
    group: "Performance",
  },
  {
    type: "sequential_await",
    title: "Sequential awaits that could be parallel",
    severity: "high",
    group: "Performance",
  },
  {
    type: "no_timeout",
    title: "External call without timeout",
    severity: "high",
    group: "Reliability",
  },
  {
    type: "no_retry",
    title: "No retry / backoff on a flaky dependency",
    severity: "high",
    group: "Reliability",
  },
  {
    type: "missing_rate_limit",
    title: "No rate limiting on an expensive endpoint",
    severity: "high",
    group: "Security",
  },
  {
    type: "secret_in_code",
    title: "Hardcoded secret or credential",
    severity: "high",
    group: "Security",
  },
  {
    type: "missing_transaction",
    title: "Multi-step write without a transaction",
    severity: "high",
    group: "Database",
  },
  {
    type: "error_handling_gap",
    title: "Error handling gap",
    severity: "medium",
    group: "Reliability",
  },
  {
    type: "resource_cleanup",
    title: "Resource not cleaned up",
    severity: "medium",
    group: "Resources",
  },
  {
    type: "inefficient_loop",
    title: "Inefficient loop / repeated work",
    severity: "medium",
    group: "Performance",
  },
  {
    type: "hardcoded_limit",
    title: "Hardcoded limit or config",
    severity: "medium",
    group: "Maintainability",
  },
  {
    type: "sync_io_in_handler",
    title: "Synchronous I/O inside a request handler",
    severity: "medium",
    group: "Performance",
  },
  {
    type: "large_payload",
    title: "Oversized response payload",
    severity: "medium",
    group: "Performance",
  },
  {
    type: "missing_idempotency",
    title: "Non-idempotent write handler",
    severity: "medium",
    group: "Reliability",
  },
  {
    type: "logging_noise",
    title: "Excessive logging in a hot path",
    severity: "low",
    group: "Observability",
  },
  {
    type: "missing_metrics",
    title: "No metrics / observability on a critical path",
    severity: "low",
    group: "Observability",
  },
  {
    type: "magic_number",
    title: "Unclear magic number in scaling logic",
    severity: "low",
    group: "Maintainability",
  },
];

export type AuditIssue = {
  id: string;
  audit_id: string;
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
  status: string;
};

export type AuditRecord = {
  id: string;
  name: string;
  source_type: string;
  language: string | null;
  filename: string | null;
  repo_full_name: string | null;
  repo_branch: string | null;
  file_count: number;
  line_count: number;
  status: string;
  progress: number;
  progress_label: string | null;
  error_message: string | null;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  health_score: number | null;
  verdict: string | null;
  share_token: string | null;
  created_at: string;
  completed_at: string | null;
};

export const PLANS = {
  free: { name: "Free", price: "$0", audits: 5 },
  pro: { name: "Pro", price: "$199", audits: 50 },
  enterprise: { name: "Enterprise", price: "Custom", audits: Infinity },
} as const;

export function severityClasses(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-critical/15 text-critical border-critical/40";
    case "high":
      return "bg-high/15 text-high border-high/40";
    case "medium":
      return "bg-medium/15 text-medium border-medium/40";
    default:
      return "bg-low/15 text-low border-low/40";
  }
}
