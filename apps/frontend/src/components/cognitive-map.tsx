"use client";

interface OceanScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

interface Props {
  ocean: OceanScores;
  decisionBiases?: string[];
  discQuadrant?: string;
  vossType?: string;
}

const OCEAN_LABELS: { key: keyof OceanScores; label: string; short: string }[] = [
  { key: "openness",          label: "Apertura",     short: "O" },
  { key: "conscientiousness", label: "Consciencia",  short: "C" },
  { key: "extraversion",      label: "Extraversión", short: "E" },
  { key: "agreeableness",     label: "Amabilidad",   short: "A" },
  { key: "neuroticism",       label: "Neuroticismo", short: "N" },
];

export function CognitiveMap({ ocean, decisionBiases = [], discQuadrant, vossType }: Props) {
  return (
    <div className="glass rounded-xl p-4 text-xs" style={{ color: "#e8e8f0" }}>
      <div className="mb-3 text-[10px] tracking-widest uppercase" style={{ color: "#6b6b8a" }}>
        OCEAN — Big Five
      </div>

      {/* OCEAN bars */}
      <div className="mb-4 space-y-2.5">
        {OCEAN_LABELS.map(({ key, label, short }) => {
          const val = ocean[key] ?? 5;
          const pct = val * 10;
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="w-4 text-center text-[10px] font-bold rounded"
                style={{
                  color: val >= 7 ? "#a78bfa" : val >= 4 ? "#60a5fa" : "#4a4a6a",
                }}
              >
                {short}
              </span>
              <span className="w-20 text-[10px] opacity-50">{label}</span>
              <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className="h-1 rounded-full animate-bar-grow"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #7c6af7, #38bdf8)",
                    opacity: 0.4 + val * 0.06,
                  }}
                />
              </div>
              <span className="w-4 text-right text-[10px] opacity-40">{val}</span>
            </div>
          );
        })}
      </div>

      {/* Badges row */}
      {(discQuadrant || vossType) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {discQuadrant && (
            <span
              className="glass rounded-lg px-2 py-0.5 text-[10px]"
              style={{ color: "#a78bfa" }}
            >
              DISC: {discQuadrant}
            </span>
          )}
          {vossType && (
            <span
              className="glass rounded-lg px-2 py-0.5 text-[10px]"
              style={{ color: "#60a5fa" }}
            >
              Voss: {vossType}
            </span>
          )}
        </div>
      )}

      {/* Decision biases */}
      {decisionBiases.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] tracking-widest uppercase opacity-50">Sesgos cognitivos</div>
          <div className="flex flex-wrap gap-1.5">
            {decisionBiases.map((b) => (
              <span
                key={b}
                className="glass rounded-lg px-2 py-0.5 text-[10px]"
                style={{ color: "#a78bfa", borderColor: "rgba(167,139,250,0.15)" }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
