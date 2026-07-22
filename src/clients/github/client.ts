import { Octokit } from "@octokit/rest";
import { createOctokit } from "./octokit.js";
import type {
  ClosedIssue,
  CommitSummary,
  CreatedCommit,
  CreatedIssue,
  IssueComment,
  IssueSummary,
  Repository,
  RepoSummary,
} from "../../schemas/github.js";
import { githubRequest } from "./request.js";

export class GitHubClient {
  private readonly octokit: Octokit;

  constructor(octokit: Octokit = createOctokit()) {
    this.octokit = octokit;
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

  async listRepositories(
    type: "all" | "public" | "private" = "all",
    sort: "created" | "updated" | "pushed" | "full_name" = "updated",
    per_page: number = 30,
  ): Promise<Repository[]> {
    const data = await githubRequest(() =>
      this.octokit.repos.listForAuthenticatedUser({ type, sort, per_page }),
    );

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

  async listIssues(
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open",
    per_page = 30,
  ): Promise<IssueSummary[]> {
    const data = await githubRequest(() =>
      this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page,
      }),
    );

    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
      }));
  }

  async createCommit(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch = "main",
  ): Promise<CreatedCommit> {
    const refData = await githubRequest(() =>
      this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      }),
    );

    const parentCommitSha = refData.object.sha;

    const commitData = await githubRequest(() =>
      this.octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: parentCommitSha,
      }),
    );

    const baseTreeSha = commitData.tree.sha;

    const blobData = await githubRequest(() =>
      this.octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(
          content,
          "utf-8",
        ).toString("base64"),
        encoding: "base64",
      }),
    );

    const treeData = await githubRequest(() =>
      this.octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: [
          {
            path,
            mode: "100644",
            type: "blob",
            sha: blobData.sha,
          },
        ],
      }),
    );

    const newCommit = await githubRequest(() =>
      this.octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: treeData.sha,
        parents: [parentCommitSha],
      }),
    );

    await githubRequest(() =>
      this.octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      }),
    );

    return {
      sha: newCommit.sha,
      url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      path,
      branch,
    };
  }

  async listCommits(
    owner: string,
    repo: string,
    branch = "main",
    per_page = 10,
  ): Promise<CommitSummary[]> {
    const data = await githubRequest(() =>
      this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page,
      }),
    );

    return data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author:
        commit.commit.author?.name ??
        commit.author?.login ??
        "Autor desconocido",
      date: commit.commit.author?.date ?? null,
      url: commit.html_url,
    }));
  }

  async addCommentToIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<IssueComment> {
    const data = await githubRequest(() =>
      this.octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      }),
    );

    return {
      id: data.id,
      issueNumber,
      body: data.body ?? "",
      author:
        data.user?.login ?? "Autor desconocido",
      url: data.html_url,
      createdAt: data.created_at,
    };
  }

  async closeIssue(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<ClosedIssue> {
  const data = await githubRequest(() =>
    this.octokit.rest.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: "closed",
    }),
  );

  return {
    number: data.number,
    title: data.title,
    state: "closed",
    url: data.html_url,
    closedAt: data.closed_at,
  };
}
}