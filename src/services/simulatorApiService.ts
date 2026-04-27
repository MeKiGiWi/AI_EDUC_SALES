import type {
  SimulatorCatalogResponseDto,
  SimulatorFinishResponseDto,
  SimulatorPublicScenarioDto,
  SimulatorSendMessageResponseDto,
  SimulatorStartSessionResponseDto
} from "../types/academy";

const simulatorApiUrl = process.env.EXPO_PUBLIC_SIMULATOR_API_URL?.trim() ?? "";

function buildUrl(path: string) {
  return `${simulatorApiUrl.replace(/\/$/, "")}${path}`;
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
    const errorText = await response.text();
    throw new Error(errorText || "Не удалось выполнить запрос к backend симулятора.");
  }

  return (await response.json()) as T;
}

export const simulatorApiService = {
  isEnabled(): boolean {
    return simulatorApiUrl.length > 0;
  },

  async fetchSimulatorScenarios(): Promise<SimulatorPublicScenarioDto[]> {
    const response = await requestJson<SimulatorCatalogResponseDto>("/api/v1/simulator/scenarios");
    return response.items;
  },

  startDialogueSession(
    scenarioId: string,
    difficulty: string
  ): Promise<SimulatorStartSessionResponseDto> {
    return requestJson<SimulatorStartSessionResponseDto>("/api/v1/simulator/sessions", {
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
      `/api/v1/simulator/sessions/${sessionId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ text })
      }
    );
  },

  finishDialogueSession(sessionId: string): Promise<SimulatorFinishResponseDto> {
    return requestJson<SimulatorFinishResponseDto>(`/api/v1/simulator/sessions/${sessionId}/finish`, {
      method: "POST"
    });
  }
};
