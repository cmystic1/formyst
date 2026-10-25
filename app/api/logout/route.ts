import { NextResponse } from "next/server";
import { isSameOrigin, isSecureRequest, revokeCurrentSession, SESSION_COOKIE } from "@/lib/auth";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "Invalid request origin.");
  await revokeCurrentSession();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  });
  return response;
}
