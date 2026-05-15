"""Tests for decide_opening_speaker — pure heuristic, no LLM."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../apps/agent"))

from src.archetypes import archetype_by_name
from src.tools.decide_opening_speaker import decide_opening_speaker


def test_negociador_alfa_opens():
    arch = archetype_by_name("Negociador Alfa")
    assert decide_opening_speaker("Vendedor", arch) == "archetype"


def test_decisor_status_opens():
    arch = archetype_by_name("Decisor por Status")
    assert decide_opening_speaker("Consultor", arch) == "archetype"


def test_esceptico_tecnico_opens():
    arch = archetype_by_name("Escéptico Técnico")
    # CD + Analyst → archetype opens
    assert decide_opening_speaker("BizDev", arch) == "archetype"


def test_relacionista_user_opens_default():
    arch = archetype_by_name("Relacionista")
    # IS + Accommodator → user opens (unless sales role)
    assert decide_opening_speaker("Abogado", arch) == "user"


def test_mandatado_user_opens():
    arch = archetype_by_name("El Mandatado")
    assert decide_opening_speaker("Account Executive", arch) == "user"


def test_visionario_tribal_opens_for_sales():
    arch = archetype_by_name("Visionario Tribal")
    assert decide_opening_speaker("Vendedor B2B", arch) == "archetype"


def test_visionario_tribal_user_opens_for_lawyer():
    arch = archetype_by_name("Visionario Tribal")
    assert decide_opening_speaker("Abogado", arch) == "user"


def test_guardian_user_opens():
    arch = archetype_by_name("Guardián del Proceso")
    # C + Analyst → user opens
    assert decide_opening_speaker("Consultor", arch) == "user"
