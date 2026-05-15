/**
 * Counterpart V4 — MCP Server
 * Exposes 3 tools: list_archetypes, get_archetype_details, show_archetype_card
 * V3 base + V4 CORS fix + enriched data
 */
import { createServer } from "mcp-use";
import { z } from "zod";
import { ARCHETYPES, archetypeByName, ARCHETYPE_NAMES } from "./src/data/archetypes.js";

const PORT = parseInt(process.env.MCP_PORT || "3001", 10);

const server = createServer({
  name: "counterpart-mcp",
  version: "4.0.0",
  description: "Counterpart V4 — Archetype catalog tools",
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    headers: ["Content-Type", "Authorization"],
  },
});

// ── Tool 1: list_archetypes ───────────────────────────────────────────────────

server.tool(
  "list_archetypes",
  "List all 10 negotiation archetypes with their branch, DISC type, and Voss type.",
  {},
  async () => {
    const list = ARCHETYPES.map((a) => ({
      nombre: a.nombre,
      branch_level_1: a.branch_level_1,
      disc_quadrant: a.disc_quadrant,
      voss_type: a.voss_type,
      batna_awareness: a.batna_awareness,
      descripcion: a.descripcion,
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ archetypes: list, total: list.length }, null, 2),
        },
      ],
    };
  }
);

// ── Tool 2: get_archetype_details ─────────────────────────────────────────────

server.tool(
  "get_archetype_details",
  "Get the full profile of a specific archetype by name.",
  { nombre: z.string().describe("Exact archetype name from list_archetypes") },
  async ({ nombre }) => {
    const arch = archetypeByName(nombre);
    if (!arch) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: `Archetype "${nombre}" not found.`,
              available: ARCHETYPE_NAMES,
            }),
          },
        ],
        isError: true,
      };
    }
    // Exclude demo_responses and keywords from the detail view
    const { demo_responses: _, keywords: __, ...details } = arch;
    return {
      content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
    };
  }
);

// ── Tool 3: show_archetype_card ───────────────────────────────────────────────

server.tool(
  "show_archetype_card",
  "Display a visual card widget for an archetype. Returns HTML for embedding.",
  { nombre: z.string().describe("Exact archetype name from list_archetypes") },
  async ({ nombre }) => {
    const arch = archetypeByName(nombre);
    if (!arch) {
      return {
        content: [{ type: "text", text: `Archetype "${nombre}" not found.` }],
        isError: true,
      };
    }

    const branchColors: Record<string, string> = {
      PODER: "#F5A623",
      CONTROL: "#00BCD4",
      RELACIÓN: "#4ade80",
      ANÁLISIS: "#39FF14",
    };
    const color = branchColors[arch.branch_level_1] || "#7c6af7";

    const oceanEntries = Object.entries(arch.ocean_base)
      .map(([k, v]) => `<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
        <span style="width:14px;font-weight:bold;color:${v >= 7 ? color : "#6b6b8a"}">${k[0].toUpperCase()}</span>
        <div style="flex:1;height:6px;border-radius:3px;background:#1a1a28">
          <div style="width:${v * 10}%;height:6px;border-radius:3px;background:${v >= 7 ? color : "#3a4a6a"}"></div>
        </div>
        <span style="font-size:10px;color:#6b6b8a">${v}</span>
      </div>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{margin:0;background:#0a0a0f;font-family:system-ui,sans-serif;color:#e8e8f0}
  .card{padding:16px;border-radius:10px;border:1px solid ${color}44;max-width:340px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
  .name{font-size:16px;font-weight:bold}
  .branch{font-size:11px;font-weight:600;color:${color};margin-top:2px}
  .badge{padding:3px 8px;border-radius:4px;font-size:10px;background:${color}22;color:${color};border:1px solid ${color}66}
  .section{margin-top:10px}
  .label{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#6b6b8a;margin-bottom:4px}
  .value{font-size:11px;line-height:1.5;color:#c8c8d8}
  .tags{display:flex;flex-wrap:wrap;gap:4px}
  .tag{padding:2px 8px;border-radius:12px;font-size:9px;background:#1a1a28;border:1px solid #2a2a3a}
</style></head>
<body>
<div class="card">
  <div class="header">
    <div>
      <div class="name">${arch.nombre}</div>
      <div class="branch">${arch.branch_level_1}</div>
    </div>
    <div>
      <div class="badge">${arch.disc_quadrant}</div>
    </div>
  </div>
  <div class="value">${arch.descripcion}</div>
  <div class="tags" style="margin-top:8px">
    <span class="tag">Voss: ${arch.voss_type}</span>
    <span class="tag">BATNA: ${arch.batna_awareness}</span>
    <span class="tag">Ekman: ${arch.ekman_emotion}</span>
  </div>
  <div class="section">
    <div class="label">OCEAN</div>
    ${oceanEntries}
  </div>
  <div class="section">
    <div class="label">Miedo primario</div>
    <div class="value">${arch.primary_fear}</div>
  </div>
  <div class="section">
    <div class="label">Palanca clave</div>
    <div class="value">${arch.key_lever}</div>
  </div>
  <div class="section">
    <div class="label">Señal de cierre</div>
    <div class="value">${arch.close_signal}</div>
  </div>
  <div class="section">
    <div class="label">Señal facial (Ekman)</div>
    <div class="value" style="font-size:10px">${arch.ekman_signal}</div>
  </div>
</div>
</body></html>`;

    return {
      content: [
        {
          type: "resource",
          resource: {
            uri: `ui://archetype-card/${encodeURIComponent(nombre)}`,
            mimeType: "text/html",
            text: html,
          },
        },
      ],
    };
  }
);

server.listen(PORT, () => {
  console.log(`Counterpart MCP server running on port ${PORT}`);
});
