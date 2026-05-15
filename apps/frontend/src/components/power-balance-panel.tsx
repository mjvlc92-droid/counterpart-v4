"use client";

// V2's PowerBalancePanel ported to Next.js — PODER branch
// Amber (#F5A623) dominance axis aesthetic

import { useEffect, useState } from "react";

interface Props {
  archetypePrimary: string;
  keyLever: string;
  primaryFear: string;
}

const AMBER = "#F5A623";
const GLOW = "rgba(245,166,35,0.3)";

const POWER_POSITION: Record<string, number> = {
  "Negociador Alfa":   70,
  "Decisor por Status": 55,
};

export function PowerBalancePanel({ archetypePrimary, keyLever, primaryFear }: Props) {
  const target = POWER_POSITION[archetypePrimary] ?? 50;
  const [pos, setPos] = useState(50);

  useEffect(() => {
    const t = setTimeout(() => setPos(target), 150);
    return () => clearTimeout(t);
  }, [target]);

  const theyDominate = pos > 50;
  const delta = Math.abs(pos - 50);

  return (
    <div
      className="panel-poder card-lift rounded-xl p-5 text-xs"
      style={{
        background: "rgba(20,10,0,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${AMBER}50`,
        boxShadow: `0 0 30px ${GLOW}, 0 0 60px rgba(245,166,35,0.06), inset 0 1px 0 rgba(245,166,35,0.08)`,
        color: AMBER,
        fontFamily: "monospace",
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="pulse-dot h-2 w-2 rounded-full" style={{ background: AMBER }} />
        <span className="text-[10px] tracking-widest uppercase">PODER — Power Balance Index</span>
      </div>

      {/* Labels */}
      <div className="mb-1 flex justify-between text-[10px] opacity-60 uppercase tracking-widest">
        <span>TÚ</span>
        <span>ELLOS</span>
      </div>

      {/* Axis */}
      <div className="relative mb-3 h-4 rounded-full" style={{ background: `${AMBER}22`, border: `1px solid ${AMBER}44` }}>
        {/* Center line */}
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: `${AMBER}44` }} />
        {/* Power dot */}
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-700"
          style={{
            left: `calc(${pos}% - 8px)`,
            background: AMBER,
            boxShadow: `0 0 12px ${GLOW}`,
            transitionTimingFunction: "ease-out",
          }}
        />
      </div>

      {/* Reading */}
      <p className="mb-4 text-center text-[11px]" style={{ color: "#e8e8f0" }}>
        {theyDominate
          ? `Ellos dominan por ${delta} puntos`
          : delta > 0
          ? `Empate / tú tienes leve ventaja`
          : "Equilibrio de poder"}
      </p>

      <div className="space-y-3">
        <div>
          <div className="mb-0.5 text-[10px] tracking-widest uppercase opacity-60">Palanca clave</div>
          <p style={{ color: "#e8e8f0" }}>{keyLever}</p>
        </div>
        <div>
          <div className="mb-0.5 text-[10px] tracking-widest uppercase opacity-60">Su miedo</div>
          <p style={{ color: "#e8e8f0" }}>{primaryFear}</p>
        </div>
      </div>
    </div>
  );
}
