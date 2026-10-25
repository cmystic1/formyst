import { NextResponse } from "next/server";
import { appUrl, googleConfigured, GOOGLE_ORIGIN_COOKIE, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, oauthChallenge, oauthRandom, OAUTH_COOKIE_TTL } from "@/lib/google-auth";

export async function GET(request: Request) {
  if (!googleConfigured()) return NextResponse.redirect(new URL("/login?google=setup", request.url));
  const source = new URL(request.url).searchParams.get("from") === "signup" ? "signup" : "login";
  try {
    const base = appUrl();
    const redirectUri = new URL("/api/auth/google/callback", base).toString();
    const state = oauthRandom();
    const verifier = oauthRandom(48);
    const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorize.search = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: redirectUri,
      response_type: "code", scope: "openid email profile", state,
      code_challenge: oauthChallenge(verifier), code_challenge_method: "S256",
      prompt: "select_account",
    }).toString();
    const response = NextResponse.redirect(authorize);
    const secure = base.protocol === "https:";
    const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure, path: "/api/auth/google", maxAge: OAUTH_COOKIE_TTL };
    response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, cookieOptions);
    response.cookies.set(GOOGLE_ORIGIN_COOKIE, source, cookieOptions);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?google=setup", request.url));
  }
}
