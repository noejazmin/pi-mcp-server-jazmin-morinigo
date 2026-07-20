import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import {
  listIssuesOutputSchema,
  listIssuesSchema,
} from "../../schemas/github.js";
import { toToolError } from "./result.js";

type ListIssuesClient = Pick<
  GitHubClient,
  "listIssues"
>;

export async function listIssuesHandler(
  args: unknown,
  githubClient?: ListIssuesClient,
) {
  const parsed = listIssuesSchema.safeParse(args);

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
    state,
    per_page,
  } = parsed.data;

  try {
    const client = githubClient ?? new GitHubClient();

    const data = await client.listIssues(
      owner,
      repo,
      state,
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

export function registerListIssues(server: McpServer) {
  server.registerTool(
    "list_issues",
    {
      description:
        "Lista los issues de un repositorio de GitHub y permite filtrarlos por estado.",
      inputSchema: listIssuesSchema.shape,
      outputSchema: listIssuesOutputSchema.shape,
    },
    async (args) => listIssuesHandler(args),
  );
}