import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FDAReport } from "@/lib/admin/types";

export const FDA_LEDGER_RELATIVE = "data/admin/pending-fda-reports.json";

export class PersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistError";
  }
}

export function persistMessageSafe(error: unknown): string {
  if (error instanceof PersistError) return error.message;
  if (error instanceof Error) return error.message;
  return "Could not save the FDA ledger.";
}

export interface LedgerSnapshot {
  reports: FDAReport[];
  mtime: number;
  sha: string | null;
}

function ledgerPath(): string {
  return path.join(process.cwd(), FDA_LEDGER_RELATIVE);
}

function githubRepo(): { owner: string; repo: string } | null {
  const explicit = process.env.FDA_GITHUB_REPO?.trim();
  if (explicit?.includes("/")) {
    const [owner, repo] = explicit.split("/");
    if (owner && repo) return { owner, repo };
  }
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && repo) return { owner, repo };
  return null;
}

function githubBranch(): string {
  return (
    process.env.FDA_GITHUB_BRANCH?.trim() ||
    process.env.VERCEL_GIT_COMMIT_REF?.trim() ||
    "main"
  );
}

function githubToken(): string | null {
  return process.env.FDA_GITHUB_TOKEN?.trim() || null;
}

function onVercel(): boolean {
  return process.env.VERCEL === "1";
}

function serialize(reports: FDAReport[]): string {
  return `${JSON.stringify(reports, null, 2)}\n`;
}

async function githubRequest(
  pathname: string,
  init: RequestInit,
): Promise<Response> {
  const token = githubToken();
  if (!token) {
    throw new PersistError(
      "FDA_GITHUB_TOKEN is missing. Approvals on Vercel cannot be saved to the living ledger file.",
    );
  }
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
  return response;
}

async function loadFromGitHub(): Promise<LedgerSnapshot> {
  const repo = githubRepo();
  if (!repo) {
    throw new PersistError(
      "Set FDA_GITHUB_REPO (owner/name) so the living ledger can be read on Vercel.",
    );
  }
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/contents/${FDA_LEDGER_RELATIVE}?ref=${encodeURIComponent(githubBranch())}`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) {
    throw new PersistError(
      `Could not read FDA ledger from GitHub (${response.status}).`,
    );
  }
  const body = (await response.json()) as {
    sha?: string;
    content?: string;
    encoding?: string;
  };
  const encoded = (body.content ?? "").replace(/\n/g, "");
  const json = Buffer.from(encoded, "base64").toString("utf8");
  return {
    reports: JSON.parse(json) as FDAReport[],
    mtime: Date.now(),
    sha: body.sha ?? null,
  };
}

async function saveToGitHub(
  reports: FDAReport[],
  sha: string | null,
  attempt = 0,
): Promise<string> {
  const repo = githubRepo();
  if (!repo) {
    throw new PersistError(
      "Set FDA_GITHUB_REPO (owner/name) so the living ledger can be saved on Vercel.",
    );
  }
  const content = Buffer.from(serialize(reports), "utf8").toString("base64");
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/contents/${FDA_LEDGER_RELATIVE}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: "chore: update FDA report ledger",
        content,
        sha: sha ?? undefined,
        branch: githubBranch(),
      }),
    },
  );
  if (response.status === 409 && attempt < 1) {
    const latest = await loadFromGitHub();
    return saveToGitHub(reports, latest.sha, attempt + 1);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new PersistError(
      `Could not save FDA ledger to GitHub (${response.status}). ${detail.slice(0, 200)}`,
    );
  }
  const body = (await response.json()) as { content?: { sha?: string } };
  return body.content?.sha ?? sha ?? "";
}

async function loadFromDisk(): Promise<LedgerSnapshot> {
  const file = ledgerPath();
  const [raw, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
  return {
    reports: JSON.parse(raw) as FDAReport[],
    mtime: info.mtimeMs,
    sha: null,
  };
}

export async function loadFdaLedger(): Promise<LedgerSnapshot> {
  if (onVercel() && githubToken()) {
    try {
      return await loadFromGitHub();
    } catch {
      return loadFromDisk();
    }
  }
  return loadFromDisk();
}

export async function saveFdaLedger(
  reports: FDAReport[],
  sha: string | null,
): Promise<{ mtime: number; sha: string | null }> {
  if (onVercel()) {
    const nextSha = await saveToGitHub(reports, sha);
    return { mtime: Date.now(), sha: nextSha };
  }

  const file = ledgerPath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, serialize(reports), "utf8");
  const info = await stat(file);
  return { mtime: info.mtimeMs, sha };
}
