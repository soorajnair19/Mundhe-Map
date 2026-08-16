import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CommunityRequest, FDAReport } from "@/lib/admin/types";

export const FDA_LEDGER_RELATIVE = "data/admin/pending-fda-reports.json";
export const COMMUNITY_LEDGER_RELATIVE = "data/admin/community-requests.json";

export class PersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistError";
  }
}

export function persistMessageSafe(error: unknown): string {
  if (error instanceof PersistError) return error.message;
  if (error instanceof Error) return error.message;
  return "Could not save the ledger.";
}

export interface LedgerSnapshot {
  reports: FDAReport[];
  mtime: number;
  sha: string | null;
}

export interface CommunityLedgerSnapshot {
  requests: CommunityRequest[];
  mtime: number;
  sha: string | null;
}

interface LedgerFileConfig {
  relativePath: string;
  ledgerLabel: string;
  commitMessage: string;
}

interface GenericLedgerSnapshot<T> {
  data: T[];
  mtime: number;
  sha: string | null;
}

const FDA_LEDGER: LedgerFileConfig = {
  relativePath: FDA_LEDGER_RELATIVE,
  ledgerLabel: "FDA",
  commitMessage: "chore: update FDA report ledger",
};

const COMMUNITY_LEDGER: LedgerFileConfig = {
  relativePath: COMMUNITY_LEDGER_RELATIVE,
  ledgerLabel: "community",
  commitMessage: "chore: update community request ledger",
};

function ledgerPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
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

function serialize<T>(data: T[]): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

async function githubRequest(
  pathname: string,
  init: RequestInit,
): Promise<Response> {
  const token = githubToken();
  if (!token) {
    throw new PersistError(
      "FDA_GITHUB_TOKEN is missing. Live changes on Vercel cannot be saved to the living ledger file.",
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

async function loadFromGitHub<T>(
  config: LedgerFileConfig,
): Promise<GenericLedgerSnapshot<T>> {
  const repo = githubRepo();
  if (!repo) {
    throw new PersistError(
      "Set FDA_GITHUB_REPO (owner/name) so the living ledger can be read on Vercel.",
    );
  }
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/contents/${config.relativePath}?ref=${encodeURIComponent(githubBranch())}`,
    { method: "GET", cache: "no-store" },
  );
  if (!response.ok) {
    throw new PersistError(
      `Could not read ${config.ledgerLabel} ledger from GitHub (${response.status}).`,
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
    data: JSON.parse(json) as T[],
    mtime: Date.now(),
    sha: body.sha ?? null,
  };
}

async function saveToGitHub<T>(
  config: LedgerFileConfig,
  data: T[],
  sha: string | null,
  attempt = 0,
): Promise<string> {
  const repo = githubRepo();
  if (!repo) {
    throw new PersistError(
      "Set FDA_GITHUB_REPO (owner/name) so the living ledger can be saved on Vercel.",
    );
  }
  const content = Buffer.from(serialize(data), "utf8").toString("base64");
  const response = await githubRequest(
    `/repos/${repo.owner}/${repo.repo}/contents/${config.relativePath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: config.commitMessage,
        content,
        sha: sha ?? undefined,
        branch: githubBranch(),
      }),
    },
  );
  if (response.status === 409 && attempt < 1) {
    const latest = await loadFromGitHub<T>(config);
    return saveToGitHub(config, data, latest.sha, attempt + 1);
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new PersistError(
      `Could not save ${config.ledgerLabel} ledger to GitHub (${response.status}). ${detail.slice(0, 200)}`,
    );
  }
  const body = (await response.json()) as { content?: { sha?: string } };
  return body.content?.sha ?? sha ?? "";
}

async function loadFromDisk<T>(
  config: LedgerFileConfig,
): Promise<GenericLedgerSnapshot<T>> {
  const file = ledgerPath(config.relativePath);
  const [raw, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
  return {
    data: JSON.parse(raw) as T[],
    mtime: info.mtimeMs,
    sha: null,
  };
}

async function loadLedger<T>(
  config: LedgerFileConfig,
): Promise<GenericLedgerSnapshot<T>> {
  if (onVercel() && githubToken()) {
    try {
      return await loadFromGitHub<T>(config);
    } catch {
      return loadFromDisk<T>(config);
    }
  }
  return loadFromDisk<T>(config);
}

async function saveLedger<T>(
  config: LedgerFileConfig,
  data: T[],
  sha: string | null,
): Promise<{ mtime: number; sha: string | null }> {
  if (onVercel()) {
    const nextSha = await saveToGitHub(config, data, sha);
    return { mtime: Date.now(), sha: nextSha };
  }

  const file = ledgerPath(config.relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, serialize(data), "utf8");
  const info = await stat(file);
  return { mtime: info.mtimeMs, sha };
}

export async function loadFdaLedger(): Promise<LedgerSnapshot> {
  const snapshot = await loadLedger<FDAReport>(FDA_LEDGER);
  return {
    reports: snapshot.data,
    mtime: snapshot.mtime,
    sha: snapshot.sha,
  };
}

export async function saveFdaLedger(
  reports: FDAReport[],
  sha: string | null,
): Promise<{ mtime: number; sha: string | null }> {
  return saveLedger(FDA_LEDGER, reports, sha);
}

export async function loadCommunityLedger(): Promise<CommunityLedgerSnapshot> {
  const snapshot = await loadLedger<CommunityRequest>(COMMUNITY_LEDGER);
  return {
    requests: snapshot.data,
    mtime: snapshot.mtime,
    sha: snapshot.sha,
  };
}

export async function saveCommunityLedger(
  requests: CommunityRequest[],
  sha: string | null,
): Promise<{ mtime: number; sha: string | null }> {
  return saveLedger(COMMUNITY_LEDGER, requests, sha);
}
