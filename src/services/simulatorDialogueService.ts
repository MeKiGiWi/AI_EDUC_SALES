import { salesAcademyMock } from "../data/salesAcademyMock";
import { SimulatorApiError } from "./simulatorApiService";
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
  if (!normalizedText) {
    throw new SimulatorApiError("Backend вернул пустой ответ клиента", {
      detail: {
        code: "empty_customer_reply",
        role: dto.role
      }
    });
  }
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
  const mappedMessages = apiMessages.flatMap((message) => {
    try {
      return [mapApiMessageToDialogueMessage(message)];
    } catch (error) {
      if (error instanceof SimulatorApiError && message.role === "customer") {
        return [];
      }
      throw error;
    }
  });
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
  if (scenario.id === "clinic-appointment") {
    return managerReplyCount >= 3
      ? "Хорошо, мне уже понятнее. А на какое время тогда лучше записаться?"
      : "Я немного переживаю. Можете, пожалуйста, помочь понять, с какого врача разумнее начать?";
  }

  if (scenario.id === "clinic-complaint") {
    return managerReplyCount >= 3
      ? "Хорошо. Тогда для меня важно, чтобы жалоба не потерялась и со мной действительно связались."
      : "Меня задело не только ожидание, но и то, что мне никто нормально не объяснял, сколько ещё ждать.";
  }

  return managerText.length > 80
    ? "Поняла. Тогда уточните, какой следующий шаг вы предлагаете в моей ситуации."
    : "Можете чуть конкретнее объяснить, что вы предлагаете дальше?";
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
