"""Counterpart V4 — Agent entry point.

LangGraph graph exposed to CopilotKit + FastAPI sparring SSE endpoint.

Graph: single-node agent that handles tool dispatch via message content detection.
The agent routes to: analyze_and_train | end_training | reset_session | role-play (sparring).

The sparring SSE stream is served by src/sparring_api.py (FastAPI),
mounted at /api/* alongside the LangGraph server.
"""
from __future__ import annotations

import logging
import os
import re

from copilotkit.integrations.fastapi import add_fastapi_endpoint
import copilotkit.integrations.fastapi as _ck_fastapi
from copilotkit import CopilotKitSDK, LangGraphAGUIAgent, Agent
from copilotkit.langgraph_agui_agent import LangGraphAgent as _LGAgent
from fastapi import Request
from fastapi.responses import JSONResponse

# copilotkit 0.1.88 bug: LangGraphAgent doesn't inherit Agent so lacks dict_repr
if not hasattr(_LGAgent, "dict_repr"):
    _LGAgent.dict_repr = Agent.dict_repr  # type: ignore[method-assign]
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from src.state import AgentState
from src.roleplay import is_exit_signal
from src.tools.analyze_and_train import run_analyze_and_train
from src.tools.end_training import run_end_training
from src.tools.reset_session import run_reset_session
from src.sparring_api import app as sparring_app

load_dotenv()

logging.basicConfig(
    level=logging.DEBUG if os.getenv("DEBUG") else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")

# ── Intent patterns ───────────────────────────────────────────────────────────

_ANALYZE_RE = re.compile(r"\banalyze_and_train\b|\banalizar\b|\biniciar entrenamiento\b|\bquiero practicar\b", re.IGNORECASE)
_END_RE = re.compile(r"\bend_training\b|\bterminar entrenamiento\b|\bfinalizar sesión\b|\bI'?m done\b", re.IGNORECASE)
_RESET_RE = re.compile(r"\breset\b|\bnueva sesión\b|\breiniciar\b|\bempezar de nuevo\b", re.IGNORECASE)


def _detect_intent(messages: list, mode: str = "idle") -> str:
    """Detect tool intent from the last human message, gated by current mode."""
    for m in reversed(messages):
        content = getattr(m, "content", "")
        if not content:
            continue
        if mode in ("idle", "complete") and _ANALYZE_RE.search(content):
            return "analyze_and_train"
        if mode == "training" and (_END_RE.search(content) or is_exit_signal(content)):
            return "end_training"
        if _RESET_RE.search(content):
            return "reset_session"
        break
    return "chat"


# ── Graph nodes ───────────────────────────────────────────────────────────────

async def agent_node(state: AgentState) -> dict:
    """Main agent node: dispatch to tools or pass to LLM for role-play."""
    messages = state.get("messages", [])
    mode = state.get("mode", "idle")

    intent = _detect_intent(messages, mode)

    # Find the triggering tool_call_id (for ToolMessage pairing)
    tool_call_id = f"call_{id(messages)}"

    if intent == "analyze_and_train":
        result = await run_analyze_and_train(state, tool_call_id)
        return result.update

    if intent == "end_training" or (mode == "training" and is_exit_signal(
        getattr(messages[-1], "content", "") if messages else ""
    )):
        result = run_end_training(state, tool_call_id)
        return result.update

    if intent == "reset_session":
        result = run_reset_session(state, tool_call_id)
        return result.update

    # Role-play pass-through: LLM responds in character via CopilotKit streaming
    if mode == "training" and _API_KEY and not DEMO_MODE:
        llm = ChatAnthropic(
            model="claude-sonnet-4-6",
            api_key=_API_KEY,
            max_tokens=600,
            streaming=True,
        )
        response = llm.invoke(messages)
        turn = state.get("training_turn", 0)
        return {"messages": [response], "training_turn": turn + 1}

    # Idle fallback
    return {
        "messages": [
            AIMessage(content="Completa el formulario para analizar a tu contraparte e iniciar el entrenamiento.")
        ]
    }


def should_continue(state: AgentState) -> str:
    mode = state.get("mode", "idle")
    if mode == "complete":
        return END
    return "agent"


# ── Build graph ───────────────────────────────────────────────────────────────

def build_graph():
    builder = StateGraph(AgentState)
    builder.add_node("agent", agent_node)
    builder.add_edge(START, "agent")
    builder.add_conditional_edges("agent", should_continue, {"agent": END, END: END})
    memory = MemorySaver()
    return builder.compile(checkpointer=memory)


graph = build_graph()

# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Counterpart V4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount sparring SSE routes
app.mount("/api", sparring_app)

# CopilotKit integration
sdk = CopilotKitSDK(
    agents=[
        LangGraphAGUIAgent(
            name="counterpart_agent",
            description="Analiza contrapartes y simula sesiones de sparring en negociación.",
            graph=graph,
        )
    ]
)

# Patch: Python SDK 0.1.88 returns agents as list; React SDK ≥1.5 expects dict keyed by name.
_orig_handle_info = _ck_fastapi.handle_info

async def _patched_handle_info(*, sdk, context, as_html=False):  # type: ignore[override]
    response = await _orig_handle_info(sdk=sdk, context=context, as_html=as_html)
    if as_html or not hasattr(response, "body"):
        return response
    import json as _json
    body = _json.loads(response.body)
    if isinstance(body.get("agents"), list):
        body["agents"] = {
            a["name"]: {k: v for k, v in a.items() if k != "name"}
            for a in body["agents"]
        }
    return JSONResponse(content=body)

_ck_fastapi.handle_info = _patched_handle_info  # type: ignore[assignment]

add_fastapi_endpoint(app, sdk, "/copilotkit")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "demo_mode": DEMO_MODE,
        "api_key_configured": bool(_API_KEY),
        "version": "4.0.0",
    }
