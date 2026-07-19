import { mapGitHubError } from "./errors.js";

export async function githubRequest<T>(
  operation: () => Promise<{ data: T }>,
): Promise<T> {
  try {
    const response = await operation();
    return response.data;
  } catch (error) {
    throw mapGitHubError(error);
  }
}