"""Tests for is_exit_signal — ensures training sessions end correctly."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../apps/agent"))

from src.roleplay import is_exit_signal


def test_terminar_is_exit():
    assert is_exit_signal("terminar") is True


def test_listo_is_exit():
    assert is_exit_signal("listo") is True


def test_fin_is_exit():
    assert is_exit_signal("fin") is True


def test_im_done_is_exit():
    assert is_exit_signal("I'm done") is True
    assert is_exit_signal("i'm done") is True


def test_suficiente_is_exit():
    assert is_exit_signal("suficiente") is True


def test_basta_is_exit():
    assert is_exit_signal("basta") is True


def test_long_sentence_is_not_exit():
    assert is_exit_signal("Quiero terminar porque creo que la negociación no avanza bien") is False


def test_normal_argument_is_not_exit():
    assert is_exit_signal("Nuestro producto tiene un ROI demostrado del 340%") is False


def test_partial_word_is_not_exit():
    assert is_exit_signal("Tengo que finalizar el contrato antes del viernes") is False


def test_empty_is_not_exit():
    assert is_exit_signal("") is False


def test_with_period_is_exit():
    assert is_exit_signal("listo.") is True
