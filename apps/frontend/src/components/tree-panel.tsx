"use client";

import { MermaidDiagram } from "./mermaid-diagram";

type Mode = "idle" | "archetype_detected" | "tree_generated" | "training" | "complete";

interface ArchetypeMatch {
  nombre: string;
  confidence: number;
  reasoning: string;
  branch_level_1?: string;
}

interface Props {
  mode: Mode;
  archetype: ArchetypeMatch | null;
  tree: string | null;
  collapsed?: boolean;
}

const MODE_LABELS: Record<Mode, string> = {
  idle: "Esperando",
  archetype_detected: "Arquetipo detectado",
  tree_generated: "Árbol generado",
  training: "Entrenamiento activo",
  complete: "Sesión completada",
};

const MODE_COLORS: Record<Mode, string> = {
  idle: "#4a4a6a",
  archetype_detected: "#F5A623",
  tree_generated: "#00BCD4",
  training: "#4ade80",
  complete: "#a78bfa",
};

const BRANCH_COLORS: Record<string, string> = {
  PODER: "#F5A623",
  CONTROL: "#00BCD4",
  "RELACIÓN": "#4ade80",
  "ANÁLISIS": "#39FF14",
};

export function TreePanel({ mode, archetype, tree, collapsed }: Props) {
  const color = MODE_COLORS[mode];
  const branchColor = archetype?.branch_level_1 ? BRANCH_COLORS[archetype.branch_level_1] : color;
  const confidencePct = archetype ? Math.round(archetype.confidence * 100) : 0;

  if (collapsed && archetype) {
    return (
      <div className="flex h-10 items-center gap-3 px-4 animate-fade-up" style={{ background: "transparent" }}>
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: branchColor, boxShadow: `0 0 6px ${branchColor}` }}
        />
        <span className="text-[11px] font-semibold truncate" style={{ color: branchColor }}>
          {archetype.nombre}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
          style={{ background: `${branchColor}15`, color: branchColor, border: `1px solid ${branchColor}40` }}
        >
          {confidencePct}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4" style={{ background: "transparent" }}>
      {/* Mode badge row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#4a4a6a" }}>
          Estado
        </span>
        <span
          className="animate-scale-in rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}40`,
            color,
          }}
        >
          {MODE_LABELS[mode]}
        </span>
      </div>

      {/* Archetype card */}
      {archetype && (
        <div
          className="glass-card rounded-xl p-3 animate-fade-up"
          style={{ borderLeft: `3px solid ${branchColor}`, boxShadow: `0 0 20px ${branchColor}18` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-sm" style={{ color: "#e8e8f0" }}>
                {archetype.nombre}
              </div>
              {archetype.branch_level_1 && (
                <div className="text-[10px] mt-0.5 font-medium tracking-wide" style={{ color: branchColor }}>
                  {archetype.branch_level_1}
                </div>
              )}
            </div>
            <div
              className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
              style={{ background: `${branchColor}15`, color: branchColor, border: `1px solid ${branchColor}40` }}
            >
              {confidencePct}%
            </div>
          </div>

          {/* Confidence bar */}
          {archetype.confidence > 0 && (
            <div className="mt-2.5 h-1 w-full rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-1 rounded-full animate-bar-grow"
                style={{
                  width: `${confidencePct}%`,
                  background: `linear-gradient(90deg, #a78bfa, #38bdf8)`,
                  boxShadow: "0 0 8px rgba(124,106,247,0.5)",
                }}
              />
            </div>
          )}

          {archetype.reasoning && (
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "#5a5a7a" }}>
              {archetype.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Probability tree */}
      {tree ? (
        <div className="glass flex-1 overflow-auto rounded-xl p-3">
          <div className="mb-2 text-[10px] tracking-widest uppercase" style={{ color: "#4a4a6a" }}>
            Árbol de probabilidades
          </div>
          <MermaidDiagram chart={tree} />
        </div>
      ) : (
        <div
          className="glass flex flex-1 items-center justify-center rounded-xl text-xs animate-fade-up"
          style={{ color: "#3a3a5a" }}
        >
          El árbol aparecerá tras el análisis
        </div>
      )}
    </div>
  );
}
