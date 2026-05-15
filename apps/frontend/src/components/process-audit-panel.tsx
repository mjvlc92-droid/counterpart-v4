"use client";

// V2's ProcessAuditPanel ported to Next.js — CONTROL branch
// Cyan (#00BCD4) pipeline aesthetic with typewriter animation

import { useEffect, useState } from "react";

interface Props {
  archetypePrimary: string;
  entryPoint: string;
}

const CYAN = "#00BCD4";
const GLOW = "rgba(0,188,212,0.3)";

const ACTIVE_STEP: Record<string, number> = {
  "Pragmático Defensivo": 0,
  "Guardián del Proceso": 1,
  "El Mandatado":         2,
  "El Bloqueador":        1,
};

const STEPS = ["Validación", "Proceso", "Cierre"];

export function ProcessAuditPanel({ archetypePrimary, entryPoint }: Props) {
  const activeStep = ACTIVE_STEP[archetypePrimary] ?? 0;
  const [displayText, setDisplayText] = useState("");
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    setDisplayText("");
    setCharIdx(0);
  }, [entryPoint]);

  useEffect(() => {
    if (charIdx >= entryPoint.length) return;
    const t = setTimeout(() => {
      setDisplayText(entryPoint.slice(0, charIdx + 1));
      setCharIdx((i) => i + 1);
    }, 28);
    return () => clearTimeout(t);
  }, [charIdx, entryPoint]);

  return (
    <div
      className="panel-control card-lift rounded-xl p-5 font-mono text-xs"
      style={{
        background: "rgba(2,20,24,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${CYAN}50`,
        boxShadow: `0 0 28px ${GLOW}, 0 0 55px rgba(0,188,212,0.06), inset 0 1px 0 rgba(0,188,212,0.08)`,
        color: CYAN,
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: CYAN }} />
        <span className="text-[10px] tracking-widest uppercase">CONTROL — Process Audit</span>
      </div>

      {/* Pipeline steps */}
      <div className="mb-5 flex items-center gap-1">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1">
            <div
              className="flex items-center gap-1.5 rounded px-3 py-1.5"
              style={{
                background: i === activeStep ? `${CYAN}22` : "transparent",
                border: `1px solid ${i === activeStep ? CYAN : `${CYAN}44`}`,
                opacity: i === activeStep ? 1 : 0.4,
              }}
            >
              {i === activeStep && (
                <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: "#ff4444" }} />
              )}
              <span className={i === activeStep ? "font-bold" : ""}>{step}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span style={{ color: `${CYAN}66` }}>→</span>
            )}
          </div>
        ))}
      </div>

      {/* Typewriter entry point */}
      <div className="space-y-1">
        <div className="text-[10px] tracking-widest uppercase opacity-60">Entrada recomendada</div>
        <p className="leading-relaxed" style={{ color: "#e8e8f0" }}>
          {displayText}
          {charIdx < entryPoint.length && (
            <span style={{ color: CYAN }}>█</span>
          )}
        </p>
      </div>
    </div>
  );
}
