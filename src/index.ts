import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerListRepositories } from "./tools/github/list-repositories.js";
import { registerCreateRepository } from "./tools/github/create-repository.js";

const server = new McpServer({
  name: "github-mcp-server",
  version: "1.0.0",
});

async function main() {
  registerListRepositories(server);
  registerCreateRepository(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Error al iniciar el MCP server:", error);
  process.exit(1);
});