import { Octokit } from "@octokit/rest";
import { createOctokit } from "./octokit.js";
import type { Repository } from "../../schemas/github.js";

export class GitHubClient {
  private readonly octokit: Octokit;

  constructor(octokit: Octokit = createOctokit()) {
    this.octokit = octokit;
  }

  async listRepositories(
  type: "all" | "public" | "private" = "all",
  sort: "created" | "updated" | "pushed" | "full_name" = "updated",
  per_page: number = 30,
): Promise<Repository[]> {
  const { data } =
    await this.octokit.rest.repos.listForAuthenticatedUser({
      type,
      sort,
      per_page,
    });

  return data.map((repository) => ({
    fullName: repository.full_name,
    url: repository.html_url,
    private: repository.private,
    description: repository.description,
    owner: repository.owner.login,
  }));
}
}