"""Archetype catalog loader for Counterpart V4.

Single source of truth: ../../data/archetypes.json
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

_DATA_FILE = Path(__file__).parents[3] / "data" / "archetypes.json"


@dataclass
class Archetype:
    nombre: str
    branch_level_1: str
    sub_branch: str | None
    descripcion: str
    disc_quadrant: str
    voss_type: str
    ekman_emotion: str
    ekman_signal: str
    ocean_base: dict
    primary_fear: str
    sparring_style: str
    entry_point: str
    blind_spot: str
    close_signal: str
    key_lever: str
    batna_awareness: str
    institutional_context_prior: dict
    demo_responses: list[dict] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)


def _load() -> list[Archetype]:
    raw = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    result = []
    for a in raw["archetypes"]:
        result.append(
            Archetype(
                nombre=a["nombre"],
                branch_level_1=a["branch_level_1"],
                sub_branch=a.get("sub_branch"),
                descripcion=a["descripcion"],
                disc_quadrant=a["disc_quadrant"],
                voss_type=a["voss_type"],
                ekman_emotion=a["ekman_emotion"],
                ekman_signal=a["ekman_signal"],
                ocean_base=a["ocean_base"],
                primary_fear=a["primary_fear"],
                sparring_style=a["sparring_style"],
                entry_point=a["entry_point"],
                blind_spot=a["blind_spot"],
                close_signal=a["close_signal"],
                key_lever=a["key_lever"],
                batna_awareness=a["batna_awareness"],
                institutional_context_prior=a["institutional_context_prior"],
                demo_responses=a.get("demo_responses", []),
                keywords=a.get("keywords", []),
            )
        )
    return result


ARCHETYPES: list[Archetype] = _load()
ARCHETYPE_NAMES: list[str] = [a.nombre for a in ARCHETYPES]
ARCHETYPE_NAMES_CSV: str = ", ".join(ARCHETYPE_NAMES)

_BY_NAME: dict[str, Archetype] = {a.nombre: a for a in ARCHETYPES}


def archetype_by_name(nombre: str) -> Archetype | None:
    return _BY_NAME.get(nombre)


def archetype_catalog_text() -> str:
    lines = []
    for a in ARCHETYPES:
        lines.append(
            f"- {a.nombre} (rama: {a.branch_level_1}, DISC: {a.disc_quadrant}, "
            f"Voss: {a.voss_type}) — {a.descripcion}"
        )
    return "\n".join(lines)
