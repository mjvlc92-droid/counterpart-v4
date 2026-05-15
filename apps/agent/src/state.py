"""Agent state schema for Counterpart V4.

Mode flow: idle → archetype_detected → tree_generated → training → complete → idle (reset)
"""
from __future__ import annotations

from typing import Annotated, Literal, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class CandidateInput(TypedDict, total=False):
    rawInput: str
    objective: str
    role: str


class ArchetypeMatch(TypedDict, total=False):
    nombre: str
    confidence: float
    reasoning: str
    branch_level_1: str
    disc_quadrant: str
    voss_type: str
    primary_fear: str
    sparring_style: str
    entry_point: str
    blind_spot: str
    close_signal: str
    key_lever: str
    ocean_base: dict
    ekman_signal: str


Mode = Literal["idle", "archetype_detected", "tree_generated", "training", "complete"]
OpeningSpeaker = Literal["user", "archetype"]


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    candidate: CandidateInput | None
    archetype: ArchetypeMatch | None
    tree: str | None
    mode: Mode
    opening_speaker: OpeningSpeaker | None
    training_turn: int
    session_score: dict | None
