import { AUDITABLE_EXTENSIONS } from "./audit-types";

const GH = "https://api.github.com";

function headers(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "scalecheck-auditor",
  };
}

async function gh<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GH}/${path}`, { headers: headers(token) });
  if (!res.ok) {
    const body = await res.text();
    console.error(`GitHub request failed [${res.status}] ${path}: ${body}`);
    if (res.status === 401)
      throw new Error("GitHub token is invalid or expired. Reconnect GitHub in Settings.");
    if (res.status === 403)
      throw new Error("GitHub rate limit or permission error. Try again shortly.");
    throw new Error(`GitHub request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export type GithubRepo = {
  full_name: string;
  name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  updated_at: string;
  language: string | null;
};

export async function getViewer(token: string) {
  return gh<{ login: string; avatar_url: string }>(token, "user");
}

export async function listRepos(token: string): Promise<GithubRepo[]> {
  const repos = await gh<GithubRepo[]>(
    token,
    "user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
  );
  return repos.map((r) => ({
    full_name: r.full_name,
    name: r.name,
    private: r.private,
    default_branch: r.default_branch,
    html_url: r.html_url,
    updated_at: r.updated_at,
    language: r.language,
  }));
}

type TreeEntry = { path: string; type: string; size?: number; sha: string };

const SKIP_DIRS = [
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  "vendor/",
  "test/",
  "tests/",
  "__tests__/",
  "spec/",
  "coverage/",
  "migrations/",
  ".git/",
  "public/",
  "docs/",
];

export async function collectRepoFiles(
  token: string,
  fullName: string,
  branch: string,
  maxFiles: number,
): Promise<{ path: string; content: string }[]> {
  const tree = await gh<{ tree: TreeEntry[]; truncated: boolean }>(
    token,
    `repos/${fullName}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );

  const candidates = tree.tree
    .filter((e) => e.type === "blob")
    .filter((e) => AUDITABLE_EXTENSIONS.some((ext) => e.path.toLowerCase().endsWith(ext)))
    .filter((e) => !SKIP_DIRS.some((d) => e.path.includes(d)))
    .filter((e) => !/\.(test|spec)\./i.test(e.path))
    .filter((e) => (e.size ?? 0) > 60 && (e.size ?? 0) < 120_000)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, maxFiles);

  const files: { path: string; content: string }[] = [];
  for (const entry of candidates) {
    try {
      const blob = await gh<{ content: string; encoding: string }>(
        token,
        `repos/${fullName}/git/blobs/${entry.sha}`,
      );
      const content =
        blob.encoding === "base64"
          ? Buffer.from(blob.content, "base64").toString("utf8")
          : blob.content;
      files.push({ path: entry.path, content });
    } catch (error) {
      console.error("Failed to read blob", entry.path, error);
    }
  }
  return files;
}

export async function exchangeOAuthCode(code: string, redirectUri: string) {
  const clientId = process.env["GITHUB_CLIENT_ID"];
  const clientSecret = process.env["GITHUB_CLIENT_SECRET"];
  if (!clientId || !clientSecret)
    throw new Error("GitHub OAuth is not configured on this deployment.");

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await res.json()) as {
    access_token?: string;
    scope?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(data.error_description ?? "GitHub did not return an access token.");
  }
  return { token: data.access_token, scope: data.scope ?? "" };
}
