"""Pure heuristic: decide who opens the sparring session.

No LLM call — deterministic, fast, testable.
Based on DISC quadrant + Voss type from V3, intact.
"""
from __future__ import annotations

from ..archetypes import Archetype

# DISC quadrants that prefer to open (assertive, dominant)
_ARCHETYPE_OPENS: set[str] = {"D", "DI", "CD"}
_ARCHETYPE_OPENS_VOSS: set[str] = {"Assertive"}

# Role keywords that make even Accommodators open (sales-initiated context)
_SALES_ROLES = {"vendedor", "account executive", "ae", "bizdev", "sales", "venta"}


def decide_opening_speaker(role: str, archetype: Archetype) -> str:
    """Return 'archetype' or 'user'.

    Decision logic:
    - D, DI, CD + Assertive → archetype opens (they assert dominance immediately)
    - S, SC, IS + LateDecider/Accommodator → user opens (they wait and react)
    - I (Visionario) → archetype opens if the user is sales-like (they evangelize first)
    - Default: user opens
    """
    disc = archetype.disc_quadrant.upper()
    voss = archetype.voss_type

    if disc in _ARCHETYPE_OPENS or voss in _ARCHETYPE_OPENS_VOSS:
        return "archetype"

    if disc == "I":
        role_lower = (role or "").lower()
        if any(kw in role_lower for kw in _SALES_ROLES):
            return "archetype"

    return "user"
