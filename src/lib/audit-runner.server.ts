import type { SupabaseClient } from "@supabase/supabase-js";
import {
  analyseChunk,
  chunkFiles,
  dedupe,
  scoreHealth,
  verdictFor,
  type AnalysisFile,
} from "./audit-engine.server";
import type { Severity } from "./audit-types";

type Admin = SupabaseClient<any, any, any>;

export async function ensureQuota(admin: Admin, userId: string) {
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let sub = data;
  if (!sub) {
    const inserted = await admin
      .from("subscriptions")
      .insert({ user_id: userId })
      .select("*")
      .single();
    sub = inserted.data;
  }
  if (!sub) throw new Error("Could not load your plan.");

  const currentPeriod = new Date().toISOString().slice(0, 7) + "-01";
  if (sub.period_start !== currentPeriod) {
    const reset = await admin
      .from("subscriptions")
      .update({ period_start: currentPeriod, audits_used_this_month: 0 })
      .eq("user_id", userId)
      .select("*")
      .single();
    sub = reset.data ?? sub;
  }

  if (sub.audits_used_this_month >= sub.audits_per_month) {
    throw new Error(
      `You've used all ${sub.audits_per_month} audits in your ${sub.plan_id} plan this month. Upgrade to keep auditing.`,
    );
  }
  return sub;
}

export async function consumeQuota(admin: Admin, userId: string, used: number) {
  await admin
    .from("subscriptions")
    .update({ audits_used_this_month: used + 1 })
    .eq("user_id", userId);
}

export async function runAnalysis(
  admin: Admin,
  auditId: string,
  userId: string,
  files: AnalysisFile[],
) {
  const chunks = chunkFiles(files);
  const collected = [];

  try {
    for (let i = 0; i < chunks.length; i++) {
      await admin
        .from("audits")
        .update({
          progress: Math.round((i / chunks.length) * 90) + 5,
          progress_label: `Analysing ${Math.min((i + 1) * (chunks[i]?.length ?? 1), files.length)} of ${files.length} files…`,
        })
        .eq("id", auditId);

      const chunk = chunks[i];
      if (!chunk) continue;
      const issues = await analyseChunk(chunk);
      collected.push(...issues);
    }

    const unique = dedupe(collected);
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const issue of unique) counts[issue.severity] += 1;

    if (unique.length) {
      const rows = unique.map((i) => ({
        audit_id: auditId,
        user_id: userId,
        type: i.type,
        severity: i.severity,
        title: i.title,
        description: i.description,
        impact_description: i.impact,
        file_path: i.file,
        line_number: i.line,
        code_snippet: i.codeSnippet,
        recommendation: i.recommendation,
        fix_code_before: i.fixCodeBefore,
        fix_code_after: i.fixCodeAfter,
      }));
      const { error } = await admin.from("issues").insert(rows);
      if (error) throw new Error(error.message);
    }

    await admin
      .from("audits")
      .update({
        status: "completed",
        progress: 100,
        progress_label: "Audit complete",
        critical_count: counts.critical,
        high_count: counts.high,
        medium_count: counts.medium,
        low_count: counts.low,
        health_score: scoreHealth(counts),
        verdict: verdictFor(counts),
        completed_at: new Date().toISOString(),
      })
      .eq("id", auditId);

    return { counts, total: unique.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit failed.";
    await admin
      .from("audits")
      .update({ status: "failed", error_message: message, progress_label: "Audit failed" })
      .eq("id", auditId);
    throw error;
  }
}
