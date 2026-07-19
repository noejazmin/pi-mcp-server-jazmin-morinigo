import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GitHubClient } from "../../clients/github/client.js";
import {
  listRepositoriesOutputSchema,
  listRepositoriesSchema,
} from "../../schemas/github.js";
import { toToolError } from "./result.js";

export function registerListRepositories(server: McpServer) {
  server.registerTool(
    "list_repositories",
    {
      description:
        "Lista los repositorios de la cuenta autenticada de GitHub.",
      inputSchema: listRepositoriesSchema.shape,
      outputSchema: listRepositoriesOutputSchema.shape,
    },
    async (args) => {
      const parsed = listRepositoriesSchema.safeParse(args);

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
              type: "text",
              text: JSON.stringify(body),
            },
          ],
          isError: true,
        };
      }

      const { type, sort, per_page } = parsed.data;

      try {
        const githubClient = new GitHubClient();
        const data = await githubClient.listRepositories(
          type,
          sort,
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
              type: "text",
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        const toolError = toToolError(error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(toolError),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
