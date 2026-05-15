# Counterpart

**Behavioral intelligence for high-stakes negotiations.**

> *Classify your counterpart. Understand their psychology. Practice the conversation before it happens.*

---

## The problem

You walk into a negotiation knowing the agenda. You rarely know the person on the other side.

Their behavioral patterns — how they process information, what motivates them, when they close — are observable long before you enter the room. Counterpart turns those signals into a structured profile and lets you practice the conversation before it happens.

**Zero PII. No names. No LinkedIn. No biographic data.** Only behavioral patterns you already observed.

---

## How it works

1. **Describe** — Fill the form with observable behavioral signals (communication style, decision patterns, reactions under pressure). No names required.
2. **Classify** — Claude analyzes the signals and identifies their archetype: DISC quadrant, OCEAN traits, Voss negotiation type, MICE motivators.
3. **Visualize** — See their probability tree, cognitive map, and the argument that moves their decision.
4. **Spar** — Practice the conversation against an AI clone of that archetype in real-time. Streaming inner monologue, verbal responses, and non-verbal signals.
5. **Learn** — Get a post-session scorecard with timing, leverage points, and what you did right.

---

## The 10 Archetypes

| Archetype | Branch | DISC | Voss |
|---|---|---|---|
| Negociador Alfa | PODER | D | Assertive |
| Decisor por Status | PODER | DI | Assertive |
| Pragmático Defensivo | CONTROL | SC | Analyst |
| Guardián del Proceso | CONTROL | C | Analyst |
| El Mandatado | CONTROL | S | LateDecider |
| El Bloqueador | CONTROL | C | Analyst |
| Relacionista | RELACIÓN | IS | Accommodator |
| Visionario Tribal | RELACIÓN | I | Accommodator |
| Analítico Silencioso | ANÁLISIS | C | Analyst |
| Escéptico Técnico | ANÁLISIS | CD | Analyst |

---

## Sample CIR Report

The [examples/](./examples/) directory contains a sample Counterpart Intelligence Report (CIR) — the output format the system produces.

**[→ CIR-MVL-2026-001 · Media Edition](./examples/CIR-MVL-2026-001-Media-Demo.html)**

This demo report was generated on the system's own founder — who gave explicit consent and published it as proof that the methodology works even when the subject knows the system built it.

The [methodology/](./methodology/) directory documents how to read a CIR and the full archetype taxonomy.

---

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/mjvlc92-droid/counterpart-v4.git
cd counterpart-v4
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# 2. Run with Docker (recommended)
docker compose up

# 3. Open
# Frontend: http://localhost:3000
# Agent:    http://localhost:2024/health
# MCP:      http://localhost:3001
```

**Without Docker (development):**

```bash
npm install
cd apps/agent && pip install -e .
npm run dev
```

**Demo mode (no API key required):**

```bash
DEMO_MODE=true docker compose up
```

---

## Architecture

```
counterpart/
├── apps/
│   ├── frontend/        Next.js 16 + React 19 + CopilotKit v2 + Tailwind
│   ├── agent/           Python + LangGraph + FastAPI + Anthropic Claude
│   └── mcp/             TypeScript + mcp-use (deployable archetype tools)
├── data/
│   └── archetypes.json  Single source of truth — 10 archetypes × 18 attributes
├── examples/
│   └── CIR-MVL-2026-001-Media-Demo.html   Sample report (founder as subject)
├── methodology/
│   ├── como_leer_cir.md                   How to read a CIR (Spanish)
│   └── tipos_personalidad.html            Archetype visual guide
└── tests/
    ├── unit/            pytest
    └── e2e/             Playwright
```

**Data flow:**
```
User fills form → CandidateForm → CopilotKit → LangGraph agent
  → analyze_and_train (archetype + probability tree + opening)
  → SparringChat → FastAPI SSE /api/sparring/stream → Claude streams says/thinks/signal
  → end_training → SessionScorecard
```

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, CopilotKit v2, Tailwind CSS
- **Agent:** LangGraph, FastAPI, Anthropic Claude Sonnet 4.6, Python 3.12
- **MCP:** TypeScript, mcp-use, Zod
- **Infra:** Docker Compose (3 services: frontend / agent / mcp)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes* | Claude API key — [get one here](https://console.anthropic.com) |
| `NEXT_PUBLIC_AGENT_URL` | No | Agent URL (default: localhost:2024) |
| `NEXT_PUBLIC_MCP_URL` | No | MCP server URL (default: localhost:3001) |
| `DEMO_MODE` | No | Use cached profiles without API key |
| `DEBUG` | No | Verbose logging |

*Not required if `DEMO_MODE=true`

---

## Tests

```bash
# Unit tests (Python)
cd apps/agent && pytest tests/unit -v

# E2E tests (Playwright)
cd tests/e2e && npx playwright test

# Type check
cd apps/frontend && npm run type-check
```

---

## Privacy & Compliance

Counterpart is **zero-PII by design**.

The system never collects, stores, or processes:
- Names · Emails · LinkedIn profiles · Phone numbers · Any biographic identifier

It processes only **observable behavioral signals** — what you observe in a meeting, not who the person is.

This design choice addresses a specific legal question we left open publicly: under **Ley 21.719** (Chile's new data protection law), does inferring someone's personality from observable behavior constitute "processing of personal data"?

The technical answer: our system doesn't know who you're describing. It classifies behavioral archetypes, not people.

The harder question — **whether identifiability lives in the system or in the user's mind** — remains open. We think that debate matters for the entire ecosystem building tools like this.

[Read the full privacy design rationale →](./docs/privacy-design.md)

---

## Use Cases

- **M&A teams** preparing for counterpart meetings before a transaction closes
- **Legal teams** entering contract negotiations or dispute resolution sessions
- **Sales executives** in high-value, multi-stakeholder deals
- **Founders** before fundraising conversations or partnership discussions
- Anyone entering a conversation where the other side's psychology determines the outcome

---

## Early Access

The system is in active use. If your organization negotiates contracts that matter and you want to be part of the first cohort of clients, [join the early access list →](https://forms.gle/placeholder)

---

## Origin

First prototype built at **AI Tinkerers Hackathon — Santiago, May 2026** in 6 hours by **Astrid Kingdom**. The question that closed the presentation — *"Does this comply with Chile's data protection law?"* — changed the design and opened a public debate we're still part of.

V4 is what came after.

---

## License

MIT — see [LICENSE](./LICENSE)

---

> *Before you know someone's name, you already know how they negotiate.*
