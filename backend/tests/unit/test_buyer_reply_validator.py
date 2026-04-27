"""Tests for buyer reply validator module."""

import pytest

from app.services.buyer_reply_validator import (
    BuyerReplyValidationResult,
    get_fallback_reply,
    validate_buyer_reply,
)


class TestValidateBuyerReply:
    """Test suite for validate_buyer_reply function."""

    def test_valid_plain_text_reply(self):
        """Test that valid plain text reply passes validation."""
        result = validate_buyer_reply("Мне важно понять сроки внедрения.")
        assert result.is_valid is True
        assert result.normalized_reply == "Мне важно понять сроки внедрения."
        assert result.reasons == []

    def test_empty_reply_returns_invalid(self):
        """Test that empty reply is invalid."""
        result = validate_buyer_reply("")
        assert result.is_valid is False
        assert "empty_reply" in result.reasons

    def test_whitespace_only_reply_returns_invalid(self):
        """Test that whitespace-only reply is invalid."""
        result = validate_buyer_reply("   \n\t  ")
        assert result.is_valid is False
        assert "empty_reply" in result.reasons

    def test_json_reply_returns_invalid(self):
        """Test that JSON-formatted reply is invalid."""
        result = validate_buyer_reply('{"reply": "test"}')
        assert result.is_valid is False
        assert "json_or_markdown" in result.reasons

    def test_markdown_heading_returns_invalid(self):
        """Test that markdown heading is invalid."""
        result = validate_buyer_reply("# Критерии оценки\nТекст")
        assert result.is_valid is False
        assert "json_or_markdown" in result.reasons

    def test_simulator_internal_leak_junior(self):
        """Test that 'junior' keyword triggers internal leak detection."""
        result = validate_buyer_reply("У вас junior компетенции.")
        assert result.is_valid is False
        assert "simulator_internal_leak" in result.reasons

    def test_simulator_internal_leak_senior(self):
        """Test that 'senior' keyword triggers internal leak detection."""
        result = validate_buyer_reply("Это уровень senior.")
        assert result.is_valid is False
        assert "simulator_internal_leak" in result.reasons

    def test_simulator_internal_leak_competency(self):
        """Test that 'компетенц' keyword triggers internal leak detection."""
        result = validate_buyer_reply("Ваши компетенции хороши.")
        assert result.is_valid is False
        assert "simulator_internal_leak" in result.reasons

    def test_simulator_internal_leak_criteria(self):
        """Test that 'критери' keyword triggers internal leak detection."""
        result = validate_buyer_reply("Какие у вас критерии?")
        assert result.is_valid is False
        assert "simulator_internal_leak" in result.reasons

    def test_simulator_internal_leak_trainer(self):
        """Test that 'тренажер' keyword triggers internal leak detection."""
        result = validate_buyer_reply("В тренажере проверяется это.")
        assert result.is_valid is False
        assert "simulator_internal_leak" in result.reasons

    def test_repeated_customer_reply_exact_match(self):
        """Test that exact match with previous reply is detected."""
        prev_reply = "Нам нужно понять риски по срокам."
        result = validate_buyer_reply(
            "Нам нужно понять риски по срокам.",
            forbidden_replies=[prev_reply],
        )
        assert result.is_valid is False
        assert "repeated_customer_reply" in result.reasons

    def test_repeated_customer_reply_high_similarity(self):
        """Test that high similarity (>=0.9) with previous reply is detected."""
        prev_reply = "Нам нужно понять риски по срокам внедрения."
        # Very similar reply
        result = validate_buyer_reply(
            "Нам нужно понять риски по срокам внедрения",
            forbidden_replies=[prev_reply],
        )
        assert result.is_valid is False
        assert "repeated_customer_reply" in result.reasons

    def test_different_reply_passes(self):
        """Test that different reply passes validation."""
        prev_reply = "Нам нужно понять риски по срокам."
        result = validate_buyer_reply(
            "Сейчас для нас важнее вопрос стоимости.",
            forbidden_replies=[prev_reply],
        )
        assert result.is_valid is True

    def test_seller_role_phrase_we_offer(self):
        """Test that 'мы предлагаем' triggers seller role leak."""
        result = validate_buyer_reply("Мы предлагаем вам решение.")
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

    def test_seller_role_phrase_our_solution(self):
        """Test that 'наше решение' triggers seller role leak."""
        result = validate_buyer_reply("Наше решение исключит простои.")
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

    def test_seller_role_phrase_we_can_solve(self):
        """Test that 'мы можем решить' triggers seller role leak."""
        result = validate_buyer_reply("Мы можем решить эту проблему.")
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

    def test_seller_role_phrase_lets_discuss(self):
        """Test that 'давайте обсудим, как мы можем' triggers seller role leak."""
        result = validate_buyer_reply("Давайте обсудим, как мы можем помочь.")
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

    def test_seller_role_phrase_you_have_doubts(self):
        """Test that 'у вас есть сомнения' triggers seller role leak."""
        result = validate_buyer_reply("Я понимаю, что у вас есть сомнения.")
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

    def test_repeated_when_convenient_with_proposed_date(self):
        """Test that 'когда вам будет удобно' is invalid when date already proposed."""
        result = validate_buyer_reply(
            "Когда вам будет удобно встретиться?",
            proposed_date_or_time="завтра в 11:00",
        )
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

    def test_when_convenient_without_proposed_date(self):
        """Test that 'когда вам будет удобно' is valid when no date proposed yet."""
        result = validate_buyer_reply(
            "Когда вам будет удобно встретиться?",
            proposed_date_or_time=None,
        )
        # This should be valid since no date was proposed yet
        # (though it might still trigger other validations)
        assert "seller_role_leak" not in result.reasons or result.is_valid is True

    def test_too_long_reply(self):
        """Test that reply with more than 60 words is invalid."""
        long_text = " ".join(["слово"] * 65)
        result = validate_buyer_reply(long_text)
        assert result.is_valid is False
        assert "too_long" in result.reasons

    def test_short_reply_passes_length_check(self):
        """Test that reply with 60 or fewer words passes length check."""
        short_text = " ".join(["слово"] * 50)
        result = validate_buyer_reply(short_text)
        assert "too_long" not in result.reasons

    def test_multiple_validation_failures(self):
        """Test that multiple validation failures are all reported."""
        result = validate_buyer_reply(
            '{"reply": "Мы предлагаем решение с junior уровнем"}',
            forbidden_replies=['{"reply": "Мы предлагаем решение с junior уровнем"}'],
        )
        assert result.is_valid is False
        assert "json_or_markdown" in result.reasons
        assert "seller_role_leak" in result.reasons
        assert "simulator_internal_leak" in result.reasons


class TestGetFallbackReply:
    """Test suite for get_fallback_reply function."""

    def test_profanity_or_insult_fallback(self):
        """Test fallback for profanity/insult signal."""
        signals = {"profanity_or_insult": True}
        reply, reason = get_fallback_reply(signals)
        assert "В таком тоне я не готов продолжать обсуждение" in reply
        assert reason == "profanity_or_insult"

    def test_price_before_value_fallback(self):
        """Test fallback for price before value signal."""
        signals = {"price_before_value": True}
        reply, reason = get_fallback_reply(signals)
        assert "Для меня вопрос не только в цене" in reply
        assert reason == "price_before_value"

    def test_repeated_pitch_fallback(self):
        """Test fallback for repeated pitch signal."""
        signals = {"repeated_pitch": True}
        reply, reason = get_fallback_reply(signals)
        assert "Вы повторяете общие обещания" in reply
        assert reason == "repeated_pitch"

    def test_asked_about_equipment_fallback(self):
        """Test fallback for asked about equipment signal."""
        signals = {"asked_about_equipment": True}
        reply, reason = get_fallback_reply(signals)
        assert "две старые холодильные установки" in reply
        assert reason == "asked_about_equipment"

    def test_asked_about_peak_problem_fallback(self):
        """Test fallback for asked about peak problem signal."""
        signals = {"asked_about_peak_problem": True}
        reply, reason = get_fallback_reply(signals)
        assert "В жаркие недели температура уходит выше нормы" in reply
        assert reason == "asked_about_peak_problem"

    def test_scheduling_attempt_with_proposed_time_fallback(self):
        """Test fallback for scheduling attempt with proposed time."""
        signals = {
            "scheduling_attempt": True,
            "proposed_date_or_time": "завтра в 11:00",
        }
        reply, reason = get_fallback_reply(signals)
        assert "Завтра смогу в 11:00" in reply
        assert reason == "scheduling_attempt"

    def test_scheduling_attempt_without_proposed_time_uses_default(self):
        """Test that scheduling attempt without proposed time uses default fallback."""
        signals = {"scheduling_attempt": True}
        reply, reason = get_fallback_reply(signals)
        assert "Мне важно понять, как вы снизите риск" in reply
        assert reason == "default"

    def test_default_fallback(self):
        """Test default fallback when no signals are set."""
        reply, reason = get_fallback_reply({})
        assert "Мне важно понять, как вы снизите риск остановки производства" in reply
        assert reason == "default"

    def test_default_fallback_none_signals(self):
        """Test default fallback when signals is None."""
        reply, reason = get_fallback_reply(None)
        assert "Мне важно понять, как вы снизите риск остановки производства" in reply
        assert reason == "default"

    def test_priority_order_profanity_over_price(self):
        """Test that profanity takes priority over price_before_value."""
        signals = {
            "profanity_or_insult": True,
            "price_before_value": True,
        }
        reply, reason = get_fallback_reply(signals)
        assert reason == "profanity_or_insult"

    def test_priority_order_price_over_repeated_pitch(self):
        """Test that price_before_value takes priority over repeated_pitch."""
        signals = {
            "price_before_value": True,
            "repeated_pitch": True,
        }
        reply, reason = get_fallback_reply(signals)
        assert reason == "price_before_value"


class TestIntegrationWithBuyerAgent:
    """Integration tests simulating BuyerAgent usage patterns."""

    def test_llm_returns_previous_customer_reply_uses_fallback(self):
        """Test that if LLM returns previous customer reply, fallback is used."""
        prev_reply = "Нам нужно понять, не сорвет ли внедрение график."
        result = validate_buyer_reply(
            prev_reply,
            forbidden_replies=[prev_reply],
            dialogue_signals={},
        )
        assert result.is_valid is False
        assert "repeated_customer_reply" in result.reasons

        # Get fallback
        fallback_reply, fallback_reason = get_fallback_reply({})
        assert fallback_reply != prev_reply
        assert fallback_reason == "default"

    def test_llm_returns_seller_phrase_uses_fallback(self):
        """Test that if LLM returns seller phrase, fallback is used."""
        seller_phrase = "Мы предлагаем решение вашей проблемы."
        result = validate_buyer_reply(
            seller_phrase,
            forbidden_replies=[],
            dialogue_signals={},
        )
        assert result.is_valid is False
        assert "seller_role_leak" in result.reasons

        # Get fallback
        fallback_reply, _ = get_fallback_reply({})
        assert "мы предлагаем" not in fallback_reply.casefold()

    def test_insult_triggers_boundary_reply(self):
        """Test that insult signal triggers boundary reply."""
        signals = {"profanity_or_insult": True}
        fallback_reply, reason = get_fallback_reply(signals)
        assert reason == "profanity_or_insult"
        assert "В таком тоне я не готов продолжать обсуждение" in fallback_reply

    def test_tomorrow_after_time_question_triggers_concrete_slot(self):
        """Test that 'tomorrow' after time question triggers concrete slot reply."""
        signals = {
            "scheduling_attempt": True,
            "proposed_date_or_time": "завтра",
        }
        fallback_reply, reason = get_fallback_reply(signals)
        assert reason == "scheduling_attempt"
        assert "Завтра смогу в 11:00" in fallback_reply

    def test_buyer_validation_does_not_duplicate_in_graph(self):
        """Test that validation result contains all needed info for graph logging."""
        result = validate_buyer_reply(
            "Мы предлагаем решение.",
            forbidden_replies=[],
            dialogue_signals={},
        )
        # Graph should receive: is_valid, normalized_reply, reasons
        assert hasattr(result, "is_valid")
        assert hasattr(result, "normalized_reply")
        assert hasattr(result, "reasons")
        # No need for graph to re-validate
