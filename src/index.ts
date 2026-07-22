import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerListRepositories } from "./tools/github/list-repositories.js";
import { registerCreateRepository } from "./tools/github/create-repository.js";
import { registerCreateIssue } from "./tools/github/create-issue.js";
import { registerListIssues } from "./tools/github/list-issues.js";
import { registerCreateCommit } from "./tools/github/create-commit.js";
import { registerListCommits } from "./tools/github/list-commits.js";
import { registerAddCommentToIssue } from "./tools/github/add-comment-to-issue.js";
import { registerCloseIssue } from "./tools/github/close-issue.js";

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

async function main() {
  registerListRepositories(server);
  registerCreateRepository(server);
  registerCreateIssue(server);
  registerListIssues(server);
  registerCreateCommit(server);
  registerListCommits(server);
  registerAddCommentToIssue(server);
  registerCloseIssue(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Error al iniciar el MCP server:", error);
  process.exit(1);
});