"use client";

import { useEffect, useRef, useState } from "react";

interface Turn {
  role: "user" | "assistant";
  says: string;
  thinks?: string;
  signal?: string;
  streaming?: boolean;
}

interface Props {
  profile: Record<string, unknown>;
  cloneId: string;
  archetypeName: string;
  branch: string;
  trainingTurn: number;
  onTurnComplete?: (turn: number) => void;
  onEndRequested?: () => void;
  agentUrl?: string;
}

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:2024";
const EXIT_RE = /^(terminar|fin|listo|suficiente|i'?m done|ya no más|hasta aquí|parar|stop|basta|enough|end training|finalizar|acabar)$/i;

export function SparringChat({
  profile,
  cloneId,
  archetypeName,
  branch,
  trainingTurn,
  onTurnComplete,
  onEndRequested,
  agentUrl = AGENT_URL,
}: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const buildHistory = (currentTurns: Turn[]) =>
    currentTurns.map((t) => ({ role: t.role, content: t.says }));

  const isExitIntent = (text: string) => {
    const stripped = text.trim().replace(/\.$/, "");
    return stripped.split(/\s+/).length <= 6 && EXIT_RE.test(stripped);
  };

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    if (isExitIntent(msg)) {
      onEndRequested?.();
      return;
    }

    const userTurn: Turn = { role: "user", says: msg };
    const newTurns = [...turns, userTurn];
    setTurns(newTurns);
    setInput("");
    setLoading(true);

    const placeholderIdx = newTurns.length;
    setTurns((t) => [...t, { role: "assistant", says: "", streaming: true }]);

    try {
      const res = await fetch(`${agentUrl}/api/sparring/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clone_id: cloneId,
          user_message: msg,
          profile,
          history: buildHistory(newTurns),
          training_turn: trainingTurn,
        }),
      });

      if (!res.body) throw new Error("No stream body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          try {
            const event = JSON.parse(data);
            if (event.type === "chunk") {
              accumulated += event.text;
              setTurns((t) => {
                const updated = [...t];
                if (updated[placeholderIdx]) updated[placeholderIdx] = { ...updated[placeholderIdx], says: accumulated };
                return updated;
              });
            } else if (event.type === "done") {
              setTurns((t) => {
                const updated = [...t];
                updated[placeholderIdx] = {
                  role: "assistant",
                  says: event.says || accumulated,
                  thinks: event.thinks,
                  signal: event.signal,
                  streaming: false,
                };
                return updated;
              });
            }
          } catch { /* malformed event */ }
        }
      }

      onTurnComplete?.(trainingTurn + 1);
    } catch {
      setTurns((t) => {
        const updated = [...t];
        if (updated[placeholderIdx]) {
          updated[placeholderIdx] = { role: "assistant", says: "Error de conexión — intenta de nuevo.", streaming: false };
        }
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex h-full flex-col" style={{ background: "transparent" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && (
          <div className="text-center text-xs py-8" style={{ color: "#6b6b8a" }}>
            La sesión de sparring ha comenzado.<br />
            Escribe tu primer argumento.
          </div>
        )}
        {turns.map((turn, i) => (
          <TurnBubble key={i} turn={turn} archetypeName={archetypeName} branch={branch} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tu argumento... (Enter para enviar, Shift+Enter nueva línea)"
            rows={2}
            className={[
              "flex-1 resize-none rounded-xl p-2.5 text-sm focus:outline-none transition-all duration-200",
              "bg-white/[0.03] border border-white/[0.07]",
              "focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20",
              "placeholder:text-[#3a3a5a]",
            ].join(" ")}
            style={{ color: "#e8e8f0" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shimmer-wrap rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-30 hover:scale-105 hover:brightness-110 active:scale-95"
            style={{
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #7c6af7 0%, #4f8ef7 100%)"
                : "#1a1a28",
              color: "#fff",
              boxShadow: input.trim() && !loading ? "0 0 12px rgba(124,106,247,0.2)" : "none",
              border: "1px solid rgba(255,255,255,0.07)",
              minWidth: "44px",
            }}
          >
            {loading ? "…" : "→"}
          </button>
        </div>
        <p className="mt-1.5 text-[10px]" style={{ color: "#3a3a5a" }}>
          Escribe "listo" o "terminar" para finalizar la sesión y obtener tu puntuación.
        </p>
      </div>
    </div>
  );
}

function TurnBubble({ turn, archetypeName, branch }: { turn: Turn; archetypeName: string; branch: string }) {
  const [showThinks, setShowThinks] = useState(false);

  useEffect(() => {
    if (!turn.streaming && turn.thinks) {
      const t = setTimeout(() => setShowThinks(true), 1200);
      return () => clearTimeout(t);
    }
  }, [turn.streaming, turn.thinks]);

  const isUser = turn.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1 ${isUser ? "msg-from-right" : "msg-from-left"}`}>
      <div className="mb-0.5 text-[10px]" style={{ color: "#4a4a6a" }}>
        {isUser ? "Tú" : archetypeName}
      </div>

      {/* Says bubble */}
      <div
        className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed"
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, rgba(124,106,247,0.18) 0%, rgba(79,142,247,0.12) 100%)",
                border: "1px solid rgba(124,106,247,0.2)",
                color: "#e8e8f0",
              }
            : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#e8e8f0",
              }
        }
      >
        {turn.says || (turn.streaming ? (
          <span className="dot-typing" style={{ color: "#6b6b8a" }}>
            <span /><span /><span />
          </span>
        ) : "")}
        {turn.signal && (
          <span
            className="ml-2 rounded-md px-1.5 py-0.5 text-[10px]"
            style={{
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.2)",
              color: "#4ade80",
            }}
          >
            {turn.signal}
          </span>
        )}
      </div>

      {/* Thinks bubble — 1.2s delay, spring ease-out */}
      {turn.thinks && (
        <div
          className="max-w-[80%] rounded-xl px-3 py-1.5 text-xs italic"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "#4a4a6a",
            opacity: showThinks ? 1 : 0,
            transform: showThinks ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          💭 {turn.thinks}
        </div>
      )}
    </div>
  );
}
