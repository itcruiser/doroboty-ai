import { z } from "zod";
import { MAX_REQUEST_BYTES } from "../src/features/deepening/protocol.ts";
import {
  BoundaryError,
  generateDeepening,
  generationUnavailable,
  type GenerationOptions,
} from "./deepening-generation.ts";

function json(status: number, value: unknown) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

async function readInput(request: Request, timeoutMs: number) {
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES)
    throw new BoundaryError(413);
  if (!request.body) throw new BoundaryError(400);
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new BoundaryError(408)), timeoutMs);
  });
  const read = async () => {
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) throw new BoundaryError(413);
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    try {
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)) as unknown;
    } catch {
      throw new BoundaryError(400);
    }
  };
  try {
    return await Promise.race([read(), deadline]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

/** Public synthetic-data demo boundary. Origin checks are not user authentication. */
export function createHostedDeepeningHandler(
  getOptions: () => GenerationOptions,
  bodyTimeoutMs = 5000,
) {
  let active = 0;
  return async (request: Request, siteUrl: string | undefined): Promise<Response> => {
    let acquired = false;
    try {
      const url = new URL(request.url);
      if (!["/api/deepening/aspects", "/api/deepening/questions"].includes(url.pathname))
        throw new BoundaryError(404);
      if (request.method !== "POST") throw new BoundaryError(405);
      if (!siteUrl) throw new BoundaryError(503);
      // Netlify site metadata can retain an http URL even when HTTPS is enabled.
      const site = new URL(siteUrl);
      site.protocol = "https:";
      const trustedOrigin = site.origin;
      if (
        url.protocol !== "https:" ||
        url.origin !== trustedOrigin ||
        request.headers.get("origin") !== trustedOrigin ||
        request.headers.get("sec-fetch-site") === "cross-site"
      )
        throw new BoundaryError(403);
      if (
        !/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(
          request.headers.get("content-type") ?? "",
        ) ||
        request.headers.has("content-encoding")
      )
        throw new BoundaryError(415);
      if (active >= 2) throw new BoundaryError(429);
      active++;
      acquired = true;
      const input = await readInput(request, bodyTimeoutMs);
      const result = await generateDeepening(
        url.pathname.endsWith("/aspects") ? "aspects" : "questions",
        input,
        getOptions(),
      );
      return json(200, result);
    } catch (error) {
      return json(
        error instanceof BoundaryError ? error.status : error instanceof z.ZodError ? 400 : 502,
        { error: generationUnavailable },
      );
    } finally {
      if (acquired) active--;
    }
  };
}
