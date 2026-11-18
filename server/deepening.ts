import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { GENERATION_TIMEOUT_MS, MAX_REQUEST_BYTES } from "../src/features/deepening/protocol.ts";
import {
  BoundaryError,
  generateDeepening,
  generationUnavailable as message,
  type GenerationOptions,
} from "./deepening-generation.ts";

const allowedOrigins = new Set(["http://127.0.0.1:3001", "http://localhost:3001"]);
function send(response: ServerResponse, status: number, value: unknown) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(value));
}
async function readInput(request: IncomingMessage) {
  if (Number(request.headers["content-length"]) > MAX_REQUEST_BYTES) throw new BoundaryError(413);
  let bytes = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_REQUEST_BYTES) throw new BoundaryError(413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    throw new BoundaryError(400);
  }
}

/** Loopback-only transport factory. The injectable fetch seam is exclusively OpenAI. */
export function createDeepeningServer(options: GenerationOptions = {}) {
  let active = 0;
  const server = createServer(async (request, response) => {
    const path = request.url;
    if (path !== "/api/deepening/aspects" && path !== "/api/deepening/questions") {
      send(response, 404, { error: message });
      request.resume();
      return;
    }
    if (request.method !== "POST") {
      send(response, 405, { error: message });
      request.resume();
      return;
    }
    if (
      !allowedOrigins.has(request.headers.origin ?? "") ||
      !/^(127\.0\.0\.1|localhost):\d+$/u.test(request.headers.host ?? "") ||
      request.headers["sec-fetch-site"] === "cross-site"
    ) {
      send(response, 403, { error: message });
      request.resume();
      return;
    }
    if (
      !/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(
        request.headers["content-type"] ?? "",
      ) ||
      request.headers["content-encoding"]
    ) {
      send(response, 415, { error: message });
      request.resume();
      return;
    }
    if (active >= 2) {
      send(response, 429, { error: message });
      request.resume();
      return;
    }
    active++;
    const bodyDeadline = setTimeout(() => {
      send(response, 408, { error: message });
      request.destroy();
    }, 5000);
    try {
      const raw = await readInput(request);
      clearTimeout(bodyDeadline);
      const result = await generateDeepening(
        path.endsWith("/aspects") ? "aspects" : "questions",
        raw,
        options,
      );
      send(response, 200, result);
    } catch (error) {
      send(
        response,
        error instanceof BoundaryError ? error.status : error instanceof z.ZodError ? 400 : 502,
        { error: message },
      );
      request.resume();
    } finally {
      clearTimeout(bodyDeadline);
      active--;
    }
  });
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.timeout = GENERATION_TIMEOUT_MS + 5000;
  server.maxHeadersCount = 30;
  server.keepAliveTimeout = 1000;
  return server;
}
