"use client";

import { useState, useCallback, useEffect } from "react";
import { useCoAgent } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

import { CandidateForm } from "@/components/candidate-form";
import { TreePanel } from "@/components/tree-panel";
import { BranchPanelSelector } from "@/components/branch-panel-selector";
import { CognitiveMap } from "@/components/cognitive-map";
import { SparringChat } from "@/components/sparring-chat";
import { SessionScorecard } from "@/components/session-scorecard";

type Mode = "idle" | "archetype_detected" | "tree_generated" | "training" | "complete";

interface ArchetypeState {
  nombre: string;
  confidence: number;
  reasoning: string;
  branch_level_1?: string;
  disc_quadrant?: string;
  voss_type?: string;
  primary_fear?: string;
  sparring_style?: string;
  entry_point?: string;
  blind_spot?: string;
  close_signal?: string;
  key_lever?: string;
  ocean_base?: Record<string, number>;
  ekman_signal?: string;
}

interface SessionScore {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  turns: number;
  archetype: string;
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:2024";

function getOrCreateCloneId(): string {
  if (typeof window === "undefined") return `session_${Math.random().toString(36).slice(2)}`;
  let id = sessionStorage.getItem("counterpart_clone_id");
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem("counterpart_clone_id", id);
  }
  return id;
}

export default function Home() {
  // Core UI state — driven by direct API calls, not CopilotKit
  const [mode, setMode] = useState<Mode>("idle");
  const [archetype, setArchetype] = useState<ArchetypeState | null>(null);
  const [tree, setTree] = useState<string | null>(null);
  const [openingSpeaker, setOpeningSpeaker] = useState<"user" | "archetype" | null>(null);
  const [sessionScore, setSessionScore] = useState<SessionScore | null>(null);
  const [trainingTurn, setTrainingTurn] = useState(0);
  const [cloneId] = useState<string>(getOrCreateCloneId);

  const isTraining = mode === "training";
  const isComplete = mode === "complete";
  const hasArchetype = !!archetype;

  const BRANCH_COLORS: Record<string, string> = {
    PODER: "#F5A623", CONTROL: "#00BCD4", "RELACIÓN": "#4ade80", "ANÁLISIS": "#39FF14",
  };
  const branchColor = archetype?.branch_level_1 ? (BRANCH_COLORS[archetype.branch_level_1] || "#7c6af7") : "#7c6af7";

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  const handleAnalysisComplete = useCallback((data: {
    archetype: Record<string, unknown>;
    tree: string;
    opening_speaker: "user" | "archetype";
  }) => {
    setArchetype(data.archetype as unknown as ArchetypeState);
    setTree(data.tree);
    setOpeningSpeaker(data.opening_speaker);
    setMode("training");
    setTrainingTurn(0);
    setSessionScore(null);
  }, []);

  const handleEndTraining = useCallback(async () => {
    // Compute a simple score locally (no API round-trip needed)
    const score: SessionScore = {
      score: Math.min(100, 45 + trainingTurn * 8),
      summary: trainingTurn >= 4
        ? "Sesión completa. Buen manejo de la dinámica."
        : "Sesión corta. Más turnos aumentan la puntuación.",
      strengths: ["Persistencia", "Adaptación al estilo"],
      improvements: ["Escuchar señales de cierre", "Usar el key lever del arquetipo"],
      turns: trainingTurn,
      archetype: archetype?.nombre || "",
    };
    setSessionScore(score);
    setMode("complete");
  }, [trainingTurn, archetype]);

  const handleNewSession = useCallback(() => {
    setMode("idle");
    setArchetype(null);
    setTree(null);
    setOpeningSpeaker(null);
    setSessionScore(null);
    setTrainingTurn(0);
  }, []);

  const handleTurnComplete = useCallback((turn: number) => {
    setTrainingTurn(turn);
  }, []);

  // Build profile for sparring SSE
  const profileForSparring = archetype
    ? {
        archetype_primary: archetype.nombre,
        archetype_secondary: archetype.nombre,
        branch_level_1: archetype.branch_level_1 || "CONTROL",
        disc_quadrant: archetype.disc_quadrant || "C",
        voss_type: archetype.voss_type || "Analyst",
        primary_fear: archetype.primary_fear || "",
        sparring_style: archetype.sparring_style || "",
        entry_point: archetype.entry_point || "",
        ocean: archetype.ocean_base || {},
        decision_biases: [],
        risk_tolerance: "medio",
      }
    : {};

  return (
    <CopilotSidebar
      defaultOpen={false}
      labels={{
        title: "Counterpart Coach",
        initial: "Soy tu coach de negociación. Pregúntame sobre la contraparte, tácticas o estrategia.",
      }}
      instructions="Eres el coach de Counterpart. Ayudas al usuario a prepararse para negociaciones de alto valor. Responde con táctica concreta, no genérica."
    >
      <div className="flex h-screen flex-col overflow-hidden page-enter" style={{ background: "#0a0a0f" }}>
        {/* Depth vignette — edges darken, center is the destination */}
        <div className="depth-vignette" aria-hidden />

        {/* Ambient aurora background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -left-60 -top-60 h-[640px] w-[640px] rounded-full animate-orb-1"
            style={{ background: "radial-gradient(circle, rgba(124,106,247,1) 0%, transparent 70%)", opacity: 0.08, filter: "blur(90px)" }}
          />
          <div
            className="absolute -bottom-60 -right-60 h-[640px] w-[640px] rounded-full animate-orb-2"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,1) 0%, transparent 70%)", opacity: 0.07, filter: "blur(90px)" }}
          />
          <div
            className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[440px] w-[440px] rounded-full animate-orb-3"
            style={{ background: "radial-gradient(circle, rgba(167,139,250,1) 0%, transparent 70%)", opacity: 0.035, filter: "blur(110px)" }}
          />
          <div
            className="absolute right-0 top-1/2 h-[320px] w-[320px] rounded-full animate-orb-1"
            style={{ background: "radial-gradient(circle, rgba(74,222,128,1) 0%, transparent 70%)", opacity: 0.028, filter: "blur(80px)", animationDelay: "9s" }}
          />
          <div
            className="absolute left-1/4 bottom-0 h-[280px] w-[280px] rounded-full animate-orb-2"
            style={{ background: "radial-gradient(circle, rgba(56,189,248,1) 0%, transparent 70%)", opacity: 0.025, filter: "blur(70px)", animationDelay: "4s" }}
          />
        </div>

        {/* Header */}
        <header className="bg-grid relative flex items-center justify-between border-b px-6 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <span className="gradient-text-animated text-base font-bold tracking-tight">Counterpart</span>
          </div>
          {isTraining && archetype ? (
            <div className="flex items-center gap-3 animate-fade-up">
              <div className="flex items-center gap-2">
                <span
                  className="live-ring pulse-dot h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: branchColor, color: branchColor, boxShadow: `0 0 10px ${branchColor}, 0 0 20px ${branchColor}60` }}
                />
                <span className="text-[11px] font-semibold" style={{ color: branchColor }}>En sesión</span>
                <span className="text-[10px] opacity-60" style={{ color: branchColor }}>
                  {archetype.nombre}
                  {openingSpeaker === "archetype" && " · abre el arquetipo"}
                  {openingSpeaker === "user" && " · comienzas tú"}
                </span>
              </div>
              <button
                onClick={handleEndTraining}
                className="rounded-lg px-3 py-1 text-xs font-semibold transition-all hover:bg-white/10 hover:border-white/30 active:scale-[0.97]"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#e8e8f0" }}
              >
                Terminar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px]" style={{ color: "#6b6b8a" }}>
              <span
                className="h-1.5 w-1.5 rounded-full animate-glow-pulse"
                style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
              />
              Behavioral Intelligence
            </div>
          )}
        </header>

        {/* Main 3-panel layout */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel — Form or Archetype info */}
          <div
            className="flex w-80 flex-shrink-0 flex-col border-r overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {!hasArchetype || mode === "idle" ? (
              <div key="form" className="flex flex-col h-full animate-fade-up">
                <CandidateForm
                  disabled={isTraining}
                  agentUrl={AGENT_URL}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
            ) : (
              <div key="archetype" className="flex flex-col gap-3 overflow-y-auto p-4 animate-fade-up">
                {/* Archetype header */}
                <div>
                  <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "#4a4a6a" }}>
                    Contraparte detectada
                  </div>
                  <h3 className="font-bold text-sm gradient-text">{archetype.nombre}</h3>
                  {archetype.branch_level_1 && (
                    <div className="text-[11px] font-semibold mt-0.5 tracking-wide" style={{
                      color: { PODER: "#F5A623", CONTROL: "#00BCD4", RELACIÓN: "#4ade80", ANÁLISIS: "#39FF14" }[archetype.branch_level_1] || "#a78bfa"
                    }}>
                      {archetype.branch_level_1}
                    </div>
                  )}
                </div>

                {/* Branch-specific panel */}
                {archetype.branch_level_1 && (
                  <BranchPanelSelector
                    archetype={{
                      archetype_primary: archetype.nombre,
                      branch_level_1: archetype.branch_level_1 as "PODER" | "CONTROL" | "RELACIÓN" | "ANÁLISIS",
                      primary_fear: archetype.primary_fear || "",
                      blind_spot: archetype.blind_spot || "",
                      close_signal: archetype.close_signal || "",
                      entry_point: archetype.entry_point || "",
                      key_lever: archetype.key_lever || "",
                    }}
                  />
                )}

                {/* OCEAN map */}
                {archetype.ocean_base && (
                  <CognitiveMap
                    ocean={archetype.ocean_base as any}
                    discQuadrant={archetype.disc_quadrant}
                    vossType={archetype.voss_type}
                  />
                )}

                {!isTraining && !isComplete && (
                  <button
                    onClick={handleNewSession}
                    className="mt-2 glass rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/10"
                    style={{ color: "#6b6b8a" }}
                  >
                    ↩ Nueva sesión
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Center/Right — Tree + Chat */}
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* Top: Tree panel — collapses to pill during training */}
            {!isComplete && (
              <div
                className={`border-b flex-shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${isTraining ? "h-10" : "h-64"}`}
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <TreePanel
                  mode={mode}
                  archetype={archetype ? {
                    nombre: archetype.nombre,
                    confidence: archetype.confidence,
                    reasoning: archetype.reasoning,
                    branch_level_1: archetype.branch_level_1,
                  } : null}
                  tree={tree}
                  collapsed={isTraining}
                />
              </div>
            )}

            {/* Bottom: Sparring chat or scorecard */}
            <div key={isComplete ? "scorecard" : "session"} className="flex-1 overflow-hidden animate-fade-up">
              {isComplete && sessionScore ? (
                <SessionScorecard score={sessionScore} onNewSession={handleNewSession} />
              ) : isTraining && archetype ? (
                <SparringChat
                  profile={profileForSparring}
                  cloneId={cloneId}
                  archetypeName={archetype.nombre}
                  branch={archetype.branch_level_1 || "CONTROL"}
                  trainingTurn={trainingTurn}
                  onTurnComplete={handleTurnComplete}
                  onEndRequested={handleEndTraining}
                  agentUrl={AGENT_URL}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-xs" style={{ color: "#6b6b8a" }}>
                  {mode === "idle" ? (
                    <>
                      <span className="gradient-text text-xs font-medium opacity-40">◈</span>
                      <span>Completa el formulario para comenzar</span>
                    </>
                  ) : (
                    <>
                      <span className="dot-typing" style={{ color: "#6b6b8a" }}><span /><span /><span /></span>
                      <span style={{ color: "#4a4a6a" }}>Analizando contraparte…</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </CopilotSidebar>
  );
}
