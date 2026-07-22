export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetEpochSeconds: number;
  retryAfterSeconds?: number;
}