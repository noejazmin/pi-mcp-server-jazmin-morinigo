import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { createCommitHandler } from "../create-commit.js";
import { GitHubNotFoundError } from "../../../clients/github/errors.js";

function githubClientMock() {
  return {
    createCommit: vi.fn(),
  };
}

describe("createCommitHandler", () => {
  let mockGitHub: ReturnType<typeof githubClientMock>;

  beforeEach(() => {
    mockGitHub = githubClientMock();
  });

  it("devuelve el commit creado con ok true", async () => {
    const createdCommit = {
      sha: "abc123",
      url: "https://github.com/octocat/hello-world/commit/abc123",
      path: "docs/prueba.md",
      branch: "main",
    };

    mockGitHub.createCommit.mockResolvedValue(
      createdCommit,
    );

    const result = await createCommitHandler(
      {
        owner: "octocat",
        repo: "hello-world",
        path: "docs/prueba.md",
        content: "# Archivo de prueba",
        message: "docs: agregar archivo de prueba",
        branch: "main",
      },
      mockGitHub,
    );

    expect(mockGitHub.createCommit).toHaveBeenCalledWith(
      "octocat",
      "hello-world",
      "docs/prueba.md",
      "# Archivo de prueba",
      "docs: agregar archivo de prueba",
      "main",
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: createdCommit,
    });

    const responseBody = JSON.parse(
      result.content[0].text,
    );

    expect(responseBody.ok).toBe(true);
    expect(responseBody.data.sha).toBe("abc123");
  });

  it("utiliza main como rama predeterminada", async () => {
  mockGitHub.createCommit.mockResolvedValue({
    sha: "def456",
    url: "https://github.com/octocat/hello-world/commit/def456",
    path: "README.md",
    branch: "main",
  });

  await createCommitHandler(
    {
      owner: "octocat",
      repo: "hello-world",
      path: "README.md",
      content: "# Nuevo contenido",
      message: "docs: actualizar README",
    },
    mockGitHub,
  );

  expect(mockGitHub.createCommit).toHaveBeenCalledWith(
    "octocat",
    "hello-world",
    "README.md",
    "# Nuevo contenido",
    "docs: actualizar README",
    "main",
  );
});

it("rechaza un mensaje de commit vacío", async () => {
  const result = await createCommitHandler(
    {
      owner: "octocat",
      repo: "hello-world",
      path: "README.md",
      content: "# Contenido",
      message: "",
      branch: "main",
    },
    mockGitHub,
  );

  expect(
    mockGitHub.createCommit,
  ).not.toHaveBeenCalled();

  expect(result.isError).toBe(true);

  const responseBody = JSON.parse(
    result.content[0].text,
  );

  expect(responseBody.ok).toBe(false);
  expect(responseBody.error.type).toBe(
    "VALIDATION_ERROR",
  );
  expect(responseBody.error.message).toContain(
    "mensaje del commit es obligatorio",
  );
});

it("transforma el error cuando la rama no existe", async () => {
  mockGitHub.createCommit.mockRejectedValue(
    new GitHubNotFoundError(),
  );

  const result = await createCommitHandler(
    {
      owner: "octocat",
      repo: "hello-world",
      path: "README.md",
      content: "# Contenido",
      message: "docs: actualizar README",
      branch: "rama-inexistente",
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