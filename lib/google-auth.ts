import crypto from "node:crypto";

export const GOOGLE_STATE_COOKIE = "formyst_google_state";
export const GOOGLE_VERIFIER_COOKIE = "formyst_google_verifier";
export const GOOGLE_ORIGIN_COOKIE = "formyst_google_origin";
export const OAUTH_COOKIE_TTL = 10 * 60;

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appUrl(): URL {
  const configured = process.env.APP_URL || "http://localhost:3000";
  const url = new URL(configured);
  if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
    throw new Error("APP_URL must be an origin without a path or credentials.");
  }
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("APP_URL must use HTTPS outside local development.");
  }
  return url;
}

export function oauthRandom(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function oauthChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
