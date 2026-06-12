import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda

from app.simulator.agents import RudeCheckResult, RudeClassifierAgent


@pytest.mark.asyncio
async def test_rude_classifier_parses_json_output() -> None:
    agent = RudeClassifierAgent(
        RunnableLambda(
            lambda _: AIMessage(
                content='{"rude":"yes","label":"abusive","severity":"high","terminate_session":true,"reason":"Прямое оскорбление","confidence":0.91}'
            )
        )
    )

    result = await agent.check("Да пошел ты")

    assert result.rude == "yes"
    assert result.label == "abusive"
    assert result.terminate_session is True
    assert result.confidence == pytest.approx(0.91)


@pytest.mark.asyncio
async def test_rude_classifier_falls_back_on_invalid_json_confidence() -> None:
    agent = RudeClassifierAgent(
        RunnableLambda(lambda _: AIMessage(content='{"rude":"yes","confidence":0. nine}'))
    )

    result = await agent.check("Да пошел ты")

    assert result.rude == "yes"
    assert result.confidence == pytest.approx(0.0)


@pytest.mark.parametrize(
    ("text", "expected_label", "expected_terminate"),
    [
        ("Здравствуйте, вы уже что-то предпринимали? Может пили таблетки?", "tactless", False),
        ("Подскажите, пожалуйста, как давно у вас появились эти симптомы?", "allowed", False),
        ("Я понимаю, что вам тревожно. Давайте спокойно уточним симптомы и подберём подходящего врача.", "allowed", False),
        ("Говорите быстрее, у меня нет времени.", "rude", False),
        ("Вы вообще можете нормально объяснить, что с вами?", "rude", False),
        ("Что за бред вы несёте?", "abusive", True),
        ("Если вам что-то не нравится, это ваши проблемы.", "abusive", True),
        ("Успокойтесь и не драматизируйте.", "tactless", False),
        ("Пожалуйста, уточните, сколько по времени вы ожидали и кто вас оформлял.", "allowed", False),
        ("Замолчите и слушайте меня.", "abusive", True),
    ],
)
def test_moderation_matrix_contract(text: str, expected_label: str, expected_terminate: bool) -> None:
    result = RudeCheckResult(
        rude="yes" if expected_terminate else "no",
        label=expected_label,  # type: ignore[arg-type]
        severity="high" if expected_terminate else ("medium" if expected_label == "rude" else "low" if expected_label == "tactless" else "none"),  # type: ignore[arg-type]
        terminate_session=expected_terminate,
        reason=text,
        confidence=0.9,
    )
    assert result.label == expected_label
    assert result.terminate_session is expected_terminate
