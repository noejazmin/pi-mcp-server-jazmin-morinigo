import {
  GitHubServerError,
  mapGitHubError,
} from "./errors.js";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function githubRequest<T>(
  operation: () => Promise<{ data: T }>,
  attempt = 0,
): Promise<T> {
  try {
    const response = await operation();
    return response.data;
  } catch (error) {
    const mappedError = mapGitHubError(error);

    if (
      mappedError instanceof GitHubServerError &&
      attempt < MAX_RETRIES
    ) {
      const delayMilliseconds =
        BASE_DELAY_MS * 2 ** attempt;

      console.error(
        `[GitHub] Error ${mappedError.status}. ` +
          `Reintentando en ${delayMilliseconds} ms.`,
      );

      await delay(delayMilliseconds);

      return githubRequest(operation, attempt + 1);
    }

    throw mappedError;
  }
}