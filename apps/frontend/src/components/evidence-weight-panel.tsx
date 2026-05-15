"use client";

// V2's EvidenceWeightPanel ported to Next.js/Tailwind — ANÁLISIS branch
// Green neon (#39FF14) terminal aesthetic, animated bars

import { useEffect, useState } from "react";

interface Props {
  archetypePrimary: string;
  primaryFear: string;
  blindSpot: string;
  closeSignal: string;
}

const TARGETS: Record<string, [number, number, number]> = {
  "Escéptico Técnico":   [92, 71, 28],
  "Analítico Silencioso": [87, 62, 31],
};

const NEON = "#39FF14";
const GLOW = "rgba(57,255,20,0.35)";

export function EvidenceWeightPanel({ archetypePrimary, primaryFear, blindSpot, closeSignal }: Props) {
  const [widths, setWidths] = useState([0, 0, 0]);
  const targets = TARGETS[archetypePrimary] ?? [80, 55, 25];

  useEffect(() => {
    const timers = [
      setTimeout(() => setWidths((w) => [targets[0], w[1], w[2]]), 100),
      setTimeout(() => setWidths((w) => [w[0], targets[1], w[2]]), 400),
      setTimeout(() => setWidths((w) => [w[0], w[1], targets[2]]), 700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [archetypePrimary]);

  const rows = [
    { label: "FEAR WEIGHT", value: widths[0], target: targets[0], text: primaryFear },
    { label: "BLIND SPOT",  value: widths[1], target: targets[1], text: blindSpot },
    { label: "CLOSE SIGNAL", value: widths[2], target: targets[2], text: closeSignal },
  ];

  return (
    <div
      className="panel-analisis card-lift rounded-xl p-5 font-mono text-xs"
      style={{
        background: "rgba(5,13,5,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${NEON}50`,
        boxShadow: `0 0 30px ${GLOW}, 0 0 60px rgba(57,255,20,0.06), inset 0 1px 0 rgba(57,255,20,0.08)`,
        color: NEON,
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: NEON }} />
        <span className="text-[10px] tracking-widest uppercase">ANÁLISIS — Evidence Matrix</span>
      </div>
      <div className="space-y-4">
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between">
              <span className="tracking-widest">{row.label}</span>
              <span>{row.value}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "rgba(57,255,20,0.1)" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${row.value}%`,
                  background: NEON,
                  boxShadow: `0 0 8px ${GLOW}`,
                  transitionDuration: `${800 + i * 300}ms`,
                  transitionTimingFunction: "ease-out",
                }}
              />
            </div>
            <p className="mt-1 text-[10px] opacity-60 leading-relaxed">{row.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
