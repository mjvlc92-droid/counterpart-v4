"""Reset session state to idle — allows starting a new sparring session."""
from __future__ import annotations

import uuid

from langchain_core.messages import AIMessage, ToolMessage
from langgraph.types import Command


def run_reset_session(state: dict, tool_call_id: str) -> Command:
    """Reset all session state fields to idle. Preserves nothing from prior session."""
    return Command(
        update={
            "candidate": None,
            "archetype": None,
            "tree": None,
            "mode": "idle",
            "opening_speaker": None,
            "training_turn": 0,
            "session_score": None,
            "messages": [
                ToolMessage(content="Sesión reiniciada.", tool_call_id=tool_call_id),
                AIMessage(
                    content="Nueva sesión lista. Completa el formulario para analizar a tu próxima contraparte.",
                    id=str(uuid.uuid4()),
                ),
            ],
        }
    )
