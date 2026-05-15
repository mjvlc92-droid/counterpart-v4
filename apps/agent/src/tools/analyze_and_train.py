"""One-shot orchestrator: detect archetype, generate tree, start role-play.

V4: Replaced Gemini with Anthropic Claude. Same one-shot pattern from V3
(avoids LLM chaining) with V2's prompt quality.
"""
from __future__ import annotations

import asyncio
import logging
import os
import uuid

import anthropic
from langchain_core.messages import AIMessage, ToolMessage
from langgraph.types import Command

from ..archetypes import archetype_by_name
from ..roleplay import build_persona_prompt
from ..tools.decide_archetype import match_archetype
from ..tools.decide_opening_speaker import decide_opening_speaker
from ..tools.generate_tree import generate_tree

logger = logging.getLogger(__name__)

DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

_client: anthropic.Anthropic | None = None
if _API_KEY and not DEMO_MODE:
    _client = anthropic.Anthropic(api_key=_API_KEY, timeout=25.0, max_retries=1)


def _generate_opening_line(archetype_data: dict, role: str, objective: str) -> str:
    """Synthesize the archetype's opening line in character using Claude."""

    if DEMO_MODE or not _client:
        nombre = archetype_data.get("nombre", "el negociador")
        sparring_style = archetype_data.get("sparring_style", "")
        return f"Bien. Empecemos. {sparring_style.split('.')[0]}."

    system = "[COUNTERPART PROPRIETARY — not included in public release]"

    try:
        response = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=150,
            system=system,
            messages=[{"role": "user", "content": "Tu frase de apertura:"}],
        )
        text = response.content[0].text.strip().strip('"').strip("'").strip("«").strip("»")
        return text
    except anthropic.APIError as e:
        logger.error(f"_generate_opening_line API error: {e}")
        return f"Bien. Empecemos. {archetype_data.get('sparring_style', '').split('.')[0]}."


async def run_analyze_and_train(state: dict, tool_call_id: str) -> Command:
    """Run the full pre-training pipeline in one shot.

    Reads state.candidate and executes:
      1. Archetype match → state.archetype
      2. Probability tree + opening line in parallel (saves ~25s)
      3. Opening speaker decision → state.opening_speaker
      4. Sets mode = "training"

    Emits ToolMessage (persona spec) + AIMessage (opening line).
    """
    candidate = state.get("candidate") or {}
    raw = candidate.get("rawInput", "")
    objective = candidate.get("objective", "")
    role = candidate.get("role", "")

    if not raw:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="Falta información del candidato. Por favor completa el formulario.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    # 1 — Archetype match (must complete before tree + opening line)
    choice = await asyncio.to_thread(match_archetype, raw, objective=objective, role=role)
    arche = archetype_by_name(choice.nombre)

    if arche is None:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Arquetipo '{choice.nombre}' no encontrado en el catálogo.",
                        tool_call_id=tool_call_id,
                    )
                ]
            }
        )

    archetype_data = {
        "nombre": arche.nombre,
        "branch_level_1": arche.branch_level_1,
        "disc_quadrant": arche.disc_quadrant,
        "voss_type": arche.voss_type,
        "primary_fear": arche.primary_fear,
        "sparring_style": arche.sparring_style,
        "entry_point": arche.entry_point,
        "blind_spot": arche.blind_spot,
        "close_signal": arche.close_signal,
        "key_lever": arche.key_lever,
        "ocean_base": arche.ocean_base,
        "ekman_signal": arche.ekman_signal,
    }

    # 2+3 — Opening speaker decision (pure heuristic, no I/O)
    opener = decide_opening_speaker(role, arche)

    # 4 — Parallel: tree generation + opening line (saves ~25s when archetype opens)
    if opener == "archetype":
        tree, opening_line = await asyncio.gather(
            asyncio.to_thread(generate_tree, arche.nombre, objective, role),
            asyncio.to_thread(_generate_opening_line, archetype_data, role, objective),
        )
    else:
        tree = await asyncio.to_thread(generate_tree, arche.nombre, objective, role)
        opening_line = (
            f"Cuando estés listo, comienza. Jugaré el rol de **{arche.nombre}** "
            f"y reaccionaré desde mi estilo: {arche.sparring_style.lower()} "
            "Para terminar la sesión, escribe 'listo' o 'terminar'."
        )

    # 5 — Persona injection for subsequent turns
    persona = build_persona_prompt(arche, role, objective)
    confidence_pct = int(round(choice.confidence * 100))

    tool_message_content = (
        f"✅ Análisis completo.\n"
        f"• Arquetipo: **{arche.nombre}** ({confidence_pct}% confianza)\n"
        f"• Rama: {arche.branch_level_1} | DISC: {arche.disc_quadrant} | Voss: {arche.voss_type}\n"
        f"• Razonamiento: {choice.reasoning}\n"
        f"• Quien abre: {'el arquetipo' if opener == 'archetype' else 'el usuario'}\n\n"
        f"--- PERSONA EN CONTEXTO ---\n{persona}"
    )

    return Command(
        update={
            "archetype": {
                "nombre": arche.nombre,
                "confidence": choice.confidence,
                "reasoning": choice.reasoning,
                "branch_level_1": arche.branch_level_1,
                "disc_quadrant": arche.disc_quadrant,
                "voss_type": arche.voss_type,
                "primary_fear": arche.primary_fear,
                "sparring_style": arche.sparring_style,
                "entry_point": arche.entry_point,
                "blind_spot": arche.blind_spot,
                "close_signal": arche.close_signal,
                "key_lever": arche.key_lever,
                "ocean_base": arche.ocean_base,
                "ekman_signal": arche.ekman_signal,
            },
            "tree": tree,
            "opening_speaker": opener,
            "training_turn": 0,
            "mode": "training",
            "messages": [
                ToolMessage(content=tool_message_content, tool_call_id=tool_call_id),
                AIMessage(content=opening_line, id=str(uuid.uuid4())),
            ],
        }
    )
