import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {listRepositoriesHandler} from "../list-repositories.js";
import { GitHubAuthError } from "../../../clients/github/errors.js";

function githubClientMock() {
  return {
    listRepositories: vi.fn(),
  };
}

describe("listRepositoriesHandler", () => {
  let mockGitHub: ReturnType<typeof githubClientMock>;

  beforeEach(() => {
    mockGitHub = githubClientMock();
  });

  it("devuelve cinco repositorios con ok true", async () => {
    const repositories = [
      {
        fullName: "octocat/repo-1",
        url: "https://github.com/octocat/repo-1",
        private: false,
        description: "Repositorio 1",
        owner: "octocat",
      },
      {
        fullName: "octocat/repo-2",
        url: "https://github.com/octocat/repo-2",
        private: false,
        description: null,
        owner: "octocat",
      },
      {
        fullName: "octocat/repo-3",
        url: "https://github.com/octocat/repo-3",
        private: false,
        description: null,
        owner: "octocat",
      },
      {
        fullName: "octocat/repo-4",
        url: "https://github.com/octocat/repo-4",
        private: false,
        description: null,
        owner: "octocat",
      },
      {
        fullName: "octocat/repo-5",
        url: "https://github.com/octocat/repo-5",
        private: false,
        description: null,
        owner: "octocat",
      },
    ];

    mockGitHub.listRepositories.mockResolvedValue(
      repositories,
    );

    const result = await listRepositoriesHandler(
      {
        type: "public",
        sort: "updated",
        per_page: 5,
      },
      mockGitHub,
    );

    expect(mockGitHub.listRepositories).toHaveBeenCalledWith(
      "public",
      "updated",
      5,
    );

    expect(result.structuredContent).toEqual({
      ok: true,
      data: repositories,
    });

    const body = JSON.parse(result.content[0].text);

    expect(body.ok).toBe(true);
    expect(body.data).toHaveLength(5);
  });

  it("rechaza per_page cuando es mayor a 100", async () => {
  const result = await listRepositoriesHandler(
    {
      type: "all",
      sort: "updated",
      per_page: 101,
    },
    mockGitHub,
  );

  expect(mockGitHub.listRepositories).not.toHaveBeenCalled();

  expect(result.isError).toBe(true);

  const body = JSON.parse(result.content[0].text);

  expect(body.ok).toBe(false);
  expect(body.error.type).toBe("VALIDATION_ERROR");
  });

  it("transforma un error de autenticación del cliente", async () => {
  mockGitHub.listRepositories.mockRejectedValue(
    new GitHubAuthError(),
  );

  const result = await listRepositoriesHandler(
    {
      type: "all",
      sort: "updated",
      per_page: 5,
    },
    mockGitHub,
  );

  expect(result.isError).toBe(true);

  const body = JSON.parse(result.content[0].text);

  expect(body).toEqual({
    ok: false,
    error: {
      type: "GitHubAuthError",
      message:
        "El token de GitHub es inexistente, inválido o está vencido.",
    },
  });
});

it("utiliza valores predeterminados cuando no recibe argumentos", async () => {
  mockGitHub.listRepositories.mockResolvedValue([]);

  const result = await listRepositoriesHandler(
    {},
    mockGitHub,
  );

  expect(mockGitHub.listRepositories).toHaveBeenCalledWith(
    "all",
    "updated",
    30,
  );

  expect(result.structuredContent).toEqual({
    ok: true,
    data: [],
  });
});
});