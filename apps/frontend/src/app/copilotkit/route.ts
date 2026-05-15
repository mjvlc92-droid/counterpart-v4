// Proxy for POST /copilotkit (CopilotKit single-endpoint transport).
// When the React SDK sends {"method":"info"}, the Python SDK 0.1.88 returns
// agents as an array but React SDK ≥1.5 expects an object keyed by agent name.
// This route intercepts only info requests to fix the shape; all other requests
// (streaming agent messages) are piped through untouched.

import { NextRequest } from "next/server";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:2024";

async function handler(req: NextRequest): Promise<Response> {
  const upstream = new URL("/copilotkit/", AGENT_URL);

  const body = req.method !== "GET" ? await req.text() : undefined;

  let isInfoRequest = false;
  if (body) {
    try {
      isInfoRequest = JSON.parse(body)?.method === "info";
    } catch {}
  }

  const res = await fetch(upstream.toString(), {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: body ?? "{}",
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text, { status: res.status });
  }

  if (isInfoRequest) {
    const data = await res.json();
    if (Array.isArray(data.agents)) {
      data.agents = Object.fromEntries(
        (data.agents as Array<{ name: string; [k: string]: unknown }>).map(
          ({ name, ...rest }) => [name, rest]
        )
      );
    }
    return Response.json(data);
  }

  // Streaming pass-through (SSE agent messages)
  const responseHeaders = new Headers();
  for (const [k, v] of res.headers.entries()) {
    const lower = k.toLowerCase();
    if (lower === "content-encoding" || lower === "transfer-encoding") continue;
    responseHeaders.set(k, v);
  }

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
