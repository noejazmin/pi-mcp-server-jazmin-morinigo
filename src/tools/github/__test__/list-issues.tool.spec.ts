import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { listIssuesHandler } from "../list-issues.js";
import { GitHubNotFoundError } from "../../../clients/github/errors.js";

function githubClientMock() {
  return {
    listIssues: vi.fn(),
  };
}

describe("listIssuesHandler", () => {
  let mockGitHub: ReturnType<typeof githubClientMock>;

  beforeEach(() => {
    mockGitHub = githubClientMock();
  });

  it("devuelve los issues del repositorio con ok true", async () => {
    const issues = [
      {
        number: 1,
        title: "Primer issue",
        state: "open",
        url: "https://github.com/octocat/hello-world/issues/1",
      },
      {
        number: 2,
        title: "Segundo issue",
        state: "open",
        url: "https://github.com/octocat/hello-world/issues/2",
      },
    ];

    mockGitHub.listIssues.mockResolvedValue(issues);

    const result = await listIssuesHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        state: "open",
        per_page: 10,
      },
      mockGitHub,
    );

    expect(mockGitHub.listIssues).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      "open",
      10,
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: issues,
    });

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(true);
    expect(responseBody.data).toHaveLength(2);
  });

  it("utiliza valores predeterminados para state y per_page", async () => {
  mockGitHub.listIssues.mockResolvedValue([]);

  const result = await listIssuesHandler(
    {
      owner: "octocat",
      repo: "hello-world",
    },
    mockGitHub,
  );

  expect(mockGitHub.listIssues).toHaveBeenCalledWith(
    "octocat",
    "hello-world",
    "open",
    30,
  );

  expect(result.structuredContent).toEqual({
    ok: true,
    data: [],
  });
});

it("rechaza per_page cuando es menor a 1", async () => {
  const result = await listIssuesHandler(
    {
      owner: "octocat",
      repo: "hello-world",
      state: "open",
      per_page: 0,
    },
    mockGitHub,
  );

  expect(
    mockGitHub.listIssues,
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

it("transforma un error cuando el repositorio no existe", async () => {
  mockGitHub.listIssues.mockRejectedValue(
    new GitHubNotFoundError(),
  );

  const result = await listIssuesHandler(
    {
      owner: "octocat",
      repo: "repositorio-inexistente",
      state: "all",
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