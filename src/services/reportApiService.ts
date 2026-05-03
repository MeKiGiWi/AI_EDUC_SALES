import type { ReportCard, SimulatorEvaluationPayloadDto, UserRole } from "../types/academy";

const backendApiUrl = process.env.EXPO_PUBLIC_SIMULATOR_API_URL?.trim() ?? "";

function buildUrl(path: string): string {
  const base = backendApiUrl.trim();
  if (!base) {
    return path;
  }

  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
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
    let detailMessage = rawBody || "Не удалось выполнить запрос по отчетам.";

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as { detail?: unknown };
        if (typeof parsed.detail === "string") {
          detailMessage = parsed.detail;
        }
      } catch {
        // Keep original text when the body is not JSON.
      }
    }

    throw new Error(detailMessage);
  }

  return (await response.json()) as T;
}

function triggerDownload(path: string): void {
  if (typeof document === "undefined") {
    throw new Error("Скачивание доступно только в web-версии.");
  }

  const link = document.createElement("a");
  link.href = buildUrl(path);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const reportApiService = {
  isEnabled(): boolean {
    return backendApiUrl.length > 0;
  },

  async fetchReports(role: UserRole): Promise<ReportCard[]> {
    const response = await requestJson<{ items: ReportCard[] }>(`/api/v1/reports?role=${role}`);
    return response.items;
  },

  async createReport(payload: {
    role: UserRole;
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
    sessionId?: string | null;
  }): Promise<ReportCard> {
    return requestJson<ReportCard>("/api/v1/reports", {
      method: "POST",
      body: JSON.stringify({
        role: payload.role,
        scenario_title: payload.scenarioTitle,
        evaluation: payload.evaluation,
        session_id: payload.sessionId ?? null
      })
    });
  },

  async openExport(reportId: string, format: "pdf" | "csv"): Promise<void> {
    triggerDownload(`/api/v1/reports/${reportId}/export/${format}`);
  }
};
