import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSessionToken, hashPassword, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appUrl, googleConfigured, GOOGLE_ORIGIN_COOKIE, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, safeEqual } from "@/lib/google-auth";

type GoogleProfile = { sub?: string; email?: string; email_verified?: boolean; name?: string };
type GoogleTokens = { access_token?: string; token_type?: string };

function failure(request: Request, destination: string, code: string) {
  try { return NextResponse.redirect(new URL(`/${destination}?google=${code}`, appUrl())); }
  catch { return NextResponse.redirect(new URL(`/${destination}?google=${code}`, request.url)); }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookies = request.headers.get("cookie") ?? "";
  const readCookie = (name: string) => cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1] ?? "";
  const source = readCookie(GOOGLE_ORIGIN_COOKIE) === "signup" ? "signup" : "login";
  const clear = (response: NextResponse) => {
    const secure = process.env.NODE_ENV === "production" || url.protocol === "https:";
    for (const name of [GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, GOOGLE_ORIGIN_COOKIE]) response.cookies.set(name, "", { httpOnly: true, sameSite: "lax", secure, path: "/api/auth/google", maxAge: 0 });
    return response;
  };
  const stateCookie = readCookie(GOOGLE_STATE_COOKIE);
  const verifier = readCookie(GOOGLE_VERIFIER_COOKIE);
  const returnedState = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code");
  if (!stateCookie || !returnedState || !safeEqual(stateCookie, returnedState) || !verifier) {
    console.warn("[google-auth] OAuth state or PKCE cookie was missing or invalid.");
    return clear(failure(request, source, "error"));
  }
  if (!googleConfigured()) return clear(failure(request, source, "setup"));
  if (url.searchParams.has("error") || !code) {
    console.warn("[google-auth] Provider returned an OAuth error or no authorization code.", { error: url.searchParams.get("error") || "missing_code" });
    return clear(failure(request, source, "error"));
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", appUrl()).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verifier }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) {
      const details = await tokenResponse.json().catch(() => null) as { error?: string } | null;
      console.warn("[google-auth] Token exchange rejected.", { status: tokenResponse.status, error: details?.error || "unknown" });
      return clear(failure(request, source, "error"));
    }
    const tokens = await tokenResponse.json() as GoogleTokens;
    if (!tokens.access_token || tokens.token_type?.toLowerCase() !== "bearer") return clear(failure(request, source, "error"));
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` }, cache: "no-store",
    });
    if (!profileResponse.ok) {
      console.warn("[google-auth] Google user profile request failed.", { status: profileResponse.status });
      return clear(failure(request, source, "error"));
    }
    const profile = await profileResponse.json() as GoogleProfile;
    const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
    if (!profile.sub || !profile.email_verified || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
      console.warn("[google-auth] Google profile did not contain a valid verified email and account ID.");
      return clear(failure(request, source, "error"));
    }

    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
    if (!user) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        if (existing.googleId && existing.googleId !== profile.sub) return clear(failure(request, source, "error"));
        user = await prisma.user.update({ where: { id: existing.id }, data: { googleId: profile.sub } });
      } else {
        user = await prisma.user.create({
          data: { name: (profile.name || email.split("@")[0]).slice(0, 120), email, googleId: profile.sub, passwordHash: await hashPassword(`google:${crypto.randomBytes(48).toString("base64url")}`), role: "member" },
        });
      }
    }
    const session = await createSessionToken(user.id);
    const response = NextResponse.redirect(new URL("/forms", appUrl()));
    response.cookies.set(SESSION_COOKIE, session, { httpOnly: true, sameSite: "lax", secure: appUrl().protocol === "https:", path: "/", maxAge: SESSION_TTL_SECONDS });
    return clear(response);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[google-auth] Database rejected account sign-in.", { code: error.code });
    } else {
      console.error("[google-auth] Sign-in callback failed.", { name: error instanceof Error ? error.name : "UnknownError" });
    }
    return clear(failure(request, source, "error"));
  }
}
