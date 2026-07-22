import type { RateLimitInfo } from "./types.js";

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export class GitHubAuthError extends GitHubError {
  constructor() {
    super(
      "El token de GitHub es inexistente, inválido o está vencido.",
      401,
    );
    this.name = "GitHubAuthError";
  }
}

export class GitHubForbiddenError extends GitHubError {
  constructor() {
    super(
      "El token no tiene permisos suficientes para realizar esta operación.",
      403,
    );
    this.name = "GitHubForbiddenError";
  }
}

export class GitHubRateLimitError extends GitHubError {
  constructor(
    public readonly resetEpochSeconds: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(
      "Se alcanzó el límite de solicitudes permitido por GitHub.",
      429,
    );
    this.name = "GitHubRateLimitError";
  }
}

export class GitHubNotFoundError extends GitHubError {
  constructor() {
    super(
      "El recurso solicitado no existe o el token no tiene acceso.",
      404,
    );
    this.name = "GitHubNotFoundError";
  }
}

export class GitHubValidationError extends GitHubError {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message, 422);
    this.name = "GitHubValidationError";
  }
}

export class GitHubServerError extends GitHubError {
  constructor(status: number) {
    super(
      `GitHub respondió con un error interno (${status}).`,
      status,
    );
    this.name = "GitHubServerError";
  }
}

export function readRateLimit(
  headers: Record<string, unknown>,
): RateLimitInfo {
  const retryAfterHeader = headers["retry-after"];

  return {
    limit: Number(
      headers["x-ratelimit-limit"] ?? 0,
    ),
    remaining: Number(
      headers["x-ratelimit-remaining"] ?? -1,
    ),
    resetEpochSeconds: Number(
      headers["x-ratelimit-reset"] ?? 0,
    ),
    retryAfterSeconds:
      retryAfterHeader === undefined
        ? undefined
        : Number(retryAfterHeader),
  };
}

export function mapGitHubError(error: unknown): GitHubError {
  const githubError = error as {
    status?: number;
    message?: string;
    response?: {
      headers?: Record<string, unknown>;
      data?: {
        errors?: unknown;
      };
    };
    errors?: unknown;
  };

  const status = githubError.status;
  const rateLimit = readRateLimit(
    githubError.response?.headers ?? {},
  );

  if (status === 401) {
    return new GitHubAuthError();
  }

  if (status === 403 || status === 429) {
    if (rateLimit.remaining === 0 || status === 429) {
      return new GitHubRateLimitError(
        rateLimit.resetEpochSeconds,
        rateLimit.retryAfterSeconds,
      );
    }

    return new GitHubForbiddenError();
  }

  if (status === 404) {
    return new GitHubNotFoundError();
  }

  if (status === 422) {
    return new GitHubValidationError(
      "GitHub rechazó los datos enviados.",
      githubError.response?.data?.errors ??
        githubError.errors,
    );
  }

  if (status !== undefined && status >= 500) {
    return new GitHubServerError(status);
  }

  return new GitHubError(
    githubError.message ?? "Ocurrió un error desconocido al consultar GitHub.",
    status,
  );
}