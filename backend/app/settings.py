from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_sales_academy"
    LLM_PROVIDER: str = "fake"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "qwen/qwen-turbo"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1/chat/completions"
    OPENROUTER_SITE_URL: str = "http://localhost:8081"
    OPENROUTER_APP_NAME: str = "AI Sales Academy"
    MIN_MANAGER_TURNS: int = Field(default=10, ge=1)
    APP_ENV: str = "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
