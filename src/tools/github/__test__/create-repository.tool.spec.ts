import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { createRepositoryHandler } from "../create-repository.js";
import { GitHubValidationError } from "../../../clients/github/errors.js";

function githubClientMock() {
    return {
        createRepository: vi.fn(),
    };
}

describe("createRepositoryHandler", () => {
    let mockGitHub: ReturnType<typeof githubClientMock>;

    beforeEach(() => {
        mockGitHub = githubClientMock();
    });

    it("devuelve el repositorio creado con ok true", async () => {
        const createdRepository = {
            fullName: "octocat/nuevo-repositorio",
            url: "https://github.com/octocat/nuevo-repositorio",
            private: false,
            description: "Repositorio creado desde MCP",
            owner: "octocat",
        };

        mockGitHub.createRepository.mockResolvedValue(
            createdRepository,
        );

        const result = await createRepositoryHandler(
            {
                name: "nuevo-repositorio",
                description: "Repositorio creado desde MCP",
                private: false,
            },
            mockGitHub,
        );

        expect(mockGitHub.createRepository).toHaveBeenCalledWith(
            "nuevo-repositorio",
            "Repositorio creado desde MCP",
            false,
        );

        expect(result.structuredContent).toEqual({
            ok: true,
            data: createdRepository,
        });

        const body = JSON.parse(result.content[0].text);

        expect(body.ok).toBe(true);
        expect(body.data.fullName).toBe(
            "octocat/nuevo-repositorio",
        );
    });

    it("rechaza un nombre de repositorio con espacios", async () => {
        const result = await createRepositoryHandler(
            {
                name: "repositorio inválido",
                description: "No debe crearse",
                private: false,
            },
            mockGitHub,
        );

        expect(
            mockGitHub.createRepository,
        ).not.toHaveBeenCalled();

        expect(result.isError).toBe(true);

        const body = JSON.parse(result.content[0].text);

        expect(body.ok).toBe(false);
        expect(body.error.type).toBe("VALIDATION_ERROR");
        expect(body.error.message).toContain(
            "El nombre solo puede contener",
        );
    });

    it("transforma un error de validación devuelto por GitHub", async () => {
        mockGitHub.createRepository.mockRejectedValue(
            new GitHubValidationError(
                "GitHub rechazó los datos enviados.",
                {
                    resource: "Repository",
                    field: "name",
                    code: "already_exists",
                },
            ),
        );

        const result = await createRepositoryHandler(
            {
                name: "repositorio-existente",
                private: false,
            },
            mockGitHub,
        );

        expect(result.isError).toBe(true);

        const body = JSON.parse(result.content[0].text);

        expect(body.ok).toBe(false);
        expect(body.error.type).toBe(
            "GitHubValidationError",
        );
        expect(body.error.details.code).toBe(
            "already_exists",
        );
    });
});