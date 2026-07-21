import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { listCommitsHandler } from "../list-commits.js";
import { GitHubNotFoundError } from "../../../clients/github/errors.js";

function githubClientMock() {
  return {
    listCommits: vi.fn(),
  };
}

describe("listCommitsHandler", () => {
  let mockGitHub: ReturnType<
    typeof githubClientMock
  >;

  beforeEach(() => {
    mockGitHub = githubClientMock();
  });

  it("devuelve los commits con ok true", async () => {
    const commits = [
      {
        sha: "abc123",
        message: "feat: agregar una funcionalidad",
        author: "Octocat",
        date: "2026-07-21T12:00:00Z",
        url: "https://github.com/octocat/hello-world/commit/abc123",
      },
      {
        sha: "def456",
        message: "fix: corregir un error",
        author: "Octocat",
        date: null,
        url: "https://github.com/octocat/hello-world/commit/def456",
      },
    ];

    mockGitHub.listCommits.mockResolvedValue(
      commits,
    );

    const result = await listCommitsHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        branch: "main",
        per_page: 2,
      },
      mockGitHub,
    );

    expect(
      mockGitHub.listCommits,
    ).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      "main",
      2,
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: commits,
    });

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(true);
    expect(responseBody.data).toHaveLength(2);
  });

    it("utiliza main y 10 como valores predeterminados", async () => {
    mockGitHub.listCommits.mockResolvedValue([]);

    const result = await listCommitsHandler(
      {
        owner: "octocat",
        repo: "hello-world",
      },
      mockGitHub,
    );

    expect(
      mockGitHub.listCommits,
    ).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      "main",
      10,
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: [],
    });
  });

  it("rechaza per_page cuando supera 100", async () => {
    const result = await listCommitsHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        branch: "main",
        per_page: 101,
      },
      mockGitHub,
    );

    expect(
      mockGitHub.listCommits,
    ).not.toHaveBeenCalled();

    expect(result.isError).toBe(true);

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(false);
    expect(responseBody.error.type).toBe(
      "VALIDATION_ERROR",
    );
  });

  it("transforma el error cuando el repositorio no existe", async () => {
    mockGitHub.listCommits.mockRejectedValue(
      new GitHubNotFoundError(),
    );

    const result = await listCommitsHandler(
      {
        owner: "octocat",
        repo: "repositorio-inexistente",
        branch: "main",
        per_page: 10,
      },
      mockGitHub,
    );

    expect(result.isError).toBe(true);

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(false);
    expect(responseBody.error.type).toBe(
      "GitHubNotFoundError",
    );
  });
});