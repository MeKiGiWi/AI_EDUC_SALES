import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.simulator.agents import EvaluationAgent


def _json_payload() -> str:
    return """{
  "overall_level": "Middle",
  "overall_comment": "Есть рабочая структура диалога, но глубину можно усилить.",
  "overall_recommendations": [
    "Уточнять влияние проблемы на бизнес-показатели.",
    "Фиксировать конкретный следующий шаг."
  ],
  "competencies": [
    {
      "name": "Умение задавать вопросы",
      "level": "Middle",
      "argument": "Менеджер задает открытые вопросы и уточняет контекст.",
      "quote": ["Какие у вас сейчас критерии выбора?"],
      "recommendations": ["Добавлять вопросы о последствиях."]
    },
    {
      "name": "Диагностика потребности",
      "level": "Middle",
      "argument": "Выходит за рамки исходного запроса.",
      "quote": ["Что для вас критично в этой задаче?"],
      "recommendations": ["Прояснять бизнес-последствия."]
    },
    {
      "name": "Формулировка ценности через выгоду",
      "level": "Middle",
      "argument": "Есть привязка ценности к задаче клиента.",
      "quote": ["Это снизит риск простоя производства."],
      "recommendations": ["Подкреплять выгоду цифрами и рисками."]
    },
    {
      "name": "Работа с возражением «подумаю / не сейчас»",
      "level": "Middle",
      "argument": "Возражение отрабатывается без давления.",
      "quote": ["Что важно уточнить перед решением?"],
      "recommendations": ["Уточнять критерии сравнения."]
    },
    {
      "name": "Фиксация следующего шага",
      "level": "Junior",
      "argument": "Шаг обозначен слишком общо.",
      "quote": ["Я пришлю материалы."],
      "recommendations": ["Фиксировать дату и цель созвона."]
    }
  ]
}"""


@pytest.mark.asyncio
async def test_evaluation_agent_parses_valid_json() -> None:
    agent = EvaluationAgent(RunnableLambda(lambda _: AIMessage(content=_json_payload())))
    result = await agent.evaluate(
        dialogue="Менеджер: Какие у вас критерии?\nКлиент: Важна стабильность.",
        manager_replies=2,
    )

    assert result.overall_level == "Middle"
    assert len(result.competencies) == 5


@pytest.mark.asyncio
async def test_evaluation_agent_extracts_json_from_fenced_output() -> None:
    raw = f"Ответ:\n```json\n{_json_payload()}\n```"
    agent = EvaluationAgent(RunnableLambda(lambda _: AIMessage(content=raw)))
    result = await agent.evaluate(
        dialogue="Менеджер: Какие у вас критерии?\nКлиент: Важна стабильность.",
        manager_replies=2,
    )

    assert result.overall_level == "Middle"
    assert result.competencies[0].name == "Умение задавать вопросы"


@pytest.mark.asyncio
async def test_evaluation_agent_accepts_tz_recommendations_alias() -> None:
    raw = """{
  "overall_level": "Junior",
  "overall_comment": "Краткое общее резюме.",
  "recommendations": "Уточнять критерии и фиксировать следующий шаг.",
  "competencies": [
    {
      "name": "Умение задавать вопросы",
      "level": "Junior",
      "argument": "Вопросов мало и они в основном закрытые.",
      "quote": "Расскажите подробнее, что именно не устраивает?",
      "recommendations": "Добавить открытые вопросы."
    }
  ]
}"""
    agent = EvaluationAgent(RunnableLambda(lambda _: AIMessage(content=raw)))
    result = await agent.evaluate(
        dialogue="Менеджер: Расскажите подробнее, что именно не устраивает?",
        manager_replies=1,
    )

    assert result.overall_recommendations == ["Уточнять критерии и фиксировать следующий шаг."]
    assert result.competencies[0].quote == ["Расскажите подробнее, что именно не устраивает?"]
    assert result.competencies[0].recommendations == ["Добавить открытые вопросы."]
