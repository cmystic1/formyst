import { NextResponse } from "next/server";
import { checkPassword, getCurrentUser, hashPassword, isSameOrigin, isSecureRequest, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Unauthorized.");
  if (!rateLimit(`password:${user.id}:${getClientIp(request)}`, 5, 15 * 60_000).ok)
    return jsonError(429, "Too many attempts. Try again later.");
  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);
  const input = body.value as { currentPassword?: unknown; newPassword?: unknown } | null;
  if (typeof input?.newPassword !== "string" || input.newPassword.length < 12 || input.newPassword.length > 128)
    return jsonError(400, "New password must be 12–128 characters.");
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !(await checkPassword(input.currentPassword, record.passwordHash)))
    return jsonError(400, "Current password is incorrect.");
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: isSecureRequest(request), path: "/", maxAge: 0 });
  return response;
}
