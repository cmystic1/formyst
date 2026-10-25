import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSessionToken, hashPassword, isSameOrigin, isSecureRequest, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  if (!process.env.DATABASE_URL?.startsWith("mysql://")) return jsonError(503, "The account database is not ready.");
  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);
  const input = body.value as { name?: unknown; email?: unknown; password?: unknown; confirmPassword?: unknown } | null;
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = input?.password;
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191)
    return jsonError(400, "Enter a valid name and email.");
  if (typeof password !== "string" || password.length < 12 || password.length > 128)
    return jsonError(400, "Use a password between 12 and 128 characters.");
  if (input?.confirmPassword !== password) return jsonError(400, "Passwords do not match.");
  const emailLimit = rateLimit(`signup-email:${email}`, 5, 60 * 60 * 1000);
  const ip = getClientIp(request);
  const ipLimit = ip === "untrusted" ? { ok: true, retryAfterSeconds: 0 } : rateLimit(`signup-ip:${ip}`, 20, 60 * 60 * 1000);
  if (!emailLimit.ok || !ipLimit.ok) {
    const retryAfterSeconds = Math.max(emailLimit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    return NextResponse.json({ error: "Too many sign-up attempts. Please try again later." }, { status: 429, headers: { "retry-after": String(retryAfterSeconds) } });
  }

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role: "member" },
      select: { id: true },
    });
    const token = await createSessionToken(user.id);
    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: isSecureRequest(request), path: "/", maxAge: SESSION_TTL_SECONDS });
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return jsonError(409, "An account with that email already exists.");
    if (error instanceof Prisma.PrismaClientInitializationError ||
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021"))
      return jsonError(503, "The account database is not ready. Please try again later.");
    throw error;
  }
}
