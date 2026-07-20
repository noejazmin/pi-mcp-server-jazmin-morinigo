import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { createIssueHandler } from "../create-issue.js";
import { GitHubNotFoundError } from "../../../clients/github/errors.js";

function githubClientMock() {
    return {
        getRepoSummary: vi.fn(),
        createIssue: vi.fn(),
    };
}

describe("createIssueHandler", () => {
    let mockGitHub: ReturnType<typeof githubClientMock>;

    beforeEach(() => {
        mockGitHub = githubClientMock();
    });

    it("verifica el repositorio y devuelve el issue creado", async () => {
        mockGitHub.getRepoSummary.mockResolvedValue({
            fullName: "octocat/hello-world",
            description: null,
            stars: 0,
            defaultBranch: "main",
        });

        mockGitHub.createIssue.mockResolvedValue({
            number: 42,
            url: "https://github.com/octocat/hello-world/issues/42",
            title: "Issue de prueba",
        });

        const result = await createIssueHandler(
            {
                owner: "octocat",
                repo: "hello-world",
                title: "Issue de prueba",
                body: "Creado desde el test del servidor MCP",
            },
            mockGitHub,
        );

        expect(mockGitHub.getRepoSummary).toHaveBeenCalledWith(
            "octocat",
            "hello-world",
        );

        expect(mockGitHub.createIssue).toHaveBeenCalledWith(
            "octocat",
            "hello-world",
            "Issue de prueba",
            "Creado desde el test del servidor MCP",
        );

        expect(result.structuredContent).toEqual({
            ok: true,
            data: {
                number: 42,
                url: "https://github.com/octocat/hello-world/issues/42",
                title: "Issue de prueba",
            },
        });

        const responseBody = JSON.parse(
            result.content[0].text,
        );

        expect(responseBody.ok).toBe(true);
        expect(responseBody.data.number).toBe(42);
    });

    it("no crea el issue si el repositorio no existe", async () => {
        mockGitHub.getRepoSummary.mockRejectedValue(
            new GitHubNotFoundError(),
        );

        const result = await createIssueHandler(
            {
                owner: "octocat",
                repo: "repositorio-inexistente",
                title: "Issue de prueba",
            },
            mockGitHub,
        );

        expect(mockGitHub.getRepoSummary).toHaveBeenCalledWith(
            "octocat",
            "repositorio-inexistente",
        );

        expect(
            mockGitHub.createIssue,
        ).not.toHaveBeenCalled();

        expect(result.isError).toBe(true);

        const responseBody = JSON.parse(
            result.content[0].text,
        );

        expect(responseBody.ok).toBe(false);
        expect(responseBody.error.type).toBe(
            "GitHubNotFoundError",
        );
    });

    it("rechaza un título con menos de tres caracteres", async () => {
        const result = await createIssueHandler(
            {
                owner: "octocat",
                repo: "hello-world",
                title: "ab",
            },
            mockGitHub,
        );

        expect(
            mockGitHub.getRepoSummary,
        ).not.toHaveBeenCalled();

        expect(
            mockGitHub.createIssue,
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
            "al menos 3 caracteres",
        );
    });
});