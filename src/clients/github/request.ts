import {
  GitHubRateLimitError,
  GitHubServerError,
  mapGitHubError,
} from "./errors.js";

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 500;

const MAX_RATE_LIMIT_RETRIES = 1;
const MAX_RATE_LIMIT_WAIT_MS = 10_000;
const RATE_LIMIT_BUFFER_MS = 1_000;

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getRateLimitDelayMilliseconds(
  error: GitHubRateLimitError,
): number | null {
  if (
    error.retryAfterSeconds !== undefined &&
    Number.isFinite(error.retryAfterSeconds) &&
    error.retryAfterSeconds >= 0
  ) {
    return error.retryAfterSeconds * 1_000;
  }

  if (
    Number.isFinite(error.resetEpochSeconds) &&
    error.resetEpochSeconds > 0
  ) {
    const resetMilliseconds =
      error.resetEpochSeconds * 1_000;

    return Math.max(
      resetMilliseconds -
        Date.now() +
        RATE_LIMIT_BUFFER_MS,
      0,
    );
  }

  return null;
}

export async function githubRequest<T>(
  operation: () => Promise<{ data: T }>,
  attempt = 0,
  rateLimitAttempt = 0,
): Promise<T> {
  try {
    const response = await operation();
    return response.data;
  } catch (error) {
    const mappedError = mapGitHubError(error);

    if (
      mappedError instanceof GitHubRateLimitError &&
      rateLimitAttempt < MAX_RATE_LIMIT_RETRIES
    ) {
      const delayMilliseconds =
        getRateLimitDelayMilliseconds(mappedError);

      if (
        delayMilliseconds !== null &&
        delayMilliseconds <= MAX_RATE_LIMIT_WAIT_MS
      ) {
        console.error(
          "[GitHub] Rate limit alcanzado. " +
            `Reintentando en ${delayMilliseconds} ms.`,
        );

        await delay(delayMilliseconds);

        return githubRequest(
          operation,
          attempt,
          rateLimitAttempt + 1,
        );
      }
    }

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

      return githubRequest(
        operation,
        attempt + 1,
        rateLimitAttempt,
      );
    }

    throw mappedError;
  }
}