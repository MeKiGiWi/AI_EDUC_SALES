from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)


class LLMSettings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        extra="ignore",
    )

    LLM_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_SITE_URL: str = "http://localhost:8081"
    OPENROUTER_APP_NAME: str = "AI Sales Academy"
    LLM_MODEL: str = "qwen-turbo"
    LLM_TEMPERATURE: float = Field(default=0.2, ge=0.0, le=1.0)
    LLM_REASONING_EFFORT: Literal["minimal", "low", "medium", "high", "none"] | None = None
    # NEVER FUCKING CHANGE THIS CLASS, ALWAYS ASK ME FOR THAT


class AgentsConfig(BaseModel):
    # pydantic readonly config
    model_config = ConfigDict(frozen=True)

    check_rude_llm_settings: LLMSettings = Field(default_factory=LLMSettings)
    check_topic_llm_settings: LLMSettings = Field(
        default_factory=lambda: get_settings().model_copy(
            update={"LLM_MODEL": "openai/gpt-oss-120b"}
        )
    )

    buyer_agent_llm_settings: LLMSettings = Field(
        default_factory=lambda: get_settings().model_copy(
            update={"LLM_MODEL": "deepseek/deepseek-v3.2"}
        )
    )

    evaluation_agent_llm_settings: LLMSettings = Field(
        default_factory=lambda: get_settings().model_copy(
            update={
                "LLM_MODEL": "deepseek/deepseek-v3.2",
                "LLM_REASONING_EFFORT": "low",
            }
        )
    )


@lru_cache(maxsize=1)
def get_settings() -> LLMSettings:
    return LLMSettings()


@lru_cache(maxsize=1)
def get_agents_config() -> AgentsConfig:
    return AgentsConfig()
