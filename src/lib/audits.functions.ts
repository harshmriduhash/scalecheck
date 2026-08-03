import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const fileSchema = z.object({
  path: z.string().min(1).max(400),
  content: z.string().min(1).max(400_000),
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  sourceType: z.enum(["paste", "upload", "github"]),
  language: z.string().max(40).optional(),
  filename: z.string().max(200).optional(),
  repoFullName: z.string().max(200).optional(),
  repoBranch: z.string().max(200).optional(),
  fileCount: z.number().int().min(1).max(60),
  lineCount: z.number().int().min(0),
});

export const createAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ensureQuota, consumeQuota } = await import("@/lib/audit-runner.server");

    const sub = await ensureQuota(supabaseAdmin, context.userId);

    const { data: audit, error } = await supabaseAdmin
      .from("audits")
      .insert({
        user_id: context.userId,
        name: data.name,
        source_type: data.sourceType,
        language: data.language ?? null,
        filename: data.filename ?? null,
        repo_full_name: data.repoFullName ?? null,
        repo_branch: data.repoBranch ?? null,
        file_count: data.fileCount,
        line_count: data.lineCount,
        status: "processing",
        progress: 3,
        progress_label: "Queued for analysis…",
      })
      .select("id")
      .single();

    if (error || !audit) throw new Error(error?.message ?? "Could not start the audit.");

    await consumeQuota(supabaseAdmin, context.userId, sub.audits_used_this_month);
    return { auditId: audit.id as string };
  });

export const runAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ auditId: z.string().uuid(), files: z.array(fileSchema).max(60).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runAnalysis } = await import("@/lib/audit-runner.server");

    const { data: audit } = await supabaseAdmin
      .from("audits")
      .select("*")
      .eq("id", data.auditId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!audit) throw new Error("Audit not found.");
    if (audit.status === "completed") return { ok: true };

    let files = data.files ?? [];

    if (audit.source_type === "github") {
      const { data: conn } = await supabaseAdmin
        .from("github_connections")
        .select("access_token")
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!conn) throw new Error("GitHub is not connected.");

      await supabaseAdmin
        .from("audits")
        .update({ progress: 4, progress_label: "Fetching repository files…" })
        .eq("id", data.auditId);

      const { collectRepoFiles } = await import("@/lib/github.server");
      files = await collectRepoFiles(
        conn.access_token as string,
        audit.repo_full_name as string,
        audit.repo_branch as string,
        Math.min(audit.file_count ?? 20, 40),
      );

      await supabaseAdmin
        .from("audits")
        .update({
          file_count: files.length || 1,
          line_count: files.reduce((n, f) => n + f.content.split("\n").length, 0),
        })
        .eq("id", data.auditId);
    }

    if (!files.length) {
      await supabaseAdmin
        .from("audits")
        .update({ status: "failed", error_message: "No analysable source files were found." })
        .eq("id", data.auditId);
      throw new Error("No analysable source files were found.");
    }

    const result = await runAnalysis(supabaseAdmin, data.auditId, context.userId, files);
    return { ok: true, ...result };
  });

export const listAudits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: audit, error } = await context.supabase
      .from("audits")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!audit) throw new Error("Audit not found.");

    const { data: issues } = await context.supabase
      .from("issues")
      .select("*")
      .eq("audit_id", data.id)
      .order("created_at", { ascending: true });

    const { data: previous } = await context.supabase
      .from("audits")
      .select("id, name, critical_count, high_count, medium_count, low_count, created_at")
      .eq("name", audit.name)
      .eq("status", "completed")
      .lt("created_at", audit.created_at)
      .order("created_at", { ascending: false })
      .limit(1);

    return { audit, issues: issues ?? [], previous: previous?.[0] ?? null };
  });

export const deleteAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("audits").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setAuditShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), enabled: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const token = data.enabled ? crypto.randomUUID().replace(/-/g, "") : null;
    const { data: updated, error } = await context.supabase
      .from("audits")
      .update({ share_token: token })
      .eq("id", data.id)
      .select("share_token")
      .single();
    if (error) throw new Error(error.message);
    return { shareToken: updated.share_token as string | null };
  });

export const setIssueStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["open", "resolved", "ignored"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("issues")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAccountOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: sub }, { data: audits }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("subscriptions").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase
        .from("audits")
        .select("id, name, status, critical_count, high_count, medium_count, low_count, created_at, source_type, health_score")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const { count: totalAudits } = await context.supabase
      .from("audits")
      .select("id", { count: "exact", head: true });
    const { count: totalIssues } = await context.supabase
      .from("issues")
      .select("id", { count: "exact", head: true });
    const { count: criticalIssues } = await context.supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("severity", "critical");

    return {
      profile,
      subscription: sub,
      recent: audits ?? [],
      stats: {
        totalAudits: totalAudits ?? 0,
        totalIssues: totalIssues ?? 0,
        criticalIssues: criticalIssues ?? 0,
        thisMonth: sub?.audits_used_this_month ?? 0,
        allowance: sub?.audits_per_month ?? 5,
      },
      };
    };
  });

export const getSharedAudit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(8).max(64) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: audit } = await supabaseAdmin
      .from("audits")
      .select(
        "id, name, source_type, language, repo_full_name, file_count, line_count, status, critical_count, high_count, medium_count, low_count, health_score, verdict, created_at, completed_at",
      )
      .eq("share_token", data.token)
      .maybeSingle();

    if (!audit) throw new Error("This shared audit link is no longer valid.");

    const { data: issues } = await supabaseAdmin
      .from("issues")
      .select(
        "id, audit_id, type, severity, title, description, impact_description, file_path, line_number, code_snippet, recommendation, fix_code_before, fix_code_after, status",
      )
      .eq("audit_id", audit.id)
      .order("created_at", { ascending: true });

    return { audit, issues: issues ?? [] };
  });
