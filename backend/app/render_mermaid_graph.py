from pathlib import Path

from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.agents import BuyerAgent, RudeClassifierAgent
from app.graph import create_graph
from app.models import GraphDependencies
from app.store import InMemorySessionStore

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "artifacts" / "langgraph"


def render_graph_artifacts() -> None:
    graph = create_graph(
        GraphDependencies(
            session_store=InMemorySessionStore(),
            rude_classifier=RudeClassifierAgent(
                RunnableLambda(lambda _: AIMessage(content='{"rude":"no","confidence":0.5}'))
            ),
            buyer_agent=BuyerAgent(RunnableLambda(lambda _: AIMessage(content="Понял. Что именно вы хотите уточнить?"))),
        )
    )
    mermaid = graph.get_graph().draw_mermaid()
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS_DIR / "simulator_graph.mmd").write_text(mermaid, encoding="utf-8")
    (ARTIFACTS_DIR / "simulator_graph.md").write_text(
        f"# Simulator Graph\n\n```mermaid\n{mermaid}\n```\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    render_graph_artifacts()
