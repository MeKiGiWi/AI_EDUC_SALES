import pytest

from app.core.settings import LLMSettings, get_agents_config, get_settings


def test_get_settings_returns_singleton_settings() -> None:
    first = get_settings()
    second = get_settings()

    assert first is second
    assert first.LLM_MODEL


def test_agents_config_returns_singleton_with_default_settings_for_all_agents() -> None:
    agents_config = get_agents_config()
    same_agents_config = get_agents_config()
    settings = get_settings()

    assert agents_config is same_agents_config
    assert agents_config.check_rude_llm_settings.LLM_MODEL == settings.LLM_MODEL
    assert agents_config.check_rude_llm_settings.LLM_TEMPERATURE == settings.LLM_TEMPERATURE
    assert agents_config.check_topic_llm_settings.LLM_MODEL == "openai/gpt-oss-120b"
    assert agents_config.buyer_agent_llm_settings.LLM_MODEL == "deepseek/deepseek-v3.2"
    assert agents_config.buyer_agent_llm_settings.LLM_TEMPERATURE == settings.LLM_TEMPERATURE
    assert agents_config.evaluation_agent_llm_settings.LLM_MODEL == "deepseek/deepseek-v3.2"
    assert agents_config.evaluation_agent_llm_settings.LLM_TEMPERATURE == settings.LLM_TEMPERATURE
    assert agents_config.evaluation_agent_llm_settings.LLM_REASONING_EFFORT == "low"
    with pytest.raises(Exception):
        agents_config.buyer_agent_llm_settings = LLMSettings()
