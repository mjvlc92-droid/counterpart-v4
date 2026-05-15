"""Tests for sparring phase logic."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../apps/agent"))

from src.roleplay import get_phase_info, build_sparring_messages


def test_phase_1_turn_1():
    info = get_phase_info(1)
    assert "APERTURA" in info
    assert "turno 1" in info


def test_phase_1_turn_2():
    info = get_phase_info(2)
    assert "APERTURA" in info


def test_phase_2_turn_3():
    info = get_phase_info(3)
    assert "PRESIÓN" in info


def test_phase_2_turn_4():
    info = get_phase_info(4)
    assert "PRESIÓN" in info


def test_phase_3_turn_5():
    info = get_phase_info(5)
    assert "DECISIÓN" in info


def test_phase_3_turn_10():
    info = get_phase_info(10)
    assert "DECISIÓN" in info


def test_build_sparring_messages_structure():
    arch_data = {
        "archetype_primary": "Negociador Alfa",
        "archetype_secondary": "Decisor por Status",
        "branch_level_1": "PODER",
        "disc_quadrant": "D",
        "voss_type": "Assertive",
        "ocean_base": {"openness": 5, "conscientiousness": 7, "extraversion": 9, "agreeableness": 2, "neuroticism": 4},
        "decision_biases": ["Sesgo de dominancia"],
        "risk_tolerance": "alto",
        "primary_fear": "Parecer débil",
        "sparring_style": "Presiona agresivamente",
        "entry_point": "Reconocer su autoridad",
    }
    system, messages = build_sparring_messages(
        archetype_data=arch_data,
        history=[],
        user_message="Tenemos el mejor producto del mercado",
        training_turn=1,
    )
    assert "Negociador Alfa" in system
    assert "FASE 1" in system
    assert messages[-1]["role"] == "user"
    assert "mejor producto" in messages[-1]["content"]


def test_build_sparring_messages_with_history():
    arch_data = {
        "archetype_primary": "Guardián del Proceso",
        "archetype_secondary": "El Mandatado",
        "branch_level_1": "CONTROL",
        "disc_quadrant": "C",
        "voss_type": "Analyst",
        "ocean_base": {"openness": 2, "conscientiousness": 10, "extraversion": 3, "agreeableness": 5, "neuroticism": 5},
        "decision_biases": [],
        "risk_tolerance": "bajo",
        "primary_fear": "Violación de proceso",
        "sparring_style": "Cita procedimientos",
        "entry_point": "Seguir el proceso",
    }
    history = [
        {"role": "user", "content": "Hola, vengo a presentar nuestra propuesta"},
        {"role": "assistant", "content": "Necesito ver el formulario de proveedor primero"},
    ]
    system, messages = build_sparring_messages(
        archetype_data=arch_data,
        history=history,
        user_message="Ya completamos todos los formularios",
        training_turn=2,
    )
    assert len(messages) == 3  # 2 history + 1 current
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"
    assert messages[2]["content"] == "Ya completamos todos los formularios"
