"""Archetype classifier using Claude Sonnet 4.6 with Pydantic structured output.

V4: Replaced Gemini with Anthropic Claude. Uses tool_use for structured output
instead of Gemini's native structured output.
"""
from __future__ import annotations

import json
import logging
import os

import anthropic
from pydantic import BaseModel

from ..archetypes import ARCHETYPE_NAMES, archetype_catalog_text
from ..prompts import CLASSIFIER_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

_client: anthropic.Anthropic | None = None
if _API_KEY and not DEMO_MODE:
    _client = anthropic.Anthropic(api_key=_API_KEY, timeout=25.0, max_retries=1)


class ArchetypeChoice(BaseModel):
    nombre: str
    confidence: float
    reasoning: str


def _snap_to_closest(name: str) -> str:
    """Snap an unrecognized name to the closest archetype by substring match."""
    name_lower = name.lower()
    for n in ARCHETYPE_NAMES:
        if name_lower in n.lower() or n.lower() in name_lower:
            return n
    return ARCHETYPE_NAMES[0]


def match_archetype(raw_input: str, objective: str = "", role: str = "") -> ArchetypeChoice:
    """Classify the counterpart described in raw_input into one of the 10 archetypes."""

    if DEMO_MODE or not _client:
        return ArchetypeChoice(
            nombre="Pragmático Defensivo",
            confidence=0.72,
            reasoning="Demo mode — clasificación simulada.",
        )

    user_content = (
        f"Clasifica la contraparte.\n\n"
        f"Descripción / señales conductuales:\n{raw_input}\n\n"
        f"Contexto de la reunión: {objective or '(no especificado)'}\n"
        f"Rol del usuario: {role or '(no especificado)'}"
    )

    try:
        response = _client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=CLASSIFIER_SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_content},
                {"role": "assistant", "content": "{"},
            ],
        )
        raw = "{" + response.content[0].text.strip()
        # Strip markdown if present
        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        data = json.loads(raw)

        nombre = data.get("archetype_primary", ARCHETYPE_NAMES[0])
        if nombre not in ARCHETYPE_NAMES:
            logger.warning(f"Unknown archetype '{nombre}', snapping to closest")
            nombre = _snap_to_closest(nombre)

        return ArchetypeChoice(
            nombre=nombre,
            confidence=data.get("match_primary_pct", 70) / 100,
            reasoning=f"DISC: {data.get('disc_quadrant','?')} | Voss: {data.get('voss_type','?')} | Miedo: {data.get('primary_fear','?')}",
        )

    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.error(f"decide_archetype parse error: {e}")
        return ArchetypeChoice(
            nombre=ARCHETYPE_NAMES[0],
            confidence=0.5,
            reasoning="Error de parsing — arquetipo por defecto.",
        )
    except anthropic.APIError as e:
        logger.error(f"decide_archetype API error: {e}")
        return ArchetypeChoice(
            nombre=ARCHETYPE_NAMES[0],
            confidence=0.5,
            reasoning="Error de API — arquetipo por defecto.",
        )
