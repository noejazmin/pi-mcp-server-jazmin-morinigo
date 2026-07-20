import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import {
  createCommitOutputSchema,
  createCommitSchema,
} from "../../schemas/github.js";
import { toToolError } from "./result.js";

type CreateCommitClient = Pick<
  GitHubClient,
  "createCommit"
>;

export async function createCommitHandler(
  args: unknown,
  githubClient?: CreateCommitClient,
) {
  const parsed = createCommitSchema.safeParse(args);

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
    owner,
    repo,
    path,
    content,
    message,
    branch,
  } = parsed.data;

  try {
    const client = githubClient ?? new GitHubClient();

    const data = await client.createCommit(
      owner,
      repo,
      path,
      content,
      message,
      branch,
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

export function registerCreateCommit(server: McpServer) {
  server.registerTool(
    "create_commit",
    {
      description:
        "Crea un commit que agrega o reemplaza un archivo en una rama de GitHub.",
      inputSchema: createCommitSchema.shape,
      outputSchema: createCommitOutputSchema.shape,
    },
    async (args) => createCommitHandler(args),
  );
}