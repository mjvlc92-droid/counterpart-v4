"""Tests for archetype catalog integrity."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../apps/agent"))

from src.archetypes import ARCHETYPES, ARCHETYPE_NAMES, archetype_by_name


def test_exactly_10_archetypes():
    assert len(ARCHETYPES) == 10


def test_all_archetypes_have_required_fields():
    required = [
        "nombre", "branch_level_1", "disc_quadrant", "voss_type",
        "primary_fear", "sparring_style", "entry_point",
        "blind_spot", "close_signal", "key_lever", "batna_awareness",
    ]
    for arch in ARCHETYPES:
        for field in required:
            assert getattr(arch, field, None), f"{arch.nombre} missing {field}"


def test_branch_levels_valid():
    valid_branches = {"PODER", "CONTROL", "RELACIÓN", "ANÁLISIS"}
    for arch in ARCHETYPES:
        assert arch.branch_level_1 in valid_branches, f"{arch.nombre}: invalid branch {arch.branch_level_1}"


def test_ocean_scores_in_range():
    for arch in ARCHETYPES:
        for key, val in arch.ocean_base.items():
            assert 1 <= val <= 10, f"{arch.nombre} OCEAN.{key}={val} out of range"


def test_archetype_by_name_exact():
    arch = archetype_by_name("Negociador Alfa")
    assert arch is not None
    assert arch.branch_level_1 == "PODER"


def test_archetype_by_name_not_found():
    assert archetype_by_name("Personaje Inventado") is None


def test_all_archetypes_have_demo_responses():
    for arch in ARCHETYPES:
        assert len(arch.demo_responses) > 0, f"{arch.nombre} missing demo_responses"


def test_demo_responses_have_required_fields():
    for arch in ARCHETYPES:
        for resp in arch.demo_responses:
            assert "says" in resp, f"{arch.nombre} demo_response missing 'says'"
            assert "thinks" in resp, f"{arch.nombre} demo_response missing 'thinks'"
            assert "signal" in resp, f"{arch.nombre} demo_response missing 'signal'"


def test_poder_archetypes():
    poder = [a for a in ARCHETYPES if a.branch_level_1 == "PODER"]
    assert len(poder) == 2


def test_control_archetypes():
    control = [a for a in ARCHETYPES if a.branch_level_1 == "CONTROL"]
    assert len(control) == 4


def test_relacion_archetypes():
    relacion = [a for a in ARCHETYPES if a.branch_level_1 == "RELACIÓN"]
    assert len(relacion) == 2


def test_analisis_archetypes():
    analisis = [a for a in ARCHETYPES if a.branch_level_1 == "ANÁLISIS"]
    assert len(analisis) == 2
