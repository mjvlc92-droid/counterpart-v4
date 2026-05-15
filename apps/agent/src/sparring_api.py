"""FastAPI sparring SSE endpoint for Counterpart V4.

Provides /api/sparring/stream — streams says word-by-word via SSE,
then sends thinks with a delay signal for the frontend's 1.2s reveal.

This endpoint runs alongside the LangGraph server (langgraph dev) and
handles the real-time sparring streaming that CopilotKit doesn't cover.
"""
from __future__ import annotations

import json
import logging
import os
import random
import uuid
from pathlib import Path
from typing import AsyncGenerator

import anthropic
from anthropic import AsyncAnthropic
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .archetypes import ARCHETYPES, archetype_by_name
from .roleplay import build_sparring_messages, is_exit_signal
from .tools.decide_archetype import match_archetype
from .tools.generate_tree import generate_tree
from .tools.decide_opening_speaker import decide_opening_speaker

load_dotenv()

logger = logging.getLogger(__name__)

DEMO_MODE = os.getenv("DEMO_MODE", "").lower() in ("1", "true", "yes")
DEBUG = os.getenv("DEBUG", "").lower() in ("1", "true", "yes")
_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

_async_client: AsyncAnthropic | None = None
if _API_KEY and not DEMO_MODE:
    _async_client = AsyncAnthropic(api_key=_API_KEY, timeout=30.0, max_retries=1)

# In-memory clone store (session-scoped, reconstructed from profile_data on restart)
_clones: dict[str, dict] = {}

app = FastAPI(title="Counterpart V4 Sparring API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SparringRequest(BaseModel):
    clone_id: str
    user_message: str
    profile: dict | None = None
    history: list[dict] | None = None
    training_turn: int = 1


class ExtractTextRequest(BaseModel):
    pass


class AnalyzeRequest(BaseModel):
    raw_input: str
    objective: str = ""
    role: str = ""


# ── helpers ──────────────────────────────────────────────────────────────────

def _demo_response(branch: str) -> dict:
    arch = next((a for a in ARCHETYPES if a.branch_level_1 == branch), ARCHETYPES[0])
    if arch.demo_responses:
        return random.choice(arch.demo_responses)
    return {
        "says": "Interesante planteamiento. Continúa.",
        "thinks": "Estoy evaluando su posición.",
        "signal": "Asiente levemente.",
    }


async def _emit_simulated_stream(says: str, thinks: str, signal: str) -> AsyncGenerator[str, None]:
    import asyncio
    words = says.split()
    for i, word in enumerate(words):
        tok = word if i == 0 else " " + word
        yield f'data: {json.dumps({"type": "chunk", "text": tok})}\n\n'
        await asyncio.sleep(0.045)
    yield f'data: {json.dumps({"type": "done", "says": says, "thinks": thinks, "signal": signal})}\n\n'


# ── routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "demo_mode": DEMO_MODE, "api_key_configured": bool(_API_KEY)}


@app.post("/sparring/stream")
async def sparring_stream(req: SparringRequest):
    """Stream a sparring response as SSE (says word-by-word, then done with thinks+signal)."""

    # Resolve clone
    clone = _clones.get(req.clone_id)
    if not clone and req.profile:
        clone = {**req.profile, "id": req.clone_id}
        _clones[req.clone_id] = clone
        if DEBUG:
            logger.info(f"Reconstructed clone {req.clone_id} from profile_data")

    if not clone:
        branch = "CONTROL"
        fb = _demo_response(branch)
        return StreamingResponse(
            _emit_simulated_stream(fb["says"], fb.get("thinks", ""), fb.get("signal", "")),
            media_type="text/event-stream",
        )

    branch = clone.get("branch_level_1", "CONTROL")

    # Demo mode or no API key
    if DEMO_MODE or not _async_client:
        demo = _demo_response(branch)
        return StreamingResponse(
            _emit_simulated_stream(demo["says"], demo.get("thinks", ""), demo.get("signal", "")),
            media_type="text/event-stream",
        )

    async def generate():
        system, messages = build_sparring_messages(
            archetype_data=clone,
            history=req.history,
            user_message=req.user_message,
            training_turn=req.training_turn,
        )
        full_text = ""
        try:
            async with _async_client.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=600,
                system=system,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    full_text += text
                    yield f'data: {json.dumps({"type": "chunk", "text": text})}\n\n'

            # Parse final JSON
            raw = full_text.strip()
            if raw.startswith("```"):
                parts = raw.split("```")
                raw = parts[1] if len(parts) > 1 else raw
                if raw.startswith("json"):
                    raw = raw[4:]
            raw = raw.strip()
            if not raw.startswith("{"):
                raw = "{" + raw

            result = json.loads(raw)
            result.setdefault("signal", "")
            yield f'data: {json.dumps({"type": "done", "says": result.get("says", ""), "thinks": result.get("thinks", ""), "signal": result.get("signal", "")})}\n\n'

        except anthropic.APIError as e:
            logger.error(f"API error in sparring stream: {e}")
            fb = _demo_response(branch)
            async for evt in _emit_simulated_stream(fb["says"], fb.get("thinks", ""), fb.get("signal", "")):
                yield evt
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Parse error in sparring stream: {e} — raw: {full_text[:200]}")
            fb = _demo_response(branch)
            async for evt in _emit_simulated_stream(fb["says"], fb.get("thinks", ""), fb.get("signal", "")):
                yield evt
        except Exception as e:
            logger.error(f"Unexpected error in sparring stream: {e}")
            fb = _demo_response(branch)
            async for evt in _emit_simulated_stream(fb["says"], fb.get("thinks", ""), fb.get("signal", "")):
                yield evt

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded file (.txt, .pdf, .docx)."""
    data = await file.read()
    name = (file.filename or "").lower()

    try:
        if name.endswith(".pdf"):
            import io
            import pdfplumber
            with pdfplumber.open(io.BytesIO(data)) as pdf:
                text = "\n".join(
                    page.extract_text() or "" for page in pdf.pages
                ).strip()
        elif name.endswith(".docx"):
            import io
            import docx as _docx
            doc = _docx.Document(io.BytesIO(data))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        else:
            # Treat as plain text (UTF-8 with latin-1 fallback)
            try:
                text = data.decode("utf-8")
            except UnicodeDecodeError:
                text = data.decode("latin-1")
    except Exception as exc:
        logger.warning("extract_text failed for %s: %s", file.filename, exc)
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail=str(exc))

    return {"text": text}


@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """One-shot analysis: archetype + probability tree + opening speaker.

    Bypasses CopilotKit — called directly by the frontend form submission.
    Returns JSON with archetype data, mermaid tree, and opening_speaker.
    """
    import asyncio

    if not req.raw_input.strip():
        return {"error": "raw_input is required"}, 400

    # Run archetype match (sequential) then tree + opening in parallel
    choice = await asyncio.to_thread(
        match_archetype, req.raw_input, objective=req.objective, role=req.role
    )
    arche = archetype_by_name(choice.nombre)

    if arche is None:
        arche = archetype_by_name("Pragmático Defensivo")

    opener = decide_opening_speaker(req.role, arche)

    tree = await asyncio.to_thread(generate_tree, arche.nombre, req.objective, req.role)

    archetype_data = {
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
    }

    return {
        "archetype": archetype_data,
        "tree": tree,
        "opening_speaker": opener,
    }
