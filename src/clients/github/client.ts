import { Octokit } from "@octokit/rest";
import { createOctokit } from "./octokit.js";
import type { Repository, CreatedIssue, RepoSummary } from "../../schemas/github.js";
import { githubRequest } from "./request.js";

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

  async createRepository(
    name: string,
    description?: string,
    isPrivate = false,
  ): Promise<Repository> {
    const data = await githubRequest(() =>
      this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        ...(description !== undefined && {
          description,
        }),
        private: isPrivate,
        auto_init: true,
      }),
    );

    return {
      fullName: data.full_name,
      url: data.html_url,
      private: data.private,
      description: data.description,
      owner: data.owner.login,
    };
  }

  async getRepoSummary(
  owner: string,
  repo: string,
): Promise<RepoSummary> {
  const data = await githubRequest(() =>
    this.octokit.rest.repos.get({
      owner,
      repo,
    }),
  );

  return {
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    defaultBranch: data.default_branch,
  };
}

async createIssue(
  owner: string,
  repo: string,
  title: string,
  body?: string,
): Promise<CreatedIssue> {
  const data = await githubRequest(() =>
    this.octokit.rest.issues.create({
      owner,
      repo,
      title,
      ...(body !== undefined && {
        body,
      }),
    }),
  );

  return {
    number: data.number,
    url: data.html_url,
    title: data.title,
  };
}
}