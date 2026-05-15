"use client";

import { useEffect, useState } from "react";

interface SessionScore {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  turns: number;
  archetype: string;
}

interface Props {
  score: SessionScore;
  onNewSession: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const [display, setDisplay] = useState(0);
  const [ringFill, setRingFill] = useState(0);

  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  const color =
    score >= 80 ? "#4ade80"
    : score >= 60 ? "#a78bfa"
    : score >= 40 ? "#F5A623"
    : "#ef4444";

  const glowColor =
    score >= 80 ? "rgba(74,222,128,0.5)"
    : score >= 60 ? "rgba(167,139,250,0.5)"
    : score >= 40 ? "rgba(245,166,35,0.5)"
    : "rgba(239,68,68,0.5)";

  const gradientId = "scoreGrad";
  const filterId = "scoreGlow";

  useEffect(() => {
    // Count-up number animation
    const duration = 1100;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) requestAnimationFrame(tick);
    };
    const rafId = requestAnimationFrame(tick);

    // Ring fill animation via CSS transition
    const rt = setTimeout(() => setRingFill((score / 100) * circumference), 80);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(rt);
    };
  }, [score, circumference]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <svg width={120} height={120} style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.5" />
            </linearGradient>
            <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer ambient glow ring */}
          <circle
            cx={60} cy={60} r={radius + 10}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.08}
          />
          <circle
            cx={60} cy={60} r={radius + 6}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.14}
          />

          {/* Track */}
          <circle
            cx={60} cy={60} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={5}
          />

          {/* Progress arc with glow */}
          <circle
            cx={60} cy={60} r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - ringFill}
            transform="rotate(-90 60 60)"
            style={{
              transition: "stroke-dashoffset 1.15s cubic-bezier(0.22, 1, 0.36, 1)",
              filter: `drop-shadow(0 0 8px ${glowColor})`,
            }}
          />
        </svg>

        <div className="relative flex flex-col items-center animate-score-in">
          <span
            className="text-4xl font-bold tabular-nums leading-none"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {display}
          </span>
        </div>
      </div>

      <div className="mt-1.5 text-[10px] tracking-widest uppercase" style={{ color: "#4a4a6a" }}>
        / 100
      </div>
    </div>
  );
}

export function SessionScorecard({ score, onNewSession }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-6 animate-fade-up">

      <div className="text-center stagger-1">
        <div className="mb-1 text-[10px] tracking-widest uppercase" style={{ color: "#6b6b8a" }}>
          Sesión completada
        </div>
        <h2 className="gradient-text-animated text-lg font-bold">
          {score.archetype}
        </h2>
        <div className="text-xs mt-0.5" style={{ color: "#6b6b8a" }}>
          {score.turns} turno{score.turns !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="stagger-2">
        <ScoreRing score={score.score} />
      </div>

      <p className="stagger-3 max-w-sm text-center text-sm" style={{ color: "#a0a0c0" }}>
        {score.summary}
      </p>

      {score.strengths.length > 0 && (
        <div
          className="glass-card stagger-4 w-full max-w-sm rounded-xl p-4"
          style={{ borderColor: "rgba(74,222,128,0.2)", boxShadow: "0 0 20px rgba(74,222,128,0.06)" }}
        >
          <div className="mb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#4ade80" }}>
            Fortalezas
          </div>
          <ul className="space-y-1">
            {score.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs" style={{ color: "#c8c8e0" }}>
                <span style={{ color: "#4ade80", flexShrink: 0 }}>✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {score.improvements.length > 0 && (
        <div
          className="glass-card stagger-5 w-full max-w-sm rounded-xl p-4"
          style={{ borderColor: "rgba(245,166,35,0.2)", boxShadow: "0 0 20px rgba(245,166,35,0.06)" }}
        >
          <div className="mb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#F5A623" }}>
            Áreas de mejora
          </div>
          <ul className="space-y-1">
            {score.improvements.map((s) => (
              <li key={s} className="flex items-start gap-2 text-xs" style={{ color: "#c8c8e0" }}>
                <span style={{ color: "#F5A623", flexShrink: 0 }}>→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onNewSession}
        className="shimmer-wrap animate-neon w-full max-w-sm rounded-xl px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, #7c6af7 0%, #4f8ef7 100%)",
          color: "#fff",
        }}
      >
        Nueva sesión
      </button>
    </div>
  );
}
