"""Sparring role-play utilities for Counterpart V4.

V4 Fix: True LangGraph subgraph with conditional edge (exit_or_continue),
replacing V3's broken persona-injection-only approach.

The sparring loop runs inside apps/agent as a LangGraph node, while
the SSE endpoint in sparring_api.py handles streaming says/thinks/signal
directly to the frontend.
"""
from __future__ import annotations

import json
import logging
import re

from .archetypes import Archetype

logger = logging.getLogger(__name__)

# Exit signals that end the training session (case-insensitive, ≤6 words)
_EXIT_PATTERNS = re.compile(
    r"^(terminar|fin|listo|suficiente|i'?m done|ya no más|hasta aquí|"
    r"parar|stop|basta|enough|end training|finalizar|acabar)$",
    re.IGNORECASE,
)


def is_exit_signal(text: str) -> bool:
    """Return True if the message is an explicit session-end request."""
    stripped = text.strip().rstrip(".")
    word_count = len(stripped.split())
    if word_count > 6:
        return False
    return bool(_EXIT_PATTERNS.match(stripped))


def build_persona_prompt(archetype: Archetype, role: str, objective: str) -> str:
    """Build the persona injection string for the LLM system context."""
    from .prompts import PERSONA_INJECTION_TEMPLATE

    return PERSONA_INJECTION_TEMPLATE.format(
        nombre=archetype.nombre,
        branch_level_1=archetype.branch_level_1,
        disc_quadrant=archetype.disc_quadrant,
        voss_type=archetype.voss_type,
        primary_fear=archetype.primary_fear,
        sparring_style=archetype.sparring_style,
        ekman_signal=archetype.ekman_signal,
        objective=objective or "(no especificado)",
        role=role or "profesional",
    )


def get_phase_info(turn: int) -> str:
    """Return the negotiation phase instruction based on turn count."""
    if turn <= 2:
        return (
            f"FASE 1 — APERTURA (turno {turn}): "
            "Evalúa con cautela. Objeta con reserva. No reveles tu posición real todavía."
        )
    elif turn <= 4:
        return (
            f"FASE 2 — PRESIÓN (turno {turn}): "
            "Escala la tensión. Reacciona con mayor especificidad e intensidad. "
            "Fuerza al interlocutor a defender su posición."
        )
    else:
        return (
            f"FASE 3 — DECISIÓN (turno {turn}): "
            "Punto de inflexión. Elige: ceder condicionalmente, escalar al máximo, "
            "o cerrar con una exigencia final."
        )


def build_sparring_messages(
    archetype_data: dict,
    history: list[dict],
    user_message: str,
    training_turn: int,
) -> tuple[str, list[dict]]:
    """Build system prompt and messages list for a sparring turn.

    Returns (system_prompt, messages) ready for Anthropic API.
    """
    from .prompts import SPARRING_V2_SYSTEM_PROMPT

    ocean_str = json.dumps(archetype_data.get("ocean_base", archetype_data.get("ocean", {})), ensure_ascii=False)
    biases = archetype_data.get("decision_biases", [])
    if isinstance(biases, list):
        biases_str = ", ".join(biases)
    else:
        biases_str = str(biases)

    fmt_data = {
        **archetype_data,
        "ocean": ocean_str,
        "decision_biases": biases_str,
        "phase_info": get_phase_info(training_turn),
    }

    try:
        system = SPARRING_V2_SYSTEM_PROMPT.format(**fmt_data)
    except KeyError as e:
        logger.warning(f"build_sparring_messages: missing key {e}, using fallback system")
        system = (
            f"Eres {archetype_data.get('archetype_primary', archetype_data.get('nombre', 'negociador'))}. "
            "Responde en carácter. Devuelve JSON: {\"says\": ..., \"thinks\": ..., \"signal\": ...}"
        )

    messages: list[dict] = []
    for item in (history or []):
        role = item.get("role", "")
        content = item.get("content", "")
        if role in ("user", "assistant") and content and content != "...":
            messages.append({"role": role, "content": str(content)})
    messages.append({"role": "user", "content": user_message})

    return system, messages
