import { describe, it, expect, vi } from "vitest";
import { createGitHubClient } from "@/lib/github";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("GitHub client (A2 — SPEC §7.2/§13)", () => {
  it("sends the bearer token and API version headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    const client = createGitHubClient("tok_123", fetchMock);
    await client.listUserRepos();

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("https://api.github.com/user/repos");
    expect(init.headers.Authorization).toBe("Bearer tok_123");
    expect(init.headers.Accept).toContain("application/vnd.github");
  });

  it("paginates until a page returns fewer than 100 repos", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `repo-${i + 1}`,
      full_name: `maya/repo-${i + 1}`,
      owner: { login: "maya" },
      private: false,
    }));
    const page2 = [
      {
        id: 101,
        name: "repo-101",
        full_name: "maya/repo-101",
        owner: { login: "maya" },
        private: true,
      },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2));

    const client = createGitHubClient("tok", fetchMock);
    const repos = await client.listUserRepos();

    expect(repos).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("page=2");
  });

  it("maps GitHub repos to the shared RepoDTO shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: 42,
          name: "shiplog",
          full_name: "maya/shiplog",
          owner: { login: "maya" },
          private: true,
        },
      ])
    );
    const client = createGitHubClient("tok", fetchMock);
    const repos = await client.listUserRepos();

    expect(repos[0]).toEqual({
      githubRepoId: "42",
      owner: "maya",
      name: "shiplog",
      fullName: "maya/shiplog",
      private: true,
    });
  });

  it("throws a descriptive error on a non-2xx response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "Bad credentials" }, 401));
    const client = createGitHubClient("bad", fetchMock);
    await expect(client.listUserRepos()).rejects.toThrow(/401/);
  });
});
