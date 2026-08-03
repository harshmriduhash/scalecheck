import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getGithubStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("github_connections")
      .select("github_login, auth_kind, created_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    return {
      connected: Boolean(data),
      login: (data?.github_login as string | null) ?? null,
      authKind: (data?.auth_kind as string | null) ?? null,
      oauthAvailable: Boolean(process.env["GITHUB_CLIENT_ID"] && process.env["GITHUB_CLIENT_SECRET"]),
    };
  });

export const getGithubAuthorizeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ redirectUri: z.string().url(), state: z.string().min(8).max(80) }).parse(data),
  )
  .handler(async ({ data }) => {
    const clientId = process.env["GITHUB_CLIENT_ID"];
    if (!clientId) throw new Error("GitHub OAuth is not configured yet. Use a personal access token instead.");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: data.redirectUri,
      scope: "read:user repo",
      state: data.state,
      allow_signup: "false",
    });
    return { url: `https://github.com/login/oauth/authorize?${params.toString()}` };
  });

export const completeGithubOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().min(4).max(200), redirectUri: z.string().url() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { exchangeOAuthCode, getViewer } = await import("@/lib/github.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { token, scope } = await exchangeOAuthCode(data.code, data.redirectUri);
    const viewer = await getViewer(token);

    const { error } = await supabaseAdmin.from("github_connections").upsert({
      user_id: context.userId,
      github_login: viewer.login,
      access_token: token,
      auth_kind: "oauth",
      scope,
    });
    if (error) throw new Error(error.message);
    return { login: viewer.login };
  });

export const connectGithubToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ token: z.string().min(20).max(255) }).parse(data))
  .handler(async ({ data, context }) => {
    const { getViewer } = await import("@/lib/github.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const viewer = await getViewer(data.token.trim());
    const { error } = await supabaseAdmin.from("github_connections").upsert({
      user_id: context.userId,
      github_login: viewer.login,
      access_token: data.token.trim(),
      auth_kind: "pat",
      scope: "pat",
    });
    if (error) throw new Error(error.message);
    return { login: viewer.login };
  });

export const disconnectGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("github_connections").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const listGithubRepos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conn } = await supabaseAdmin
      .from("github_connections")
      .select("access_token")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!conn) return [];

    const { listRepos } = await import("@/lib/github.server");
    return listRepos(conn.access_token as string);
  });
