import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  isSameOrigin,
  isSecureRequest,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  if (!process.env.DATABASE_URL?.startsWith("mysql://"))
    return jsonError(503, "MySQL is not configured yet. Ask the administrator to finish setup.");

  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);

  const input = body.value as { email?: unknown; password?: unknown } | null;
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const limit = rateLimit(`login-email:${email || "empty"}`, 5, 15 * 60 * 1000);
  const ipLimit = rateLimit(`login-ip:${getClientIp(request)}`, 30, 15 * 60 * 1000);
  if (!limit.ok || !ipLimit.ok) {
    const retryAfterSeconds = Math.max(limit.retryAfterSeconds, ipLimit.retryAfterSeconds);
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${retryAfterSeconds}s.` },
      { status: 429, headers: { "retry-after": String(retryAfterSeconds) } },
    );
  }
  try {
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (!user || !(await checkPassword(input?.password, user.passwordHash))) {
      return jsonError(401, "Invalid email or password.");
    }
    const token = await createSessionToken(user.id);
    const response = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError ||
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021"))
      return jsonError(503, "The user database is not ready. Ask the administrator to finish MySQL setup.");
    throw error;
  }
}
