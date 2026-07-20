import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import {
  createIssueOutputSchema,
  createIssueSchema,
} from "../../schemas/github.js";
import { toToolError } from "./result.js";

type CreateIssueClient = Pick<
  GitHubClient,
  "getRepoSummary" | "createIssue"
>;

export async function createIssueHandler(
  args: unknown,
  githubClient?: CreateIssueClient,
) {
  const parsed = createIssueSchema.safeParse(args);

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
    title,
    body,
  } = parsed.data;

  try {
    const client = githubClient ?? new GitHubClient();

    await client.getRepoSummary(owner, repo);

    const data = await client.createIssue(
      owner,
      repo,
      title,
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

export function registerCreateIssue(server: McpServer) {
  server.registerTool(
    "create_issue",
    {
      description:
        "Crea un issue en un repositorio de GitHub después de verificar que exista.",
      inputSchema: createIssueSchema.shape,
      outputSchema: createIssueOutputSchema.shape,
    },
    async (args) => createIssueHandler(args),
  );
}