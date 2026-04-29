from fastapi import HTTPException, status
from langchain_openai import ChatOpenAI

from app.agents import BuyerAgent, RudeClassifierAgent
from app.graph import create_graph
from app.models import GraphDependencies
from app.settings import LLMSettings
from app.store import InMemorySessionStore

SESSION_STORE = InMemorySessionStore()


def build_chat_model(llm_settings: LLMSettings) -> ChatOpenAI:
    if not llm_settings.LLM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM API key is not configured.",
        )

    return ChatOpenAI(
        model=llm_settings.LLM_MODEL,
        api_key=llm_settings.LLM_API_KEY,
        base_url=llm_settings.OPENROUTER_BASE_URL,
        temperature=llm_settings.LLM_TEMPERATURE,
        default_headers={
            "HTTP-Referer": llm_settings.OPENROUTER_SITE_URL,
            "X-Title": llm_settings.OPENROUTER_APP_NAME,
        },
    )


def build_graph(llm_settings: LLMSettings):
    llm = build_chat_model(llm_settings)
    deps = GraphDependencies(
        session_store=SESSION_STORE,
        rude_classifier=RudeClassifierAgent(llm),
        buyer_agent=BuyerAgent(llm),
    )
    return create_graph(deps)
