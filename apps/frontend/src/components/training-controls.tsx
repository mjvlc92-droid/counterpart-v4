"use client";

const BRANCH_COLORS: Record<string, string> = {
  PODER:    "#F5A623",
  CONTROL:  "#00BCD4",
  "RELACIÓN": "#4ade80",
  "ANÁLISIS": "#39FF14",
};

interface Props {
  archetypeName: string;
  branch?: string;
  openingSpeaker: "user" | "archetype" | null;
  onEndTraining: () => void;
  disabled?: boolean;
}

export function TrainingControls({ archetypeName, branch, openingSpeaker, onEndTraining, disabled }: Props) {
  const branchColor = (branch && BRANCH_COLORS[branch]) || "#7c6af7";

  return (
    <div
      className="glass flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs"
      style={{ borderTop: `2px solid ${branchColor}60`, boxShadow: `0 0 30px ${branchColor}10, inset 0 1px 0 rgba(255,255,255,0.05)` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="live-ring pulse-dot h-2 w-2 rounded-full flex-shrink-0"
          style={{ background: branchColor, color: branchColor, boxShadow: `0 0 10px ${branchColor}, 0 0 20px ${branchColor}60` }}
        />
        <span className="font-semibold" style={{ color: branchColor }}>Entrenamiento activo</span>
        <span className="opacity-50" style={{ color: branchColor }}>
          {archetypeName}
          {openingSpeaker === "archetype" && " · abre el arquetipo"}
          {openingSpeaker === "user" && " · comienzas tú"}
        </span>
      </div>
      <button
        onClick={onEndTraining}
        disabled={disabled}
        className="rounded-lg px-3 py-1 text-xs font-semibold transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.97] disabled:opacity-40"
        style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#e8e8f0" }}
      >
        Terminar sesión
      </button>
    </div>
  );
}
