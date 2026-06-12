import json
import logging
import re
from difflib import SequenceMatcher
from typing import Literal

from langchain_core.exceptions import OutputParserException
from langchain_core.messages import AIMessage, BaseMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from pydantic import BaseModel, Field

from app.simulator.prompts import (
    BUYER_ROLE_LOCK_PROMPT,
    OFFTOPIC_REFUSAL_MESSAGE,
    OFFTOPIC_WARNING_MESSAGE,
    RUDE_REFUSAL_MESSAGE,
    RUDE_CLASSIFIER_SYSTEM_PROMPT,
    TOPIC_CLASSIFIER_PROMPT,
    build_evaluation_system_prompt,
)
from app.simulator.schemas import EvaluationResultRaw


class RudeCheckResult(BaseModel):
    rude: Literal["yes", "no"] = Field(
        description="Whether the sales message is rude. Use 'yes' for rude tone and 'no' otherwise."
    )
    label: Literal["allowed", "tactless", "rude", "abusive"] = Field(
        default="allowed",
        description="Explainable moderation label for the current sales message.",
    )
    severity: Literal["none", "low", "medium", "high"] = Field(
        default="none",
        description="Moderation severity for the message.",
    )
    terminate_session: bool = Field(
        default=False,
        description="Whether the current message should trigger a hard stop of the session.",
    )
    reason: str | None = Field(
        default=None,
        description="Short explanation of the moderation decision.",
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence for the rudeness decision, from 0 to 1.",
    )


class TopicCheckResult(BaseModel):
    on_topic: Literal["yes", "no"] = Field(
        description="Whether the learner message is relevant to the current training dialogue."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence for the topic relevance decision, from 0 to 1.",
    )


class RudeClassifierAgent:
    def __init__(self, llm) -> None:
        self.llm = llm
        self.parser = JsonOutputParser(pydantic_object=RudeCheckResult)
        self.prompt_template = PromptTemplate(
            template=(
                "{system_prompt}\n\n"
                "{format_instructions}\n\n"
                "Сообщение sales:\n{message}"
            ),
            input_variables=["message"],
            partial_variables={
                "system_prompt": RUDE_CLASSIFIER_SYSTEM_PROMPT,
                "format_instructions": self.parser.get_format_instructions(),
            },
        )
        self.chain = self.prompt_template | llm | self.parser

    async def check(self, message: str) -> RudeCheckResult:
        try:
            result = await self.chain.ainvoke({"message": message})
            parsed = RudeCheckResult.model_validate(result)
        except (OutputParserException, ValueError, TypeError):
            raw_output = await (self.prompt_template | self.llm | StrOutputParser()).ainvoke({"message": message})
            parsed = self._fallback_parse(raw_output)
        LOGGER.info(
            "moderation_result text=%r label=%s severity=%s terminate_session=%s reason=%s confidence=%.2f",
            message,
            parsed.label,
            parsed.severity,
            parsed.terminate_session,
            parsed.reason,
            parsed.confidence,
        )
        return parsed

    @staticmethod
    def _fallback_parse(raw_output: str) -> RudeCheckResult:
        normalized = raw_output.strip()
        rude_match = re.search(r'"rude"\s*:\s*"(yes|no)"', normalized, flags=re.IGNORECASE)
        label_match = re.search(r'"label"\s*:\s*"(allowed|tactless|rude|abusive)"', normalized, flags=re.IGNORECASE)
        severity_match = re.search(r'"severity"\s*:\s*"(none|low|medium|high)"', normalized, flags=re.IGNORECASE)
        terminate_match = re.search(r'"terminate_session"\s*:\s*(true|false)', normalized, flags=re.IGNORECASE)
        reason_match = re.search(r'"reason"\s*:\s*"([^"]*)"', normalized, flags=re.IGNORECASE)
        confidence = _extract_confidence(normalized)
        rude = (rude_match.group(1).lower() if rude_match else "no")
        label = (label_match.group(1).lower() if label_match else ("abusive" if rude == "yes" else "allowed"))
        severity = severity_match.group(1).lower() if severity_match else ("high" if rude == "yes" else "none")
        terminate_session = (
            terminate_match.group(1).lower() == "true"
            if terminate_match
            else rude == "yes" or label == "abusive" or severity == "high"
        )
        return RudeCheckResult(
            rude="yes" if terminate_session else "no",
            label=label,  # type: ignore[arg-type]
            severity=severity,  # type: ignore[arg-type]
            terminate_session=terminate_session,
            reason=reason_match.group(1).strip() if reason_match and reason_match.group(1).strip() else None,
            confidence=confidence,
        )


LOGGER = logging.getLogger(__name__)


def format_messages_for_topic_check(messages: list[BaseMessage]) -> str:
    lines = []
    for message in messages:
        if isinstance(message, SystemMessage):
            continue
        if isinstance(message, AIMessage) and is_internal_guard_message(str(message.content)):
            continue
        role = "Покупатель" if isinstance(message, AIMessage) else "Продавец"
        lines.append(f"{role}: {message.content}")
    return "\n".join(lines)


def normalize_role_copy_text(value: str) -> str:
    collapsed = " ".join(value.strip().casefold().split())
    without_punctuation = re.sub(r"[^\w\s]", " ", collapsed, flags=re.UNICODE)
    return " ".join(without_punctuation.split())


def find_latest_customer_message(messages: list[BaseMessage]) -> AIMessage | None:
    for message in reversed(messages):
        if isinstance(message, AIMessage):
            return message
    return None


SELLER_LANGUAGE_PATTERNS = [
    "мы можем предложить",
    "наше решение",
    "наш продукт",
    "наше оборудование",
    "мы подберём",
    "я подготовлю кп",
    "отправлю вам кп",
    "как менеджер",
    "как продавец",
    "как поставщик",
    "давайте я задам",
    "давайте я уточню",
    "давайте уточним",
    "я задам несколько уточняющих вопросов",
    "я уточню детали",
    "я готов вас выслушать",
    "я помогу вам сориентироваться",
    "подскажите пожалуйста на какое время вы были записаны",
    "скажите пожалуйста как давно у вас появились эти симптомы",
]


def is_internal_guard_message(value: str) -> bool:
    normalized = normalize_role_copy_text(value)
    guard_messages = {
        normalize_role_copy_text(OFFTOPIC_WARNING_MESSAGE),
        normalize_role_copy_text(OFFTOPIC_REFUSAL_MESSAGE),
        normalize_role_copy_text(RUDE_REFUSAL_MESSAGE),
    }
    return normalized in guard_messages


def contains_seller_language(value: str) -> bool:
    normalized = normalize_role_copy_text(value)
    return any(pattern in normalized for pattern in SELLER_LANGUAGE_PATTERNS)


def find_customer_anchor_message(messages: list[BaseMessage]) -> AIMessage | None:
    for message in reversed(messages):
        if not isinstance(message, AIMessage):
            continue
        content = str(message.content)
        if is_internal_guard_message(content):
            continue
        if contains_seller_language(content):
            continue
        return message
    return find_latest_customer_message(messages)


def detect_role_copy(
    sales_message: str,
    messages: list[BaseMessage],
    *,
    similarity_threshold: float = 0.94,
) -> tuple[bool, AIMessage | None, float]:
    latest_customer_message = find_latest_customer_message(messages)
    if latest_customer_message is None:
        return False, None, 0.0

    normalized_sales = normalize_role_copy_text(sales_message)
    normalized_customer = normalize_role_copy_text(str(latest_customer_message.content))
    if not normalized_sales or not normalized_customer:
        return False, latest_customer_message, 0.0

    if normalized_sales == normalized_customer:
        return True, latest_customer_message, 1.0

    similarity = SequenceMatcher(a=normalized_sales, b=normalized_customer).ratio()
    return similarity >= similarity_threshold, latest_customer_message, similarity


def format_messages_for_buyer_transcript(messages: list[BaseMessage]) -> str:
    lines = []
    previous_customer_message = ""
    for index, message in enumerate(messages):
        if isinstance(message, SystemMessage):
            continue
        if isinstance(message, AIMessage):
            content = str(message.content)
            if is_internal_guard_message(content):
                continue
            previous_customer_message = content
            lines.append(f"Покупатель: {content}")
            continue

        content = str(message.content)
        copied_previous_customer = (
            previous_customer_message
            and detect_role_copy(content, messages[:index], similarity_threshold=0.94)[0]
        )
        if copied_previous_customer:
            lines.append(
                "Продавец: [дословно или почти дословно повторяет предыдущую реплику покупателя; "
                "нового предложения или вопроса не добавлено]"
            )
            continue
        lines.append(f"Продавец: {content}")
    return "\n".join(lines)


class TopicClassifierAgent:
    def __init__(self, llm) -> None:
        self.llm = llm
        self.parser = JsonOutputParser(pydantic_object=TopicCheckResult)
        self.prompt_template = PromptTemplate(
            template=(
                TOPIC_CLASSIFIER_PROMPT
                + "\n\n"
                + "{format_instructions}"
            ),
            input_variables=["sales_message", "history"],
            partial_variables={
                "format_instructions": self.parser.get_format_instructions(),
            },
        )
        self.chain = self.prompt_template | llm | self.parser

    async def check(
        self,
        message: str,
        messages: list[BaseMessage],
        *,
        training_context: str = "",
    ) -> TopicCheckResult:
        history = format_messages_for_topic_check(messages)
        payload = {
            "sales_message": message,
            "history": history,
            "training_context": training_context or "Контекст сценария не передан.",
        }
        try:
            result = await self.chain.ainvoke(payload)
            return TopicCheckResult.model_validate(result)
        except (OutputParserException, ValueError, TypeError):
            raw_output = await (self.prompt_template | self.llm | StrOutputParser()).ainvoke(payload)
            return self._fallback_parse(raw_output)

    @staticmethod
    def _fallback_parse(raw_output: str) -> TopicCheckResult:
        normalized = raw_output.strip()
        topic_match = re.search(r'"on_topic"\s*:\s*"(yes|no)"', normalized, flags=re.IGNORECASE)
        confidence = _extract_confidence(normalized)
        return TopicCheckResult(
            on_topic=(topic_match.group(1).lower() if topic_match else "yes"),
            confidence=confidence,
        )


def _extract_confidence(raw_output: str) -> float:
    confidence_match = re.search(r'"confidence"\s*:\s*([0-9]+(?:\.[0-9]+)?)', raw_output, flags=re.IGNORECASE)
    if not confidence_match:
        return 0.0
    try:
        value = float(confidence_match.group(1))
    except ValueError:
        return 0.0
    return max(0.0, min(1.0, value))


class BuyerAgent:
    def __init__(self, llm) -> None:
        self.parser = StrOutputParser()
        self.prompt_template = ChatPromptTemplate.from_messages(
            [
                ("system", "{buyer_system_prompt}"),
                ("system", "{scenario_context_prompt}"),
                ("system", BUYER_ROLE_LOCK_PROMPT),
                ("human", "{transcript_prompt}"),
            ]
        )
        self.chain = self.prompt_template | llm | self.parser

    async def reply(
        self,
        messages: list[BaseMessage],
        *,
        role_copy_detected: bool = False,
        copied_customer_message: str = "",
        role_copy_similarity: float = 0.0,
    ) -> str:
        system_messages = [message for message in messages if isinstance(message, SystemMessage)]
        buyer_system_prompt = str(system_messages[0].content) if system_messages else ""
        scenario_context_prompt = str(system_messages[1].content) if len(system_messages) > 1 else ""
        transcript = format_messages_for_buyer_transcript(messages)
        anchor_message = find_customer_anchor_message(messages)
        anchor_text = "" if anchor_message is None else str(anchor_message.content).strip()
        copy_guard_note = (
            (
                "Важное наблюдение: последняя реплика продавца выглядит как повтор или цитата предыдущей "
                f"реплики покупателя (similarity={role_copy_similarity:.2f}). "
                f"Повторённый текст покупателя: {copied_customer_message.strip()}\n"
                "Интерпретируй это только как повтор/эхо. Роли не меняются. "
                "Не копируй повтор обратно. Опирайся на последнюю валидную реплику покупателя ниже и продолжай "
                "разговор только от её лица. Попроси продавца перейти к конкретному предложению, уточнению или "
                "следующему шагу, но не задавай вопросы и не веди диалог как оператор."
            )
            if role_copy_detected
            else "Последняя реплика продавца интерпретируется как обычный ход диалога."
        )
        transcript_prompt = (
            "Ниже transcript диалога с фиксированными ролями.\n"
            "Метки ролей являются source of truth, даже если тексты совпадают.\n\n"
            f"{copy_guard_note}\n\n"
            f"Последняя валидная реплика покупателя:\n{anchor_text or 'Нет отдельной anchor-реплики.'}\n\n"
            f"Transcript:\n{transcript}\n\n"
            "Ответь следующей одной репликой покупателя.\n"
            "Запрещено:\n"
            "- писать off-topic или refusal фразы из guardrail-модерации;\n"
            "- извиняться за нарушение сценария от имени системы;\n"
            "- писать как оператор, менеджер, регистратор, продавец или поставщик;\n"
            "- задавать диагностические, сервисные или квалификационные вопросы вместо покупателя."
        )
        payload = {
            "buyer_system_prompt": buyer_system_prompt,
            "scenario_context_prompt": scenario_context_prompt,
            "transcript_prompt": transcript_prompt,
        }
        reply = await self.chain.ainvoke(payload)
        normalized = " ".join(reply.strip().split())
        if self._needs_repair(normalized):
            repaired_prompt = (
                transcript_prompt
                + "\n\n"
                + "Исправь предыдущий ответ. Нужна одна краткая реплика покупателя без meta-комментариев, "
                + "без сервисных вопросов от лица клиники и без завершения сессии."
            )
            reply = await self.chain.ainvoke(
                {
                    "buyer_system_prompt": buyer_system_prompt,
                    "scenario_context_prompt": scenario_context_prompt,
                    "transcript_prompt": repaired_prompt,
                }
            )
            normalized = " ".join(reply.strip().split())
        return normalized or "Нужно чуть больше контекста, чтобы я продолжил разговор."

    @staticmethod
    def _needs_repair(reply: str) -> bool:
        return is_internal_guard_message(reply) or contains_seller_language(reply)


class EvaluationAgent:
    def __init__(self, llm, *, scenario_title: str, segment: str, competency_catalog: list[str]) -> None:
        self.parser = StrOutputParser()
        self.prompt_template = PromptTemplate(
            template=(
                "{system_prompt}\n\n"
                "Контекст:\n"
                "- Минимум реплик для уверенной оценки: {min_replies}\n"
                "- Фактическое количество реплик менеджера: {manager_replies}\n"
                "{short_dialogue_note}\n\n"
                "{retry_instruction}\n\n"
                "Диалог:\n{dialogue}"
            ),
            input_variables=[
                "system_prompt",
                "dialogue",
                "manager_replies",
                "min_replies",
                "short_dialogue_note",
                "retry_instruction",
            ],
        )
        self.chain = self.prompt_template | llm | self.parser
        self.system_prompt = build_evaluation_system_prompt(
            scenario_title=scenario_title,
            segment=segment,
            competency_catalog=competency_catalog,
        )

    async def evaluate(
        self,
        dialogue: str,
        manager_replies: int,
        *,
        min_replies: int = 10,
    ) -> EvaluationResultRaw:
        short_dialogue_note = (
            "Диалог короче рекомендуемого порога. Сохраняй осторожную оценку и явно указывай ограничения."
            if manager_replies < min_replies
            else "Диалог достиг достаточного объема для стандартной оценки."
        )

        last_error: Exception | None = None
        for attempt in range(3):
            retry_instruction = (
                ""
                if attempt == 0
                else "ВАЖНО: предыдущий ответ был невалидным JSON. Верни только валидный JSON без лишнего текста."
            )
            raw_output = await self.chain.ainvoke(
                {
                    "system_prompt": self.system_prompt,
                    "dialogue": dialogue,
                    "manager_replies": manager_replies,
                    "min_replies": min_replies,
                    "short_dialogue_note": short_dialogue_note,
                    "retry_instruction": retry_instruction,
                }
            )

            try:
                payload = self._parse_json(raw_output)
                return EvaluationResultRaw.model_validate(payload)
            except Exception as exc:  # noqa: BLE001
                last_error = exc

        raise ValueError(f"Evaluation JSON parse failed after retries: {last_error}")

    @staticmethod
    def _parse_json(raw_output: str) -> dict:
        raw = raw_output.strip()
        candidates = [raw]

        if "```" in raw:
            fenced = raw.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
            if fenced:
                candidates.append(fenced)

        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            candidates.append(raw[start : end + 1])

        for candidate in candidates:
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                continue

        raise ValueError(f"Could not parse JSON payload: {raw_output}")
