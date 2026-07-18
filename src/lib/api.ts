import type {
  ActivityEvent,
  GenerateStandupRequest,
  GenerateStandupResponse,
  MetricsSummary,
  RepoListItem,
  StandupDoc,
} from "@/lib/types";

/**
 * Thin client for Person A's APIs.
 * Never throws on missing routes — returns null so UI can fall back to demo / empty states.
 */
async function safeJson<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
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
): Promise<ActivityEvent[] | null> {
  return safeJson<ActivityEvent[]>(
    `/api/activity?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  );
}

export async function fetchMetrics(
  start: string,
  end: string,
): Promise<MetricsSummary | null> {
  return safeJson<MetricsSummary>(
    `/api/metrics?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
  );
}

export async function fetchRepos(): Promise<RepoListItem[] | null> {
  return safeJson<RepoListItem[]>("/api/repos");
}

export async function saveRepoSelection(
  fullNames: string[],
): Promise<boolean> {
  const res = await safeJson<{ ok?: boolean }>("/api/repos/selection", {
    method: "POST",
    body: JSON.stringify({ included: fullNames }),
  });
  return Boolean(res);
}

export async function triggerSync(): Promise<{
  lastSyncedAt?: string;
} | null> {
  return safeJson("/api/sync", { method: "POST" });
}

export async function generateStandupApi(
  body: GenerateStandupRequest,
): Promise<GenerateStandupResponse | null> {
  return safeJson<GenerateStandupResponse>("/api/standups/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchStandup(
  id: string,
  contentMd: string,
  contentJson: StandupDoc["contentJson"],
): Promise<StandupDoc | null> {
  return safeJson<StandupDoc>(`/api/standups/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ contentMd, contentJson }),
  });
}

export async function listStandups(): Promise<StandupDoc[] | null> {
  return safeJson<StandupDoc[]>("/api/standups");
}
