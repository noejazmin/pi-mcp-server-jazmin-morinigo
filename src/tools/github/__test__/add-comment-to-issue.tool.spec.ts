import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { GitHubNotFoundError } from "../../../clients/github/errors.js";
import { addCommentToIssueHandler } from "../add-comment-to-issue.js";

function githubClientMock() {
  return {
    addCommentToIssue: vi.fn(),
  };
}

describe("addCommentToIssueHandler", () => {
  let mockGitHub: ReturnType<
    typeof githubClientMock
  >;

  beforeEach(() => {
    mockGitHub = githubClientMock();
  });

  it("devuelve el comentario creado con ok true", async () => {
    const comment = {
      id: 123,
      issueNumber: 7,
      body: "Comentario creado desde MCP.",
      author: "octocat",
      url: "https://github.com/octocat/hello-world/issues/7#issuecomment-123",
      createdAt: "2026-07-21T15:30:00Z",
    };

    mockGitHub.addCommentToIssue.mockResolvedValue(
      comment,
    );

    const result = await addCommentToIssueHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        issue_number: 7,
        body: "Comentario creado desde MCP.",
      },
      mockGitHub,
    );

    expect(
      mockGitHub.addCommentToIssue,
    ).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      7,
      "Comentario creado desde MCP.",
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: comment,
    });

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(true);
    expect(responseBody.data.id).toBe(123);
  });

  it("rechaza un comentario vacío antes de llamar al cliente", async () => {
    const result = await addCommentToIssueHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        issue_number: 7,
        body: "",
      },
      mockGitHub,
    );

    expect(
      mockGitHub.addCommentToIssue,
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
    mockGitHub.addCommentToIssue.mockRejectedValue(
      new GitHubNotFoundError(),
    );

    const result = await addCommentToIssueHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        issue_number: 999,
        body: "Comentario de prueba.",
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