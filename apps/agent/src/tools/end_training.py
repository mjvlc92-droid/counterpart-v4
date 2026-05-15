"""End training session: compute score + regenerate tree from transcript."""
from __future__ import annotations

import logging
import uuid

from langchain_core.messages import AIMessage, ToolMessage
from langgraph.types import Command

from ..tools.generate_tree import regenerate_tree_from_transcript

logger = logging.getLogger(__name__)


def _compute_session_score(archetype: dict, messages: list) -> dict:
    """Evaluate user performance based on message content vs. archetype key_lever."""
    if not archetype or not messages:
        return {"score": 50, "summary": "Sesión incompleta.", "strengths": [], "improvements": []}

    user_msgs = [m for m in messages if getattr(m, "type", None) == "human" or getattr(m, "role", None) == "user"]
    user_text = " ".join(getattr(m, "content", "") for m in user_msgs).lower()

    key_lever = (archetype.get("key_lever") or "").lower()
    entry_point = (archetype.get("entry_point") or "").lower()
    blind_spot = (archetype.get("blind_spot") or "").lower()
    branch = archetype.get("branch_level_1", "CONTROL")

    score = 40
    strengths = []
    improvements = []

    # Check key lever usage
    key_lever_words = [w for w in key_lever.split() if len(w) > 4]
    lever_hits = sum(1 for w in key_lever_words if w in user_text)
    if lever_hits >= 2:
        score += 25
        strengths.append(f"Usaste el argumento clave del arquetipo ({archetype.get('nombre')})")
    elif lever_hits == 1:
        score += 10
        improvements.append(f"Desarrolla más el key lever: {archetype.get('key_lever', '')}")
    else:
        improvements.append(f"Palanca clave ignorada: {archetype.get('key_lever', '')}")

    # Turn count (more turns = more practice)
    if len(user_msgs) >= 4:
        score += 15
        strengths.append("Mantuviste la conversación activa")
    elif len(user_msgs) >= 2:
        score += 8

    # Branch-specific check
    if branch == "ANÁLISIS" and any(w in user_text for w in ["dato", "evidencia", "estudio", "número"]):
        score += 10
        strengths.append("Adaptaste el lenguaje al estilo analítico")
    elif branch == "PODER" and any(w in user_text for w in ["exclusiv", "lider", "primer", "diferencia"]):
        score += 10
        strengths.append("Usaste el lenguaje de status correcto")
    elif branch == "RELACIÓN" and any(w in user_text for w in ["equipo", "relación", "confia", "person"]):
        score += 10
        strengths.append("Construiste rapport apropiado para el tipo relacional")
    elif branch == "CONTROL" and any(w in user_text for w in ["proceso", "document", "paso", "protocolo"]):
        score += 10
        strengths.append("Respetaste el lenguaje de proceso del arquetipo")

    score = min(100, max(0, score))

    if score >= 80:
        summary = "Excelente sesión. Dominaste los patrones del arquetipo."
    elif score >= 60:
        summary = "Buena sesión. Con práctica adicional podrás cerrar más rápido."
    elif score >= 40:
        summary = "Sesión correcta. Hay palancas clave sin activar."
    else:
        summary = "Sesión inicial. El arquetipo te puso a prueba — es normal."

    return {
        "score": score,
        "summary": summary,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "turns": len(user_msgs),
        "archetype": archetype.get("nombre", "?"),
    }


def run_end_training(state: dict, tool_call_id: str) -> Command:
    """End the training session, score the user, regenerate the tree."""
    messages = state.get("messages", [])
    archetype = state.get("archetype") or {}
    candidate = state.get("candidate") or {}

    session_score = _compute_session_score(archetype, messages)

    # Regenerate tree from actual conversation
    transcript = [
        {"role": getattr(m, "type", getattr(m, "role", "user")), "content": getattr(m, "content", "")}
        for m in messages
        if getattr(m, "content", "")
    ]
    new_tree = regenerate_tree_from_transcript(
        archetype_name=archetype.get("nombre", ""),
        objective=candidate.get("objective", ""),
        transcript=transcript,
    )

    score = session_score["score"]
    summary_msg = (
        f"**Sesión terminada.**\n\n"
        f"**Puntuación: {score}/100**\n"
        f"{session_score['summary']}\n\n"
        + (f"**Fortalezas:**\n" + "\n".join(f"• {s}" for s in session_score["strengths"]) + "\n\n" if session_score["strengths"] else "")
        + (f"**Áreas de mejora:**\n" + "\n".join(f"• {i}" for i in session_score["improvements"]) if session_score["improvements"] else "")
    )

    return Command(
        update={
            "mode": "complete",
            "tree": new_tree,
            "session_score": session_score,
            "messages": [
                ToolMessage(content="Sesión terminada. Árbol recalibrado con la transcripción.", tool_call_id=tool_call_id),
                AIMessage(content=summary_msg, id=str(uuid.uuid4())),
            ],
        }
    )
