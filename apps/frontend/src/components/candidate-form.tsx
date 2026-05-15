"use client";

import { useState } from "react";

const COMMON_OBJECTIVES = [
  "Cerrar contrato anual de software",
  "Aprobar partnership comercial",
  "Negociar términos de salida",
  "Conseguir extensión de plazo",
  "Validar interés en pilot",
  "Presentar propuesta de consultoría",
];

const COMMON_ROLES = [
  "Vendedor B2B",
  "Account Executive",
  "Abogado",
  "Entrevistador",
  "BizDev",
  "Project Manager",
  "Consultor",
];

interface Props {
  disabled?: boolean;
  agentUrl: string;
  onAnalysisComplete: (data: { archetype: Record<string, unknown>; tree: string; opening_speaker: "user" | "archetype" }) => void;
}

const inputClass = [
  "w-full rounded-xl p-2.5 text-sm focus:outline-none transition-all duration-200",
  "bg-white/[0.03] border border-white/[0.07] text-[#e8e8f0]",
  "focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20",
  "placeholder:text-[#3a3a5a] disabled:opacity-40",
].join(" ");

export function CandidateForm({ disabled, agentUrl, onAnalysisComplete }: Props) {
  const [rawInput, setRawInput] = useState("");
  const [objective, setObjective] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const isComplete = rawInput.trim().length > 50 && objective.trim() && role.trim();
  const charCount = rawInput.trim().length;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setFileError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-text", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error extrayendo texto");
      const { text } = await res.json();
      setRawInput((prev) => prev ? `${prev}\n\n${text}` : text);
      setFileName(file.name);
    } catch {
      setFileError("No se pudo leer el archivo. Prueba pegando el texto directamente.");
    } finally {
      setFileLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || submitting || disabled) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${agentUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: rawInput, objective, role }),
      });
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
      const data = await res.json();
      onAnalysisComplete(data);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-base font-bold" style={{ color: "#e8e8f0" }}>Nueva sesión</h2>
        <p className="text-[11px] mt-0.5" style={{ color: "#6b6b8a" }}>
          Describe a la persona con la que vas a negociar.
        </p>
      </div>

      {/* Raw input */}
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6b6b8a" }}>
          Información sobre la persona
        </span>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Pega aquí su LinkedIn, emails, notas de reuniones anteriores, lo que tengas. El agente sintetiza los patrones conductuales."
          rows={8}
          disabled={disabled || submitting}
          className={[
            "w-full resize-y rounded-xl p-2.5 text-sm focus:outline-none transition-all duration-200 disabled:opacity-50",
            "bg-white/[0.03] border border-white/[0.07]",
            "focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20",
            "placeholder:text-[#3a3a5a]",
          ].join(" ")}
          style={{ color: "#e8e8f0" }}
        />
        <div className="flex items-center justify-between px-0.5">
          <span
            className={`text-[10px] transition-colors ${charCount >= 50 ? "gradient-text font-medium" : ""}`}
            style={charCount < 50 ? { color: "#3a3a5a" } : undefined}
          >
            {charCount} chars (mín. 50)
          </span>
          {fileName && (
            <span className="text-[10px]" style={{ color: "#4ade80" }}>
              ↗ {fileName}
            </span>
          )}
        </div>
      </label>

      {/* File upload */}
      <label
        className="flex cursor-pointer items-center gap-2 text-xs transition-all"
        style={{ color: "#6b6b8a" }}
      >
        <input type="file" accept=".txt,.pdf,.docx" className="hidden" onChange={handleFile} disabled={disabled || submitting} />
        <span
          className="glass rounded-lg px-2.5 py-1.5 text-[11px] transition-all hover:border-white/20 hover:bg-white/5 active:scale-[0.98]"
          style={{ color: "#8b8baa" }}
        >
          {fileLoading ? "Cargando…" : "↑ Subir archivo (.txt, .pdf, .docx)"}
        </span>
        {fileError && <span style={{ color: "#ef4444" }} className="text-[10px]">{fileError}</span>}
      </label>

      {/* Objective */}
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6b6b8a" }}>
          Objetivo de la reunión
        </span>
        <input
          list="objective-options"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Objetivo: ej. Cerrar contrato anual"
          disabled={disabled || submitting}
          className={inputClass}
        />
        <datalist id="objective-options">
          {COMMON_OBJECTIVES.map((o) => <option key={o} value={o} />)}
        </datalist>
      </label>

      {/* Role */}
      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6b6b8a" }}>
          Tu rol
        </span>
        <input
          list="role-options"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Rol: ej. Vendedor B2B"
          disabled={disabled || submitting}
          className={inputClass}
        />
        <datalist id="role-options">
          {COMMON_ROLES.map((r) => <option key={r} value={r} />)}
        </datalist>
      </label>

      <button
        type="submit"
        disabled={!isComplete || submitting || disabled}
        className={`mt-auto rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-30 ${isComplete && !submitting ? "animate-neon" : ""}`}
        style={{
          background: isComplete && !submitting
            ? "linear-gradient(135deg, #7c6af7 0%, #4f8ef7 100%)"
            : "#1a1a28",
          color: "#fff",
          transform: isComplete && !submitting ? "scale(1.01)" : undefined,
        }}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="dot-typing" style={{ color: "rgba(255,255,255,0.9)" }}><span /><span /><span /></span>
            Analizando
          </span>
        ) : "Analizar e iniciar entrenamiento →"}
      </button>
    </form>
  );
}
