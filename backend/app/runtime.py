from fastapi import HTTPException, status
from langchain_openai import ChatOpenAI

from app.settings import Settings
from app.agents import BuyerAgent, RudeClassifierAgent
from app.graph import GraphDependencies, create_graph
from app.store import InMemorySessionStore

SESSION_STORE = InMemorySessionStore()


def build_chat_model(settings: Settings) -> ChatOpenAI:
    if not settings.LLM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM API key is not configured.",
        )

    return ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
        temperature=settings.LLM_TEMPERATURE,
        default_headers={
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-Title": settings.OPENROUTER_APP_NAME,
        },
    )


def build_graph(settings: Settings):
    llm = build_chat_model(settings)
    deps = GraphDependencies(
        session_store=SESSION_STORE,
        rude_classifier=RudeClassifierAgent(llm),
        buyer_agent=BuyerAgent(llm),
    )
    return create_graph(deps)
