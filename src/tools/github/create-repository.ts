import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import {
  createRepositoryOutputSchema,
  createRepositorySchema,
} from "../../schemas/github.js";
import { toToolError } from "./result.js";

type CreateRepositoryClient = Pick<
  GitHubClient,
  "createRepository"
>;

export async function createRepositoryHandler(
  args: unknown,
  githubClient?: CreateRepositoryClient,
) {
  const parsed = createRepositorySchema.safeParse(args);

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ");

    const body = {
      ok: false,
      error: {
        type: "VALIDATION_ERROR",
        message: messages,
      },
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(body),
        },
      ],
      isError: true,
    };
  }

  const {
    name,
    description,
    private: isPrivate,
  } = parsed.data;

  try {
    const client = githubClient ?? new GitHubClient();

    const data = await client.createRepository(
      name,
      description,
      isPrivate,
    );

    const result = {
      ok: true as const,
      data,
    };

    return {
      structuredContent: result,
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result),
        },
      ],
    };
  } catch (error) {
    const toolError = toToolError(error);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(toolError),
        },
      ],
      isError: true,
    };
  }
}

export function registerCreateRepository(
  server: McpServer,
) {
  server.registerTool(
    "create_repository",
    {
      description:
        "Crea un repositorio nuevo en la cuenta autenticada de GitHub.",
      inputSchema: createRepositorySchema.shape,
      outputSchema: createRepositoryOutputSchema.shape,
    },
    async (args) => createRepositoryHandler(args),
  );
}