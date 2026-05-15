"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!chart || !ref.current) return;
    setError(null);
    setRendered(false);

    let cancelled = false;
    const el = ref.current;

    import("mermaid").then((mod) => {
      if (cancelled) return;
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#7c6af7",
          primaryTextColor: "#e8e8f0",
          primaryBorderColor: "#2a2a3a",
          lineColor: "#6b6b8a",
          secondaryColor: "#12121a",
          tertiaryColor: "#1a1a28",
          background: "#0a0a0f",
          mainBkg: "#12121a",
          nodeBorder: "#2a2a3a",
          clusterBkg: "#1a1a28",
          edgeLabelBackground: "#0a0a0f",
          titleColor: "#e8e8f0",
          fontFamily: "Inter, sans-serif",
        },
        flowchart: { curve: "basis", htmlLabels: true },
        securityLevel: "loose",
      });

      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid
        .render(id, chart)
        .then(({ svg }) => {
          if (cancelled || !el) return;
          el.innerHTML = svg;
          setRendered(true);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(String(err));
          }
        });
    });

    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded border border-red-900 bg-red-950/30 p-3 text-xs text-red-400 ${className ?? ""}`}>
        <div className="mb-1 font-semibold">Error al renderizar árbol</div>
        <pre className="overflow-auto whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`overflow-auto ${rendered ? "" : "animate-pulse"} ${className ?? ""}`}
      style={{ minHeight: rendered ? undefined : "120px" }}
    />
  );
}
