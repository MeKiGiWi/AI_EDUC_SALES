from functools import lru_cache
from pathlib import Path

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
    LLM_MODEL: str = "qwen/qwen-turbo"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_SITE_URL: str = "http://localhost:8081"
    OPENROUTER_APP_NAME: str = "AI Sales Academy"
    LLM_TEMPERATURE: float = Field(default=0.2, ge=0.0, le=1.0)


@lru_cache(maxsize=1)
def get_settings() -> LLMSettings:
    return LLMSettings()
