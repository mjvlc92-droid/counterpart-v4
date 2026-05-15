"use client";

// NEW in V4: Selects the correct branch panel based on branch_level_1
// Connects V3's state management with V2's visual panels

import { EvidenceWeightPanel } from "./evidence-weight-panel";
import { ProcessAuditPanel } from "./process-audit-panel";
import { PowerBalancePanel } from "./power-balance-panel";

interface ArchetypeData {
  archetype_primary?: string;
  nombre?: string;
  branch_level_1: "PODER" | "CONTROL" | "RELACIÓN" | "ANÁLISIS";
  primary_fear: string;
  blind_spot: string;
  close_signal: string;
  entry_point: string;
  key_lever: string;
}

interface Props {
  archetype: ArchetypeData;
}

export function BranchPanelSelector({ archetype }: Props) {
  const name = archetype.archetype_primary ?? archetype.nombre ?? "";
  const branch = archetype.branch_level_1;

  switch (branch) {
    case "ANÁLISIS":
      return (
        <EvidenceWeightPanel
          archetypePrimary={name}
          primaryFear={archetype.primary_fear}
          blindSpot={archetype.blind_spot}
          closeSignal={archetype.close_signal}
        />
      );

    case "CONTROL":
      return (
        <ProcessAuditPanel
          archetypePrimary={name}
          entryPoint={archetype.entry_point}
        />
      );

    case "PODER":
      return (
        <PowerBalancePanel
          archetypePrimary={name}
          keyLever={archetype.key_lever}
          primaryFear={archetype.primary_fear}
        />
      );

    case "RELACIÓN":
      return (
        <div
          className="panel-relacion card-lift rounded-xl p-5 text-xs"
          style={{
            background: "rgba(4,20,8,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(74,222,128,0.4)",
            boxShadow: "0 0 30px rgba(74,222,128,0.18), 0 0 60px rgba(74,222,128,0.06), inset 0 1px 0 rgba(74,222,128,0.08)",
            color: "#4ade80",
            fontFamily: "monospace",
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
            <span className="text-[10px] tracking-widest uppercase">RELACIÓN — Relational Levers</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Entrada", value: archetype.entry_point },
              { label: "Palanca", value: archetype.key_lever },
              { label: "Señal de cierre", value: archetype.close_signal },
              { label: "Punto ciego", value: archetype.blind_spot },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-2" style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)" }}>
                <div className="mb-1 text-[10px] tracking-widest uppercase opacity-60">{label}</div>
                <p style={{ color: "#e8e8f0", fontSize: "11px", lineHeight: "1.4" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
