import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { githubRequest } from "../request.js";

describe("githubRequest", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reintenta una solicitud después de un error 500", async () => {
    vi.useFakeTimers();

    vi.spyOn(console, "error").mockImplementation(
      () => undefined,
    );

    const operation = vi
      .fn()
      .mockRejectedValueOnce({
        status: 500,
        message: "Error interno de GitHub",
      })
      .mockResolvedValueOnce({
        data: "respuesta correcta",
      });

    const requestPromise = githubRequest(operation);

    await vi.advanceTimersByTimeAsync(500);

    await expect(requestPromise).resolves.toBe(
      "respuesta correcta",
    );

    expect(operation).toHaveBeenCalledTimes(2);
  });
});