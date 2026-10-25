import { NextResponse } from "next/server";

// Generous enough for two base64 branding images (~600 KB files each) plus a
// full set of max-length answers; rate limiting is the abuse control here.
export const MAX_BODY_BYTES = 3_000_000;

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: number; error: string };

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  let text: string;
  try {
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES)
      return { ok: false, status: 413, error: "Request body is too large." };
    const reader = request.body?.getReader();
    if (!reader) return { ok: false, status: 400, error: "Request body is empty." };
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413, error: "Request body is too large." };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, status: 400, error: "Could not read request body." };
  }

  if (!text.trim()) {
    return { ok: false, status: 400, error: "Request body is empty." };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400, error: "Request body must be valid JSON." };
  }
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}
