import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GitHubAuthError } from "../../../clients/github/errors.js";
import { toToolError } from "../result.js";

describe("toToolError", () => {
  it("transforma un ZodError en un error de validación", () => {
    const parseResult = z.string().min(5).safeParse("ab");

    expect(parseResult.success).toBe(false);

    if (parseResult.success) {
      throw new Error("Se esperaba que la validación fallara.");
    }

    const result = toToolError(parseResult.error);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect(result.error.message).toBe(
        "El input de la tool no cumple el schema.",
      );
      expect(result.error.details).toBeDefined();
    }
  });

  it("transforma un error de autenticación de GitHub", () => {
    const error = new GitHubAuthError();

    const result = toToolError(error);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "GitHubAuthError",
        message:
          "El token de GitHub es inexistente, inválido o está vencido.",
      },
    });
  });

  it("transforma un Error común en un error desconocido", () => {
    const error = new Error("Fallo inesperado");

    const result = toToolError(error);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "UNKNOWN_ERROR",
        message: "Fallo inesperado",
      },
    });
  });
});