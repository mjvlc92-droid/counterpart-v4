"""Mermaid probability tree generator using Claude Sonnet 4.6.

V4: Replaced Gemini with Anthropic Claude. Generates graph TD with
probability-labeled edges (format -->|0.65|).
"""
from __future__ import annotations

import logging
import os
import re

import anthropic

logger = logging.getLogger(__name__)

DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

_client: anthropic.Anthropic | None = None
if _API_KEY and not DEMO_MODE:
    _client = anthropic.Anthropic(api_key=_API_KEY, timeout=25.0, max_retries=1)

_DEMO_TREE = """graph TD
    Start["🎯 Inicio de negociación"] -->|0.65| A["Apertura directa con propuesta"]
    Start -->|0.35| B["Preguntas diagnósticas"]
    A -->|0.55| C["Resistencia inicial"]
    A -->|0.45| D["Interés moderado"]
    B -->|0.70| E["Solicitud de información adicional"]
    B -->|0.30| F["Evaluación positiva silenciosa"]
    C -->|0.60| G["Objeción de precio / proceso"]
    C -->|0.40| H["Compromiso condicional"]
    D -->|0.65| I["Avance hacia acuerdo"]
    D -->|0.35| J["Pausa para consultar internamente"]
    G -->|0.50| Win["✅ Acuerdo con concesiones"]
    G -->|0.50| Stall["⏸ Proceso bloqueado"]
    H -->|0.80| Win
    I -->|0.90| Win
    J -->|0.40| Win
    J -->|0.60| Lose["❌ Sin avance"]"""

_TREE_SYSTEM = "[COUNTERPART PROPRIETARY — not included in public release]"


def _clean_mermaid(raw: str) -> str:
    """Strip code fences and validate basic structure."""
    text = raw.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("mermaid"):
            text = text[7:]
        text = text.strip()
    # Ensure it starts with graph
    if not text.startswith("graph"):
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if line.strip().startswith("graph"):
                text = "\n".join(lines[i:])
                break
    return text.strip()


def generate_tree(archetype_name: str, objective: str = "", role: str = "") -> str:
    """Generate a Mermaid probability tree for this archetype + context."""

    if DEMO_MODE or not _client:
        return _DEMO_TREE

    user_content = (
        f"Arquetipo: {archetype_name}\n"
        f"Objetivo de la negociación: {objective or '(no especificado)'}\n"
        f"Rol del interlocutor: {role or '(no especificado)'}\n\n"
        "Genera el árbol de probabilidades Mermaid."
    )

    try:
        response = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=_TREE_SYSTEM,
            messages=[{"role": "user", "content": user_content}],
        )
        raw = response.content[0].text
        tree = _clean_mermaid(raw)

        # Basic validation: must have at least 3 --> edges
        if tree.count("-->") < 3:
            logger.warning(f"generate_tree: insufficient edges for '{archetype_name}', using demo")
            return _DEMO_TREE

        return tree

    except anthropic.APIError as e:
        logger.error(f"generate_tree API error: {e}")
        return _DEMO_TREE
    except Exception as e:
        logger.error(f"generate_tree unexpected error: {e}")
        return _DEMO_TREE


def regenerate_tree_from_transcript(
    archetype_name: str,
    objective: str,
    transcript: list[dict],
) -> str:
    """Regenerate tree conditioned on the actual sparring transcript."""

    if DEMO_MODE or not _client:
        return _DEMO_TREE

    turns_text = "\n".join(
        f"{'Usuario' if t.get('role') == 'user' else archetype_name}: {t.get('content', '')}"
        for t in (transcript or [])
        if t.get("content")
    )

    user_content = (
        f"Arquetipo: {archetype_name}\n"
        f"Objetivo: {objective or '(no especificado)'}\n\n"
        f"Transcripción de la sesión:\n{turns_text}\n\n"
        "Regenera el árbol de probabilidades considerando cómo evolucionó realmente la negociación. "
        "Refleja los caminos que se tomaron y actualiza las probabilidades."
    )

    try:
        response = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            system=_TREE_SYSTEM,
            messages=[{"role": "user", "content": user_content}],
        )
        tree = _clean_mermaid(response.content[0].text)
        if tree.count("-->") < 3:
            return _DEMO_TREE
        return tree
    except Exception as e:
        logger.error(f"regenerate_tree error: {e}")
        return _DEMO_TREE
