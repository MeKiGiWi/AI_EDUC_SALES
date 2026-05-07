import { salesAcademyMock } from "../data/salesAcademyMock";
import type {
  DialogueMessage,
  ScenarioCardItem,
  SimulatorApiMessageDto
} from "../types/academy";

const DEFAULT_MANAGER_TARGET = 10;

export function formatDialogueTime(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatApiMessageTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return formatDialogueTime(new Date());
  }
  return formatDialogueTime(date);
}

export function mapApiMessageToDialogueMessage(dto: SimulatorApiMessageDto): DialogueMessage {
  const normalizedText = dto.text.trim();
  const id =
    dto.id?.trim() ||
    `api-${dto.role}-${dto.created_at}-${normalizedText
      .slice(0, 32)
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

  return {
    id,
    author: dto.role === "learner" ? "manager" : "customer",
    text: normalizedText,
    time: formatApiMessageTime(dto.created_at)
  };
}

export function countManagerReplies(messages: DialogueMessage[]): number {
  return messages.filter((message) => message.author === "manager").length;
}

export function calculateDialogueProgress(
  messages: DialogueMessage[],
  target: number
): number {
  if (target <= 0) {
    return 0;
  }

  const progress = Math.round((countManagerReplies(messages) / target) * 100);
  return Math.max(0, Math.min(100, progress));
}

function isSameMessage(left: DialogueMessage, right: DialogueMessage): boolean {
  return left.author === right.author && left.text.trim() === right.text.trim();
}

export function mergeApiMessages(
  currentMessages: DialogueMessage[],
  apiMessages: SimulatorApiMessageDto[],
  optimisticMessageId?: string
): DialogueMessage[] {
  const mappedMessages = apiMessages.map(mapApiMessageToDialogueMessage);
  let nextMessages = [...currentMessages];

  for (const mappedMessage of mappedMessages) {
    if (mappedMessage.author === "manager" && optimisticMessageId) {
      const optimisticIndex = nextMessages.findIndex((message) => message.id === optimisticMessageId);
      if (optimisticIndex >= 0) {
        nextMessages[optimisticIndex] = mappedMessage;
        continue;
      }
    }

    const duplicateIndex = nextMessages.findIndex((message) => isSameMessage(message, mappedMessage));
    if (duplicateIndex >= 0) {
      nextMessages[duplicateIndex] = {
        ...nextMessages[duplicateIndex],
        ...mappedMessage
      };
      continue;
    }

    nextMessages = [...nextMessages, mappedMessage];
  }

  return nextMessages;
}

export function buildInitialMockDialogue(params: {
  scenarioId: string;
  scenarioTitle: string;
  openingMessage?: string;
}): DialogueMessage[] {
  const preset = salesAcademyMock.activeDialogue;
  if (params.scenarioId === preset.selectedScenarioId) {
    return preset.messages.map((message) => ({ ...message }));
  }

  const openingMessage =
    params.openingMessage?.trim() ||
    `Добрый день. Рассматриваем сценарий «${params.scenarioTitle}». С чего вы предлагаете начать обсуждение?`;

  return [
    {
      id: `mock-opening-${params.scenarioId}`,
      author: "customer",
      text: openingMessage,
      time: formatDialogueTime(new Date())
    }
  ];
}

export function buildMockCustomerFollowUp(
  scenario: ScenarioCardItem,
  managerText: string,
  managerReplyCount: number
): string {
  if (scenario.id === "price-objection") {
    return managerReplyCount >= 3
      ? "Если мы увидим понятный пилот и сроки без простоя, готовы обсудить следующий шаг."
      : "Аргумент понятен, но мне все еще важно понять, как это окупится в нашем бюджете.";
  }

  if (scenario.id === "timeline-negotiation") {
    return "Тогда уточните, какие этапы и сроки вы готовы зафиксировать уже сейчас.";
  }

  if (scenario.id === "competitor-comparison") {
    return "Хорошо, а в чем для нас будет практическая разница по сравнению с конкурентом?";
  }

  if (scenario.id === "cold-call") {
    return "Прежде чем идти дальше, коротко скажите, чем ваш подход отличается от других предложений на рынке.";
  }

  if (scenario.id === "upsell") {
    return "Хорошо, а какую дополнительную ценность мы увидим в первый месяц после расширения?";
  }

  if (scenario.id === "customer-return") {
    return "Мы уже пробовали похожие инициативы. Почему сейчас это должно сработать лучше?";
  }

  return managerText.length > 80
    ? "Понял. Тогда уточните, какой следующий шаг вы предлагаете проверить первым."
    : "Можете раскрыть это чуть конкретнее применительно к нашей ситуации?";
}

export function buildOptimisticManagerMessage(text: string): DialogueMessage {
  return {
    id: `optimistic-manager-${Date.now()}`,
    author: "manager",
    text: text.trim(),
    time: formatDialogueTime(new Date())
  };
}

export function getVisibleManagerReplyLabel(messages: DialogueMessage[], target: number): string {
  const replyCount = countManagerReplies(messages);
  return `${replyCount} / ${target}`;
}

export const simulatorDialogueDefaults = {
  managerTarget: DEFAULT_MANAGER_TARGET
};
