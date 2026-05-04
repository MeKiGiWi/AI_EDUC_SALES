import type {
  AgentDebugStepDto,
  SimulatorCatalogResponseDto,
  SimulatorFinishResponseDto,
  SimulatorPublicScenarioDto,
  SimulatorSendMessageResponseDto,
  SimulatorStartSessionResponseDto
} from "../types/academy";

const simulatorApiUrl = process.env.EXPO_PUBLIC_SIMULATOR_API_URL?.trim() ?? "";
const simulatorDebugEnabled = process.env.EXPO_PUBLIC_SIMULATOR_DEBUG === "true";

export interface SimulatorApiErrorDetail {
  code?: string;
  message?: string;
  node?: string;
  raw_output?: string;
  debug_steps?: AgentDebugStepDto[];
}

export class SimulatorApiError extends Error {
  status?: number;
  body?: string;
  detail?: unknown;

  constructor(message: string, options?: { status?: number; body?: string; detail?: unknown }) {
    super(message);
    this.name = "SimulatorApiError";
    this.status = options?.status;
    this.body = options?.body;
    this.detail = options?.detail;
  }
}

function buildUrl(path: string) {
  const base = simulatorApiUrl.trim();
  if (!base) {
    return path;
  }
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function withDebugQuery(path: string) {
  if (!simulatorDebugEnabled) {
    return path;
  }
  return path.includes("?") ? `${path}&debug=true` : `${path}?debug=true`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined;
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let parsedBody: unknown;
    let detail: unknown;

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
        if (parsedBody && typeof parsedBody === "object" && "detail" in parsedBody) {
          detail = (parsedBody as { detail?: unknown }).detail;
        }
      } catch {
        parsedBody = undefined;
      }
    }

    const detailMessage =
      typeof detail === "string"
        ? detail
        : detail !== undefined
          ? JSON.stringify(detail)
          : rawBody || "Не удалось выполнить запрос к backend симулятора.";

    throw new SimulatorApiError("Произошла ошибка при обращении к серверу.", {
      status: response.status,
      body: rawBody,
      detail: detail ?? parsedBody
    });
  }

  return (await response.json()) as T;
}

export function getSafeSimulatorErrorMessage(error: unknown): string {
  if (error instanceof SimulatorApiError) {
    if (error.status === 409) {
      return "Диалог уже завершен. Начните новый сценарий, чтобы продолжить тренировку.";
    }
    if (error.status === 404) {
      return "Сессия не найдена. Перезапустите сценарий.";
    }
    return error.message || "Не удалось выполнить действие. Проверьте подключение и попробуйте снова.";
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Превышено время ожидания ответа от сервера.";
    }
  }
  return "Не удалось выполнить действие. Проверьте подключение и попробуйте снова.";
}

export const simulatorApiService = {
  isEnabled(): boolean {
    return simulatorApiUrl.length > 0;
  },

  isDebugEnabled(): boolean {
    return simulatorDebugEnabled;
  },

  async fetchSimulatorScenarios(): Promise<SimulatorPublicScenarioDto[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await requestJson<SimulatorCatalogResponseDto>("/api/v1/simulator/scenarios", {
        signal: controller.signal
      });
      return response.items;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async startDialogueSession(
    scenarioId: string,
    difficulty: string
  ): Promise<SimulatorStartSessionResponseDto> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      return await requestJson<SimulatorStartSessionResponseDto>(withDebugQuery("/api/v1/simulator/sessions"), {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          scenario_id: scenarioId,
          difficulty
        })
      });
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async sendDialogueMessage(
    sessionId: string,
    text: string
  ): Promise<SimulatorSendMessageResponseDto> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      return await requestJson<SimulatorSendMessageResponseDto>(
        withDebugQuery(`/api/v1/simulator/sessions/${sessionId}/messages`),
        {
          method: "POST",
          signal: controller.signal,
          body: JSON.stringify({ text })
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async finishDialogueSession(sessionId: string): Promise<SimulatorFinishResponseDto> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
      return await requestJson<SimulatorFinishResponseDto>(withDebugQuery(`/api/v1/simulator/sessions/${sessionId}/finish`), {
        method: "POST",
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
