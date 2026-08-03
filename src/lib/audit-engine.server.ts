import { ISSUE_CATALOG, type Severity } from "./audit-types";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.5-flash";

export type AnalysisFile = { path: string; content: string };

export type RawIssue = {
  type: string;
  severity: Severity;
  title: string;
  description: string;
  impact: string;
  file: string;
  line: number | null;
  codeSnippet: string;
  recommendation: string;
  fixCodeBefore: string;
  fixCodeAfter: string;
};

const SYSTEM_PROMPT = `You are an expert production engineer who specialises in identifying scale issues.
Your job is to audit code and identify problems that will cause outages when traffic increases 10-100x.

You understand database query patterns (N+1, missing indexes, missing caching), connection pooling and
resource management, memory management and leaks, error handling, security vulnerabilities and general
production best practices.

When analysing code:
1. Look only for patterns that genuinely scale poorly. Do NOT invent issues; if the code is clean, return an empty list.
2. Explain the specific problem in plain language.
3. Show the impact at 10x and 100x scale with concrete numbers where possible.
4. Provide a concrete fix with a real before/after code example taken from the supplied code.
5. Score severity by likelihood x blast radius.

Known issue types (use the closest matching "type" value, or "other"):
${ISSUE_CATALOG.map((i) => `- ${i.type}: ${i.title}`).join("\n")}

Reply with STRICT JSON only, no markdown fences:
{"issues":[{"type":"n1_query","severity":"critical","title":"...","description":"...","impact":"At 100x scale this becomes...","file":"src/x.ts","line":234,"codeSnippet":"...","recommendation":"...","fixCodeBefore":"...","fixCodeAfter":"..."}]}`;

function buildUserPrompt(files: AnalysisFile[]) {
  const body = files
    .map((f) => {
      const numbered = f.content
        .split("\n")
        .map((line, i) => `${i + 1}| ${line}`)
        .join("\n");
      return `--- FILE: ${f.path} ---\n${numbered}`;
    })
    .join("\n\n");

  return `Analyse this code for scale issues. Line numbers are prefixed as "N| ".

${body}

Specifically check for: N+1 query patterns, missing database indexes, missing caching, connection pool
issues, memory leaks, unbounded queries and missing pagination, blocking operations, error handling gaps,
missing timeouts/retries, resource cleanup and security vulnerabilities.

Return the JSON object described in the system prompt. Use the exact file paths given above and the real
line number from the "N| " prefix.`;
}

function coerceSeverity(value: unknown): Severity {
  const v = String(value ?? "").toLowerCase();
  if (v === "critical" || v === "high" || v === "medium" || v === "low") return v;
  return "medium";
}

function extractJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function analyseChunk(files: AnalysisFile[]): Promise<RawIssue[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI service is not configured.");

  const response = await fetch(AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(files) },
      ],
    }),
  });

  if (response.status === 429)
    throw new Error("Analysis rate limit reached. Please try again in a minute.");
  if (response.status === 402)
    throw new Error("AI credits exhausted. Top up your workspace to keep auditing.");
  if (!response.ok) {
    const body = await response.text();
    console.error(`AI gateway failed [${response.status}]: ${body}`);
    throw new Error(`Analysis failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(content) as { issues?: unknown[] } | null;
  const issues = Array.isArray(parsed?.issues) ? parsed.issues : [];

  const knownPaths = new Set(files.map((f) => f.path));

  return issues
    .map((raw) => {
      const i = raw as Record<string, unknown>;
      const title = String(i["title"] ?? "").trim();
      if (!title) return null;
      const file = String(i["file"] ?? files[0]?.path ?? "");
      const lineValue = Number(i["line"]);
      return {
        type: String(i["type"] ?? "other").trim() || "other",
        severity: coerceSeverity(i["severity"]),
        title,
        description: String(i["description"] ?? ""),
        impact: String(i["impact"] ?? ""),
        file: knownPaths.has(file) ? file : (files[0]?.path ?? file),
        line: Number.isFinite(lineValue) && lineValue > 0 ? Math.round(lineValue) : null,
        codeSnippet: String(i["codeSnippet"] ?? ""),
        recommendation: String(i["recommendation"] ?? ""),
        fixCodeBefore: String(i["fixCodeBefore"] ?? ""),
        fixCodeAfter: String(i["fixCodeAfter"] ?? ""),
      } satisfies RawIssue;
    })
    .filter((i): i is RawIssue => i !== null);
}

/** Split files into chunks that stay comfortably inside a single model call. */
export function chunkFiles(files: AnalysisFile[], maxChars = 24000): AnalysisFile[][] {
  const chunks: AnalysisFile[][] = [];
  let current: AnalysisFile[] = [];
  let size = 0;

  for (const file of files) {
    const content = file.content.length > maxChars ? file.content.slice(0, maxChars) : file.content;
    const trimmed = { path: file.path, content };
    if (size + content.length > maxChars && current.length > 0) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(trimmed);
    size += content.length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

const WEIGHTS: Record<Severity, number> = { critical: 18, high: 8, medium: 3, low: 1 };

export function scoreHealth(counts: Record<Severity, number>): number {
  const penalty =
    counts.critical * WEIGHTS.critical +
    counts.high * WEIGHTS.high +
    counts.medium * WEIGHTS.medium +
    counts.low * WEIGHTS.low;
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function verdictFor(counts: Record<Severity, number>): string {
  if (counts.critical > 0) return "Not production-ready — critical scale risks found";
  if (counts.high > 2) return "Risky at scale — several high-severity issues";
  if (counts.high > 0) return "Mostly solid — fix the high-severity issues before scaling";
  if (counts.medium + counts.low > 0) return "Production-ready with minor cleanups";
  return "Production-ready — no scale issues detected";
}

export function dedupe(issues: RawIssue[]): RawIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.type}|${i.file}|${i.line ?? "?"}|${i.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
