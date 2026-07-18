import type {
  ActivityEventDTO,
  MetricsDTO,
  RepoDTO,
  StandupDocDTO,
  StandupLength,
  StandupRangePreset,
  StandupTone,
  SyncResponse,
} from "@/lib/types";

/**
 * Thin client for Person A's APIs.
 * Never throws on missing/unauthorized routes — returns null so UI can fall back.
 */
async function safeJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchActivity(
  start: string,
  end: string,
): Promise<ActivityEventDTO[] | null> {
  const data = await safeJson<{ events: ActivityEventDTO[] }>(
    `/api/activity?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  );
  return data?.events ?? null;
}

export async function fetchMetrics(
  start: string,
  end: string,
): Promise<MetricsDTO | null> {
  return safeJson<MetricsDTO>(
    `/api/metrics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  );
}

export async function fetchRepos(): Promise<RepoDTO[] | null> {
  const data = await safeJson<{ repos: RepoDTO[] }>("/api/repos");
  return data?.repos ?? null;
}

export async function saveRepoSelection(repos: RepoDTO[]): Promise<boolean> {
  const res = await safeJson<{ ok?: boolean }>("/api/repos/selection", {
    method: "POST",
    body: JSON.stringify({
      repos: repos.map((r) => ({
        githubRepoId: r.githubRepoId,
        owner: r.owner,
        name: r.name,
        fullName: r.fullName,
        private: r.private,
        included: r.included,
      })),
    }),
  });
  return Boolean(res);
}

export async function triggerSync(): Promise<SyncResponse | null> {
  return safeJson<SyncResponse>("/api/sync", { method: "POST" });
}

export async function generateStandupApi(body: {
  preset: StandupRangePreset;
  start?: string;
  end?: string;
  tone: StandupTone;
  length: StandupLength;
  highlightMode?: boolean;
}): Promise<StandupDocDTO | null> {
  return safeJson<StandupDocDTO>("/api/standups/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchStandup(
  id: string,
  contentMd: string,
  contentJson: StandupDocDTO["contentJson"],
): Promise<StandupDocDTO | null> {
  return safeJson<StandupDocDTO>(`/api/standups/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ contentMd, contentJson }),
  });
}
