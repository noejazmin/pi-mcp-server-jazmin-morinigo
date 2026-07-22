import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import { addCommentToIssueSchema, addCommentToIssueOutputSchema } from "../../schemas/github.js";
import { toToolError } from "./result.js";

type AddCommentToIssueClient = Pick<
  GitHubClient,
  "addCommentToIssue"
>;

export async function addCommentToIssueHandler(
  args: unknown,
  githubClient?: AddCommentToIssueClient,
) {
  const parsed =
    addCommentToIssueSchema.safeParse(args);

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
    body,
  } = parsed.data;

  try {
    const client =
      githubClient ?? new GitHubClient();

    const data = await client.addCommentToIssue(
      owner,
      repo,
      issue_number,
      body,
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

export function registerAddCommentToIssue(
  server: McpServer,
) {
  server.registerTool(
    "add_comment_to_issue",
    {
      description:
        "Agrega un comentario en Markdown a un issue específico de un repositorio de GitHub.",
      inputSchema: addCommentToIssueSchema.shape,
      outputSchema:
        addCommentToIssueOutputSchema.shape,
    },
    async (args) =>
      addCommentToIssueHandler(args),
  );
}