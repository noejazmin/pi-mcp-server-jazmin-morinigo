import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import { listCommitsOutputSchema, listCommitsSchema, } from "../../schemas/github.js";
import { toToolError } from "./result.js";

type ListCommitsClient = Pick<
  GitHubClient,
  "listCommits"
>;

export async function listCommitsHandler(
  args: unknown,
  githubClient?: ListCommitsClient,
) {
  const parsed = listCommitsSchema.safeParse(args);

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
    branch,
    per_page,
  } = parsed.data;

  try {
    const client = githubClient ?? new GitHubClient();

    const data = await client.listCommits(
      owner,
      repo,
      branch,
      per_page,
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

export function registerListCommits(
  server: McpServer,
) {
  server.registerTool(
    "list_commits",
    {
      description:
        "Lista los commits recientes de una rama de un repositorio de GitHub.",
      inputSchema: listCommitsSchema.shape,
      outputSchema: listCommitsOutputSchema.shape,
    },
    async (args) => listCommitsHandler(args),
  );
}