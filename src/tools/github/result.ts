import { ZodError } from "zod";
import {
  GitHubError,
  GitHubRateLimitError,
  GitHubValidationError,
} from "../../clients/github/errors.js";

export type ToolResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        type: string;
        message: string;
        details?: unknown;
      };
    };

export function toToolError(error: unknown): ToolResult<never> {
  if (error instanceof ZodError) {
    return {
      ok: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "El input de la tool no cumple el schema.",
        details: error.issues,
      },
    };
  }

  if (error instanceof GitHubRateLimitError) {
  return {
    ok: false,
    error: {
      type: error.name,
      message: error.message,
      details: {
        resetEpochSeconds:
          error.resetEpochSeconds,
        ...(error.retryAfterSeconds !== undefined && {
          retryAfterSeconds:
            error.retryAfterSeconds,
        }),
      },
    },
  };
}

  if (error instanceof GitHubValidationError) {
    return {
      ok: false,
      error: {
        type: error.name,
        message: error.message,
        details: error.details,
      },
    };
  }

  if (error instanceof GitHubError) {
    return {
      ok: false,
      error: {
        type: error.name,
        message: error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      type: "UNKNOWN_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Ocurrió un error desconocido.",
    },
  };
}