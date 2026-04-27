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
  return `${simulatorApiUrl.replace(/\/$/, "")}${path}`;
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

    throw new SimulatorApiError(detailMessage, {
      status: response.status,
      body: rawBody,
      detail: detail ?? parsedBody
    });
  }

  return (await response.json()) as T;
}

export const simulatorApiService = {
  isEnabled(): boolean {
    return simulatorApiUrl.length > 0;
  },

  isDebugEnabled(): boolean {
    return simulatorDebugEnabled;
  },

  async fetchSimulatorScenarios(): Promise<SimulatorPublicScenarioDto[]> {
    const response = await requestJson<SimulatorCatalogResponseDto>("/api/v1/simulator/scenarios");
    return response.items;
  },

  startDialogueSession(
    scenarioId: string,
    difficulty: string
  ): Promise<SimulatorStartSessionResponseDto> {
    return requestJson<SimulatorStartSessionResponseDto>(withDebugQuery("/api/v1/simulator/sessions"), {
      method: "POST",
      body: JSON.stringify({
        scenario_id: scenarioId,
        difficulty
      })
    });
  },

  sendDialogueMessage(
    sessionId: string,
    text: string
  ): Promise<SimulatorSendMessageResponseDto> {
    return requestJson<SimulatorSendMessageResponseDto>(
      withDebugQuery(`/api/v1/simulator/sessions/${sessionId}/messages`),
      {
        method: "POST",
        body: JSON.stringify({ text })
      }
    );
  },

  finishDialogueSession(sessionId: string): Promise<SimulatorFinishResponseDto> {
    return requestJson<SimulatorFinishResponseDto>(withDebugQuery(`/api/v1/simulator/sessions/${sessionId}/finish`), {
      method: "POST"
    });
  }
};
