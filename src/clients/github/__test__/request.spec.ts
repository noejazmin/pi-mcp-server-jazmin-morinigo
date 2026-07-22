import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { githubRequest } from "../request.js";
import { GitHubRateLimitError } from "../errors.js";

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

  it("reintenta una vez cuando retry-after indica una espera corta", async () => {
  vi.useFakeTimers();

  vi.spyOn(console, "error").mockImplementation(
    () => undefined,
  );

  const operation = vi
    .fn()
    .mockRejectedValueOnce({
      status: 429,
      message: "Rate limit alcanzado",
      response: {
        headers: {
          "retry-after": "2",
          "x-ratelimit-remaining": "0",
        },
      },
    })
    .mockResolvedValueOnce({
      data: "respuesta después del rate limit",
    });

  const requestPromise = githubRequest(operation);

  await vi.advanceTimersByTimeAsync(2_000);

  await expect(requestPromise).resolves.toBe(
    "respuesta después del rate limit",
  );

  expect(operation).toHaveBeenCalledTimes(2);
});

it("no reintenta cuando retry-after supera la espera máxima", async () => {
  const operation = vi
    .fn()
    .mockRejectedValue({
      status: 429,
      message: "Rate limit alcanzado",
      response: {
        headers: {
          "retry-after": "60",
          "x-ratelimit-remaining": "0",
        },
      },
    });

  await expect(
    githubRequest(operation),
  ).rejects.toBeInstanceOf(
    GitHubRateLimitError,
  );

  expect(operation).toHaveBeenCalledTimes(1);
});

it("calcula la espera usando x-ratelimit-reset", async () => {
  vi.useFakeTimers();

  vi.spyOn(console, "error").mockImplementation(
    () => undefined,
  );

  const currentTimeMilliseconds =
    1_750_000_000_000;

  vi.setSystemTime(currentTimeMilliseconds);

  const resetEpochSeconds =
    currentTimeMilliseconds / 1_000 + 2;

  const operation = vi
    .fn()
    .mockRejectedValueOnce({
      status: 403,
      message: "Rate limit primario alcanzado",
      response: {
        headers: {
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset": String(
            resetEpochSeconds,
          ),
        },
      },
    })
    .mockResolvedValueOnce({
      data: "respuesta después del reset",
    });

  const requestPromise = githubRequest(operation);

  await vi.advanceTimersByTimeAsync(3_000);

  await expect(requestPromise).resolves.toBe(
    "respuesta después del reset",
  );

  expect(operation).toHaveBeenCalledTimes(2);
});

it("realiza como máximo un reintento por rate limit", async () => {
  vi.useFakeTimers();

  vi.spyOn(console, "error").mockImplementation(
    () => undefined,
  );

  const rateLimitResponse = {
    status: 429,
    message: "Rate limit alcanzado",
    response: {
      headers: {
        "retry-after": "1",
        "x-ratelimit-remaining": "0",
      },
    },
  };

  const operation = vi
    .fn()
    .mockRejectedValueOnce(rateLimitResponse)
    .mockRejectedValueOnce(rateLimitResponse);

  const requestPromise = githubRequest(operation);

const rejectionExpectation = expect(
  requestPromise,
).rejects.toBeInstanceOf(
  GitHubRateLimitError,
);

await vi.advanceTimersByTimeAsync(1_000);

await rejectionExpectation;

  expect(operation).toHaveBeenCalledTimes(2);
});
});