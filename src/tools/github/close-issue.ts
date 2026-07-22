import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import { closeIssueOutputSchema, closeIssueSchema } from "../../schemas/github.js";
import { toToolError } from "./result.js";

type CloseIssueClient = Pick<
  GitHubClient,
  "closeIssue"
>;

export async function closeIssueHandler(
  args: unknown,
  githubClient?: CloseIssueClient,
) {
  const parsed = closeIssueSchema.safeParse(args);

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
    issue_number,
  } = parsed.data;

  try {
    const client =
      githubClient ?? new GitHubClient();

    const data = await client.closeIssue(
      owner,
      repo,
      issue_number,
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

export function registerCloseIssue(
  server: McpServer,
) {
  server.registerTool(
    "close_issue",
    {
      description:
        "Cierra un issue específico de un repositorio de GitHub.",
      inputSchema: closeIssueSchema.shape,
      outputSchema: closeIssueOutputSchema.shape,
    },
    async (args) => closeIssueHandler(args),
  );
}