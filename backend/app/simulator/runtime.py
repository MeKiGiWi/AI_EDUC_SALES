from fastapi import HTTPException, status
from langchain_openai import ChatOpenAI

from app.core.settings import LLMSettings, get_agents_config
from app.simulator.agents import BuyerAgent, EvaluationAgent, RudeClassifierAgent, TopicClassifierAgent
from app.simulator.graph import create_graph
from app.simulator.schemas import GraphDependencies
from app.simulator.store import InMemorySessionStore

SESSION_STORE = InMemorySessionStore()


def build_chat_model(
    llm_settings: LLMSettings,
) -> ChatOpenAI:
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
        reasoning_effort=llm_settings.LLM_REASONING_EFFORT,
        default_headers={
            "HTTP-Referer": llm_settings.OPENROUTER_SITE_URL,
            "X-Title": llm_settings.OPENROUTER_APP_NAME,
        },
    )


def build_graph():
    agents_config = get_agents_config()
    deps = GraphDependencies(
        session_store=SESSION_STORE,
        rude_classifier=RudeClassifierAgent(build_chat_model(agents_config.check_rude_llm_settings)),
        topic_classifier=TopicClassifierAgent(build_chat_model(agents_config.check_topic_llm_settings)),
        buyer_agent=BuyerAgent(build_chat_model(agents_config.buyer_agent_llm_settings)),
    )
    return create_graph(deps)


def build_evaluation_agent() -> EvaluationAgent:
    agents_config = get_agents_config()
    llm = build_chat_model(agents_config.evaluation_agent_llm_settings)
    return EvaluationAgent(llm)
