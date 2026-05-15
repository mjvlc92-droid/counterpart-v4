// Intercepts GET /copilotkit/info (App Router routes beat Next.js rewrites).
// The Python copilotkit SDK 0.1.88 returns agents as an array; React SDK ≥1.5
// expects an object keyed by agent name. This shim transforms the response so
// the CopilotKit frontend finds the agent correctly and doesn't crash.

import { NextRequest, NextResponse } from "next/server";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:2024";

async function handleInfo(req: NextRequest): Promise<NextResponse> {
  const upstream = new URL("/copilotkit/", AGENT_URL);
  const body = req.method === "POST" ? await req.text() : undefined;

  const res = await fetch(upstream.toString(), {
    method: req.method === "GET" ? "POST" : req.method,
    headers: { "Content-Type": "application/json" },
    body: body ?? "{}",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "upstream error" }, { status: res.status });
  }

  const data = await res.json();

  // Transform agents from array [{name, ...}] → object {name: {...}}
  if (Array.isArray(data.agents)) {
    data.agents = Object.fromEntries(
      data.agents.map(({ name, ...rest }: { name: string; [k: string]: unknown }) => [name, rest])
    );
  }

  return NextResponse.json(data);
}

export const GET = handleInfo;
export const POST = handleInfo;
