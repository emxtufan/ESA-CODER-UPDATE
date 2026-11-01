/**
 * Sincronizare GitHub (§8) — aduce commits, pull requests și releases pentru un repository
 * și le salvează idempotent, pe cheile unice din schemă (`(repositoryId, hash)`,
 * `(repositoryId, number)`, `(repositoryId, tag)`).
 *
 * Tokenul nu apare niciodată în erori sau loguri: mesajele de eroare conțin doar statusul.
 */
import { eq } from "drizzle-orm";

import type { Db } from "../../db/client";
import { commits, pullRequests, releases, repositories } from "../../db/schema/github";
import type { Env } from "../../env";
import { HttpError } from "../../lib/http";

/** Rândul de repository primit de la apelant. */
type Repository = typeof repositories.$inferSelect;

/** Adresa API-ului GitHub și timeout-ul unei cereri. */
const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 15000;

export interface CommitInput {
  hash: string;
  message: string | null;
  author: string | null;
  authorEmail: string | null;
  date: Date | null;
  branch: string | null;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  url: string | null;
}

export interface PullInput {
  number: number;
  title: string | null;
  author: string | null;
  status: string | null;
  createdAt: Date | null;
  mergedAt: Date | null;
  headRef: string | null;
  baseRef: string | null;
  url: string | null;
}

export interface ReleaseInput {
  version: string;
  tag: string;
  notes: string | null;
  date: Date | null;
}

export interface SyncResult {
  commits: number;
  pulls: number;
  releases: number;
}

/** Commit: unic pe `(repositoryId, hash)` — reluatul nu dublează nimic. */
export async function upsertCommit(
  db: Db,
  repositoryId: string,
  commit: CommitInput,
): Promise<void> {
  await db
    .insert(commits)
    .values({ repositoryId, ...commit })
    .onConflictDoNothing({ target: [commits.repositoryId, commits.hash] });
}

/** Pull request: unic pe `(repositoryId, number)` — se actualizează la fiecare sincronizare. */
export async function upsertPull(
  db: Db,
  repositoryId: string,
  pull: PullInput,
): Promise<void> {
  /** `created_at` are default în schemă: îl scriem doar când GitHub îl trimite. */
  const createdAt = pull.createdAt ? { createdAt: pull.createdAt } : {};

  await db
    .insert(pullRequests)
    .values({
      repositoryId,
      number: pull.number,
      title: pull.title,
      author: pull.author,
      status: pull.status,
      mergedAt: pull.mergedAt,
      headRef: pull.headRef,
      baseRef: pull.baseRef,
      url: pull.url,
      ...createdAt,
    })
    .onConflictDoUpdate({
      target: [pullRequests.repositoryId, pullRequests.number],
      set: {
        title: pull.title,
        author: pull.author,
        status: pull.status,
        mergedAt: pull.mergedAt,
        headRef: pull.headRef,
        baseRef: pull.baseRef,
        url: pull.url,
        ...createdAt,
      },
    });
}

/** Release: unic pe `(repositoryId, tag)`. */
export async function upsertRelease(
  db: Db,
  repositoryId: string,
  release: ReleaseInput,
): Promise<void> {
  await db
    .insert(releases)
    .values({
      repositoryId,
      version: release.version,
      tag: release.tag,
      notes: release.notes,
      date: release.date,
    })
    .onConflictDoUpdate({
      target: [releases.repositoryId, releases.tag],
      set: {
        version: release.version,
        notes: release.notes,
        date: release.date,
      },
    });
}

/** Formele minime ale răspunsurilor GitHub pe care le citim. */
interface GithubRepoPayload {
  html_url?: string | null;
  default_branch?: string | null;
  visibility?: string | null;
  private?: boolean;
}

interface GithubCommitPayload {
  sha?: string;
  html_url?: string | null;
  commit?: {
    message?: string | null;
    author?: { name?: string | null; email?: string | null; date?: string | null } | null;
  } | null;
}

interface GithubPullPayload {
  number?: number;
  title?: string | null;
  user?: { login?: string | null } | null;
  state?: string | null;
  created_at?: string | null;
  merged_at?: string | null;
  head?: { ref?: string | null } | null;
  base?: { ref?: string | null } | null;
  html_url?: string | null;
}

interface GithubReleasePayload {
  name?: string | null;
  tag_name?: string | null;
  body?: string | null;
  published_at?: string | null;
}

/** Data ISO din GitHub → `Date`, sau `null` pentru lipsă/valoare invalidă. */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Cerere autentificată către API-ul GitHub. Orice eșec devine 502 `github_error`, cu
 * statusul în mesaj; tokenul rămâne doar în header.
 */
async function githubGet<T>(token: string, path: string): Promise<T> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "esa-management",
  };

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, "github_error", "GitHub nu răspunde");
  }

  if (!response.ok) {
    throw new HttpError(502, "github_error", `GitHub a răspuns ${response.status}`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new HttpError(502, "github_error", `GitHub a răspuns ${response.status}`);
  }
}

/**
 * Sincronizează un repository: detalii, commits, pull requests și releases. Marchează
 * repository-ul `error` la orice eșec GitHub și `connected` la final.
 */
export async function syncRepository(
  db: Db,
  env: Env,
  repo: Repository,
): Promise<SyncResult> {
  if (!env.GITHUB_TOKEN) {
    throw new HttpError(
      503,
      "github_not_configured",
      "GitHub nu este conectat: setează GITHUB_TOKEN",
    );
  }

  const token = env.GITHUB_TOKEN;
  const base = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;

  try {
    // ponytail: doar prima pagină; paginare când un repo depășește 50 de commit-uri între sincronizări.
    const [details, commitList, pullList, releaseList] = await Promise.all([
      githubGet<GithubRepoPayload>(token, base),
      githubGet<GithubCommitPayload[]>(token, `${base}/commits?per_page=50`),
      githubGet<GithubPullPayload[]>(token, `${base}/pulls?state=all&per_page=50`),
      githubGet<GithubReleasePayload[]>(token, `${base}/releases?per_page=30`),
    ]);

    const branch = details.default_branch ?? null;

    let commitCount = 0;
    for (const item of commitList) {
      if (!item.sha) continue;
      await upsertCommit(db, repo.id, {
        hash: item.sha,
        message: item.commit?.message ?? null,
        author: item.commit?.author?.name ?? null,
        authorEmail: item.commit?.author?.email ?? null,
        date: toDate(item.commit?.author?.date),
        branch,
        url: item.html_url ?? null,
      });
      commitCount += 1;
    }

    let pullCount = 0;
    for (const item of pullList) {
      if (typeof item.number !== "number") continue;
      await upsertPull(db, repo.id, {
        number: item.number,
        title: item.title ?? null,
        author: item.user?.login ?? null,
        status: item.merged_at ? "merged" : (item.state ?? null),
        createdAt: toDate(item.created_at),
        mergedAt: toDate(item.merged_at),
        headRef: item.head?.ref ?? null,
        baseRef: item.base?.ref ?? null,
        url: item.html_url ?? null,
      });
      pullCount += 1;
    }

    let releaseCount = 0;
    for (const item of releaseList) {
      if (!item.tag_name) continue;
      await upsertRelease(db, repo.id, {
        version: item.name || item.tag_name,
        tag: item.tag_name,
        notes: item.body ?? null,
        date: toDate(item.published_at),
      });
      releaseCount += 1;
    }

    await db
      .update(repositories)
      .set({
        defaultBranch: details.default_branch ?? null,
        visibility: details.visibility ?? (details.private ? "private" : "public"),
        url: details.html_url ?? null,
        status: "connected",
        lastSyncAt: new Date(),
      })
      .where(eq(repositories.id, repo.id));

    return { commits: commitCount, pulls: pullCount, releases: releaseCount };
  } catch (error) {
    await db
      .update(repositories)
      .set({ status: "error" })
      .where(eq(repositories.id, repo.id));
    throw error;
  }
}
