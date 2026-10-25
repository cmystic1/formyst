import { getCurrentUser, hashPassword, isSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { jsonError, readJsonBody } from "@/lib/http";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") return jsonError(403, "Forbidden.");
  if (!rateLimit(`create-user:${actor.id}:${getClientIp(request)}`, 10, 60_000).ok)
    return jsonError(429, "Too many accounts created. Please wait.");
  const body = await readJsonBody(request);
  if (!body.ok) return jsonError(body.status, body.error);
  const input = body.value as { name?: unknown; email?: unknown; password?: unknown } | null;
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = input?.password;
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191)
    return jsonError(400, "Enter a valid name and email.");
  if (typeof password !== "string" || password.length < 12 || password.length > 128)
    return jsonError(400, "Password must be 12–128 characters.");
  if (await prisma.user.findUnique({ where: { email } })) return jsonError(409, "Email is already in use.");
  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role: "member" },
      select: { id: true, name: true, email: true },
    });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return jsonError(409, "Email is already in use.");
    throw error;
  }
}
