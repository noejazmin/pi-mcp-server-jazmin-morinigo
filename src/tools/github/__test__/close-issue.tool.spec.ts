import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { GitHubNotFoundError } from "../../../clients/github/errors.js";
import { closeIssueHandler } from "../close-issue.js";

function githubClientMock() {
  return {
    closeIssue: vi.fn(),
  };
}

describe("closeIssueHandler", () => {
  let mockGitHub: ReturnType<
    typeof githubClientMock
  >;

  beforeEach(() => {
    mockGitHub = githubClientMock();
  });

  it("devuelve el issue cerrado con ok true", async () => {
    const closedIssue = {
      number: 7,
      title: "Issue de prueba",
      state: "closed" as const,
      url: "https://github.com/octocat/hello-world/issues/7",
      closedAt: "2026-07-21T16:00:00Z",
    };

    mockGitHub.closeIssue.mockResolvedValue(
      closedIssue,
    );

    const result = await closeIssueHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        issue_number: 7,
      },
      mockGitHub,
    );

    expect(
      mockGitHub.closeIssue,
    ).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      7,
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: closedIssue,
    });

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(true);
    expect(responseBody.data.state).toBe(
      "closed",
    );
  });

  it("rechaza un número de issue inválido", async () => {
    const result = await closeIssueHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        issue_number: 0,
      },
      mockGitHub,
    );

    expect(
      mockGitHub.closeIssue,
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

  it("transforma el error cuando el issue no existe", async () => {
    mockGitHub.closeIssue.mockRejectedValue(
      new GitHubNotFoundError(),
    );

    const result = await closeIssueHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        issue_number: 999,
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